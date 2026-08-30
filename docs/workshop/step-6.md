# Step 6 (bonus) — The Artifact Store

**Start from:** your step-5 state (`make catchup step=5`) · **Ends at:** the state tagged `step-6`
**Solution files:** [`solutions/step-6/`](solutions/step-6/)

## Goal

Prove the deepest lesson of the series by construction: **remotes are artifacts, not
services.** Instead of each remote being served from "its own host", every team
publishes its build into one central artifact store — the S3 / Azure Blob Storage
pattern — and the only processes left running are the shell's file server, the API,
and the store itself. A deploy becomes a file upload.

```
before (steps 1–5):                     after (step 6):
uikit    :3101  ─┐                      ┌──────────────────────────┐
claims   :3102  ─┼─▶ shell :3100        │ artifact store  :4400    │
worklist :3103  ─┘                      │  /uikit/…  /claims/…     │──▶ shell :3100
(a file host per remote)                │  /worklist/…             │
                                        └──────────────────────────┘
                                        (one dumb file host, zero remote servers)
```

## Do it

**1. Make remote locations env-driven.** All four federated configs learn one trick:
if `ARTIFACT_STORE` is set at build time, files live in the store; otherwise the
localhost defaults. Add near the top of each `rsbuild.config.ts`:

```ts
const STORE = process.env.ARTIFACT_STORE;
```

- **uikit** and **claims** (remotes with no consumers of their own) — only the
  production assetPrefix changes:

  ```ts
  output: { assetPrefix: STORE ? `${STORE}/uikit` : 'http://localhost:3101' },
  ```

  (claims: `${STORE}/claims` : `http://localhost:3102`.)

- **shell** and **worklist** (they consume remotes) — also add a helper and use it in
  `remotes:`:

  ```ts
  const remote = (name: string, port: number) =>
    `${name}@${STORE ? `${STORE}/${name}` : `http://localhost:${port}`}/mf-manifest.json`;
  ```

  ```ts
  remotes: {
    uikit: remote('uikit', 3101),
    claims: remote('claims', 3102),
    worklist: remote('worklist', 3103),
  },
  ```

  (worklist keeps just its `uikit` entry, plus its own `output.assetPrefix` switch.)

This is the real-world pattern: **the same code, retargeted per environment by the
build pipeline.** Dev mode is completely unaffected — no env var, no change.

**2. Run the store** (stop `pnpm dev` first — it makes the point better):

```bash
make store
```

A ~40-line node script (`scripts/artifact-store.mjs`) serving the `.artifact-store/`
folder on :4400 with CORS — a stand-in for your bucket + CDN. It's empty so far.

**3. Every team publishes** (new terminal):

```bash
make publish app=uikit
make publish app=claims
make publish app=worklist
```

Each one builds with `ARTIFACT_STORE` set and copies `dist/` into the store. Look at
`.artifact-store/` — three folders of files. That's three teams, deployed. Nothing
is running for any of them.

**4. Run the host against the store:**

```bash
make host
```

Builds the shell with its remotes pointed at :4400, then serves it on :3100 with the
API on :4100. Open http://localhost:3100 — the full product. Check the network tab:
every remote loads from `localhost:4400/<name>/…`.

## The moment

Leave :3100 open. Change something visible in uikit (`metric-card.tsx`), then:

```bash
make publish app=uikit
```

Reload :3100 → the new uikit is live. **No server restarted, because no server for
uikit exists.** The deploy was a build and a file copy — exactly how a CI pipeline
pushing to Azure Blob or S3 works.

## Verify

- `make store` + three `publish`es + `make host` → full product on :3100
- Network tab: remotes load from `:4400/<name>/`, not `:310x`
- Re-publishing uikit updates the page on reload; `ps` shows no uikit process
- `pnpm dev` still works exactly as before (env var unset ⇒ localhost defaults)

## Worth noticing

- The store script sets the two cache headers that make this pattern safe in real
  life: `no-cache` on `mf-manifest.json`, `immutable` on hashed chunks. On a real
  bucket + CDN you must set these yourself at upload time — long-cache the manifest
  and reloads stop discovering releases.
- Three topologies, one mechanism: per-remote hosts (steps 1–5), central store
  (this step), or remotes co-located with the host's own hosting. The host binds to
  a stable manifest URL; everything else is an infra choice.

**Stuck?** `diff` against [`solutions/step-6/`](solutions/step-6/) or `make catchup step=6`.
