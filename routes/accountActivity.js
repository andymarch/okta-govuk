const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
var LogModel = require('../models/logmodel')

module.exports = function (_oidc){
    oidc = _oidc;

  router.get('/', oidc.ensureAuthenticated(), async function(req, res, next) {
    try {
        var response = await axios.get(process.env.TENANT_URL+'/api/v1/logs/?limit=50'+
        '&filter='+encodeURI('actor.id eq "'+req.userContext.userinfo.sub+'"'));
        var logs = [];
        for( var entry in response.data) {
            logs.push(new LogModel(response.data[entry]))  
        }
        res.render('accountactivity', {layout: 'subpage', logs: logs});
    }
    catch(err) {
      console.log(err)
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error', { title: 'Error' });
      } 
  });

  return router;
}
