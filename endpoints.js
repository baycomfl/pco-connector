const ENDPOINTS = {
  "lists": {
    "attributes": {
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
    "label": "Lists",
    "url": "https://api.planningcenteronline.com/people/v2/lists",
    "per_page": 100,
    "statusCode": 200
  },
  "events": {
    "attributes": {
      "archived_at": "timestamp",
      "created_at": "timestamp",
      "enable_services_integration": "boolean",
      "frequency": "string",
      "integration_key": "string",
      "location_times_enabled": "boolean",
      "name": "string",
      "pre_select_enabled": "boolean",
      "updated_at": "timestamp"
    },
    "label": "Events",
    "url": "https://api.planningcenteronline.com/check-ins/v2/events",
    "per_page": 100,
    "statusCode": 200
  }
}; 
