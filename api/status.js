// GET /api/status?version=v1.2
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const version = req.query.version || 'unknown';

  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/kills.json`, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
    });

    if (r.status === 404) return res.status(200).json({ allowed: true, message: '' });

    const data = await r.json();
    const kills = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));

    if (kills['global']) {
      return res.status(200).json({ allowed: false, message: kills['global'].message || 'Service unavailable.' });
    }
    if (kills[version]) {
      return res.status(200).json({ allowed: false, message: kills[version].message || `Version ${version} is disabled.` });
    }

    return res.status(200).json({ allowed: true, message: '' });
  } catch (e) {
    return res.status(200).json({ allowed: true, message: '' });
  }
}
