var AWS = require('aws-sdk');
const zlib = require('zlib');
const geolib = require('geolib');
const {promisify} = require('util');
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const s3 = new AWS.S3({apiVersion: '2006-03-01', region: 'us-east-1'});
const bucket = {"1": "aaronrosenheck.com", "2": "thetr3k.com"};


// only expose this
// distanceOfLastPoint vs totalDistance could be different since 
// real hiker can stop between points and I do not advance pointer if they do not reach next waypoint
async function updateGeoJson(userId, totalDistance) {
	let geoJson = await getGeoJson(userId);
	// or condition can be removed once all files have this property
	let distanceOfLastPoint = geoJson.features[1].properties['distanceOfLastPoint'] || 0.0
	// Trail behind me, littered with holes filled with my poop
	let done = geoJson.features[1].geometry.coordinates;
	// Trail that I still have not made poop graves on yet
	let theGreatUnkown = geoJson.features[2].geometry.coordinates;

	// walk the hiker through the trail
	let hikerLocation;
	let realLocation = totalDistance;
	let keepHiking = true;
	while(theGreatUnkown.length > 0 && keepHiking) {
		let distanceBetweenDoneAndNextPoint = distanceBetweenTwoPoints(done[done.length - 1], theGreatUnkown[0]);
		if(distanceOfLastPoint + distanceBetweenDoneAndNextPoint <= totalDistance) {
			distanceOfLastPoint += distanceBetweenDoneAndNextPoint;
			hikerLocation = theGreatUnkown.shift();
			done.push(hikerLocation);
		} else {
			// break loop
			keepHiking = false;
		}
	}
	// put back the current location so there is not a gap between segments
	if(theGreatUnkown.length > 0) {
		theGreatUnkown.unshift(hikerLocation);
	}
	// update distanceOfLastPoint
	geoJson.features[1].properties['distanceOfLastPoint'] = distanceOfLastPoint
	// update pin
	geoJson.features[0].geometry.coordinates = hikerLocation;
	// give it real total distance for display
	geoJson.features[0].properties.distanceFromStart = totalDistance;
	await saveGeoJson(geoJson, userId);
}

function distanceBetweenTwoPoints(a, b) {
	return geolib.getPreciseDistance(
		{ latitude: a[1], longitude: a[0] },
		{ latitude: b[1], longitude: b[0] },
	);
}

function getKey(userId) {
	return `data/route-${userId}.json`;
}

async function getGeoJson(userId) {
	var params = {
	  Bucket: bucket[userId],
	  Key: getKey(userId),
	};
	return s3.getObject(params).promise().then(response => {
		let body = response.Body;
		return gunzip(body);
	}).then(unzipped => JSON.parse(unzipped));
}

async function saveGeoJson(geoJson, userId) {
	var params = {
	  Bucket: bucket[userId],
	  Key: getKey(userId),
	  Body: await gzip(JSON.stringify(geoJson)),
	  ContentType: 'application/json',
	  CacheControl: 'no-cache, no-store, must-revalidate',
	  ContentEncoding: 'gzip'
	};
	return s3.putObject(params).promise();
}

module.exports.updateGeoJson = updateGeoJson;