# Execution boundary stops

Non-owned invocation stops are identified without integration metadata. Unknown deployment values and external outcomes remain unverified. No producer/consumer link is established.

<a id="flow_86e533f27463"></a>
## Ship invoice

CLI startup invokes ship unless the action is drain. Await billing; status >= 400 throws. Otherwise await the peer request, call owned persistence detail, publish, write object storage, sign, await the runtime request and return the signature. External failure paths remain unmodeled. Evidence: [src_3974bdf10af3], [src_2f0b2166ded0], [src_431b24774cdf], [src_767bdca92f20], [src_841afc5f3e77], [src_da58dbdebcb6], [src_1a08070b10c1], [src_415e0e97127f], [src_623954d5f119], [src_8f600b3cb06a], [src_99e42a8a1430], [src_10ce4554ba7f], [src_fafc28b8880b], [src_fdb80eeb1b59].

<a id="flow_d50d43f1cd4f"></a>
## Persist invoice transaction

Called by ship, persistInvoice awaits BEGIN, mapped INSERT and COMMIT. INSERT/COMMIT failure awaits ROLLBACK and then rethrows only if rollback completes. Other failures remain unmodeled. Evidence: [src_623954d5f119], [src_8555d77003bf], [src_2f0b2166ded0], [src_3974bdf10af3], [src_f444eee89ff5], [src_ec2735e31dad], [src_cfac07212562].

<a id="flow_d445bdf2fa71"></a>
## Drain configured channel

The CLI drain action invokes drain, awaits the configured receive operation and returns its result. No producer relation is established. Evidence: [src_3974bdf10af3], [src_2f0b2166ded0], [src_7f55d69338f2], [src_148369f1e624].

## Source evidence

[src_3974bdf10af3]: ../../../repository/package.json#L1
[src_2f0b2166ded0]: ../../../repository/boot.mjs#L11-L19
[src_431b24774cdf]: ../../../repository/OWNERSHIP.md#L3
[src_767bdca92f20]: ../../../repository/app/handlers.mjs#L3
[src_841afc5f3e77]: ../../../repository/app/handlers.mjs#L4
[src_da58dbdebcb6]: ../../../repository/app/handlers.mjs#L5
[src_1a08070b10c1]: ../../../repository/app/handlers.mjs#L6
[src_415e0e97127f]: ../../../repository/app/handlers.mjs#L7
[src_8f600b3cb06a]: ../../../repository/app/handlers.mjs#L8
[src_99e42a8a1430]: ../../../repository/app/handlers.mjs#L9
[src_10ce4554ba7f]: ../../../repository/app/handlers.mjs#L10
[src_fafc28b8880b]: ../../../repository/app/handlers.mjs#L11
[src_fdb80eeb1b59]: ../../../repository/app/handlers.mjs#L12
[src_7f55d69338f2]: ../../../repository/app/handlers.mjs#L14
[src_148369f1e624]: ../../../repository/app/handlers.mjs#L15
[src_623954d5f119]: ../../../repository/app/persist.mjs#L1
[src_8555d77003bf]: ../../../repository/app/persist.mjs#L2
[src_f444eee89ff5]: ../../../repository/app/persist.mjs#L4
[src_ec2735e31dad]: ../../../repository/app/persist.mjs#L5
[src_cfac07212562]: ../../../repository/app/persist.mjs#L6-L8
