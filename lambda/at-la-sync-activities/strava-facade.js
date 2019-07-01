const stravaSecrets = require('./strava-secrets')
const rp = require('request-promise');

async function StravaFacade() {
    const accessToken = await (async () => {
        // Returns new access token and persists refresh token for next time.
        // made anonymous as to not tempt anybody to call this multiple times.
        let secrets = await stravaSecrets.getSecrets();
        let refreshOptions = {
            method: 'POST',
            uri: 'https://www.strava.com/oauth/token',
            form: {
                client_id: secrets['client-id'],
                client_secret: secrets['client-secret'],
                refresh_token: secrets['refresh-token'],
                grant_type: 'refresh_token'
            }
        };
        let stravaResponse = JSON.parse(await rp(refreshOptions));
        secrets['refresh-token'] = stravaResponse['refresh_token'];
        await stravaSecrets.saveSecrets(secrets);
        return stravaResponse['access_token'];
    })();

    async function getAllActivitiesAfter(date) {
        // 0 indexed
        let page = 1;
        let activities = [];
        // This API is silly sauce. 
        // Only know that there are no matter actvities when they return a page w/ 0 results.
        let latestPageReturnedResults;
        do {
        	let pageOfActivities = await getActivitiesAfter(date, page);
        	pageOfActivities.forEach(a => activities.push(a));
        	page++;
        	latestPageReturnedResults = pageOfActivities.length > 0;
        } while (latestPageReturnedResults);
        return activities;
    }

    async function getActivitiesAfter(date, page) {
    	var options = {
            method: 'GET',
            uri: 'https://www.strava.com/api/v3/athlete/activities',
            qs: {
                after: date,
                per_page: 100,
                page: page
            },
            headers: {
                Authorization : `Bearer ${accessToken}`
            }
        };
        return JSON.parse(await rp(options));
    }

    return {
        getAllActivitiesAfter
    }
}

module.exports.StravaFacade = StravaFacade;