const Mixpanel = require('mixpanel');
const enableTracking = process.env.ENABLE_ANALYTICS || false;

var mixpanel 
if(enableTracking){
    mixpanel = Mixpanel.init(
    process.env.MIXPANEL_TOKEN,
    {
      host: "api-eu.mixpanel.com",
    },
  );
}

  async function trackEvent (user,event){
      if(enableTracking){
        mixpanelProperties = {distinct_id:user}
        mixpanel.track(event,mixpanelProperties)
      }
  }

  async function trackUser(userProfile){
      if(enableTracking){
        mixpanelProperties = {
            $first_name: userProfile.firstName,
            $last_name: userProfile.lastName
        }
        mixpanel.people.set(userProfile.login,mixpanelProperties)
    }
  }

module.exports = {trackEvent,trackUser}