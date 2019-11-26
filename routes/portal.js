const express = require('express');
const router = express.Router();
const axios = require('axios');
var oidc = require('@okta/oidc-middleware');

module.exports = function (_oidc){
    oidc = _oidc;

  router.get('/', oidc.ensureAuthenticated(), function(req, res, next) {
    res.render('portal',{layour: 'portal'});
  });

  return router;
}
