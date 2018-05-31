const AWS = require('aws-sdk');
const fs = require('fs');
const zlib = require('zlib');

const s3 = new AWS.S3();

const buildBucket = 'imgterestbuild';
const deployBucket = '';

var artifactKey = 'imgterestbuild.zip';

s3.getObject({ Bucket: buildBucket, Key: artifactKey }, function(err, data) {
	if (err) {
		console.log(err);
	} else {
		const unzip = zlib.createUnzip();

		fs.writeFile(artifactKey, data.Body, err => {
			if (err) {
				console.log(err);
			} else {
				fs
					.createReadStream(artifactKey)
					.pipe(unzip)
					.pipe(fs.createWriteStream('tmp'));

				console.log('success!');
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
