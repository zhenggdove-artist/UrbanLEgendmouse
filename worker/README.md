# Urban Legend Rat Leaderboard Worker

This Worker is the online Rat City leaderboard API. It uses Cloudflare D1 only; no token or secret is required in `index.html`.

## Endpoints

- `GET /api/leaderboard` returns `{ ok, entries }` with the top 20 scores.
- `POST /api/leaderboard` accepts `{ name, score, chaos, rats }`, validates the payload, inserts the score, prunes old rows, and returns the top 20.
- `GET /health` returns `{ ok: true }`.

## Deploy

1. Create the D1 database:

```powershell
npx wrangler d1 create urban_legend_rat_leaderboard
```

2. Paste the returned `database_id` into `wrangler.toml`.

3. Apply the schema:

```powershell
npx wrangler d1 execute urban_legend_rat_leaderboard --file=worker/schema.sql --remote
```

4. Confirm `ALLOWED_ORIGIN` in `wrangler.toml`.

For this GitHub Pages repo it should normally be:

```toml
ALLOWED_ORIGIN = "https://zhenggdove-artist.github.io"
```

GitHub Pages project paths are not part of the browser Origin, so do not include `/UrbanLEgendmouse` here.

5. Deploy the Worker:

```powershell
npx wrangler deploy
```

6. Replace `RAT_CITY_LEADERBOARD_API_URL` in `index.html` with the deployed Worker URL, for example:

```javascript
const RAT_CITY_LEADERBOARD_API_URL='https://urban-legend-rat-leaderboard.<your-workers-subdomain>.workers.dev/api/leaderboard';
```

For local testing without editing the file, open the game and set:

```javascript
localStorage.setItem('urbanLegendRatLeaderboardApiUrl','http://127.0.0.1:8787/api/leaderboard');
```
