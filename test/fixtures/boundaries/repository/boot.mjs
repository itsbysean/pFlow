import { readFileSync } from 'node:fs';
import { createHttp } from 'wire-http';
import { connectDatabase } from 'ledger-store';
import { connectBus } from 'parcel-bus';
import { createObjectStore } from 'cloud-objects';
import { createSigner } from 'seal-kit';
import { sendMail } from 'unused-mail';
import { loadSettings } from './settings.mjs';
import { ship, drain } from './app/handlers.mjs';

const cfg = loadSettings(readFileSync(new URL('./config/settings.json', import.meta.url), 'utf8'), readFileSync(new URL('./config/transport.xml', import.meta.url), 'utf8'), process.env);
const ports = {
  http: createHttp(), db: connectDatabase(cfg.database),
  bus: connectBus({ protocol: cfg.protocol, url: process.env[cfg.brokerUrlKey] }),
  objects: createObjectStore({ region: cfg.storage.region }), signer: createSigner(),
};
const input = JSON.parse(process.argv[3] || '{}');
if (process.argv[2] === 'drain') await drain(ports, cfg);
else await ship(input, ports, cfg);
