export async function consume(bus, cfg, message) {
  await bus.publish({ destination: cfg.relay, payload: message });
  return message;
}
