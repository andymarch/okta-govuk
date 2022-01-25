const express = require('express');
const router = express.Router();
var oidc = require('@okta/oidc-middleware');
const analytics = require('../analytics')

module.exports = function (_oidc){
    oidc = _oidc;

  router.get('/', oidc.ensureAuthenticated(), function(req, res, next) {
    analytics.trackEvent(req.userContext.userinfo.sub,"Show tokens")
    if(req.session.user.refresh_token){
      res.render('tokens',{layout: 'subpage',id_token: req.session.user.id_token, access_token: req.session.user.access_token, refresh_token: req.session.user.refresh_token});
    }
    else{
      res.render('tokens',{layout: 'subpage',id_token: req.session.user.id_token, access_token: req.session.user.access_token});
    }
  });

  return router;
}
