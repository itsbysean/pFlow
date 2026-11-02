export async function emit(bus, cfg, input) {
  await bus.publish({ destination: cfg.destinations.orders, route: 'ready', type: 'Order', payload: input });
  if (input.audit) await bus.publish({ destination: cfg.destinations.audit, route: 'receipt', type: 'Receipt', payload: input });
}
export async function retry(bus, cfg, input) {
  await bus.publish({ destination: cfg.destinations.orders, route: 'ready', type: 'Order', payload: input });
}
export async function workerOne(bus, cfg, message) {
  await bus.publish({ destination: cfg.destinations.audit, route: 'receipt', type: 'Receipt', payload: message });
}
export function workerTwo(bus, cfg, message) { return message; }
export function auditTap(bus, cfg, message) { return message; }
export async function receipt(bus, cfg, message) {
  if (message.replay) await bus.publish({ destination: cfg.destinations.orders, route: 'ready', type: 'Order', payload: message });
}
export function rejectedOnly(bus, cfg, message) { return message; }
export function wrongBroker(bus, cfg, message) { return message; }
export function runtimeConsumer(bus, cfg, message) { return message; }
export function disabled(bus, cfg, message) { return message; }
export function OrdersReadyConsumer(bus, cfg, message) { return message; }
export async function runtimeProducer(bus, cfg, input) {
  await bus.publish({ destination: cfg.destinations.orders, route: 'ready', type: 'Order', payload: input });
}
