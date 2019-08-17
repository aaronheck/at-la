var AWS = require('aws-sdk');

var s3 = new AWS.S3({apiVersion: '2006-03-01', region: 'us-east-1'});
var bucket = "at-la-secrets"

// I've got too much TV to watch to properly handle errors.
async function getSecrets(userId) {
	var params = {
	  Bucket: bucket,
	  Key: getKey(userId),
	};
	return s3.getObject(params).promise().then(response => JSON.parse(response.Body));
}

function getKey(userId) {
	return `strava-${userId}.json`
}

async function saveSecrets(userId, secrets) {
	var params = {
	  Bucket: bucket,
	  Key: getKey(userId),
	  Body: JSON.stringify(secrets, null, 4)
	};
	return s3.putObject(params).promise();
}

module.exports.getSecrets = getSecrets;
module.exports.saveSecrets = saveSecrets;