You’re hitting `Neo4jError: Pool is closed` because code is trying to run a query on a driver whose connection pool has already been shut down. In your stack it happens during `passport`’s `deserializeUser` → `User.get` → `neo4jClient.cypherQuery`, so a request path that expects the DB to be available is running after the driver (or its pool) was closed.

What typically causes this in Node + neo4j-driver:

1. The driver is created per request and then closed in a `finally`—subsequent middleware still tries to use it.
2. The driver is global but you call `driver.close()` after a route (e.g., at the end of `/post`) or during hot-reload/cleanup hooks.
3. Sessions/transactions are kept around after `driver.close()`.
4. Container restarts or network hiccups plus no reconnection logic.
5. Multiple copies of your “client” module: one creates, another closes. In ESM/TS this can happen if paths differ (`../lib/db/neo4jClient` vs `./lib/db/neo4jClient`), defeating singleton caching.

Quick checks

* `ripgrep` for closes: `rg "driver\.close\(" -n` and remove any call outside process shutdown handlers.
* Ensure you never call `driver.close()` inside route handlers, auth flows, or background jobs.
* Confirm there’s exactly one module that constructs the driver and everyone imports from it (no duplicate relative paths).
* In `neo4jClient.js` (line ~94 in your trace), make sure a new `Session` isn’t created from a stale/closed driver.

Recommended pattern (singleton driver, short-lived sessions)

```ts
// lib/db/neo4jClient.ts
import neo4j, { Driver, Session } from 'neo4j-driver';

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (driver && !driver.closed) return driver;
  driver = neo4j.driver(
    process.env.NEO4J_URI!, 
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!),
    {
      // optional: tune pool & liveness checks
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 60000,
      // Ensures stale conns are tested before use:
      // (name changed across driver versions; use the one your version supports)
      // disableLosslessIntegers: true  // if you need JS numbers
    }
  );
  return driver;
}

export async function cypherQuery<T=unknown>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const d = getDriver();
  const session: Session = d.session();
  try {
    const res = await session.run(query, params);
    // Map/return as needed:
    // @ts-ignore - adjust to your driver version
    return res.records.map(r => r.toObject()) as T[];
  } finally {
    await session.close();
  }
}

// Call only on process shutdown
export async function closeDriver() {
  if (driver && !driver.closed) {
    await driver.close();
  }
}
```

Server bootstrap and shutdown

```ts
// app.ts or server.ts
import { getDriver, closeDriver } from './lib/db/neo4jClient';

async function start() {
  const driver = getDriver();
  await driver.verifyConnectivity(); // fail fast if bad creds/URI
  // init express, passport, routes...
}

process.on('SIGTERM', async () => { await closeDriver(); process.exit(0); });
process.on('SIGINT',  async () => { await closeDriver(); process.exit(0); });
```

Usage in models/middleware

```ts
// lib/user.js
import { cypherQuery } from './db/neo4jClient';

export const User = {
  async get(id) {
    const rows = await cypherQuery(
      'MATCH (u:User {id: $id}) RETURN u LIMIT 1',
      { id }
    );
    return rows[0]?.u; // adjust to your mapping
  }
};
```

Passport integration

* `deserializeUser` is invoked on many requests; it must not rely on a driver that may have been closed. With the singleton pattern above, it will always get a fresh session.
* If you have caching around users, ensure it doesn’t keep a session/tx handle.

If you must auto-recover from a closed pool

```ts
export function getDriver(): Driver {
  if (!driver || driver.closed) {
    driver = neo4j.driver(...);
  }
  return driver;
}
```

Avoid swallowing the underlying cause, though—find and remove the premature `driver.close()`.

Container considerations

* If your container restarts (your earlier logs show disconnects right after `POST /post 200`), the in-memory driver is lost. That’s fine—on next request, create a new driver; just do not attempt to use a stale reference kept by a hot-reloaded module.
* Add a readiness check that calls `driver.verifyConnectivity()` at startup, and a health endpoint that runs a trivial read (`RETURN 1`) to catch pool issues.
* Ensure NEO4J_* env vars are consistent and reachable from the app network (Docker compose service names, ports, and auth).

What to change right now

1. Centralize driver creation in one module; export `getDriver`, `cypherQuery`, and `closeDriver`.
2. Remove all `driver.close()` calls outside of shutdown hooks.
3. Refactor any long-lived sessions/transactions to short-lived create→run→close within the same function.
4. Add `driver.verifyConnectivity()` at app start; add `/health/db` that executes `RETURN 1`.
5. Grep for duplicate imports of the client with differing paths and normalize to one import path.

Small diagnostic to confirm fix

* After changes, hit an authenticated route twice in quick succession; if the second call previously triggered the error (e.g., during `deserializeUser`), it should now pass.
* Intentionally send `SIGTERM` and confirm the app closes the driver cleanly.

Notes on gaps and edge cases

* If the pool closes due to network blips to Neo4j, you may also need driver config that tests connections before reuse.
* If you’re using server hot-reload, ensure it doesn’t call `closeDriver()` while old requests are still in flight.
* If you use worker threads or clustered processes, create one driver per process, not shared across processes. The steps above address the immediate “Pool is closed” by eliminating premature closes and ensuring one stable driver instance with short-lived sessions.
