// Vercel Cron — daily snapshot of every business table into PostgreSQL
// (system_snapshots) + analytics/audit retention housekeeping.
// Scheduled daily at 03:00 UTC via vercel.json ("crons").
// Optional protection: set CRON_SECRET and Vercel will send it as
// `Authorization: Bearer <CRON_SECRET>`.
import type { IncomingMessage, ServerResponse } from 'http';
import { initDatabase, ensureDailyBackup } from '../../server/db.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = String((req.headers as Record<string, string | string[] | undefined>).authorization || '');
    if (auth !== `Bearer ${secret}`) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
  }
  try {
    await initDatabase();
    await ensureDailyBackup();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, ranAt: new Date().toISOString() }));
  } catch (err) {
    console.error('Cron backup error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Backup failed' }));
  }
}
