const axios = require('axios')
const qs = require('querystring')
var base64 = require('base-64');
const OktaJwtVerifier = require('@okta/jwt-verifier');

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: process.env.ISSUER,
    clientId: process.env.CLIENT_ID,
    });

class Auth {
    ensureAuthenticated(){
        return async (req, res, next) => {
            if(req.userContext != null){
                oktaJwtVerifier.verifyAccessToken(req.userContext.tokens.access_token,process.env.TOKEN_AUD)
                .then(jwt => {
                    return next();
                })
                .catch(err => {
                    console.log(err)
                    res.redirect("/login")
                });      
            }
            else{
                console.log("no context")
                res.redirect("/login")
            }
        }
    }

    setContext(req,res,next){
        if(req.userContext == undefined){
            req.userContext = {
                userinfo: {
                    sub : "",
                    family_name : "",
                    givenName: "",
                },
                tokens: {
                    access_token: "",
                    id_token: ""
                }
            }
        }
        if(req.session.user){
            var atob = require('atob');
              var base64Url = req.session.user.id_token.split('.')[1];
              var base64 = base64Url.replace('-', '+').replace('_', '/');
              var token = JSON.parse(atob(base64))
            req.userContext = {
                'userinfo': {
                    'sub' : token.sub,
                    'family_name' : token.name,
                    'givenName': token.name,
                    'preferred_username': token.preferred_username
                },
                'tokens': {
                    'access_token': req.session.user.access_token,
                    'id_token': req.session.user.id_token
                }
            }
        }
        return next();
    }

    async handleCallback (req,res,next){     
        if(req.query.state === req.session.state)
        {
            if(req.query.error){
                if(req.query.error_description){
                    if(unescape(req.query.error_description) === 'User creation was disabled.'){
                        res.redirect("/login?unlinked='true'")
                    }
                    else{
                        res.render('error', {message: unescape(req.query.error_description)})
                    }
                } else {
                    res.render('error', {message: req.query.error})
                }
            }
            else {
                try{
                    var tokenresponse = await axios.post(process.env.ISSUER + '/v1/token',
                    qs.stringify({
                        "code":req.query.code,
                        "grant_type": "authorization_code",
                        "redirect_uri": process.env.REDIRECT_URI,
                    }),
                    {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'authorization': "Basic "+base64.encode(process.env.CLIENT_ID+":"+process.env.CLIENT_SECRET)
                    }
                    }
                    )
                    req.session.user =
                    {
                        'id_token': tokenresponse.data.id_token,
                        'access_token': tokenresponse.data.access_token
                    }
                    res.redirect("/myslc")
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
          }
        }
        else{
          res.redirect("/error",{err: "State mismatch"})
        }
    }
}

module.exports = Auth