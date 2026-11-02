const version = 'v1';

export async function processRecord(bus, cfg, input) {
  await bus.publish({ destination: cfg.jobs, version, payload: input });
  return input;
}
