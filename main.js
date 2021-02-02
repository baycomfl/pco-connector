
// declare connector
//const pcoConnector = DataStudioApp.createCommunityConnector();

function getConfig() {
  Logger.log('getConfig()');
  const config = pcoConnector.getConfig();
  config
    .newInfo()
    .setId('instructions')
    .setText(
      'Select the data set you would like to import.'
    );
  return config.build();
}

function getSchema(){
  Logger.log('getSchema()');
};

function getData(){
  Logger.log('getData()');
};