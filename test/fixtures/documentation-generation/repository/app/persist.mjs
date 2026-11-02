export async function persistInvoice(input, db, cfg) {
  await db.exec('BEGIN');
  try {
    await db.exec(`INSERT INTO ${cfg.tables.invoice} (id) VALUES (?)`, [input.id]);
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}
