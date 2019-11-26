const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');

module.exports = function (_oidc){
    oidc = _oidc;

  router.get('/', oidc.ensureAuthenticated(),function(req, res, next) {
    res.render('token-inspection',{idToken: req.userContext.tokens.id_token});
  });

  router.get('/perform', oidc.ensureAuthenticated(),function(req, res, next) {
    var login_hint = req.userContext.userinfo.preferred_username
    var oauth_nonce = "";
  
    //generate a reasonable nonce
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < 13; i++) {
      oauth_nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  
    var nJwt = require('njwt');
  
    var request = {
        iss: process.env.ATTESTATION_ID,
        aud: process.env.TENANT_URL,
        response_type: 'id_token',
        client_id: process.env.ATTESTATION_ID,
        response_mode: 'form_post',
        acr_values: 'urn:okta:app:mfa:attestation',
        nonce: oauth_nonce,
        scope: 'openid',
        state: 'demo',
        login_hint: login_hint,
        redirect_uri: process.env.APP_BASE_URL+"/attestation/callback"
    }
  
    var signedRequest = nJwt.create(request,process.env.ATTESTATION_SECRET);
  
    res.redirect(
    process.env.ISSUER.split('/oauth2')[0]+'/oauth2/v1/authorize'+
    '?request='+signedRequest.compact());
  });

  router.post('/callback',oidc.ensureAuthenticated(),function(req, res, next) {
      console.log(req)
    res.render('token-inspection',{attestedToken: req.body.id_token});
  });
  return router;
}
