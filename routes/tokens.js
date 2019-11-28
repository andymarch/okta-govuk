const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');

module.exports = function (_oidc){
    oidc = _oidc;

  router.get('/', oidc.ensureAuthenticated(), function(req, res, next) {
    if(req.session.user.refresh_token){
      res.render('tokens',{layout: 'subpage',id_token: req.session.user.id_token, access_token: req.session.user.access_token, refresh_token: req.session.user.refresh_token});
    }
    else{
      res.render('tokens',{layout: 'subpage',id_token: req.session.user.id_token, access_token: req.session.user.access_token});
    }
  });

  return router;
}
