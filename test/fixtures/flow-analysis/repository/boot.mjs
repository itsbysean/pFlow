import { createServer } from 'node:http';
import { createEntry } from './app/entry.mjs';
import { ProcessService } from './domain/service.mjs';
import { MemoryRepository } from './data/repository.mjs';
import { policyFor } from './domain/policies.mjs';
import { recordSaved } from './domain/audit.mjs';

const service = new ProcessService(new MemoryRepository(), policyFor, recordSaved, globalThis.runtimePlugins || {});
const submit = createEntry(service);
createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/submit') { response.statusCode = 404; response.end('missing'); return; }
  let body = '';
  request.on('data', chunk => { body += chunk; });
  request.on('end', () => response.end(JSON.stringify(submit(JSON.parse(body)))));
}).listen(8081);
