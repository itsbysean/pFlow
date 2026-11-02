# Controlled flow review fixture

<a id="flow_4312555b59"></a>
## Validate before switching

Begin, validate correlation, then switch and renew only on a match. A mismatch throws before either side effect.

Evidence: [src_4116b462f1].

<a id="flow_cb256aea3b"></a>
## Handle only session validation errors

Renewal returns normally on success. A SessionValidationError returns authentication_required; other errors are rethrown unchanged.

Evidence: [src_2e46bebb7d].

<a id="flow_a36e31a2d1"></a>
## Parse then throw provider error

The parsing helper returns normally before the owned throw propagates its error.

Evidence: [src_e4e7c5d3d2].

<a id="flow_50ad6c9f62"></a>
## Capture defaults

Defaults: `{"board":"","post":0,"key":"CAPTURE"}`.

Evidence: [src_c909734a7f].

<a id="flow_1ea2c147f7"></a>
## Write defaults

Defaults: `{"board":"","post":0,"subject":""}`.

Evidence: [src_8576465ae8].

<a id="flow_2198fae6f4"></a>
## Decode through imported Buffer binding

Buffer.from is reached through the node:buffer import and the static decoder binding.

Evidence: [src_4ae4e76934], [src_2217fd31e4].

<a id="flow_a50e92b00c"></a>
## Resolve identity with the guest-provider predicate

Reuse only an existing identity whose providers include guest. An existing non-guest identity or a missing identity returns created true.

Evidence: [src_41fc6be0f3].

<a id="flow_ec2693cc0d"></a>
## Return guest response status

The caller uses result.created to select its response. Results: `{"existingGuest":{"created":false,"status":200},"existingNonGuest":{"created":true,"status":201},"missing":{"created":true,"status":201}}`.

Evidence: [src_5d40a07051].

## Source evidence

[src_4116b462f1]: ../../repository/operations.mjs#L6-L11
[src_2e46bebb7d]: ../../repository/operations.mjs#L14-L22
[src_e4e7c5d3d2]: ../../repository/operations.mjs#L25-L28
[src_c909734a7f]: ../../repository/operations.mjs#L31-L33
[src_8576465ae8]: ../../repository/operations.mjs#L35-L37
[src_2217fd31e4]: ../../repository/operations.mjs#L1-L3
[src_4ae4e76934]: ../../repository/operations.mjs#L39-L40
[src_41fc6be0f3]: ../../repository/operations.mjs#L43-L46
[src_5d40a07051]: ../../repository/operations.mjs#L48-L51
