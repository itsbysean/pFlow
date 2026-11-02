import { persistInvoice } from './persist.mjs';

export async function ship(input, ports, cfg) {
  const reply = await ports.http.request({ method: 'POST', url: cfg.billing.origin + '/v1/items', timeoutMs: cfg.billing.timeoutMs, retries: cfg.billing.retries, tag: cfg.billing.name });
  if (reply.status >= 400) throw new Error('billing rejected');
  await ports.http.request({ method: 'GET', url: cfg.peerOrigin + '/status' });
  await persistInvoice(input, ports.db, cfg);
  await ports.bus.publish({ topic: cfg.topic, routingKey: 'invoice.saved', messageType: 'InvoiceSaved', payload: input });
  await ports.objects.putObject({ bucket: cfg.storage.bucket, key: input.id, body: input });
  const signature = ports.signer.sign(input, { format: cfg.signing.format });
  await ports.http.request({ method: 'GET', url: input.endpoint });
  return signature;
}
export async function drain(ports, cfg) {
  return await ports.bus.receive({ topic: cfg.topic });
}
