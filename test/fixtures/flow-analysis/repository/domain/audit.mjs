const savedRecords = [];
export function recordSaved(value) { savedRecords.push(value); }
export function records() { return [...savedRecords]; }
export function reset() { savedRecords.length = 0; }
