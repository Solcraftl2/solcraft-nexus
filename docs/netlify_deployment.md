# Netlify Deployment Guide

This document explains how to build SolCraft Nexus on Netlify, run the Netlify Functions locally and configure the required environment variables.

## Build Process

Netlify uses the `netlify.toml` file to define the build. The project requires **Node.js 20**, as specified in `.nvmrc` and under `[build.environment]` in `netlify.toml`:

```toml
[build]
  command = "npm install --no-frozen-lockfile && npm run build"
  functions = "netlify/functions"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

To test the build locally run:

```bash
npm run netlify:build
```

This runs `vite build` and `netlify build` using the Netlify CLI. Deployments on Netlify automatically execute the same process when code is pushed.

## Running Functions Locally

Install the Netlify CLI globally if you do not have it:

```bash
npm install -g netlify-cli
```

Then start the local development server:

```bash
npm run netlify:dev
```

The frontend is served on <http://localhost:8888> and Netlify Functions are available under `/.netlify/functions/*`.

## Environment Variables

Deployment requires several environment variables. Use `.env.example` as a reference and configure the same keys in Netlify. The most important variables are:

```bash
REACT_APP_XUMM_API_KEY=
REACT_APP_XUMM_API_SECRET=
REACT_APP_WEB3AUTH_CLIENT_ID=
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_API_BASE_URL=
REDIS_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SESSION_SECRET=
JWT_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
API_BASE_URL=
FRONTEND_URL=
```

Set any additional variables from `.env.example` as needed.
