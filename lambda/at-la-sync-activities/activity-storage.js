var AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01', region: 'us-east-1'});
const activityManifestBucket = "at-la-secrets"
const activityManifestKey = "activity-manifest.json"

// Activity manfiest will have last sync time and a set of precomputed stats like total distance.
// Right now it also has a summary of all activities but long term that will be moved to DDB.
async function ActivityManifestClient() {
	let _activityManifest = await (async ()=>{
		var params = {
		  Bucket: activityManifestBucket,
		  Key: activityManifestKey,
		};
		return s3.getObject(params).promise().then(response => JSON.parse(response.Body));
	})(); 

	// returns {distance, lastActivityStart} and other stuff if I care
	function getActivityManifest() {
		// clone cached manifest
		return {... _activityManifest};
	} 

	function saveActivityManifest(activityManifest) {
		_activityManifest = activityManifest;
		var params = {
		  Bucket: activityManifestBucket,
		  Key: activityManifestKey,
		  Body: JSON.stringify(_activityManifest)
		};
		return s3.putObject(params).promise();
	}

	return {
		getActivityManifest,
		saveActivityManifest
	}
}

async function ActivityStorageClient() {
	const activityManifestClient = await ActivityManifestClient();

	function getLastActivityStart() {
		return activityManifestClient.getActivityManifest()['lastActivityStart'];
	}

	function getTotalDistance() {
		return activityManifestClient.getActivityManifest()['totalDistance'];
	}

	// TODO: use ddb and the manifest as an actual manifest and not a storage for all activities
	async function saveNewActivities(activities) {
		// saves each activity in DDB
		// updates last activity start time
		// returns stats precompute
		let activityManifest = activityManifestClient.getActivityManifest();
		activities.forEach((activity) => {
			if (!activityManifest.activities.hasOwnProperty(activity.id)) {
				activityManifest.totalDistance += activity.distance;
				activityManifest.lastActivityStart = Math.max(activityManifest.lastActivityStart, new Date(activity.startTime).getTime() / 1000);
				activityManifest.activities[activity.id.toString()] = activity;
			}
		});
		await activityManifestClient.saveActivityManifest(activityManifest);
	}

	return {
		getLastActivityStart, 
		getTotalDistance, 
		saveNewActivities
	}
}

module.exports.ActivityStorageClient = ActivityStorageClient;
