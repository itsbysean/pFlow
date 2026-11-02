import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createRouter, installRoutes } from './web/routes.mjs';
import { configureJobs, configureDispatcher } from './engine/runtime.mjs';

const router = createRouter();
installRoutes(router);
createServer(router.dispatch).listen(8080);
const jobs = configureJobs(readFileSync(new URL('./config/tasks.xml', import.meta.url), 'utf8'), process.env);
for (const job of jobs) setInterval(() => job.invoke([]), job.everyMs);
const dispatcher = configureDispatcher();
process.stdin.on('data', chunk => dispatcher.dispatch(chunk.toString().trim(), []));
