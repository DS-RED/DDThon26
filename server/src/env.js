import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Loads server/.env into process.env for real runs (start/dev/migrate/seed).
// Resolved relative to this file so it works regardless of the current working
// directory. dotenv does NOT override variables already set in the environment,
// so real env vars (e.g. from the shell or CI) always win over the file.
//
// Skipped entirely under NODE_ENV=test: tests/helpers.js sets its own env vars
// before importing any app module, and a developer's local .env must never leak
// into (and flake) the test run.
if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
}
