const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sns = new AWS.SNS();
const AdmZip = require('adm-zip');
const mime = require('mime-types');
const deployBucket = 'imgterest.com';

exports.handler = (event, context, callback) => {
	const job = event['CodePipeline.job'];
	if (job) {
		const {bucketName, objectKey} = job['data']['inputArtifacts']
			.filter((artifact) => artifact.name === 'MyAppBuild')
			.map((artifact) => artifact.location.s3Location);
			
		s3.getObject({ Bucket: bucketName, Key: objectKey }, function(err, data) {
			if (err) {
				callback(err);
				return;
			}
			const zip = new AdmZip(data.Body);
			const zipEntries = zip.getEntries();
			let count = 0;
			zipEntries.forEach(function(zipEntry) {
				const params = {
					Body: zipEntry.getData(),
					Bucket: deployBucket,
					ACL: 'public-read',
					Key: zipEntry.entryName,
					ContentType: mime.lookup(zipEntry.entryName)
				};
				s3.putObject(params, err => {
					count += 1;
					if (err) {
						console.error(err);
						sns.publish({
							TopicArn: 'arn:aws:sns:us-east-1:669497506585:deployImgterestTopic',
							Message: 'Imgterest failed with error ' + err,
							Subject: 'Imgterest deploy failed!'
						}, (err) => callback(err, 'Failure!'));
						return;
					} else {
						console.log(`Uploaded ${zipEntry.entryName}`);
					}
					if (count === zipEntries.length) {
						let notifications = 0;
						sns.publish({
							TopicArn: 'arn:aws:sns:us-east-1:669497506585:deployImgterestTopic',
							Message: 'Imgterest deployed to http://imgterest.com',
							Subject: 'Imgterest deploy successful'
						}, (err) => {
							notifications += 1;
							if (notifications == 2) {
								callback(err, 'Success!')
							}
						});
						
						const codepipeline = new AWS.CodePipeline();
						codepipeline.putJobSuccessResult({jobId: job.id}, (err) => {
							notifications += 1;
							if (notifications == 2) {
								callback(err, 'Success!')
							}
						});
					}
				});
			});
		});
	}
}