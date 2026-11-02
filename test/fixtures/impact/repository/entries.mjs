import { processRecord } from './shared.mjs';
export const alpha = (bus, cfg, input) => processRecord(bus, cfg, input);
export const beta = (bus, cfg, input) => processRecord(bus, cfg, input);
export const unrelated = input => input;
