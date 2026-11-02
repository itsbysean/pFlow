import * as handlers from './handlers.mjs';
export function register(clients, cfg) {
  for (const row of cfg.subscriptions) {
    if (!row.enabled) continue;
    clients[row.broker].subscribe({ destination: cfg.destinations[row.destinationKey], route: row.route, type: row.type, group: row.group }, message => handlers[row.handler](clients.primary, cfg, message));
  }
}
