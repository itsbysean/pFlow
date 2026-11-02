# Persist invoice detail

<a id="flow_9806dd400bb2"></a>
## Persist invoice detail

ship awaits persistInvoice with the bound database. BEGIN occurs outside the try. The try inserts into the configured acct_items table and commits. INSERT or COMMIT failure enters ROLLBACK, then rethrows the original error if rollback succeeds. BEGIN failure and rollback failure escape directly. No isolation or successful rollback guarantee is claimed.

Evidence: [src_f15faa2be590], [src_88437214f43b], [src_3fd7b64f1820], [src_669de1ade32f], [src_795a06d6c6c7], [src_5c1aee5bbfc3], [src_e3d1ee51d4eb].

<a id="node_9beb70b9ad36"></a>
### BEGIN transaction

BEGIN runs before the try; its failure does not enter rollback.

Evidence: [src_88437214f43b], [src_5c1aee5bbfc3], [src_e3d1ee51d4eb], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4], [src_5a3dea7ad4e0].

<a id="node_527c2b0b8379"></a>
### INSERT invoice id

The actual table mapping is acct_items. The input id is supplied as a parameter.

Evidence: [src_3fd7b64f1820], [src_5c1aee5bbfc3], [src_e3d1ee51d4eb], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4], [src_5a3dea7ad4e0].

<a id="node_fea29d04b25f"></a>
### COMMIT transaction

Commit is awaited inside the try. Its rejection enters the same rollback catch as insert.

Evidence: [src_669de1ade32f], [src_5c1aee5bbfc3], [src_e3d1ee51d4eb], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4], [src_5a3dea7ad4e0].

<a id="node_3e3461614409"></a>
### ROLLBACK transaction

Rollback is awaited before the original error is rethrown. If rollback fails, that failure escapes instead.

Evidence: [src_795a06d6c6c7], [src_5c1aee5bbfc3], [src_e3d1ee51d4eb], [src_e6b7e41c878a], [src_c928067b59c5], [src_bc13d322e5b4], [src_5a3dea7ad4e0].


## Source evidence

[src_f15faa2be590]: ../../../../app/handlers.mjs#L7
[src_88437214f43b]: ../../../../app/persist.mjs#L1-L3
[src_3fd7b64f1820]: ../../../../app/persist.mjs#L4
[src_669de1ade32f]: ../../../../app/persist.mjs#L5
[src_795a06d6c6c7]: ../../../../app/persist.mjs#L6-L9
[src_5c1aee5bbfc3]: ../../../../config/settings.json#L3-L4
[src_e3d1ee51d4eb]: ../../../../boot.mjs#L13-L18
[src_e6b7e41c878a]: ../../../../boot.mjs#L2-L6
[src_c928067b59c5]: ../../../../package.json#L1
[src_bc13d322e5b4]: ../../../../boot.mjs#L12
[src_5a3dea7ad4e0]: ../../../../settings.mjs#L1-L6
