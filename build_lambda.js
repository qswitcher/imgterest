const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const os = require('os');

const s3 = new AWS.S3();
const AdmZip = require('adm-zip');
const mime = require('mime-types');
const buildBucket = 'imgterestbuild';
const deployBucket = 'imgterest';

var artifactKey = 'imgterestbuild.zip';

s3.getObject({ Bucket: buildBucket, Key: artifactKey }, function(err, data) {
	if (err) {
		console.log(err);
	} else {
		fs.mkdtemp(os.tmpdir(), (err, folder) => {
			fs.writeFile(path.join(folder, artifactKey), data.Body, err => {
				if (err) {
					console.error(err);
				} else {
					const zip = new AdmZip(path.join(folder, artifactKey));
					const zipEntries = zip.getEntries();
					zipEntries.forEach(function(zipEntry) {
						const params = {
							Body: zipEntry.getData(),
							Bucket: deployBucket,
							ACL: 'public-read',
							Key: zipEntry.entryName,
							ContentType: mime.lookup(zipEntry.entryName)
						};
						s3.putObject(params, err => {
							if (err) {
								console.error(err);
							} else {
								console.log(`Uploaded ${zipEntry.entryName}`);
							}
						});
					});
				}
			});
		});
	}
});
