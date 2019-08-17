'use strict';

const stravaFacade = require('./strava-facade')
const activityStorage = require('./activity-storage')
const geoJsonClient = require('./geojson-client')

// Fun Game: Count the race conditions.
exports.handler = async function(event) {
    const userId = event.userId;
    const facade = await stravaFacade.StravaFacade(userId);

    const activityStorageClient =  await activityStorage.ActivityStorageClient(userId);
    const allowedActivities = new Set(activityStorageClient.getAllowedActivities());
    let newActivities = (await facade.getAllActivitiesAfter(activityStorageClient.getLastActivityStart()))
    	.filter(activity => allowedActivities.has(activity.type))
    	.map(activity => ({
    		distance: activity['distance'], 
    		startTime: activity['start_date'], 
    		id: activity['id'], 
    		type: activity['type'], 
    		elapsedTime: activity['elapsed_time']}));
    await activityStorageClient.saveNewActivities(newActivities);

    let totalDistance = activityStorageClient.getTotalDistance();
    console.log("Total Distance: " + totalDistance);

    await geoJsonClient.updateGeoJson(userId, totalDistance);

    return "Great Hiking! " + "New activities fetched: " + newActivities.length;
};