const express = require('express');
const router = express.Router();
const axios = require('axios');
const analytics = require('../analytics')

module.exports = function (_oidc){
    oidc = _oidc;
  
  router.get('/', oidc.ensureAuthenticated(), async function(req, res, next) {
    analytics.trackEvent(req.userContext.userinfo.preferred_username,"Get tickets")
      try{      
        var response = await axios.get(process.env.TICKET_SERVICE_URL+"tickets",{ headers: { Authorization: "Bearer " + req.session.user.access_token } })
        res.render('tickets',
        {
            layout: 'subpage',
            tickets:response.data,
        });
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

  router.get('/new',oidc.ensureAuthenticated(),async function(req,res,next){
      res.render('tickets-new')
  });

  router.post('/new',oidc.ensureAuthenticated(),async function(req,res,next){
    analytics.trackEvent(req.userContext.userinfo.preferred_username,"Create ticket")
    try{
      await axios.post(process.env.TICKET_SERVICE_URL+"tickets",
      { comment: req.body.comment },
      { headers: { Authorization: "Bearer " + req.session.user.access_token } })
      res.redirect('/tickets')
    } catch(err){
        console.log(err)
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error', { title: 'Error' });
    }
  });

  router.get('/:id/comment',oidc.ensureAuthenticated(), async function(req,res,next){
    res.render('tickets-update',{id:req.params.id})
  })

  router.post('/:id/comment',oidc.ensureAuthenticated(), async function(req,res,next){
    analytics.trackEvent(req.userContext.userinfo.preferred_username,"Add comment")
    try{
      await axios.post(process.env.TICKET_SERVICE_URL+"tickets/"+req.params.id,
      { comment: req.body.comment },
      { headers: { Authorization: "Bearer " + req.session.user.access_token } })
      res.redirect('/tickets')
    } catch(err){
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