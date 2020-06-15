const axios = require('axios')
const qs = require('querystring')
var base64 = require('base-64');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const uuidv1 = require('uuid/v1');

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
                    canDelegate: ""
                },
                tokens: {
                    access_token: "",
                    id_token: ""
                }
            }
        }
        if(req.session.user){
            var atob = require('atob');
              var idbase64Url = req.session.user.id_token.split('.')[1];
              var idbase64 = idbase64Url.replace('-', '+').replace('_', '/');
              var idtoken = JSON.parse(atob(idbase64))

              var accessbase64Url = req.session.user.access_token.split('.')[1];
              var accessbase64 = accessbase64Url.replace('-', '+').replace('_', '/');
              var accesstoken = JSON.parse(atob(accessbase64))
            req.userContext = {
                'userinfo': {
                    'sub' : idtoken.sub,
                    'family_name' : idtoken.name,
                    'givenName': idtoken.name,
                    'preferred_username': idtoken.preferred_username,
                    'canDelegate': accesstoken.can_delegate
                },
                'tokens': {
                    'access_token': req.session.user.access_token,
                    'id_token': req.session.user.id_token
                }
            }
        }
        return next();
    }

    async handleRefresh(req,res){
        try{
        var tokenresponse = await axios.post(process.env.ISSUER + '/v1/token',
        qs.stringify({
            "grant_type": "refresh_token",
            "scope": process.env.SCOPES,
            "refresh_token": req.session.user.refresh_token
        }),
        {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'authorization': "Basic "+base64.encode(process.env.CLIENT_ID+":"+process.env.CLIENT_SECRET)
        }
        }
        )
        if(tokenresponse.data.refresh_token){
            req.session.user =
            {
                'id_token': tokenresponse.data.id_token,
                'access_token': tokenresponse.data.access_token,
                'refresh_token': tokenresponse.data.refresh_token
            }
        }
        else{
            req.session.user =
            {
                'id_token': tokenresponse.data.id_token,
                'access_token': tokenresponse.data.access_token
            }
        }
        res.redirect("/portal")
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

    async handleReauthorize (req,res){
        if(req.query.state){
            req.session.state = req.query.state
        }
        else{ 
            req.session.state = uuidv1();
        }
        res.redirect(process.env.ISSUER + 
          '/v1/authorize?' +
          'client_id=' + process.env.CLIENT_ID +
          '&response_type=code' +
          '&redirect_uri='+process.env.REDIRECT_URI + 
          '&scope=' + process.env.SCOPES + 
          '&state=' + req.session.state)
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
                    if(tokenresponse.data.refresh_token){
                        req.session.user =
                        {
                            'id_token': tokenresponse.data.id_token,
                            'access_token': tokenresponse.data.access_token,
                            'refresh_token': tokenresponse.data.refresh_token
                        }
                    }
                    else{
                        req.session.user =
                        {
                            'id_token': tokenresponse.data.id_token,
                            'access_token': tokenresponse.data.access_token
                        }
                    }
                    res.redirect("/portal")
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