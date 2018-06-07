const AWS = require('aws-sdk');
const fs = require('fs');
const zlib = require('zlib');

const s3 = new AWS.S3();
const AdmZip = require('adm-zip');

const buildBucket = 'imgterestbuild';
const deployBucket = '';

var artifactKey = 'imgterestbuild.zip';

s3.getObject({ Bucket: buildBucket, Key: artifactKey }, function(err, data) {
	if (err) {
		console.log(err);
	} else {
		fs.writeFile(`./tmp/${artifactKey}`, data.Body, err => {
			if (err) {
				console.log(err);
			} else {
				const zip = new AdmZip(artifactKey);
				const zipEntries = zip.getEntries();
				zipEntries.forEach(function(zipEntry) {
					console.log(zipEntry.entryName); // outputs zip entries information
					const params = {
						Body: zipEntry.getData(),
						Bucket: 'imgterest',
						ACL: 'public-read',
						Key: zipEntry.entryName
					};
					s3.putObject(params, err => {
						if (err) {
							console.error(err);
							return;
						}
						console.log('success!');
					});
					// console.log(zipEntry.getData().toString('utf8'));
				});
				s3.putObject();
				// zip.extractAllTo('./tmp/', true);
			}
		});
		// params = { Bucket: myBucket, Key: myKey, Body: 'Hello!' };

		// s3.putObject(params, function(err, data) {
		// 	if (err) {
		// 		console.log(err);
		// 	} else {
		// 		console.log('Successfully uploaded data to myBucket/myKey');
		// 	}
		// });
	}
});
