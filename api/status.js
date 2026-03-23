// GET /api/status?version=v1.2
// Returns { allowed: bool, message: string }
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const version = req.query.version || 'unknown';

  const global_kill = await redis.get('kill:global');
  if (global_kill) {
    return res.status(200).json({
      allowed: false,
      message: global_kill.message || 'Service temporarily unavailable.'
    });
  }

  const version_kill = await redis.get(`kill:${version}`);
  if (version_kill) {
    return res.status(200).json({
      allowed: false,
      message: version_kill.message || `Version ${version} is no longer supported. Please update.`
    });
  }

  return res.status(200).json({ allowed: true, message: '' });
}
