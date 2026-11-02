export function archiveInvoice(message) {
  return { archived: message.id };
}
export function registerArchive(bus, cfg, xml) {
  const row = xml.match(/<subscription topic="([^"]+)" route="([^"]+)" type="([^"]+)" group="([^"]+)" handler="([^"]+)"/);
  const handlers = { archiveInvoice };
  bus.subscribe({ topic: row[1], routingKey: row[2], messageType: row[3], group: row[4] }, handlers[row[5]]);
}
