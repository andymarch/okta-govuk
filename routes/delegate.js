const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
const analytics = require('../analytics')

module.exports = function (_oidc){
    oidc = _oidc;

  router.get('/', oidc.ensureAuthenticated(), async function(req, res, next) {
    analytics.trackEvent(req.userContext.userinfo.preferred_username,"Display delegated agents")
    try{      
        if(req.userContext.userinfo.canDelegate == "True"){
          var response = await axios.get(
            process.env.SERVICE_URL + '/delegator/agents',
            { headers: { Authorization: "Bearer " + req.session.user.access_token } })
          res.render('delegate',{layout:'subpage',delegates: response.data.agents});
        }
        else {
          res.render('delegate',{layout:'subpage'});
        }
      }
      catch(err){
        console.log(err)
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error', { title: 'Error' });
    }
  })

  router.get('/add', oidc.ensureAuthenticated(), function(req, res, next) {
    res.render('addDelegate',{layout:'subpage'});
  })

  router.post('/add', oidc.ensureAuthenticated(), async function(req,res,next){
    analytics.trackEvent(req.userContext.userinfo.preferred_username,"Add delegated agent")
    try{
      await axios.post(
        process.env.SERVICE_URL + '/delegator/agents/add',
        { agentid: req.body.email },
        { headers: { Authorization: "Bearer " + req.session.user.access_token } })
      res.redirect('/delegateAuthority')
    } catch (err){
      console.log(err)
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error', { title: 'Error' });
    }
  })

  router.get('/remove/:id', oidc.ensureAuthenticated(), async function(req, res, next) {
    analytics.trackEvent(req.userContext.userinfo.preferred_username,"Remove delegated agents")
    try {
      await axios.post(
        process.env.SERVICE_URL + '/delegator/agents/remove',
        { agentid: req.params.id },
        { headers: { Authorization: "Bearer " + req.session.user.access_token } },)
      res.redirect('/delegateAuthority')
    } catch (err){
      console.log(err)
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error', { title: 'Error' });
    }
  })

  router.get('/enable', oidc.ensureAuthenticated(),async function (req,res,next){
    analytics.trackEvent(req.userContext.userinfo.preferred_username,"Enable account delegation")
    try {
      await axios.post(
        process.env.SERVICE_URL + '/delegator/delegation',
        { op: "ACTIVATE" },
        { headers: { Authorization: "Bearer " + req.session.user.access_token } },)
        res.redirect('/reauth')
    } catch (err){
      console.log(err)
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error', { title: 'Error' });
    }
  })

  router.get('/disable', oidc.ensureAuthenticated(),async function (req,res,next){
    analytics.trackEvent(req.userContext.userinfo.preferred_username,"Disable account delegation")
    try {
      await axios.post(
        process.env.SERVICE_URL + '/delegator/delegation',
        { op: "DEACTIVATE" },
        { headers: { Authorization: "Bearer " + req.session.user.access_token } },)
        res.redirect('/reauth')
    } catch (err){
      console.log(err)
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error', { title: 'Error' });
    }
  })


  return router;
}
