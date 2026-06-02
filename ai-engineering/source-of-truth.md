# KV CompLens AI Engineering Source Of Truth

This file stores permanent operating memory for KV CompLens engineering work.

## Root Deployment Memory

### Vercel Next.js Project Rule

Never create or leave a KV CompLens Vercel project with generic `Other` framework settings or `public` as the output directory.

For this Next.js app, Vercel must be configured as a Next.js project with explicit repo configuration:

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs"
}
```

Required checks before claiming any Vercel deployment:

- Confirm `vercel.json` exists and includes `framework: "nextjs"`.
- Run `npm run build` locally.
- Deploy with the existing project, not a new generic project: `vercel deploy . --project kv-complens --prod -y`.
- Inspect project protection: `vercel project protection kv-complens --format json`.
- Public `.vercel.app` deployments must not require SSO/login.
- Verify the final public URL with Browser, not only the Vercel CLI.
- Do not claim success from Vercel `READY` alone; Browser must show `KV CompLens` and must not show `404: NOT_FOUND` or Vercel login.

Known failure this prevents:

- Vercel can report a deployment as `READY` while a generic `Other/public` project configuration serves the wrong output surface and returns `404: NOT_FOUND`.
