// "config" is dynamically defined and loaded into the JS namespace in views/header.ejs
 
config.tokenManager = {
    storage: 'sessionStorage'
};

// Override the default authorize and userinfo URLs
config.authorizeUrl: config.url + 'oauth2/default/v1/authorize';
config.userinfoUrl:  config.url + 'oauth2/default/v1/userinfo';
};

var validationOptions = {
  issuer: config.url + 'oauth2/default'
}

var authClient = new OktaAuth(config);

$( "#loginForm" ).submit(function( event ) {
  event.preventDefault();
});

authClient.session.get()
.then(function(session) {
  console.log(session)
})
.catch(function(err) {
  // not logged in
});

var do_login = function() {

  authClient.signIn({
    username: $("input[name='Name']").val(),
    password: $("input[name='Password']").val()
  })
  .then(function(transaction) {
    if (transaction.status === 'SUCCESS') {
      // Step #1: get sessionToken
      console.log('sessionToken = ', transaction.sessionToken);
      console.log(window.location.origin + "/accountPage")
      // [jpf] FIXME: I'm not sure if the relative link will work 
      // authClient.session.setCookieAndRedirect(transaction.sessionToken, window.location.origin + "/accountPage");

    } else {
      throw 'We cannot handle the ' + transaction.status + ' status';
    }
  })
  .fail(function(err) {
    console.error(err);
  });
}
