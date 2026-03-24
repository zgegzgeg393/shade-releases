// POST /api/admin
// Body: { secret, action, target, message }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { secret, action, target, message } = req.body ?? {};

  if (secret !== process.env.RELEASE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!action || !target) {
    return res.status(400).json({ error: 'action and target required' });
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };

  // Get current kills.json
  let kills = {};
  let sha = null;
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/kills.json`, { headers });
  if (r.ok) {
    const data = await r.json();
    sha = data.sha;
    kills = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  }

  if (action === 'kill') {
    kills[target] = { message: message || `Version ${target} has been disabled.` };
  } else if (action === 'unkill') {
    delete kills[target];
  } else {
    return res.status(400).json({ error: 'Unknown action' });
  }

  const content = Buffer.from(JSON.stringify(kills, null, 2)).toString('base64');
  const body = { message: `${action} ${target}`, content };
  if (sha) body.sha = sha;

  const w = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/kills.json`, {
    method: 'PUT', headers, body: JSON.stringify(body)
  });

  if (!w.ok) return res.status(500).json({ error: 'Failed to update kills.json' });
  return res.status(200).json({ ok: true, target, action });
}
