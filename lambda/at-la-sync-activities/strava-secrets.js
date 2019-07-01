var AWS = require('aws-sdk');

var s3 = new AWS.S3({apiVersion: '2006-03-01', region: 'us-east-1'});
var bucket = "at-la-secrets"
var key = "strava.json"

// I've got too much TV to watch to properly handle errors.
async function getSecrets() {
	var params = {
	  Bucket: bucket,
	  Key: key,
	};
	return s3.getObject(params).promise().then(response => JSON.parse(response.Body));
}

async function saveSecrets(secrets) {
	var params = {
	  Bucket: bucket,
	  Key: key,
	  Body: JSON.stringify(secrets, null, 4)
	};
	return s3.putObject(params).promise();
}

module.exports.getSecrets = getSecrets;
module.exports.saveSecrets = saveSecrets;