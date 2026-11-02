# Job-processing architecture

Illustrative producer and consumer connected by an evidenced subscription.

## Entry points

| Entry point | Trigger | Execution |
|---|---|---|
| Submit command | Registered command `submit` | [Producer](execution.md#flow_9e27be90a054) |
| Indexer worker | Configured `jobs` subscription | [Consumer](execution.md#flow_4b996747ac21) |

## Coverage

Possible delivery is established. Delivery guarantees, retries, and broker/store failure handling are not established.
