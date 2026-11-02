export class ProcessService {
  constructor(repository, selectPolicy, notify, plugins) {
    this.repository = repository; this.selectPolicy = selectPolicy;
    this.notify = notify; this.plugins = plugins;
  }
  process(input) {
    if (!input.authorized) return { status: 'denied' };
    const policy = this.selectPolicy(input.mode);
    const transformed = policy.transform(input.value);
    const saved = this.repository.save(transformed);
    this.notify(saved);
    if (input.plugin) return this.plugins[input.plugin](saved);
    return { status: 'ok', value: saved };
  }
}
