/**
 *
 *
 * @param {*} [selectedFields=[]]
 * @param {*} [rawApiData=[]]
 * @return {*} 
 */
 const buildRows = (selectedFields = [], rawApiData = [], selectedAPI) => {
   const formatTimeStamp = (isoTimeStamp) => {
     console.error("isoTimeStamp", isoTimeStamp);
     return isoTimeStamp
       .split("") // cut chars into array
       .map(elem => parseInt(elem)) // cast strings to numbers
       .filter(elem => typeof elem === "number" && (elem === 0 || elem)) // filter out NaN
       .join("");
   };
  try {
    // flatten this in case we get back and array of objects, or just a single object that is not in an array.
    return rawApiData.reduce((acc, curr) =>{
      return acc.concat(acc, curr.data);
    }, [])
    // filter the response to just the selected attributes.
    .map(row =>{
      const values = [];
      Object.keys(row.attributes).forEach(attribute => {
        if(selectedFields.indexOf(attribute) !== -1){
          let formattedAttribute = row.attributes[attribute];
          if(ENDPOINTS[selectedAPI].attributes[attribute] === "timestamp"){
            formattedAttribute = formatTimeStamp(formattedAttribute);
            console.warn("formattedAttribute", formattedAttribute);
          }  
          values.push(formattedAttribute);
        } 
      });
      return {"values": values};
    });
  } catch (e){
    console.error("error building rows from API results", e)
    throw new Error("Building rows from API response failed");
  }
}

/**
 *
 *
 * @param {*} attributes
 * @return {*} 
 */
const deriveSchema = (selectedApiConfig) => {
  const attributes = selectedApiConfig.attributes;
  let fields = pcoConnector.getFields();
  var types = pcoConnector.FieldType;

  Object.keys(attributes).forEach((prop) => {
    // Set fields based on data type
    let field;
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
    // set the default dimension and metric if specified
    if(
      typeof selectedApiConfig.default_dimension !== undefined &&
      selectedApiConfig.default_dimension === prop
    ){
      fields.setDefaultDimension(field.getId());
    }
    // could default metric and dimension be the same prop?
    // if not this should be an else if
    if(
      typeof selectedApiConfig.default_metric !== undefined &&
      selectedApiConfig.default_metric === prop
    ){
      fields.setDefaultMetric(field.getId());
    }
  });
  
  return fields;
};

const filterUserDefinedParams = (configParams = {}) => {
  // to avoid name collisions and errors related to reserved param names
  // all user speficied parameters must begin with "pco_" prefix
  // filter out everything that does not satisfy this requriement
  return Object.keys(configParams).reduce((acc, curr) => {
    if(typeof configParams[curr] === "string" && typeof curr.split("_")[1] !== "undefined"){
      acc[curr.split("_")[1]] = configParams[curr];
    }
    return acc;
  }, {});
}

// running requests sync because this could be running in multiple data sources simultaneously
// TODO investigate cache
/**
 *
 *
 * @param {*} selectedAPI
 * @param {*} [options={}]
 * @return {*} 
 */
const requestPCO = (selectedAPI, options = {}) => {
   console.warn("REQUEST PCO CALLED", selectedAPI, JSON.stringify(options));
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
  if([ENDPOINTS[selectedAPI].status_code, 429].indexOf(responseCode) >= 0){
    if(responseCode === 429 && responseHeaders.hasOwnProperty("Retry-After")){
      console.warn("rate limiter applied. retry after: ", parseInt(responseHeaders["Retry-After"],10) * 1000);
      Utilities.sleep(parseInt(responseHeaders["Retry-After"],10) * 1000);///default this...
      responsePayload.data = [];
      const nextResponse = requestPCO(selectedAPI, options);
      responsePayload.data = responsePayload.data.concat(responsePayload.data, nextResponse.data);
    } 
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
    } 
    return responsePayload;
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
