'use strict';

const stravaFacade = require('./strava-facade')
const activityStorage = require('./activity-storage')
const geoJsonClient = require('./geojson-client')

// Fun Game: Count the race conditions.
exports.handler = async function(event) {
    const facade = await stravaFacade.StravaFacade();
    const allowedActivities = new Set(["Run", "Walk", "Hike"]);
    const activityStorageClient =  await activityStorage.ActivityStorageClient();
    let newActivities = (await facade.getAllActivitiesAfter(activityStorageClient.getLastActivityStart()))
    	.filter(activity => allowedActivities.has(activity.type))
    	.map(activity => ({
    		distance: activity['distance'], 
    		startTime: activity['start_date'], 
    		id: activity['id'], 
    		type: activity['type'], 
    		elapsedTime: activity['elapsed_time']}));
    console.log("New activities fetched: " + newActivities.length);
    await activityStorageClient.saveNewActivities(newActivities);

    let totalDistance = activityStorageClient.getTotalDistance();
    console.log("Total Distance: " + totalDistance);

    await geoJsonClient.updateGeoJson(totalDistance);

    return "Great Hiking!";
};