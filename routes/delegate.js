const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
const agentmodel = require('../models/agentmodel')

module.exports = function (_oidc){
    oidc = _oidc;

  router.get('/', oidc.ensureAuthenticated(), async function(req, res, next) {
    try{      
        var response = await axios.get(
          process.env.SERVICE_URL + '/entity/agents',
          { headers: { Authorization: "Bearer " + req.session.user.access_token } })
        res.render('delegate',{layout:'subpage',delegates:  response.data.agents});
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
      await axios.post(
        process.env.SERVICE_URL + '/entity/agents/add',
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
    try {
      await axios.post(
        process.env.SERVICE_URL + '/entity/agents/remove',
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


  return router;
}
