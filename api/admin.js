// POST /api/admin
// Body: { secret, action, target, message }
// action: "kill" | "unkill"
// target: "global" | "v1.0" | "v1.1" etc.
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { secret, action, target, message } = req.body ?? {};

  if (secret !== process.env.RELEASE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!action || !target) {
    return res.status(400).json({ error: 'action and target required' });
  }

  const key = `kill:${target}`;

  if (action === 'kill') {
    await redis.set(key, { message: message || `Version ${target} has been disabled.` });
    return res.status(200).json({ ok: true, key, message });
  }

  if (action === 'unkill') {
    await redis.del(key);
    return res.status(200).json({ ok: true, key, removed: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
