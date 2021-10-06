const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');
const { Onfido, Region } = require("@onfido/api");
const AddressModel = require('../models/addressmodel');
const multer = require('multer')
const fs = require('fs');


var storage = multer.memoryStorage();
var upload = multer({ storage : storage })

module.exports = function (_oidc){
    oidc = _oidc;

const onfido = new Onfido({
    apiToken: process.env.ONFIDO_API_TOKEN
    // Defaults to Region.EU (api.onfido.com), supports Region.US and Region.CA
    // region: Region.US
    });

  router.get('/', oidc.ensureAuthenticated(), async function(req, res, next) {
    var response = await axios.get(process.env.TENANT_URL + 
        '/api/v1/users/'+req.userContext.userinfo.sub)
    res.render('identityVerification',{layout: 'subpage', loa: req.userContext.userinfo.loa});
  });

  router.get('/loa1/gather', oidc.ensureAuthenticated(), async function(req,res,next){
    res.render('identityVerification-gather',{layout: 'subpage'});
  })

  router.post('/loa1/gather', oidc.ensureAuthenticated(), upload.single('document'), async function(req,res,next){
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
    }

    console.log(file)


    try{
        var response = await axios.get(process.env.TENANT_URL + 
            '/api/v1/users/'+req.userContext.userinfo.sub)
        var dob = response.data.profile.date_of_birth.match("(?<day>[0-9]{2})\/(?<month>[0-9]{2})\/(?<year>[0-9]{4})")
        var address = new AddressModel(response.data.profile.postalAddress)
        
        var applicantId = response.data.profile.verificationID

        if(applicantId == null || applicantId.length == 0){
            //need to create the applicant
            var applicant = await onfido.applicant
            .create({
                firstName: response.data.profile.firstName,
                lastName: response.data.profile.lastName,
                dob: dob.groups.year+"-"+dob.groups.month+"-"+dob.groups.day,
                address: {
                    "town": address.city,
                    "postcode": address.postcode,
                    "country": address.country,
                    "line1": address.line1,
                    "line2": address.line2
                }
            })

        
            var response = await axios.post(process.env.TENANT_URL + 
                '/api/v1/users/'+req.userContext.userinfo.sub,
                {
                    profile:{
                        verificationID : applicant.id
                    }
                })

            applicantId = applicant.id
        }
        else {
            await onfido.applicant.update(applicantId, {
                firstName: response.data.profile.firstName,
                lastName: response.data.profile.lastName,
                dob: dob.groups.year+"-"+dob.groups.month+"-"+dob.groups.day,
                address: {
                    "town": address.city,
                    "postcode": address.postcode,
                    "country": address.country,
                    "line1": address.line1,
                    "line2": address.line2
                }
              });
        }

        await onfido.document.upload({
            applicantId: applicantId,
            file: fs.createReadStream("static/images/sample_driving_licence.png"),
            type: "driving_licence"
          })

        //create a new check for this user
        const newCheck = await onfido.check.create({
            applicantId,
            reportNames: ["identity_enhanced","document"],
            //this is slow but means we can just dump the result, don't do this for a
            //real system use a call back
            asynchronous: false
          });

        if(newCheck.result == "clear"){
        var update = await axios.post(process.env.TENANT_URL + 
            '/api/v1/users/'+req.userContext.userinfo.sub,{
                "profile":{
                    "LOA": "LOA2"
                }
            })
        }
        var reports = []
        for (let index = 0; index < newCheck.reportIds.length; index++) {
            const element = newCheck.reportIds[index];
            var report = await onfido.report.find(element)
            reports.push(report)
        }

        res.render('identityVerification-checkSubmitSuccess',{check: newCheck,reports:reports})
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
