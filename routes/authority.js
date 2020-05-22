const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
const qs = require('querystring')


module.exports = function (_oidc){
    oidc = _oidc;
  
  router.get('/',oidc.ensureAuthenticated(),async function(req, res, next) {
    try{
     var resp = await axios.get(process.env.SERVICE_URL + '/agent',{headers:{Authorization: "Bearer "+req.session.user.access_token}})
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
          var response = await axios.post(process.env.SERVICE_URL + '/agent',
          {
            entityid: req.body.entity,
          },{headers:{Authorization: "Bearer "+req.session.user.access_token}})
          var identifier = response.data.id
          if(req.session.user.refresh_token){
            res.redirect('/refresh')
          }
          else{
            var stateQuery = qs.stringify({
              "state":identifier})
            res.redirect('/reauth?'+stateQuery)
            //refresh the token with redirect if refresh token is not available
            //res.status(err.status || 500);
            //res.render('error', { title: 'Get with redirect is not implemented.' });
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