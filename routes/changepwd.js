const express = require('express');
const router = express.Router();
const axios = require('axios');
const uuidv1 = require('uuid/v1');

module.exports = function (_oidc){
  oidc = _oidc;

  router.post('/', async function(req, res, next) {
    try {
        var response = await axios.post(process.env.TENANT_URL+'/api/v1/users/'+req.body.uid+'/credentials/change_password',
        {
            'oldPassword': req.body.oldpwd,
            'newPassword': req.body.password
        });
        var authNresponse = await axios.post(process.env.TENANT_URL + 
            '/api/v1/authn',{
                "username": req.body.login,
                "password": req.body.password
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
          } else {
            throw authNresponse.data.status
          }
    }
    catch(err) {
        if(err.response && err.response.status === 403){
            res.status(403);
            res.render('expired', {uid: req.body.uid,login:req.body.login,oldpwd:req.body.oldpwd, err: "Unable to update password, did not meet minimum strength requirement."});
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

  return router;
}
