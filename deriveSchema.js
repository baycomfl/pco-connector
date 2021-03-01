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

}
