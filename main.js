
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
      let pickList = config.newSelectMultiple()
        .setId("selectedItems")
        .setName("Select Your Items")
        .setHelpText("Select the PCO items to import.")
      const response = requestPCO(configParams.selectedAPI, {"aggregate": true});
      response.data.forEach(item => {
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
       config.setIsSteppedConfig(false);
    }     
     
    return config.build()
    
  } catch (e) {
    console.error(e);
    pcoConnector.newUserError()
      .setDebugText(e)
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
    const requestedFields = fields.forIds(requestedFieldIds);
//configParams: { selectedAPI: 'lists', selectedItems: '1609138,1611113' },
    const apiResponses = [];
    request.configParams.selectedItems.split(",").forEach(item =>{
      apiResponses.push(requestPCO(request.configParams.selectedAPI, {"rest_params": [item]}));
    });
    console.log("RAW ROWS!!!", apiResponses);
    // TODO add util to build values arrays
    // TODO add util to filter values arrays based on requested fields.
    const schema = requestedFields.build();
    console.log("SCHEMA!!!", schema);
    return {
      "schema": schema,
      "rows":[ 
        {
          "values": [false,false]
        },
        {
          "values": [false,false]
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