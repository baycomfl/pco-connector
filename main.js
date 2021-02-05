
// declare connector
//const pcoConnector = DataStudioApp.createCommunityConnector();

function getConfig() {
  try {
    var config = pcoConnector.getConfig();
    let pickList = config.newSelectSingle()
      .setId("selected_list")
      .setName("Select Your List")
      .setHelpText("Select the PCO List to import.")
    const response = UrlFetchApp.fetch(
      "https://api.planningcenteronline.com/people/v2/lists",
      {
        "headers": {
          "Authorization": "Bearer " + getOAuthService().getAccessToken()
        }
      }
    );
    const lists = JSON.parse(response.getContentText());
    lists.data.forEach(list => {
      pickList.addOption(
        config.newOptionBuilder()
        .setLabel(
          list.attributes.name === null 
          ? list.attributes.description.substring(0,20) + "..." 
          : list.attributes.name
        )
        .setValue(list.id)
      )
    });
    
    return config.build();
  } catch (e) {
    console.error("Error in getConfig()", e);
    DataStudioApp.createCommunityConnector()
        .newUserError()
        .setDebugText('Error getting configuration: ' + e)
        .setText('There was an error getting the connector configuration. Try again later, or file an issue if this error persists.')
        .throwException();
  }
}

function getSchema(){
  try {
    Logger.log('getSchema()');
  } catch (e) {
    DataStudioApp.createCommunityConnector()
        .newUserError()
        .setDebugText('Error getting configuration: ' + e)
        .setText('There was an error getting the connector schema. Try again later, or file an issue if this error persists.')
        .throwException();
  }
};

function getData(){
  try {
    Logger.log('getData()');
    return config.build();
  } catch (e) {
    DataStudioApp.createCommunityConnector()
        .newUserError()
        .setDebugText('Error getting data: ' + e)
        .setText('There was an error getting the connector data. Try again later, or file an issue if this error persists.')
        .throwException();
  }
};