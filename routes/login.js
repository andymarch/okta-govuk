const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
const uuidv1 = require('uuid/v1');
const passwordTester = require('../PwnedPasswordTester')

module.exports = function (_oidc){
    oidc = _oidc;
  
  router.get('/',function(req, res, next) {
      res.render('login');
  });

  router.post('/', async function(req, res, next) {
    try{
      var username
      if(req.body.crn){
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
      } else{
        username = req.body.email
      }

      var authNresponse = await axios.post(process.env.TENANT_URL + 
        '/api/v1/authn',{
            "username": username,
            "password": req.body.password
      },{
        'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
      })

      var useridresponse = await axios.get(process.env.TENANT_URL + 
        '/api/v1/users/'+username)
      var userid = useridresponse.data.id

      if(authNresponse.data.status == "SUCCESS" || authNresponse.data.status == "MFA_REQUIRED"){
        var result = await passwordTester.isPwnedPassword(req.body.password)
        if (result>0){
          req.session.hibpScore = result;
          if(authNresponse.data.status == "SUCCESS"){
            //add the user to the MFA enforcement group and rechallenge the authn
            await axios.put(process.env.TENANT_URL + 
              '/api/v1/groups/'+process.env.MFA_GROUPID+'/users/'+userid)

            authNresponse = await axios.post(process.env.TENANT_URL + 
              '/api/v1/authn',{
                  "username": username,
                  "password": req.body.password
            },{
              'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
            })
          }
        }
      }

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
        res.render('expired',{uid: userid,login:username,oldpwd:req.body.password})
      } else if(authNresponse.data.status == "MFA_ENROLL"){
        req.session.username = username
        req.session.uuid = authNresponse.data._embedded.user.id
        req.session.stateToken = authNresponse.data.stateToken
        res.redirect("/login/MFA/enroll")
      } else if(authNresponse.data.status == "MFA_REQUIRED"){
        req.session.username = username
        req.session.uuid = authNresponse.data._embedded.user.id
        req.session.factors = authNresponse.data._embedded.factors
        req.session.stateToken = authNresponse.data.stateToken
        res.redirect("/login/MFA/challenge")
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
      
      var hibp = 0
      if(req.session.hibpScore){
        hibp = req.session.hibpScore
      }

      var factor = req.session.factors.find(item => {
          return item.factorType == 'token:software:totp'
      })
      if(factor== null){
        factor = req.session.factors.find(item => {
          return item.factorType == 'email'
      })
      }
      req.session.factorid = factor.id

    var update = await axios.post(process.env.TENANT_URL + 
      '/api/v1/users/'+req.session.uuid+'/factors/'+req.session.factorid+'/verify',{},
      {
        headers: {
        'Content-Type': 'application/json',
        }
      })
      res.render('factorChallenge',{factor:factor, hibp: hibp})
    
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
      '/api/v1/authn/factors/'+req.session.factorid+'/verify',{
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