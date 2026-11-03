/* Approved example artifacts for offline development. */
globalThis.pFlowSamples = [
  {
    "key": "a-sync",
    "title": "Synchronous refresh",
    "architecture": {
      "modelVersion": "1.0.0",
      "entryPoints": [
        {
          "id": "entry_b285ac74eb27",
          "label": "Refresh command",
          "flowId": "flow_9a0eb994df17",
          "sourceIds": [
            "src_65bf5e7a0a3d",
            "src_9eeed4e44319"
          ],
          "trigger": "Registered command refresh",
          "docs": [
            {
              "path": "execution.md",
              "anchor": "entry_b285ac74eb27"
            }
          ]
        }
      ],
      "flows": [
        {
          "id": "flow_9a0eb994df17",
          "label": "Refresh command",
          "startNodeId": "node_352296cd82d5",
          "nodes": [
            {
              "id": "node_352296cd82d5",
              "label": "Receive command",
              "kind": "operation",
              "sourceIds": [
                "src_9eeed4e44319"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_352296cd82d5"
                }
              ]
            },
            {
              "id": "node_8b15c706f980",
              "label": "Invoke refresh component",
              "kind": "operation",
              "sourceIds": [
                "src_9eeed4e44319",
                "src_e8a62f5a06fa"
              ],
              "expandFlowId": "flow_df8ae1187700",
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_8b15c706f980"
                }
              ]
            },
            {
              "id": "node_4810507d3d99",
              "label": "Return result",
              "kind": "terminal",
              "sourceIds": [
                "src_9eeed4e44319"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_4810507d3d99"
                }
              ]
            },
            {
              "id": "node_a750a397fbb6",
              "label": "Propagate exception",
              "kind": "terminal",
              "sourceIds": [
                "src_9eeed4e44319"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_a750a397fbb6"
                }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_388f0f343535",
              "from": "node_352296cd82d5",
              "to": "node_8b15c706f980",
              "kind": "call",
              "mode": "sync",
              "sourceIds": [
                "src_9eeed4e44319",
                "src_e8a62f5a06fa"
              ]
            },
            {
              "id": "edge_50f5d89b43b2",
              "from": "node_8b15c706f980",
              "to": "node_4810507d3d99",
              "kind": "return",
              "mode": "sync",
              "sourceIds": [
                "src_9eeed4e44319"
              ]
            },
            {
              "id": "edge_5e4c16fc95e4",
              "from": "node_8b15c706f980",
              "to": "node_a750a397fbb6",
              "kind": "exception",
              "mode": "sync",
              "sourceIds": [
                "src_9eeed4e44319"
              ]
            }
          ],
          "docs": [
            {
              "path": "execution.md",
              "anchor": "flow_9a0eb994df17"
            }
          ]
        },
        {
          "id": "flow_df8ae1187700",
          "label": "Refresh component",
          "startNodeId": "node_8a44645d4337",
          "nodes": [
            {
              "id": "node_8a44645d4337",
              "label": "Receive execution request",
              "kind": "operation",
              "sourceIds": [
                "src_e8a62f5a06fa"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_8a44645d4337"
                }
              ]
            },
            {
              "id": "node_a92196d6ef71",
              "label": "Invoke read_state",
              "kind": "operation",
              "sourceIds": [
                "src_e8a62f5a06fa",
                "src_1def2254d126"
              ],
              "expandFlowId": "flow_844c0963da42",
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_a92196d6ef71"
                }
              ]
            },
            {
              "id": "node_6f458592ca7a",
              "label": "Return result",
              "kind": "terminal",
              "sourceIds": [
                "src_e8a62f5a06fa"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_6f458592ca7a"
                }
              ]
            },
            {
              "id": "node_f76637525363",
              "label": "Propagate exception",
              "kind": "terminal",
              "sourceIds": [
                "src_e8a62f5a06fa"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_f76637525363"
                }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_bc53e9600442",
              "from": "node_8a44645d4337",
              "to": "node_a92196d6ef71",
              "kind": "call",
              "mode": "sync",
              "sourceIds": [
                "src_e8a62f5a06fa",
                "src_1def2254d126"
              ]
            },
            {
              "id": "edge_a5cc0e2285bc",
              "from": "node_a92196d6ef71",
              "to": "node_6f458592ca7a",
              "kind": "return",
              "mode": "sync",
              "sourceIds": [
                "src_e8a62f5a06fa"
              ]
            },
            {
              "id": "edge_5b92d09811b8",
              "from": "node_a92196d6ef71",
              "to": "node_f76637525363",
              "kind": "exception",
              "mode": "sync",
              "sourceIds": [
                "src_e8a62f5a06fa"
              ]
            }
          ],
          "docs": [
            {
              "path": "execution.md",
              "anchor": "flow_df8ae1187700"
            }
          ]
        },
        {
          "id": "flow_844c0963da42",
          "label": "Read state",
          "startNodeId": "node_687dd127f403",
          "nodes": [
            {
              "id": "node_687dd127f403",
              "label": "Validate with input_rules",
              "kind": "external",
              "sourceIds": [
                "src_ea6916f84f7c"
              ],
              "external": {
                "kind": "library",
                "name": "input_rules",
                "attributes": {
                  "library.symbol": "check"
                }
              },
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_687dd127f403"
                }
              ]
            },
            {
              "id": "node_b5b0dd797025",
              "label": "Input valid?",
              "kind": "decision",
              "sourceIds": [
                "src_9c29a4625764"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_b5b0dd797025"
                }
              ]
            },
            {
              "id": "node_d1e0f061c044",
              "label": "Fetch state",
              "kind": "external",
              "sourceIds": [
                "src_35f0bded3992"
              ],
              "external": {
                "kind": "http",
                "name": "State service",
                "attributes": {
                  "http.method": "GET",
                  "http.urlTemplate": "${STATE_URL}/state"
                }
              },
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_d1e0f061c044"
                }
              ]
            },
            {
              "id": "node_61a961f4ac47",
              "label": "Return invalid input",
              "kind": "terminal",
              "sourceIds": [
                "src_9c29a4625764"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_61a961f4ac47"
                }
              ]
            },
            {
              "id": "node_3e4fe1d913f7",
              "label": "Return state",
              "kind": "terminal",
              "sourceIds": [
                "src_58fcca3eb0d2"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_3e4fe1d913f7"
                }
              ]
            },
            {
              "id": "node_e9162329f133",
              "label": "Propagate request exception",
              "kind": "terminal",
              "sourceIds": [
                "src_35f0bded3992"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_e9162329f133"
                }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_c3bcb936335e",
              "from": "node_687dd127f403",
              "to": "node_b5b0dd797025",
              "kind": "next",
              "mode": "sync",
              "sourceIds": [
                "src_ea6916f84f7c",
                "src_9c29a4625764"
              ]
            },
            {
              "id": "edge_3a8a37b2eaf7",
              "from": "node_b5b0dd797025",
              "to": "node_d1e0f061c044",
              "kind": "branch",
              "mode": "sync",
              "sourceIds": [
                "src_9c29a4625764",
                "src_35f0bded3992"
              ],
              "label": "valid"
            },
            {
              "id": "edge_20b2f39e2cc9",
              "from": "node_b5b0dd797025",
              "to": "node_61a961f4ac47",
              "kind": "branch",
              "mode": "sync",
              "sourceIds": [
                "src_9c29a4625764"
              ],
              "label": "invalid"
            },
            {
              "id": "edge_bcafd9b24e12",
              "from": "node_d1e0f061c044",
              "to": "node_3e4fe1d913f7",
              "kind": "return",
              "mode": "sync",
              "sourceIds": [
                "src_58fcca3eb0d2"
              ]
            },
            {
              "id": "edge_768478b1f423",
              "from": "node_d1e0f061c044",
              "to": "node_e9162329f133",
              "kind": "exception",
              "mode": "sync",
              "sourceIds": [
                "src_35f0bded3992"
              ]
            }
          ],
          "docs": [
            {
              "path": "execution.md",
              "anchor": "flow_844c0963da42"
            }
          ]
        }
      ],
      "sources": [
        {
          "id": "src_65bf5e7a0a3d",
          "path": "examples/a-sync/sources/command.py.txt",
          "startLine": 2,
          "endLine": 2
        },
        {
          "id": "src_9eeed4e44319",
          "path": "examples/a-sync/sources/command.py.txt",
          "startLine": 3,
          "endLine": 4,
          "symbol": "run_refresh"
        },
        {
          "id": "src_e8a62f5a06fa",
          "path": "examples/a-sync/sources/component.py.txt",
          "startLine": 2,
          "endLine": 3,
          "symbol": "execute"
        },
        {
          "id": "src_1def2254d126",
          "path": "examples/a-sync/sources/state.py.txt",
          "startLine": 2,
          "endLine": 7,
          "symbol": "read_state"
        },
        {
          "id": "src_ea6916f84f7c",
          "path": "examples/a-sync/sources/state.py.txt",
          "startLine": 3,
          "endLine": 3
        },
        {
          "id": "src_9c29a4625764",
          "path": "examples/a-sync/sources/state.py.txt",
          "startLine": 4,
          "endLine": 5
        },
        {
          "id": "src_35f0bded3992",
          "path": "examples/a-sync/sources/state.py.txt",
          "startLine": 6,
          "endLine": 6
        },
        {
          "id": "src_58fcca3eb0d2",
          "path": "examples/a-sync/sources/state.py.txt",
          "startLine": 7,
          "endLine": 7
        }
      ]
    }
  },
  {
    "key": "b-async",
    "title": "Asynchronous jobs",
    "architecture": {
      "modelVersion": "1.0.0",
      "entryPoints": [
        {
          "id": "entry_1a955790e646",
          "label": "Submit command",
          "flowId": "flow_9e27be90a054",
          "sourceIds": [
            "src_cd50bc1a2640"
          ],
          "trigger": "Registered command submit",
          "docs": [
            {
              "path": "execution.md",
              "anchor": "entry_1a955790e646"
            }
          ]
        },
        {
          "id": "entry_25020255407d",
          "label": "Indexer worker",
          "flowId": "flow_4b996747ac21",
          "sourceIds": [
            "src_cb7eb44009b5",
            "src_4e211161c2b5"
          ],
          "trigger": "Configured jobs subscription",
          "docs": [
            {
              "path": "execution.md",
              "anchor": "entry_25020255407d"
            }
          ]
        }
      ],
      "flows": [
        {
          "id": "flow_9e27be90a054",
          "label": "Publish job",
          "startNodeId": "node_0e7cc113b65d",
          "nodes": [
            {
              "id": "node_0e7cc113b65d",
              "label": "Receive submit command",
              "kind": "operation",
              "sourceIds": [
                "src_cd50bc1a2640"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_0e7cc113b65d"
                }
              ]
            },
            {
              "id": "node_565205c4b6ac",
              "label": "Publish to jobs",
              "kind": "external",
              "sourceIds": [
                "src_54f1fff7e970"
              ],
              "external": {
                "kind": "messaging",
                "name": "Job broker",
                "attributes": {
                  "messaging.channel": "jobs"
                }
              },
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_565205c4b6ac"
                }
              ]
            },
            {
              "id": "node_baa95457c989",
              "label": "Return accepted",
              "kind": "terminal",
              "sourceIds": [
                "src_eef0c1c8de4a"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_baa95457c989"
                }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_0dbe36428aeb",
              "from": "node_0e7cc113b65d",
              "to": "node_565205c4b6ac",
              "kind": "send",
              "mode": "sync",
              "sourceIds": [
                "src_54f1fff7e970"
              ]
            },
            {
              "id": "edge_53b87a9d836d",
              "from": "node_565205c4b6ac",
              "to": "node_baa95457c989",
              "kind": "return",
              "mode": "sync",
              "sourceIds": [
                "src_eef0c1c8de4a"
              ]
            },
            {
              "id": "edge_3656a413844b",
              "from": "node_565205c4b6ac",
              "to": "node_787c595615f3",
              "kind": "receive",
              "mode": "async",
              "sourceIds": [
                "src_54f1fff7e970",
                "src_cb7eb44009b5",
                "src_4e211161c2b5"
              ],
              "label": "Configured jobs subscription",
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "edge_3656a413844b"
                }
              ]
            }
          ],
          "docs": [
            {
              "path": "execution.md",
              "anchor": "flow_9e27be90a054"
            }
          ]
        },
        {
          "id": "flow_4b996747ac21",
          "label": "Process job",
          "startNodeId": "node_787c595615f3",
          "nodes": [
            {
              "id": "node_787c595615f3",
              "label": "Receive jobs message",
              "kind": "operation",
              "sourceIds": [
                "src_cb7eb44009b5",
                "src_4e211161c2b5"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_787c595615f3"
                }
              ]
            },
            {
              "id": "node_b02d324b90b7",
              "label": "Write message",
              "kind": "external",
              "sourceIds": [
                "src_3007021966f4"
              ],
              "external": {
                "kind": "database",
                "name": "Job store",
                "attributes": {
                  "database.operation": "write"
                }
              },
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_b02d324b90b7"
                }
              ]
            },
            {
              "id": "node_fae9e45838b8",
              "label": "Return processed",
              "kind": "terminal",
              "sourceIds": [
                "src_3007021966f4"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_fae9e45838b8"
                }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_3fb40c16cb1a",
              "from": "node_787c595615f3",
              "to": "node_b02d324b90b7",
              "kind": "call",
              "mode": "sync",
              "sourceIds": [
                "src_3007021966f4"
              ]
            },
            {
              "id": "edge_8045d15b7fe6",
              "from": "node_b02d324b90b7",
              "to": "node_fae9e45838b8",
              "kind": "return",
              "mode": "sync",
              "sourceIds": [
                "src_3007021966f4"
              ]
            }
          ],
          "docs": [
            {
              "path": "execution.md",
              "anchor": "flow_4b996747ac21"
            }
          ]
        }
      ],
      "sources": [
        {
          "id": "src_54f1fff7e970",
          "path": "examples/b-async/sources/publisher.js.txt",
          "startLine": 4,
          "endLine": 4
        },
        {
          "id": "src_cd50bc1a2640",
          "path": "examples/b-async/sources/publisher.js.txt",
          "startLine": 2,
          "endLine": 2
        },
        {
          "id": "src_eef0c1c8de4a",
          "path": "examples/b-async/sources/publisher.js.txt",
          "startLine": 5,
          "endLine": 5
        },
        {
          "id": "src_cb7eb44009b5",
          "path": "examples/b-async/sources/bindings.xml",
          "startLine": 2,
          "endLine": 2
        },
        {
          "id": "src_4e211161c2b5",
          "path": "examples/b-async/sources/worker.js.txt",
          "startLine": 2,
          "endLine": 2
        },
        {
          "id": "src_3007021966f4",
          "path": "examples/b-async/sources/worker.js.txt",
          "startLine": 3,
          "endLine": 5,
          "symbol": "processJob"
        }
      ]
    }
  },
  {
    "key": "c-custom",
    "title": "Custom task dispatch",
    "architecture": {
      "modelVersion": "1.0.0",
      "entryPoints": [
        {
          "id": "entry_614ac3cd60a1",
          "label": "Nightly rollup task",
          "flowId": "flow_4131e85f26d2",
          "sourceIds": [
            "src_32bed10ef9e0",
            "src_d2d9d64232f1",
            "src_eae3e0bb6cfb",
            "src_d346d8984be7"
          ],
          "trigger": "Custom scheduler registration from XML",
          "docs": [
            {
              "path": "execution.md",
              "anchor": "entry_614ac3cd60a1"
            }
          ]
        }
      ],
      "flows": [
        {
          "id": "flow_4131e85f26d2",
          "label": "Custom scheduled dispatch",
          "startNodeId": "node_31a244ce4c93",
          "nodes": [
            {
              "id": "node_31a244ce4c93",
              "label": "Activate configured task",
              "kind": "operation",
              "sourceIds": [
                "src_32bed10ef9e0",
                "src_eae3e0bb6cfb"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_31a244ce4c93"
                }
              ]
            },
            {
              "id": "node_dff9cc696735",
              "label": "Resolve registered handler",
              "kind": "operation",
              "sourceIds": [
                "src_d346d8984be7",
                "src_d2d9d64232f1"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_dff9cc696735"
                }
              ]
            },
            {
              "id": "node_9a2347f940fd",
              "label": "Invoke rollup",
              "kind": "operation",
              "sourceIds": [
                "src_32bed10ef9e0",
                "src_d2d9d64232f1",
                "src_d346d8984be7",
                "src_101537a07182"
              ],
              "expandFlowId": "flow_6dc031d9e806",
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_9a2347f940fd"
                }
              ]
            },
            {
              "id": "node_453c6bcced56",
              "label": "Return handler result",
              "kind": "terminal",
              "sourceIds": [
                "src_d346d8984be7"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_453c6bcced56"
                }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_3a2d03b335c8",
              "from": "node_31a244ce4c93",
              "to": "node_dff9cc696735",
              "kind": "call",
              "mode": "sync",
              "sourceIds": [
                "src_32bed10ef9e0",
                "src_eae3e0bb6cfb",
                "src_d346d8984be7"
              ]
            },
            {
              "id": "edge_6e7ba394154f",
              "from": "node_dff9cc696735",
              "to": "node_9a2347f940fd",
              "kind": "call",
              "mode": "sync",
              "sourceIds": [
                "src_32bed10ef9e0",
                "src_d2d9d64232f1",
                "src_d346d8984be7",
                "src_101537a07182"
              ]
            },
            {
              "id": "edge_c63332bc6095",
              "from": "node_9a2347f940fd",
              "to": "node_453c6bcced56",
              "kind": "return",
              "mode": "sync",
              "sourceIds": [
                "src_d346d8984be7"
              ]
            }
          ],
          "docs": [
            {
              "path": "execution.md",
              "anchor": "flow_4131e85f26d2"
            }
          ]
        },
        {
          "id": "flow_6dc031d9e806",
          "label": "Rollup handler",
          "startNodeId": "node_441a3ec507a6",
          "nodes": [
            {
              "id": "node_441a3ec507a6",
              "label": "Compact archive",
              "kind": "external",
              "sourceIds": [
                "src_101537a07182"
              ],
              "external": {
                "kind": "other",
                "name": "Archive service"
              },
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_441a3ec507a6"
                }
              ]
            },
            {
              "id": "node_8817fbc8a8cf",
              "label": "Return complete",
              "kind": "terminal",
              "sourceIds": [
                "src_101537a07182"
              ],
              "docs": [
                {
                  "path": "execution.md",
                  "anchor": "node_8817fbc8a8cf"
                }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_ac39134ae92d",
              "from": "node_441a3ec507a6",
              "to": "node_8817fbc8a8cf",
              "kind": "return",
              "mode": "sync",
              "sourceIds": [
                "src_101537a07182"
              ]
            }
          ],
          "docs": [
            {
              "path": "execution.md",
              "anchor": "flow_6dc031d9e806"
            }
          ]
        }
      ],
      "sources": [
        {
          "id": "src_32bed10ef9e0",
          "path": "examples/c-custom/sources/tasks.xml",
          "startLine": 2,
          "endLine": 2
        },
        {
          "id": "src_d2d9d64232f1",
          "path": "examples/c-custom/sources/runtime.txt",
          "startLine": 2,
          "endLine": 2
        },
        {
          "id": "src_eae3e0bb6cfb",
          "path": "examples/c-custom/sources/runtime.txt",
          "startLine": 3,
          "endLine": 4
        },
        {
          "id": "src_d346d8984be7",
          "path": "examples/c-custom/sources/runtime.txt",
          "startLine": 5,
          "endLine": 6,
          "symbol": "dispatch"
        },
        {
          "id": "src_101537a07182",
          "path": "examples/c-custom/sources/handler.txt",
          "startLine": 2,
          "endLine": 4,
          "symbol": "rollup"
        }
      ]
    }
  }
];
