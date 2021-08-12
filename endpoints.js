const ENDPOINTS = {
  "check-ins": {
    "attributes": {
      "checked_out_at": "timestamp",
      "created_at": "timestamp",
      "emergency_contact_name": "string",
      "emergency_contact_phone_number": "string",
      "first_name": "string",
      "kind": "string",
      "last_name": "string",
      "medical_notes": "string",
      "number": "int",
      "security_code": "string",
      "updated_at": "timestamp"
    },
    "label": "Check-ins",
    "url": "https://api.planningcenteronline.com/check-ins/v2/check_ins",
    "per_page": 100,
    "status_code": 200,
    "date_range_required": true,
    "start_date_param": "where[created_at][gte]",
    "end_date_param": "where[created_at][lte]"
  },
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
    "status_code": 200,
    "date_range_required": false,
    "start_date_param": "where[created_at][gte]",
    "end_date_param": "where[created_at][lte]"
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
    "status_code": 200,
    "date_range_required": false,
    "start_date_param": "where[created_at][gte]",
    "end_date_param": "where[created_at][lte]"
  }
}; 
