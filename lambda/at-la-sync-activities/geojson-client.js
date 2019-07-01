var AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01', region: 'us-east-1'});
const bucket = "aaronrosenheck.com";
const key = "data/centerline.json";


// only expose this
async function updateGeoJson(totalDistance) {
	let geoJson = await getGeoJson();
	// Trail behind me, littered with holes filled with my poop
	let done = geoJson.features[1].geometry.coordinates;
	// Trail that I still have not made poop graves on yet
	let theGreatUnkown = geoJson.features[2].geometry.coordinates;
	
	// walk the hiker through the trail
	let hikerLocation;
	while(theGreatUnkown.length > 0 && theGreatUnkown[0][2] < totalDistance) {
		hikerLocation = theGreatUnkown.shift();
		done.push(hikerLocation);
	}
	// put back the current location so there is not a gap between segments
	if(theGreatUnkown.length > 0) {
		theGreatUnkown.unshift(hikerLocation);
	}
	// update pin
	geoJson.features[0].geometry.coordinates = hikerLocation;
	geoJson.features[0].properties.distanceFromStart = totalDistance;
	await saveGeoJson(geoJson);
}

async function getGeoJson() {
	var params = {
	  Bucket: bucket,
	  Key: key,
	};
	return s3.getObject(params).promise().then(response => JSON.parse(response.Body));
}

async function saveGeoJson(secrets) {
	var params = {
	  Bucket: bucket,
	  Key: key,
	  Body: JSON.stringify(secrets)
	};
	return s3.putObject(params).promise();
}

module.exports.updateGeoJson = updateGeoJson;