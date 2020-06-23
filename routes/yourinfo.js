const express = require('express');
const router = express.Router();
const axios = require('axios');
const AddressModel = require('../models/addressmodel');

module.exports = function (_oidc){
    oidc = _oidc;
  
  router.get('/', oidc.ensureAuthenticated(), async function(req, res, next) {
      try{      
        var response = await axios.get(process.env.TENANT_URL + 
            '/api/v1/users/'+req.userContext.userinfo.sub)
        res.render('yourinfo',
        {
            layout: 'subpage',
            name:response.data.profile.firstName+" "+response.data.profile.lastName,
            dob:response.data.profile.date_of_birth,
            login:response.data.profile.login,
            crn:response.data.profile.customer_reference_number,
            address: new AddressModel(response.data.profile.postalAddress).forDisplay()
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

  router.get('/update-email',oidc.ensureAuthenticated(),async function(req,res,next){
    var response = await axios.get(process.env.TENANT_URL + 
        '/api/v1/users/'+req.userContext.userinfo.sub)
      res.render('update-email',{email:response.data.profile.login})
  });

  router.post('/update-email',oidc.ensureAuthenticated(),async function(req,res,next){
    try{
        res.render('verifypwd',{email:req.body.email})   
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

  router.post('/update-email/verify-password',oidc.ensureAuthenticated(), async function(req,res,next){
    try{
        var response = await axios.get(process.env.TENANT_URL + 
            '/api/v1/users/'+req.userContext.userinfo.sub)
        
        var authNresponse = await axios.post(process.env.TENANT_URL + 
        '/api/v1/authn',{
            "username": response.data.profile.login,
            "password": req.body.password
        })
      if(authNresponse.data.status == "SUCCESS"){
        var update = await axios.post(process.env.TENANT_URL + 
            '/api/v1/users/'+req.userContext.userinfo.sub,{
                "profile":{
                    "login":req.body.email,
                    "email":req.body.email
                }
            })
        req.session.destination = '/yourinfo'
        res.redirect('/reauth')
      } else {
        res.status(401);
        res.render('verifypwd',{err: "Authentication Failed."});
      }
    }catch(err){
      if(err.response && err.response.status === 401){
        res.status(401);
        res.render('verifypwd',{err: "Authentication Failed."});
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
  })

  router.post('/', async function(req, res, next) {
    try{
      var username
      var profile
      if(!req.body.crn.includes('@')){
        var response = await axios.get(process.env.TENANT_URL + 
          '/api/v1/users?search=' +
          encodeURI('profile.customer_reference_number eq "'+req.body.crn+'"'));
          if(response.data.length > 1){
            res.render('forgotten',{err: "Could not verify your account.(Non-unique CRN)"})
            return;
          }
          if(response.data.length == 0){
            res.render('forgotten',{err: "Could not verify your account.(CRN not found)"})
            return;
          }
          username = response.data[0].profile.login
          profile = response.data[0]
          console.log(profile)
      }
      else {
        username = req.body.crn
        try{
        var response = await axios.get(process.env.TENANT_URL + 
            '/api/v1/users/'+username)
            profile = response.data;
        } catch {
            res.render('forgotten',{err: "Could not verify your account.(User not found)"})
            return;
        }
      }

      var dob
      if(req.body.dobday < 10){
          dob = '0' + req.body.dobday
      }
      else{
          dob = req.body.dobday
      }
      if(req.body.dobmonth < 10){
          dob = dob + '/0' + req.body.dobmonth
      }
      else {
          dob = dob + '/' + req.body.dobmonth
      }
      dob = dob+'/'+req.body.dobyear

      if(profile.profile.date_of_birth === dob){
          console.log(profile)
        var expire = await axios.post(process.env.TENANT_URL + 
            '/api/v1/users/'+profile.id+'/lifecycle/expire_password?tempPassword=true')
            console.log(expire)
        res.render('forgotten-success',{temp: expire.data.tempPassword})
      }
      else{
        res.render('forgotten',{err: "Could not verify your account."})
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
   });

  router.get('/update-name',oidc.ensureAuthenticated(),async function(req,res,next){
    var response = await axios.get(process.env.TENANT_URL + 
        '/api/v1/users/'+req.userContext.userinfo.sub)
      res.render('update-name',{givenNames:response.data.profile.firstName,familyName: response.data.profile.lastName})
  });

  router.post('/update-name',oidc.ensureAuthenticated(),async function(req,res,next){
    try{
      var loa = req.userContext.userinfo.loa
      if(loa == "LOA0"){
        loa = "LOA1"
      }
      var update = await axios.post(process.env.TENANT_URL + 
          '/api/v1/users/'+req.userContext.userinfo.sub,{
              "profile":{
                  "firstName":req.body.givenNames,
                  "lastName":req.body.familyName,
                  "LOA": loa
              }
          })
      req.session.destination = '/yourinfo'
      res.redirect('/reauth')
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

  router.get('/update-address',oidc.ensureAuthenticated(),async function(req,res,next){
    var response = await axios.get(process.env.TENANT_URL + 
        '/api/v1/users/'+req.userContext.userinfo.sub)
        var addressModel = new AddressModel(response.data.profile.postalAddress)
      res.render('update-address',{address:addressModel})
  });

  router.post('/update-address',oidc.ensureAuthenticated(),async function(req,res,next){
    try{
      var addressModel = new AddressModel()
      addressModel.line1 = req.body.addressLine1
      addressModel.line2 = req.body.addressLine2
      addressModel.city = req.body.addressTown
      addressModel.county = req.body.addressCounty
      addressModel.postcode = req.body.addressPostcode
      //this value is fixed
      addressModel.country = "GBR"
      var update = await axios.post(process.env.TENANT_URL + 
          '/api/v1/users/'+req.userContext.userinfo.sub,{
              "profile":{
                  "postalAddress":addressModel.forStorage()
              }
          })
      req.session.destination = '/yourinfo'
      res.redirect('/reauth')
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