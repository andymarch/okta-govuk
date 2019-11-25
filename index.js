require('dotenv').config()

const sassMiddleware = require('node-sass-middleware')
const express = require('express')
const hbs  = require('express-handlebars')
const session = require('express-session')
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const axios = require('axios')
var auth = require('./auth.js')

const UserModel = require('./models/usermodel')

const PORT = process.env.PORT || 3000;

var app = express();

app.engine('hbs',  hbs( { 
    extname: 'hbs', 
    defaultLayout: 'base', 
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: {
      json: function(json){
        return JSON.stringify(json, undefined, '\t');
      },
      jwt: function (token){
          var atob = require('atob');
          if (token != null) {
              var base64Url = token.split('.')[1];
              var base64 = base64Url.replace('-', '+').replace('_', '/');
              return JSON.stringify(JSON.parse(atob(base64)), undefined, '\t');
          } else {
              return "Invalid or empty token was parsed"
          }
      }
  }
  } ) );
app.set('view engine', 'hbs');
 app.use(
    sassMiddleware({
        src: __dirname + '/sass', 
        dest: __dirname + '/static/css',
        prefix: '/static/css',
        debug: false     
    })
 );   
app.use('/static', express.static('static'));
app.use('/govuk-frontend', express.static(__dirname + '/node_modules/govuk-frontend/govuk'));
app.use('/assets', express.static(__dirname + '/node_modules/govuk-frontend/govuk/assets'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// session support is required to use ExpressOIDC
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {secure: false}
}));  

var auth = new auth();
app.use(auth.setContext)
app.use('/authorization-code/callback',auth.handleCallback)

app.use(async function (req,res,next){
    if(req.userContext){
        res.locals.user = new UserModel(req.userContext)
    }
    next();
})

var indexRouter = require('./routes/index')(auth)
app.use('/', indexRouter)
  
app.use(function(req, res, next) {
    next(createError(404));
});
  
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', { title: 'Error' });
});
  
axios.defaults.headers.common['Authorization'] = `SSWS  `+process.env.API_TOKEN

app.listen(PORT, () => console.log('app started'));
  
  