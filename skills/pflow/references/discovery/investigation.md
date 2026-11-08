# Indirect mechanisms and coverage

## Reachability before classification

Start with the repository's actual launch surfaces: executable/module metadata, startup scripts, service configuration, deployment commands or host-loaded plugins. Read enough bootstrap to establish which owned modules/configuration are loaded. Record configuration precedence and conditional activation when they change the result. A file existing in the tree does not prove it participates in execution.

Build a small working list of owned modules, launch roots and discovered registration/dispatch sites. Choose the next search from gaps in that list. Search for callers and wrappers of registration functions, registry writes and lookups, configuration readers, reflective target selectors and callback adapters. Framework knowledge suggests leads; it does not define an exhaustive mechanism taxonomy. A native host callback, binary-command table or project-specific activation token can be as relevant as an HTTP route.

Read dependencies only far enough to resolve an activation contract. Do not treat all exported functions, dependency APIs, test harnesses or example registrations as project entry points. Note the ownership boundary and what remains uninspected.

## Evidence chains

A direct registration needs the reachable installation site, the trigger/selector and the concrete callback target. A configured job additionally needs the actual config loader, selected record/key, registry binding and dispatch/receiver relationship. A callback adapter may require another short step to identify the project handler; stop when project control is established.

Examples of useful questions, not mandatory categories:

- Does the actual listener/router attach this callback, and which request selector reaches it?
- Which task record is loaded, who installs it, and how does its handler key resolve?
- Who writes this custom registry and who dispatches into it? Is that setup active for the inspected launch?
- Can a supplied function, plugin, environment variable or deployment override replace this target?

Keep separate activation paths distinct when their evidence or receiving context differs. Two labels matching across files do not establish a binding. Do not follow a publish call to a consumer in this task.

## Uncertainty and negative evidence

If the trigger is known but the target depends on absent/runtime data, cite the existing selection expression and describe the missing binding. Never cite a nonexistent configuration file as if inspected. If a handler is concrete but activation is conditional, state the evidence-backed condition instead of inventing a runtime guarantee.

Distinguish an unresolved candidate from an excluded declaration. For a misleading name or annotation, say that no active binding was found within the inspected scope; do not claim that it can never execute. Report concrete negative evidence such as an unimported module, disabled record or registration absent from the loaded registry, and state the search boundary.

Report languages/build metadata actually observed; owned modules and launch roots inspected; selected configuration/assumptions; known skipped modules; dynamic gaps; and stale/missing evidence. Stop when the requested surfaces have evidence chains or explicit gaps. Do not equate finishing a search pattern list with complete discovery.
