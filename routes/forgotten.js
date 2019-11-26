const express = require('express');
const router = express.Router();
const axios = require('axios');
const uuidv1 = require('uuid/v1');

module.exports = function (_oidc){
    oidc = _oidc;
  
  router.get('/',function(req, res, next) {
    res.render('forgotten');
  });

  router.get('/success',function(req, res, next) {
    res.render('forgotten-success');
  });

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

   return router;
}