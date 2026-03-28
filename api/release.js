// POST /api/release
// Body: { secret, tag, name, changelog }
// Used to trigger a new GitHub release (you then upload the .exe manually or via CI)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { secret, tag, name, changelog } = req.body ?? {};

  if (secret !== process.env.RELEASE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!tag || !name) {
    return res.status(400).json({ error: 'tag and name are required' });
  }

  const owner = process.env.GITHUB_OWNER;
  const repo  = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  try {
    const r = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'shade-panel'
        },
        body: JSON.stringify({
          tag_name: tag,
          name: name,
          body: changelog ?? '',
          draft: false,
          prerelease: false
        })
      }
    );

    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data.message });

    return res.status(200).json({
      release_id:  data.id,
      upload_url:  data.upload_url,
      html_url:    data.html_url,
      tag:         data.tag_name
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
