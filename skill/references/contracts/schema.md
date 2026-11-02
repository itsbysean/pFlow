# Approved architecture JSON Schema

Exact model 1.0.0 schema; also embedded in the executable.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:pflow:architecture:1.0.0",
  "title": "pFlow architecture model 1.0.0",
  "description": "Approved M1-01 model. Cross-reference and evidence checks are separate from structural validation.",
  "type": "object",
  "required": [
    "modelVersion",
    "entryPoints",
    "flows",
    "sources"
  ],
  "properties": {
    "modelVersion": {
      "const": "1.0.0"
    },
    "revision": {
      "$ref": "#/$defs/text"
    },
    "entryPoints": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/entryPoint"
      }
    },
    "flows": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/flow"
      }
    },
    "sources": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/sourceReference"
      }
    }
  },
  "additionalProperties": false,
  "$defs": {
    "entryId": {
      "type": "string",
      "pattern": "^entry_[A-Za-z0-9_-]+$"
    },
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
    },
    "sourceId": {
      "type": "string",
      "pattern": "^src_[A-Za-z0-9_-]+$"
    },
    "text": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S"
    },
    "sourceIds": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/sourceId"
      },
      "minItems": 1
    },
    "doc": {
      "type": "object",
      "required": [
        "path"
      ],
      "properties": {
        "path": {
          "$ref": "#/$defs/text"
        },
        "anchor": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^#\\s]+$"
        }
      },
      "additionalProperties": false
    },
    "docs": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/doc"
      }
    },
    "scalar": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ]
    },
    "external": {
      "type": "object",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "enum": [
            "http",
            "database",
            "messaging",
            "library",
            "other"
          ]
        },
        "name": {
          "$ref": "#/$defs/text"
        },
        "attributes": {
          "type": "object",
          "propertyNames": {
            "pattern": "^[^.\\s]+\\.[^\\s]+$"
          },
          "additionalProperties": {
            "anyOf": [
              {
                "$ref": "#/$defs/scalar"
              },
              {
                "type": "array",
                "items": {
                  "$ref": "#/$defs/scalar"
                }
              }
            ]
          }
        }
      },
      "additionalProperties": false
    },
    "entryPoint": {
      "type": "object",
      "required": [
        "id",
        "label",
        "flowId",
        "sourceIds"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/entryId"
        },
        "label": {
          "$ref": "#/$defs/text"
        },
        "flowId": {
          "$ref": "#/$defs/flowId"
        },
        "sourceIds": {
          "$ref": "#/$defs/sourceIds"
        },
        "trigger": {
          "$ref": "#/$defs/text"
        },
        "docs": {
          "$ref": "#/$defs/docs"
        }
      },
      "additionalProperties": false
    },
    "flow": {
      "type": "object",
      "required": [
        "id",
        "label",
        "startNodeId",
        "nodes",
        "edges"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/flowId"
        },
        "label": {
          "$ref": "#/$defs/text"
        },
        "startNodeId": {
          "$ref": "#/$defs/nodeId"
        },
        "nodes": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/node"
          },
          "minItems": 1
        },
        "edges": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/edge"
          }
        },
        "docs": {
          "$ref": "#/$defs/docs"
        }
      },
      "additionalProperties": false
    },
    "node": {
      "type": "object",
      "required": [
        "id",
        "label",
        "kind",
        "sourceIds"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/nodeId"
        },
        "label": {
          "$ref": "#/$defs/text"
        },
        "kind": {
          "enum": [
            "operation",
            "decision",
            "external",
            "terminal",
            "unresolved"
          ]
        },
        "sourceIds": {
          "$ref": "#/$defs/sourceIds"
        },
        "expandFlowId": {
          "$ref": "#/$defs/flowId"
        },
        "external": {
          "$ref": "#/$defs/external"
        },
        "docs": {
          "$ref": "#/$defs/docs"
        }
      },
      "additionalProperties": false,
      "allOf": [
        {
          "if": {
            "required": [
              "external"
            ],
            "properties": {
              "external": true
            }
          },
          "then": {
            "properties": {
              "kind": {
                "const": "external"
              }
            }
          }
        }
      ]
    },
    "edge": {
      "type": "object",
      "required": [
        "id",
        "from",
        "to",
        "kind",
        "mode",
        "sourceIds"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/edgeId"
        },
        "from": {
          "$ref": "#/$defs/nodeId"
        },
        "to": {
          "$ref": "#/$defs/nodeId"
        },
        "kind": {
          "enum": [
            "next",
            "call",
            "branch",
            "return",
            "exception",
            "send",
            "receive"
          ]
        },
        "mode": {
          "enum": [
            "sync",
            "async",
            "unknown"
          ]
        },
        "sourceIds": {
          "$ref": "#/$defs/sourceIds"
        },
        "label": {
          "$ref": "#/$defs/text"
        },
        "docs": {
          "$ref": "#/$defs/docs"
        }
      },
      "additionalProperties": false,
      "allOf": [
        {
          "if": {
            "properties": {
              "kind": {
                "const": "branch"
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "required": [
              "label"
            ],
            "properties": {
              "label": true
            }
          }
        }
      ]
    },
    "sourceReference": {
      "type": "object",
      "required": [
        "id",
        "path"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/sourceId"
        },
        "path": {
          "$ref": "#/$defs/text"
        },
        "symbol": {
          "$ref": "#/$defs/text"
        },
        "startLine": {
          "type": "integer",
          "minimum": 1
        },
        "endLine": {
          "type": "integer",
          "minimum": 1
        }
      },
      "additionalProperties": false,
      "dependentRequired": {
        "startLine": [
          "endLine"
        ],
        "endLine": [
          "startLine"
        ]
      }
    }
  }
}
```
