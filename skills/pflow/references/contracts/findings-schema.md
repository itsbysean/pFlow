# Optional code findings JSON Schema

Version 1.0.0; also embedded in the executable. Findings reuse the architecture SourceReference definition in schema.md.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:pflow:findings:1.0.0",
  "title": "pFlow optional code findings 1.0.0",
  "type": "object",
  "required": [
    "findingsVersion",
    "findings"
  ],
  "properties": {
    "findingsVersion": {
      "const": "1.0.0"
    },
    "findings": {
      "type": "array",
      "maxItems": 1000,
      "items": {
        "$ref": "#/$defs/finding"
      }
    }
  },
  "additionalProperties": false,
  "$defs": {
    "target": {
      "type": "object",
      "required": [
        "flowId"
      ],
      "properties": {
        "flowId": {
          "type": "string",
          "pattern": "^flow_[A-Za-z0-9_-]+$"
        },
        "nodeId": {
          "type": "string",
          "pattern": "^node_[A-Za-z0-9_-]+$"
        },
        "edgeId": {
          "type": "string",
          "pattern": "^edge_[A-Za-z0-9_-]+$"
        }
      },
      "not": {
        "required": [
          "nodeId",
          "edgeId"
        ],
        "properties": {
          "nodeId": true,
          "edgeId": true
        }
      },
      "additionalProperties": false
    },
    "review": {
      "type": "object",
      "required": [
        "status",
        "rationale"
      ],
      "properties": {
        "status": {
          "enum": [
            "unreviewed",
            "supported",
            "dismissed",
            "resolved"
          ]
        },
        "rationale": {
          "type": "string",
          "minLength": 1,
          "maxLength": 12000,
          "pattern": "\\S"
        }
      },
      "additionalProperties": false
    },
    "evidence": {
      "type": "object",
      "required": [
        "source",
        "sha256"
      ],
      "properties": {
        "source": {
          "$ref": "urn:pflow:architecture:1.0.0#/$defs/sourceReference"
        },
        "sha256": {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        }
      },
      "additionalProperties": false
    },
    "finding": {
      "type": "object",
      "required": [
        "id",
        "architectureHash",
        "title",
        "description",
        "severity",
        "confidence",
        "targets",
        "evidence",
        "reviews"
      ],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^finding_[A-Za-z0-9_-]+$"
        },
        "architectureHash": {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        },
        "title": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "pattern": "\\S"
        },
        "description": {
          "type": "string",
          "minLength": 1,
          "maxLength": 12000,
          "pattern": "\\S"
        },
        "severity": {
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ]
        },
        "confidence": {
          "enum": [
            "low",
            "medium",
            "high"
          ]
        },
        "targets": {
          "type": "array",
          "minItems": 1,
          "maxItems": 25,
          "uniqueItems": true,
          "items": {
            "$ref": "#/$defs/target"
          }
        },
        "evidence": {
          "type": "array",
          "minItems": 1,
          "maxItems": 50,
          "items": {
            "$ref": "#/$defs/evidence"
          }
        },
        "reviews": {
          "type": "array",
          "minItems": 1,
          "maxItems": 1000,
          "items": {
            "$ref": "#/$defs/review"
          }
        }
      },
      "additionalProperties": false
    }
  }
}
```
