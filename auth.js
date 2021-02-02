// declare connector
var pcoConnector = DataStudioApp.createCommunityConnector();

/**
 * Returns the Auth Type of this connector.
 * @return {object} The Auth type.
 */
function getAuthType() {
  Logger.log('getAuthType()');
  return pcoConnector.newAuthTypeResponse()
    .setAuthType(pcoConnector.AuthType.OAUTH2)
    .build();
}

/**
 * Resets the auth service.
 */
function resetAuth() {
  getOAuthService().reset();
}


/**
 * Returns true if the auth service has access.
 * @return {boolean} True if the auth service has access.
 */
function isAuthValid() {
  return getOAuthService().hasAccess();
}

/**
 * Returns the configured OAuth Service.
 * @return {Service} The OAuth Service
 */
function getOAuthService() {
  console.log("GET AUTH SERV", CLIENT_ID, SECRET);
  return OAuth2.createService('pcoAuthService')
    .setAuthorizationBaseUrl('https://api.planningcenteronline.com/oauth/authorize')
    .setTokenUrl('https://api.planningcenteronline.com/oauth/token')
    .setClientId(CLIENT_ID)
    .setClientSecret(SECRET)
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCallbackFunction('authCallback')
    .setScope('people check_ins');
};

/**
 * The OAuth callback.
 * @param {object} request The request data received from the OAuth flow.
 * @return {HtmlOutput} The HTML output to show to the user.
 */
function authCallback(request) {
  var authorized = getOAuthService().handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. Please close this tab and try again.');
  };
};

/**
 * Gets the 3P authorization URL.
 * @return {string} The authorization URL.
 * @see https://developers.google.com/apps-script/reference/script/authorization-info
 */
function get3PAuthorizationUrls() {
  return getOAuthService().getAuthorizationUrl();
}

