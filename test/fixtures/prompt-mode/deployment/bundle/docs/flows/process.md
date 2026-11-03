# Deployment process

<a id="flow_p01"></a>
## Deployment

Prepare the package and run verification. Publish only on pass; abort on failure. No additional approval, rollback or retry is described. Evidence: [src_p01], [src_p02], [src_p03], [src_p04].

<a id="node_p01"></a>
### Prepare package

When deployment is requested, prepare the package before running verification. No packaging tool or responsible person is specified. Evidence: [src_p01].

<a id="node_p02"></a>
### Run verification

Run verification after package preparation. Its result determines whether the package can be published. The verification tool and checks are unspecified. Evidence: [src_p02].

<a id="node_p03"></a>
### Verification passes?

A passing result leads to package publication. A failing result leads to aborting this deployment; no approval or retry is described. Evidence: [src_p02], [src_p03], [src_p04].

<a id="node_p04"></a>
### Publish package and finish

Publish the prepared package only after verification passes, then finish. The supplied description does not specify a destination or additional approval. Evidence: [src_p03].

<a id="node_p05"></a>
### Abort deployment and finish

Stop the deployment when verification fails. No package publication, rollback or retry is described for this outcome. Evidence: [src_p04].

## Source evidence

[src_p01]: ../../evidence/request.md#L1
[src_p02]: ../../evidence/request.md#L2
[src_p03]: ../../evidence/request.md#L3
[src_p04]: ../../evidence/request.md#L4
