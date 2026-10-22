import "server-only";

// Generated at build time on Amplify (see amplify.yml) to work around Amplify
// Hosting not reliably injecting Console-configured environment variables into
// the deployed SSR runtime. Locally, real values already come from .env, so
// this file intentionally does nothing outside CI. The server-only import makes
// the build fail if a client component ever imports it (it holds every secret).
export {};
