# Selected parcel-bus integration contract

The project owns boot.mjs, settings.mjs, app/ and config/. Dependencies and third_party/ are non-owned. Do not read vendor bodies or execute this fixture.

connectBus selects an exact url and namespace routing domain. The bootstrap shares that single bus with ship, drain and registerArchive. No runtime URL override or alias is configured. XML subscription values are loaded by reachable registration.

publish supplies topic, routingKey, messageType and payload; subscribe registers a concrete callback. A message is eligible when exact topic, routingKey and messageType match in the same domain. Payload is passed unchanged. Members of the same group compete; a group is a possible recipient, not a delivery guarantee. receive is a pull operation whose options in this example do not establish a callback binding or filter/group compatibility; do not infer a ship-to-drain edge.

Awaiting publish is not consumer completion. Registration is active for the process lifetime; no unsubscribe/replacement occurs. No live delivery, retry, ordering or exactly-once behavior is established. runtimePlugins is an optional externally populated runtime registry: no plugin target can be resolved from this repository.
