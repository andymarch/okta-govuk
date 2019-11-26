const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
const uuidv1 = require('uuid/v1');
const auth = require('../auth')


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
      try{
          await axios.post(process.env.SERVICE_URL + '/agent?id='+ req.userContext.userinfo.sub,
          {
            entityid: req.body.entity,
            sessionid: req.sessionID
          })
          res.redirect('/refresh')
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