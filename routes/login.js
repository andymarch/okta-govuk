const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
const uuidv1 = require('uuid/v1');

module.exports = function (_oidc){
    oidc = _oidc;
  
  router.get('/',function(req, res, next) {
      res.render('login');
  });

  router.post('/', async function(req, res, next) {
    try{
      var username
      if(!req.body.crn.includes('@')){
        var response = await axios.get(process.env.TENANT_URL + 
          '/api/v1/users?search=' +
          encodeURI('profile.customer_reference_number eq "'+req.body.crn+'"'));
          if(response.data.length > 1){
            throw "Customer reference is not unique"
          }
          if(response.data.length == 0){
            throw "Customer reference not found"
          }
          username = response.data[0].profile.login
      }
      else {
        username = req.body.crn
      }
      var authNresponse = await axios.post(process.env.TENANT_URL + 
        '/api/v1/authn',{
            "username": username,
            "password": req.body.password
      },{
        'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
      })
      if(authNresponse.data.status == "SUCCESS"){
        req.session.state = uuidv1();
        res.redirect(process.env.ISSUER + 
          '/v1/authorize?' +
          'client_id=' + process.env.CLIENT_ID +
          '&sessionToken=' + authNresponse.data.sessionToken +
          '&response_type=code' +
          '&redirect_uri='+process.env.REDIRECT_URI + 
          '&scope=' + process.env.SCOPES + 
          '&state=' + req.session.state)
      } 
      else if(authNresponse.data.status == "PASSWORD_EXPIRED"){
        var getuserid = await axios.get(process.env.TENANT_URL + 
          '/api/v1/users/'+username)
        res.render('expired',{uid: getuserid.data.id,login:username,oldpwd:req.body.password})
      } else if(authNresponse.data.status == "MFA_ENROLL"){
        console.log(authNresponse.data)
        req.session.username = username
        req.session.uuid = authNresponse.data._embedded.user.id
        req.session.stateToken = authNresponse.data.stateToken
        res.redirect("/login/MFA/enroll")
      } else if(authNresponse.data.status == "MFA_REQUIRED"){
        console.log(authNresponse)
        req.session.username = username
        req.session.uuid = authNresponse.data._embedded.user.id
        req.session.emailfactorid = authNresponse.data._embedded.factors[0].id
        req.session.stateToken = authNresponse.data.stateToken
        res.redirect("/login/MFA/challenge?provider="+authNresponse.data._embedded.factors[0].provider)
      } else {
        throw authNresponse.data.status
      }
      
    }
    catch(err){
      if(err.response && err.response.status === 401){
        console.log(err)
        res.status(401);
        res.render('login',{err: "Unable to login customer reference number or password may be incorrect."});
      }
      else {
          console.log(err)
          // set locals, only providing error in development
          res.locals.message = err.message;
          res.locals.error = req.app.get('env') === 'development' ? err : {};

          // render the error page
          res.status(err.status || 500);
          res.render('error', { title: 'Error' });
        }
      }
   });

  router.get('/MFA/enroll', async function(req, res, next) {
    res.render("mfaenroll")
   });

  router.get('/MFA/challenge', async function(req, res, next) {
    try{
    var update = await axios.post(process.env.TENANT_URL + 
      '/api/v1/users/'+req.session.uuid+'/factors/'+req.session.emailfactorid+'/verify',{},
      {
        headers: {
        'Content-Type': 'application/json',
        }
      })
      if(req.query.provider === "GOOGLE" ||req.query.provider === "OKTA" ){
        res.render('factorChallenge',{totp:true, challengeProvider:req.query.provider})
      }
      else{
        res.render('factorChallenge',{email:req.session.username})
      }
    
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

   router.post('/MFA/challenge', async function(req, res, next) {
     try {
    var factorChallenge = await axios.post(process.env.TENANT_URL + 
      '/api/v1/authn/factors/'+req.session.emailfactorid+'/verify',{
        'passCode':req.body.password,
        'stateToken': req.session.stateToken
      },{
        'X-Forwarded-For': req.headers['x-forwarded-for'] || req.connection.remoteAddress
      })
    if(factorChallenge.data.status === 'SUCCESS'){
      req.session.state = uuidv1();
      res.redirect(process.env.ISSUER + 
        '/v1/authorize?' +
        'client_id=' + process.env.CLIENT_ID +
        '&sessionToken=' + factorChallenge.data.sessionToken +
        '&response_type=code' +
        '&redirect_uri='+process.env.REDIRECT_URI + 
        '&scope=' + process.env.SCOPES + 
        '&state=' + req.session.state)
    }
    else{
      res.redirect('/login')
    }
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

   return router;
}