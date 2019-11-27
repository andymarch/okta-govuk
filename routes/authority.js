const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
const uuidv1 = require('uuid/v1');
const auth = require('../auth')
var atob = require('atob');


module.exports = function (_oidc){
    oidc = _oidc;
  
  router.get('/',oidc.ensureAuthenticated(),async function(req, res, next) {
    try{
      console.log(process.env.SERVICE_URL + '/agent?id='+ req.userContext.userinfo.sub)
    var resp = await axios.get(process.env.SERVICE_URL + '/agent?id='+ req.userContext.userinfo.sub)
      res.render('authority',{layout: 'subpage', entities: resp.data});
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
  });

  router.post('/',oidc.ensureAuthenticated(),async function(req, res, next) {

      var identifier = req.sessionID;
      if(req.session.user.refresh_token){
        var base64 = this.req.session.user.refresh_token.split('.')[1];
        var decoded = JSON.parse(atob(base64))
        identifier = decoded.jti;
      }
      try{
          await axios.post(process.env.SERVICE_URL + '/agent?id='+ req.userContext.userinfo.sub,
          {
            entityid: req.body.entity,
            sessionid: identifier
          })
          if(req.session.user.refresh_token){
            res.redirect('/refresh')
          }
          else{
            //refresh the token with redirect if refresh token is not available
            res.status(err.status || 500);
            res.render('error', { title: 'Get with redirect is not implemented.' });
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

   return router;
}