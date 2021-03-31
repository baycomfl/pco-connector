
// takes in attributes object and builds fields
const deriveSchema = (attributes) => {
  
  let fields = pcoConnector.getFields();
  var types = pcoConnector.FieldType;

  Object.keys(attributes).forEach((prop) => {
    // Set fields based on data type
    var field;
    switch (attributes[prop]) {
      case 'boolean':
        field = fields
          .newDimension()
          .setId(prop)
          .setType(types.BOOLEAN);
        break;
      case 'tinyint':
      case 'smallint':
      case 'int':
      case 'bigint':
      case 'double':
      case 'float':
      case 'decimal':
        field = fields
          .newMetric()
          .setId(prop)
          .setType(types.NUMBER);
        break;
      case 'char':
      case 'varchar':
      case 'string':
        field = fields
          .newDimension()
          .setId(prop)
          .setType(types.TEXT);
        break;
      case 'date':
        field = fields
          .newDimension()
          .setId(prop)
          .setType(types.YEAR_MONTH_DAY);
        break;
      case 'timestamp':
        field = fields
          .newDimension()
          .setId(prop)
          .setType(types.YEAR_MONTH_DAY_SECOND);
        break;
      default:
        return;
    }
  });
  return fields;
};
// running requests sync because this could be running in multiple data sources simultaneously
// TODO investigate cache
const requestPCO = (selectedAPI, options = {}) => {
  // get the URL from the config and abort if not found
  const API = ENDPOINTS[selectedAPI];
  if(typeof API === "undefined"){
    throw new Error("selected api not found");
  }

  // base url from config
  let url = API.url;
  // add the path params
  if(options.hasOwnProperty("rest_params")){
    options["rest_params"].forEach(param => {
      url = `${url}/${param}`;
    });
  }

  //${API.hasOwnProperty("per_page") ? `?per_page=${API.per_page}` : ""}`;
  let noQS = true;
  if(API.hasOwnProperty("per_page")){
    noQS = false;
    url = `${url}?per_page=${API["per_page"]}`;
  }
  
  // TODO test this
  // add the query params
  if(options.hasOwnProperty("qs")){
    Object.keys(options["qs"]).forEach(param => {
      if(noQS){
        noQS = false;
        url = `${url}?${param}=${options["qs"][param]}`;
      } else {
        url = `${url}&${param}=${options["qs"][param]}`;
      }
    });
  }
  
  // add the bearer token if not specified
  if(!options.hasOwnProperty("headers")){
    options.headers = {};
  }
  if(!options.headers.hasOwnProperty("Authorization")){
    options.headers.Authorization = `Bearer ${getOAuthService().getAccessToken()}`;
  }

  // handle retries, etc but allow caller to override. 
  if(!options.hasOwnProperty("muteHttpExceptions") || typeof options.muteHttpExceptions !== "boolean"){
    options.muteHttpExceptions = true;
  }
  
  const response = UrlFetchApp.fetch(url, options);
  const responsePayload = JSON.parse(response.getContentText());
  const responseHeaders = response.getAllHeaders();
  let responseCode = response.getResponseCode();
  if(responseCode === ENDPOINTS[selectedAPI].statusCode){
    if(options.aggregate) {
      if(
        responsePayload.hasOwnProperty("meta") &&
        responsePayload.meta.hasOwnProperty("next") &&
        responsePayload.meta.next.hasOwnProperty("offset")
      ){
        if(!options.hasOwnProperty("qs")){
          options.qs = {};
        }
        options.qs.offset = responsePayload.meta.next.offset;
        const nextResponse = requestPCO(selectedAPI, options);
        responsePayload.data = responsePayload.data.concat(responsePayload.data, nextResponse.data);
      }
      return responsePayload;
    } else {
      return responsePayload;
    }
  } else if (responseCode === 429 && responseHeaders.hasOwnProperty("Retry-After")){
    Utilities.sleep(parseInt(responseHeaders["Retry-After"],10) * 1000);
    return requestPCO(selectedAPI, options);
  } else {
    // make this a little easier to read
    let responseError = response;
    try {
      responseError = JSON.stringify(responsePayload, null , "  ");
    } catch(e){
      console.error("unable to format error response", e);
    }
    throw new Error(`HTTP code ${responseCode}: ${responseError}`);
  }
};

const buildRows = (selectedAPI, selectedFields = [], rawApiData = []) => {
  try {
    return rawApiData.map(row =>{
      const values = [];
      Object.keys(row.data.attributes).forEach(attribute => {
        if(selectedFields.indexOf(attribute) !== -1){
          values.push(row.data.attributes[attribute]);
        } 
      });
      return {"values": values};
    });
  } catch (e){
    console.error("error building rows from API results", e)
    throw new Error("Building rows from API response failed");
  }
}