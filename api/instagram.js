// Vercel serverless function: GET /api/instagram
// Returns the latest posts from the cccc Instagram Business account (@cculturacc)
// via the Instagram Graph API. Keeps the access token server-side only.
//
// Required environment variables (set in the Vercel project, never committed):
//   IG_USER_ID      Instagram Business Account ID
//   IG_ACCESS_TOKEN Long-lived access token with instagram_basic permission
//
// See README.md for how to obtain both.

const GRAPH_VERSION = "v21.0";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_url,media_type,thumbnail_url}";
const LIMIT = 12;

module.exports = async function handler(req, res) {
  const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;

  if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
    res.status(503).json({ error: "instagram_not_configured" });
    return;
  }

  const url =
    `https://graph.instagram.com/${GRAPH_VERSION}/${IG_USER_ID}/media` +
    `?fields=${FIELDS}&limit=${LIMIT}&access_token=${IG_ACCESS_TOKEN}`;

  try {
    const igRes = await fetch(url);
    const data = await igRes.json();

    if (!igRes.ok) {
      console.error("Instagram Graph API error:", data);
      res.status(502).json({ error: "instagram_api_error" });
      return;
    }

    const posts = (data.data || []).filter(
      (post) => post.media_type === "IMAGE" || post.media_type === "CAROUSEL_ALBUM" || post.media_type === "VIDEO"
    );

    // Cache at the CDN for 1h, serve stale for a day while revalidating in the background.
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ posts });
  } catch (err) {
    console.error("Instagram feed fetch failed:", err);
    res.status(502).json({ error: "instagram_fetch_failed" });
  }
};
