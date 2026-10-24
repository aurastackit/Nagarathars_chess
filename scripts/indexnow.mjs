// Tells IndexNow (Bing, Yandex, …) to recrawl the site's public pages: the
// main pages plus every URL in the live sitemap. Run after a deploy, once the
// key file is live:
//   npm run indexnow
// The key is public by design — it only proves we own the host.

const HOST = "nagaratharschesschampionship.org";
const ORIGIN = `https://${HOST}`;
const KEY = "05bbeca91a7182bd88b2416a3c5b7c64";
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const MAIN_PAGES = ["/", "/tournaments", "/about", "/gallery", "/contact"];

async function sitemapUrls() {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml answered ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

// IndexNow rejects the batch if the key file isn't served at keyLocation.
const keyRes = await fetch(KEY_LOCATION);
const served = keyRes.ok ? (await keyRes.text()).trim() : null;
if (served !== KEY) {
  console.error(`Key file not live at ${KEY_LOCATION} (HTTP ${keyRes.status}) — deploy first.`);
  process.exit(1);
}

const urlList = [
  ...new Set([...MAIN_PAGES.map((p) => `${ORIGIN}${p}`), ...(await sitemapUrls())]),
].filter((u) => new URL(u).host === HOST);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});

console.log(`IndexNow: HTTP ${res.status} ${res.statusText} for ${urlList.length} URLs`);
const body = await res.text();
if (body) console.log(body);
// 200 = accepted, 202 = accepted (key check pending); anything else is a failure.
if (res.status !== 200 && res.status !== 202) process.exit(1);
