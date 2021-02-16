
// connector declared in auth.gs
// const pcoConnector = DataStudioApp.createCommunityConnector();
function getConfig(request) {
  try {
    let config = pcoConnector.getConfig();
    let configParams = request.configParams;
    const isFirstRequest = configParams === undefined;
    if (isFirstRequest) {
      config.setIsSteppedConfig(true);
    }
    config
      .newSelectSingle()
      .setId('selectedAPI')
      .setName('Select Data Source')
      .setIsDynamic(true)
      .setHelpText('Select the PCO data source.')
      .setAllowOverride(true)
      .addOption(config.newOptionBuilder().setLabel('Lists').setValue('lists'))
      .addOption(config.newOptionBuilder().setLabel('Events').setValue('events'))
    
    if(!isFirstRequest){
      const URL = configParams.selectedAPI === "lists" ? LISTS_URL : EVENTS_URL
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
  
  let fields = pcoConnector.getFields();
  let types = pcoConnector.FieldType;

  let created = fields.newDimension()
      .setId('Created')
      .setName('Date Created')
      .setDescription('The date the list was created')
      .setType(types.YEAR_MONTH_DAY)
      .setGroup('Date');

  let updated = fields.newDimension()
      .setId('Updated')
      .setName('Date Update')
      .setDescription('The date the list was updated')
      .setType(types.YEAR_MONTH_DAY)
      .setGroup('Date');

  let people = fields.newDimension()
      .setId('People')
      .setName('People')
      .setDescription('The count of people')
      .setType(types.NUMBER);
    
    fields.setDefaultDimension(people.getId());

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
  } catch (e) {
    pcoConnector.newUserError()
      .setDebugText('Error getting data: ' + e)
      .setText('There was an error getting the connector data. Try again later, or file an issue if this error persists.')
      .throwException();
  }
};