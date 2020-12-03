var envFileEmpty = false;
if(!process.env.CLIENT_ID) {
  console.log(".env is empty");
  envFileEmpty = true;
  process.env.CLIENT_ID = "empty";
  process.env.CLIENT_SECRET = "empty";
  process.env.ISSUER = "https://example.okta.com";
  process.env.OKTA_URL = "https://example.okta.com";
}

var request = require("request");
var express = require('express');
var router = express.Router();
const session = require('express-session');
const { ExpressOIDC } = require('@okta/oidc-middleware');
var oktaConfig = require('config.json')('./oktaconfig.json');

const oidc = new ExpressOIDC({
  issuer: process.env.ISSUER,
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uri: "https://" + process.env.PROJECT_DOMAIN + ".glitch.me/authorization-code/callback",
  scope: 'openid profile'
});


console.log(oidc)
var oktaTenantUrl = process.env.OKTA_URL


const OktaJwtVerifier = require('@okta/jwt-verifier');

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.issuer
})

// FIXME: It's painful that this doesn't support all of the features that we want. Look into a way to either extend the SDK, or move everything to my hack below
const okta = require('@okta/okta-sdk-nodejs');

const client = new okta.Client({
  orgUrl: process.env.OKTA_URL,
  // Obtained from Developer Dashboard
  token: process.env.OKTA_API_TOKEN,
  // Will be added by default in 2.0
  requestExecutor: new okta.DefaultRequestExecutor() 
});

const apiToken = process.env.OKTA_API_TOKEN;

const assetsUrl = "https://cdn.glitch.com/" + process.env.PROJECT_ID + "%2F"

var sendToAccounts = function(amount, id, responseFromMFA){
  var request = require("request");
  console.log(amount)
  console.log(id)
  var putUrl = 'https://okta-example-playground.appspot.com/accounts/' + id
  console.log(putUrl)
 var options = { method: 'PUT',
  url: putUrl,
  headers: 
   { 'Cache-Control': 'no-cache',
     'Content-Type': 'application/x-www-form-urlencoded',
     Accept: 'application/json' },
  form: { requestedAmount: amount } };


  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    responseFromMFA.send(body)
    console.log(body);
  });
}

function oktaApiGet(path, callback) {
  var options = { 
    method: 'GET',
    url: oktaTenantUrl + path,
    headers: { 
      'Cache-Control': 'no-cache',
      'Authorization': 'SSWS ' + apiToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json' 
    } 
  };

  request(options, function (error, response, body) {
    callback(error, response, body);
  });
}

function oktaApiPost(path, payload, callback) {
  var options = { 
    method: 'POST',
    url: oktaTenantUrl + path,
    headers: { 
      'Cache-Control': 'no-cache',
      'Authorization': 'SSWS ' + apiToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json' 
    },
    body: payload
  };

  request(options, function (error, response, body) {
    callback(error, response, body);
  });
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { user: req.userContext });
});

router.get('/howto', function(req, res, next) {
  res.render('howto');
});

router.get('/apiintro', function(req, res, next) {
  res.render('apiintro');
});


function promptIfNeeded(token, callback) {
  var userPrompt = false;
  if('opt' in token && token.opt.length > 0) {
      // FIXME: Set a unique UserAgent for this, so we can see if it's being used
      oktaApiGet('/api/v1/meta/schemas/user/default', function(error, response, body) {
      var result = JSON.parse(body);
      console.log("Okta Schema");
      
      userPrompt = [];
      token.opt.forEach(function(key) {
        const schema = result.definitions.custom.properties[key]; 
        userPrompt.push({
          key: key,
          description: schema.description,
          options: schema.items.oneOf,
        });
      });
      // FIXME: This forces the userPrompt variable to have the _last_ element listed
      //        Ideally this should also be an array of every element we want to prompt for
      userPrompt = userPrompt.slice(-1)[0]; // "userPrompt.last()"
      console.log(userPrompt);
      callback(userPrompt)
    });
  } else {
    callback(userPrompt);
  }
}

router.get('/helloworld', (req, res, next) => {
  res.send("Hello!");
});

router.get('/updateProfile', oidc.ensureAuthenticated(), (req, res, next) => {
  client.getUser(req.userContext.userinfo.sub)
  .then(user => {
    if('attributeToChange' in req.query && req.query.attributeToChange in user.profile) {
      var element = user.profile[req.query.attributeToChange];
      // [jpf] FIXME: We only support array types right now
      if(Array.isArray(element)) {
        // [jpf] FIXME: Overwriting the value is what we want now, it's not what we want long term
        user.profile[req.query.attributeToChange] = [];
        if('attributeValue' in req.query && req.query.attributeValue !== '') {
          user.profile[req.query.attributeToChange].push(req.query.attributeValue);
        }
      }
    }
    // console.log(user);
    user.update().then(() => { 
      // console.log('User updated');
      res.sendStatus(204);
    });
  });
});

router.get('/accountPage', oidc.ensureAuthenticated(), (req, res, next) => {
  //console.log("/accountPage");
  // console.log(req.userContext.tokens);
  var tokens = {
    access_token: req.userContext.tokens.access_token,
    id_token: req.userContext.tokens.id_token,
  };
  
  oktaJwtVerifier.verifyAccessToken(req.userContext.tokens.access_token)
  .catch(jwt => {
    console.log("jwt.parsedBody");
    console.log(jwt.parsedBody);
    var userPrompt = false;
    
    promptIfNeeded(jwt.parsedBody, function (userPrompt) {
      res.render('accountPage', { user: req.userContext, userPrompt: userPrompt, tokens: tokens });
    });
  });
});

router.post('/resetMfa', oidc.ensureAuthenticated(), (req, res, next) => {
  var request = require("request");

  var options = { method: 'DELETE',
  url:  oktaTenantUrl  + '/api/v1/users/' + req.userContext.userinfo.sub  + '/factors/' + req.userContext.userinfo.smsFactor,
  headers:
  { 
  'cache-control': 'no-cache',
  authorization: 'SSWS ' + apiToken,
  'content-type': 'application/json',
  accept: 'application/json' } };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
  });


});



router.get('/factors', function(req, res, next) {
  var request = require("request");
  console.log(req.userContext.userinfo)
  var options = { method: 'GET',
  url: oktaTenantUrl  + '/api/v1/users/' + req.userContext.userinfo.sub +'/factors',
  // FIXME: DRY this up
  headers: { 
    'Cache-Control': 'no-cache',
    Authorization: 'SSWS ' + apiToken,
    'Content-Type': 'application/json',
    Accept: 'application/json' } 
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    var factorsResult = JSON.parse(body)
    var smsId = null
    var factors = factorsResult.map(factor =>{
      var oktaFactor = {};
      oktaFactor["id"] = factor.id;
      oktaFactor["type"] = factor.factorType;
      if(factor.factorType == "sms"){
        smsId = factor.id
      }
      return oktaFactor
    });

    if(smsId){
      client.getUser(req.userContext.userinfo.sub)
      .then(user => {
        console.log(user);
        user.profile.factorId = smsId;
        user.update().then(user => {
          res.send(factors);
        });
      });
    } else {
      res.send(factors);
    }
  });
});


router.get('/logout', (req, res) => {
  req.logout();
  res.redirect(oktaTenantUrl + "/login/signout?fromURI=" + "https://" + process.env.PROJECT_DOMAIN + ".glitch.me");
});




router.post('/factorsTest', oidc.ensureAuthenticated(), (req, res, next) => {
  var request = require("request");
  console.log("test")
  console.log(req.body)
  var bankId = req.body.bankAccount
  var requestedAmount = req.body.requestedAmount
  var smsCode = {"passCode": req.body.passCode }

  oktaJwtVerifier.verifyAccessToken(req.userContext.tokens.access_token)
  .catch(jwt => {
    console.log(jwt.parsedBody.factorId)
    var url = oktaTenantUrl + '/api/v1/users/' + req.userContext.userinfo.sub + '/factors/' + jwt.parsedBody.factorId + '/verify'
    console.log(url)
    var options = { method: 'POST',
    url: url,
    headers:
    {
    'Cache-Control': 'no-cache',
    Authorization: 'SSWS ' + apiToken,
    'Content-Type': 'application/json',
    Accept: 'application/json' },
    body: smsCode,
    json: true };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      console.log(body.factorResult)
      if(body.factorResult == "SUCCESS"){
        console.log(req.body.id,)
        console.log(req.body.requestedAmount)
        sendToAccounts(requestedAmount, bankId, res)
      } else {
        res.send(body)
      }
    });
  });
});

router.get('/index', function(req, res, next) {
  res.render('index', { user: req.userContext });
});

router.get('/about', function(req, res, next) {
  res.render('about', { user: req.userContext });
});

router.get('/contact', function(req, res, next) {
  res.render('contact', { user: req.userContext });
});


router.get('/services', function(req, res, next) {
  res.render('services', { user: req.userContext, customLogin: true, url: process.env.ISSUER});
});


router.get('/widget', function(req, res, next) {
  res.render('single', { user: req.userContext });
});

router.get('/portfolio', function(req, res, next) {
  res.render('portfolio', { user: req.userContext });
});

router.get('/single', function(req, res, next) {
  res.render('single', { user: req.userContext });
});


router.get('/blog', function(req, res, next) {
  res.render('blog', { user: req.userContext });
});




module.exports = router;
