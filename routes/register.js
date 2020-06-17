const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');

module.exports = function (_oidc){
    oidc = _oidc;

  router.get('/', function(req, res, next) {
    res.render('register');
  });

  router.post('/', async function(req, res, next) {
    try{
      var username
      var profile
      var dob
      if(req.body.dobday < 10 && !req.body.dobday.startsWith("0")){
          dob = '0' + req.body.dobday
      }
      else{
          dob = req.body.dobday
      }
      if(req.body.dobmonth < 10 && !req.body.dobmonth.startsWith("0")){
          dob = dob + '/0' + req.body.dobmonth
      }
      else {
          dob = dob + '/' + req.body.dobmonth
      }
      dob = dob+'/'+req.body.dobyear

      var customerNumber = await generateCustomerNumber()

      var payload = {
          profile: {
              email: req.body.email,
              login: req.body.email,
              date_of_birth: dob,
              customer_reference_number: customerNumber,
              LOA: 'LOA0'
          },
          credentials: {
              password: { value: req.body.password}
          }
      }
        var register = await axios.post(process.env.TENANT_URL + 
            '/api/v1/users/',payload)
        res.redirect(307, '/login');
    }
    catch(err){
        if(err.response.data.errorSummary && err.response.data.errorSummary === 'Api validation failed: login'){
            res.render('register',{email:req.body.email,dobday:req.body.dobday, dobmonth:req.body.dobmonth, dobyear:req.body.dobyear, error: "registered"})
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


   async function generateCustomerNumber(){
       var customerNumber = Math.floor(Math.random() * 90000) + 10000;
       var response = await axios.get(process.env.TENANT_URL + 
        '/api/v1/users?search=' +
        encodeURI('profile.customer_reference_number eq "'+customerNumber+'"'));
        if(response.data.length > 1){
            console.log("collision for "+ customerNumber)
            return await generateCustomerNumber()
        }
        if(response.data.length == 0){
            console.log("no collision for " + customerNumber)
            return customerNumber
        } 
   }

  return router;
}
