#!/usr/bin/env node

/**
 * Module dependencies.
 */
var envFileEmpty = true;
/* if(!process.env.CLIENT_ID) {
  console.log(".env is empty");
  envFileEmpty = false;
  process.env.CLIENT_ID = "0oa1l8jhjdBrip2aU5d6";
  process.env.CLIENT_SECRET = "IMeeHjVY3_3ZUEzKdlVWIiWbpUiFNV5FFTzNsQLn";
  process.env.ISSUER = "https://worldofwarcraft.okta.com";
  process.env.OKTA_URL = "https://worldofwarcraft.okta.com";
  process.env.
  // FIXME: We shoudln't require this at all
  process.env.OKTA_API_TOKEN = "example";
}
*/ 

process.env.CLIENT_ID="0oa1l8jhjdBrip2aU5d6"
process.env.CLIENT_SECRET="IMeeHjVY3_3ZUEzKdlVWIiWbpUiFNV5FFTzNsQLn"
process.env.ISSUER="https://worldofwarcraft.okta.com/oauth2/default"
process.env.OKTA_URL="https://worldofwarcraft.okta.com"
process.env.OKTA_API_TOKEN="00_Im-qQJj3xc6fRQqjKMuD0qU_ZPaaUVXbhkX48Zq"
process.env.NODE_TLS_REJECT_UNAUTHORIZED="0"
process.env.PROJECT_DOMAIN="localhost"
process.env.PORT="8080"



var debug = require('debug')('bankinguiapp:server');
var http = require('http');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var oktaConfig = require('config.json')('./oktaconfig.json');

const session = require('express-session');
const { ExpressOIDC } = require('@okta/oidc-middleware');

// https://cdn.glitch.com/3b9b03a9-82e6-44b5-8b93-5e0e237c8d29%2F
// app.locals.assetsUrl = "https://cdn.glitch.com/" + process.env.PROJECT_ID + "%2F";
// Hardcoded because this apparently doesn't work as expected.
app.locals.assetsUrl = "https://cdn.glitch.com/3b9b03a9-82e6-44b5-8b93-5e0e237c8d29%2F";
// https://glitch.com/edit/#!/avbank
app.locals.editLink = "https://glitch.com/edit/#!/" + process.env.PROJECT_DOMAIN;
// https://glitch.com/edit/#!/avbank?path=.env:1:0
app.locals.envEditLink = app.locals.editLink + "?path=.env:1:0";

const oidcConfig = {
  // FIXME: Give example of the "url" below:
  url: process.env.ISSUER.split('/').slice(0,3).join('/') + '/',
  issuer: process.env.ISSUER,
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uri: "https://" + process.env.PROJECT_DOMAIN + ".glitch.me/authorization-code/callback",
  scope: 'openid profile'
};

app.locals.oidcConfig = oidcConfig;

const oidc = new ExpressOIDC(oidcConfig);

// Session support is required to use ExpressOIDC
app.use(session({
  // Note: In a perfect world, this should be a seperate secret from the CLIENT_SECRET
  //       However, re-using the CLIENT_SECRET is a reasonable and pragmatic compromise
  secret: process.env.CLIENT_SECRET,
  resave: true,
  saveUninitialized: false
}));

// ExpressOIDC will attach handlers for the /login and /authorization-code/callback routes
app.use(oidc.router);

app.get("/*", function (req, res, next) {
  if(envFileEmpty) {
    res.render('noEnv');
  } else {
    next();
  }
});
app.get("/noEnv", function (req, res, next) {
    res.render('noEnv');
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;



/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

oidc.on('ready', () => {
  console.log("OIDC Ready");

  server.listen(port);
  //  server.on('error', onError);
  server.on('listening', onListening);
});

oidc.on('error', err => {
  console.log("OIDC ERROR");
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  console.log("onError called");
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
