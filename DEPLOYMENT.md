# Firebase / Vercel deployment

This branch (`codex/firebase-vercel`) runs Next.js on Vercel and stores classroom
sessions in Firestore project `global-shift-map` (Seoul). The earlier Sites/D1
deployment and its data are unchanged. Old Vite, Drizzle and Wrangler configuration
files are historical artifacts, not used by this branch's build.

## Configuration

Copy the non-secret settings from `.env.example` into the Vercel project settings
for production, preview and development. Authentication uses Vercel OIDC and
Google Workload Identity Federation; there is no service-account private key.
The identity provider is restricted to this Vercel team and project.

For local work, run `vercel env pull .env.local` to obtain a temporary development
token, then `npm ci` and `npm run dev`. Refresh the token if it expires. Never
commit `.env.local`. Infrastructure setup is documented in
`scripts/configure-firebase-oidc.cjs`; running it requires the Firebase project
owner's authenticated CLI and explicit `--apply`.

## Verification and deployment

- `npm run build`
- `npm audit`
- `node scripts/test-classroom.mjs` (three rounds of five synthetic students)
- `firebase deploy --only firestore:rules --project global-shift-map`
- `vercel deploy --prod`

Set `TEST_BASE_URL` to test the deployed app. Tests create synthetic sessions and
end them; they do not remove records or migrate existing Sites sessions.

Client Firestore access is denied. Server APIs authenticate teacher management
with a hashed bearer key; students receive random participant IDs. Keep teacher
management links private. Public classroom creation currently has no account
login/rate limiting; monitor the Firebase free-tier quotas before large classes.
GitHub's original `main` remains the MVP. Vercel is connected to the GitHub
repository and tracks `codex/firebase-vercel` for production auto-deployments.
Pushes to this branch update `https://global-shift-map.vercel.app` automatically.
