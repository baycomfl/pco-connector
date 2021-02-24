const ATTRIBUTES = {
  "lists": {
                "auto_refresh": "boolean",
                "automations_active": "boolean",
                "automations_count": "int",
                "batch_completed_at": "timestamp",
                "created_at": "timestamp",
                "description": "string",
                "has_inactive_results": "boolean",
                "include_inactive": "boolean",
                "invalid": "boolean",
                "name": "string",
                "recently_viewed": "boolean",
                "refreshed_at": "timestamp",
                "return_original_if_none": "boolean",
                "returns": "string",
                "starred": "boolean",
                "status": "string",
                "subset": "string",
                "total_people": "int",
                "updated_at": "timestamp"
            },
  "events": {
                "archived_at": "timestamp",
                "created_at": "timestamp",
                "enable_services_integration": "boolean",
                "frequency": "string",
                "integration_key": "string",
                "location_times_enabled": "boolean",
                "name": "string",
                "pre_select_enabled": "boolean",
                "updated_at": "timestamp"
            }
};

const deriveSchema = (dataSource) => {
  
  let fields = pcoConnector.getFields();
  var types = pcoConnector.FieldType;

  Object.keys(dataSource).forEach((prop) => {
    // Set fields based on data type
    var field;
    switch (dataSource[prop]) {
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

}
