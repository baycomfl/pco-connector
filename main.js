
// connector declared in auth.gs
// const pcoConnector = DataStudioApp.createCommunityConnector();

// TODO figure this out for non devs to return false
function isAdminUser() {
  return true;
}

function getConfig(request) {
  try {
    let config = pcoConnector.getConfig();
    let configParams = request.configParams;
    const isFirstRequest = configParams === undefined;
    if (isFirstRequest) {
      config.setIsSteppedConfig(true);
    }
    let source = config
      .newSelectSingle()
      .setId('selectedAPI')
      .setName('Select Data Source')
      .setIsDynamic(true)
      .setHelpText('Select the PCO data source.')
      .setAllowOverride(true);
    Object.keys(ENDPOINTS).forEach(endpoint =>{
      source.addOption(config.newOptionBuilder().setLabel(ENDPOINTS[endpoint].label).setValue(endpoint))
    });
    
    if(!isFirstRequest){
      const URL = ENDPOINTS[configParams.selectedAPI].url;
      let pickList = config.newSelectMultiple()
        .setId("selectedItems")
        .setName("Select Your Items")
        .setHelpText("Select the PCO items to import.")
      //TODO aggregate and filter
      const response = UrlFetchApp.fetch(
        URL,
        {
          "headers": {
            "Authorization": "Bearer " + getOAuthService().getAccessToken()
          }
        }
      );
    
      const items = JSON.parse(response.getContentText());
      items.data.forEach(item => {
        pickList.addOption(
          config.newOptionBuilder()
          .setLabel(
            item.attributes.name === null 
            ? (
                item.attributes.description.length > 50 
                  ? item.attributes.description.replace(/(.{47})..+/, "$1…")
                  : item.attributes.description
              )
            : (
                item.attributes.name.length > 50
                  ? item.attributes.name.replace(/(.{47})..+/, "$1…")
                  : item.attributes.name
              )
          )
          .setValue(item.id)
        )
      });
    }     
     
    return config.build()
    
  } catch (e) {
    console.error("Error in getConfig()", e);
    pcoConnector.newUserError()
      .setDebugText('Error getting configuration: ' + e)
      .setText('There was an error listing the connector data sources. Try again later, or file an issue if this error persists.')
      .throwException();
  }
}

function getSchema(request){
  try {
    console.log("getSchema",request);
    const fields = deriveSchema(ENDPOINTS[request.configParams.selectedAPI].attributes);
    return { 'schema': fields.build() };

  } catch (e) {
    console.error("getSchema() error: ", e.hasOwnProperty("message") ? e.message : e);
    pcoConnector.newUserError()
      .setDebugText('Error getting configuration: ' + e)
      .setText('There was an error getting the connector schema. Try again later, or file an issue if this error persists.')
      .throwException();
  }
};

function getData(request){
  try {
    console.log("getData", request); 
    let requestedFieldIds = request.fields.map(field => {return field.name;});
    const fields = deriveSchema(ENDPOINTS[request.configParams.selectedAPI].attributes);
    const filteredFields = fields.forIds(requestedFieldIds);
    const schema = filteredFields.build();
console.log("SCHEMA!!!", schema);
  return {
    "schema": schema,
    "rows":[ 
      {
        "values": [false,false, 0, 20210211023031,20210211023031,"Attendance attended 'Weekend at Bayside (EBC)' 'any location' 'any time' since 1 week ago any number of times include 'Guests' or 'Regulars'",false,false,false,"null",true,20210211023031,true,"exact",false,"complete","all",794,20210211023031]
      }
    ]
  };
  } catch (e) {
    pcoConnector.newUserError()
      .setDebugText('Error getting data: ' + e)
      .setText('There was an error getting the connector data. Try again later, or file an issue if this error persists.')
      .throwException();
  }
};