// Vercel serverless entry point.
// All /api/* requests (see vercel.json rewrites) are handled by the shared
// Express application built in server.ts — schema init/seed runs once per
// warm instance through dbReady().
import type { IncomingMessage, ServerResponse } from 'http';
import { dbReady, app } from '../server.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await dbReady();
  } catch (err) {
    console.error('Database bootstrap error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: 'Initialisation de la base de données impossible.',
        detail: err instanceof Error ? err.message : String(err),
      }),
    );
    return;
  }
  return app(req as never, res as never);
}
