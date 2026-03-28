// GET /api/version
// Returns latest release info from GitHub
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const owner = process.env.GITHUB_OWNER;
  const repo  = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  try {
    const r = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'shade-panel' } }
    );

    if (!r.ok) return res.status(502).json({ error: 'GitHub API error', status: r.status });

    const data = await r.json();

    // Find the .exe asset
    const asset = data.assets?.find(a => a.name.endsWith('.exe'));

    return res.status(200).json({
      version:      data.tag_name,
      name:         data.name,
      published_at: data.published_at,
      download_url: asset?.browser_download_url ?? null,
      asset_name:   asset?.name ?? null,
      changelog:    data.body ?? ''
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
