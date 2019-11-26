const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
const agentmodel = require('../models/agentmodel')

module.exports = function (_oidc){
    oidc = _oidc;

  router.get('/', oidc.ensureAuthenticated(), async function(req, res, next) {
    try{      
        var response = await axios.get(process.env.TENANT_URL + 
          '/api/v1/users/'+req.userContext.userinfo.sub)
        var agents = []
        for(var entry in response.data.profile.delegatedAgents){
          var agent = await axios.get(process.env.TENANT_URL + 
            '/api/v1/users/'+ response.data.profile.delegatedAgents[entry])
            agents.push(new agentmodel(agent.data))
          }
        res.render('delegate',{layout:'subpage',delegates: agents});
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
    try{
      var userresponse = await axios.get(process.env.TENANT_URL + 
        '/api/v1/users/'+req.body.email)
      await axios.post(process.env.SERVICE_URL + 
        '/entity/agents/?id='+ req.userContext.userinfo.sub+"&agentid="+userresponse.data.id)
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
    await axios.delete(process.env.SERVICE_URL + 
      '/entity/agents/?id='+ req.userContext.userinfo.sub+"&agentid="+req.params.id)
    res.redirect('/delegateAuthority')
  })


  return router;
}
