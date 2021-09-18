
// connector declared in auth.gs
// const pcoConnector = DataStudioApp.createCommunityConnector();

/**
 *
 *
 * @return {*} 
 */
function isAdminUser() {
  if(ADMINS.indexOf(Session.getEffectiveUser().getEmail() !== -1)){
    console.warn("admin user");
    return true;
  }
  return false;
}

/**
 *
 *
 * @param {*} request
 * @return {*} 
 */
function getConfig(request) {
  // This function gets called over and over as the user moves through the options
  // Instead of exposing a way to pass previous selections to the the next call, you have this abomination :)
  // Also there is no way to set default options
  try {
    const config = pcoConnector.getConfig();
    const configParams = request.configParams;
    const isFirstRequest = configParams === undefined;
    if(isFirstRequest){
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
      source.addOption(config.newOptionBuilder().setLabel(ENDPOINTS[endpoint].label).setValue(endpoint));
    });

    if(!isFirstRequest){
      if (configParams.selectedAPI === undefined) {
        pcoConnector.newUserError().setText('You must choose a data source to continue.').throwException();
      }

      switch (ENDPOINTS[configParams.selectedAPI].date_range_required) {
        case true: {
          config.setDateRangeRequired(true);
          config.setIsSteppedConfig(false);
          break;
        }
        case false: {
          config.setIsSteppedConfig(true);
          config.newCheckbox()
            .setId('selectMultiple')
            .setName('Select Individual Items')
            .setIsDynamic(true)
            .setHelpText('If checked you can select a subset of items to add to Data Studio');
          break;
        }
      }
      if (configParams.selectMultiple === "true") {
            config.setIsSteppedConfig(false);
            let pickList = config.newSelectMultiple()
              .setId("selectedItems")
              .setName("Select Your Items")
              .setIsDynamic(true)
              .setHelpText("Select the PCO items to import.");
            const response = requestPCO(configParams.selectedAPI, {aggregate: true});

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
          } else {
            // this is a work around because you can't default the value of the checkbox
            // the empty config element allows UI to present the "connect" button.
            config.newInfo().setId('ready');
            config.setDateRangeRequired(true);
            config.setIsSteppedConfig(false);
          }
    }
    
    return config.build();     
  } catch (e) {
    console.error(e);
    pcoConnector.newUserError()
      .setDebugText(e)
      .setText('There was an error listing the connector data sources. Try again later, or file an issue if this error persists.')
      .throwException();
  }
}

/**
 *
 *
 * @param {*} request
 * @return {*} 
 */
function getSchema(request){
  try {
    console.log("getSchema",request);
    const fields = deriveSchema(ENDPOINTS[request.configParams.selectedAPI]);
    return { 'schema': fields.build() };
  } catch (e) {
    console.error("getSchema() error: ", e.hasOwnProperty("message") ? e.message : e);
    pcoConnector.newUserError()
      .setDebugText('Error getting configuration: ' + e)
      .setText('There was an error getting the connector schema. Try again later, or file an issue if this error persists.')
      .throwException();
  }
};

/**
 *
 *
 * @param {*} request
 * @return {*} 
 */
function getData(request){
  try {
    console.log("getData", request); 
    // uncomment to reduce request size for debugging
    //request.dateRange ={ startDate: '2021-08-04', endDate: '2021-08-12' }
    let requestedFieldIds = request.fields.map(field => {return field.name;});
    const selectedAPI = request.configParams.selectedAPI;
    const fields = deriveSchema(ENDPOINTS[selectedAPI]);
    const requestedFields = fields.forIds(requestedFieldIds);
    const schema = requestedFields.build();
    const apiResponses = [];
    const options = {
      "aggregate": true,
      "qs": filterUserDefinedParams(request.configParams)
    };
    if(typeof request.dateRange !== "undefined"){
      if (typeof request.dateRange.startDate){
        options.qs[ENDPOINTS[selectedAPI].start_date_param] = request.dateRange.startDate;
      }
      if (typeof request.dateRange.endDate){
        options.qs[ENDPOINTS[selectedAPI].end_date_param] = request.dateRange.endDate;
      }
    }

    if(typeof request.configParams.selectedItems !== "undefined"){
      request.configParams.selectedItems.split(",").forEach(item =>{
        options["rest_params"] = [item];
        apiResponses.push(requestPCO(selectedAPI, options));
      });
    } else {
      apiResponses.push(requestPCO(selectedAPI, options));
    }
              
    const rows = buildRows(requestedFieldIds, apiResponses, selectedAPI);

    return {
      "schema": schema,
      "rows": rows
    };
  } catch (e) {
    pcoConnector.newUserError()
      .setDebugText('Error getting data: ' + e)
      .setText('There was an error getting the connector data. Try again later, or file an issue if this error persists.')
      .throwException();
  }
};