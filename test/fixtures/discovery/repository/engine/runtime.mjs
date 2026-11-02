import { compactLedger, flushBuffer } from './handlers.mjs';

export function configureJobs(xml, environment) {
  const registry = new Map([['fold-v2', compactLedger]]);
  // This fixture's legacy loader accepts only self-closing task records.
  const tasks = [...xml.matchAll(/<task\s+([^>]+)\/>/g)].map(match => Object.fromEntries(
    [...match[1].matchAll(/([A-Za-z]+)="([^"]*)"/g)].map(attr => [attr[1], attr[2]]),
  ));
  return tasks.map(task => ({
    name: task.name, everyMs: Number(task.everyMs),
    resolve: () => registry.get(task.handler || environment[task.keyEnv]),
    invoke(log) {
      const target = registry.get(task.handler || environment[task.keyEnv]);
      if (!target) throw new Error(`Task ${task.name} has no resolved handler`);
      return target(log);
    },
  }));
}

export function configureDispatcher() {
  const verbs = new Map();
  verbs.set('drain/9', flushBuffer);
  return {
    verbs,
    dispatch(token, log) {
      const target = verbs.get(token);
      if (!target) throw new Error('Unknown activation token');
      return target(log);
    },
  };
}
