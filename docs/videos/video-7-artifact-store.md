# Video 7 — Bonus: The Artifact Store (8–10 min)

**Teaches:** remotes are artifacts, not services — proven by construction. Every remote
moves into one central store (the S3 / Azure Blob pattern); env-driven remote URLs;
a deploy becomes a file upload.
**Starts from:** end of video 5 or 6 (`make catchup step=5`).
**Ends at:** the state tagged `step-6` (workshop guide: `docs/workshop/step-6.md`).

## Pre-flight

- [ ] State = end of step 5; `pnpm dev` STOPPED (this episode's point is what *isn't* running)
- [ ] Docker not needed at all for this one
- [ ] Editor tabs: all four federated `rsbuild.config.ts` files; `scripts/artifact-store.mjs`
- [ ] Terminals: one for the store, one for commands; network tab docked

---

## 0:00–0:50 · Cold open — the question that won't die

**Screen:** shell's config, cursor on `uikit@http://localhost:3101/mf-manifest.json`.

**Say:** "Every video so far, this URL pointed at a server per remote — and you've
probably been thinking: so uikit has to be *running* somewhere? No. Remotes are files.
This episode we make that undeniable: all three remotes move into one storage bucket —
think S3 or Azure Blob behind a CDN — and we run the whole product with **zero remote
servers**. When we're done, deploying will mean copying files. Because that's what it
always meant."

**Recovery line:** "Joining here? `make catchup step=5`, stop `pnpm dev`."

## 0:50–3:00 · One env var, four configs

**Screen:** `apps/uikit/rsbuild.config.ts`. **Type:**

```ts
const STORE = process.env.ARTIFACT_STORE;
```

```ts
output: { assetPrefix: STORE ? `${STORE}/uikit` : 'http://localhost:3101' },
```

**Say:** "The assetPrefix lesson from episode 1, completed: a remote's files must
resolve to wherever they're *actually hosted*. Until now that was 'my own server'.
Now it's 'my folder in the store' — decided at build time, by the pipeline. This is
exactly how real CI parameterizes federation builds per environment."

**Repeat fast** for claims (same one-liner), then shell and worklist get the helper:

```ts
const remote = (name: string, port: number) =>
  `${name}@${STORE ? `${STORE}/${name}` : `http://localhost:${port}`}/mf-manifest.json`;
```

…used in their `remotes:` blocks. **Call out:** "No env var set? Everything behaves
exactly as before — dev mode untouched. One code path, two topologies."

## 3:00–4:00 · Meet the 'bucket'

**Screen:** `scripts/artifact-store.mjs`, scroll it slowly.

**Say:** "Our pretend Azure Blob + CDN is forty lines of node: serve a folder, add
CORS, and — the two lines that matter most — cache headers. `no-cache` on the
manifest, `immutable` on the hashed chunks. Tattoo that on your CDN config: the
manifest is how a reload discovers a new release. Long-cache it and deploys go silent."

**Do (terminal 1):**

```bash
make store
```

"Port 4400, serving an empty folder. That folder is production."

## 4:00–5:30 · Three teams deploy

**Do (terminal 2), reading each output:**

```bash
make publish app=uikit
make publish app=claims
make publish app=worklist
```

**Say over the last one:** "Build with the env var, copy `dist/` in. Look at the last
line every time: *servers now running for this team: none.* " **Then:**

```bash
ls .artifact-store
```

"Three teams, deployed. Total processes started: zero."

## 5:30–7:00 · Run the product on files alone

**Do:**

```bash
make host
```

**Say:** "The shell builds with its remotes pointed at the store, and serves. What's
alive right now, in total: the store, the shell's file server, the API. Three
processes, none of them a remote."

**Open :3100, network tab filtered to `4400`:** manifest, remoteEntry, chunks — all
three remotes streaming out of one origin. Click into Claims, deep link, the works.

## 7:00–8:30 · THE moment — deploy is a file copy

**Setup:** leave :3100 open. Edit `apps/uikit/src/components/metric-card.tsx` —
something visible.

**Do:**

```bash
make publish app=uikit
```

**Reload :3100** — new uikit. **Say:** "No server restarted — there is no uikit server
to restart. Build, copy, reload. That's a deploy in this topology, and it's how
federation runs at plenty of shops: CI pushes files to blob storage, the CDN serves
them, the host discovers them on the next manifest fetch. Nothing to keep alive,
nothing to scale, nothing to page you at 3am — for the remotes, anyway."

## 8:30–9:30 · Wrap — three topologies, one invariant

**Say over the step-6 guide's diagram:** "You've now seen remotes hosted three ways:
a host per remote — best for seeing team boundaries; one central store — cheapest to
operate, deploys are uploads; and you can even co-locate the files with the host's own
hosting — no CORS, but someone else's CI writes to your bucket. Same mechanism in all
three. The invariant: **the host binds to a stable manifest URL. Where the bytes live
is an infra decision, and none of the options involve a running frontend.** That's the
series, complete. `make catchup step=6` if you want this state; everything's in
docs/workshop/step-6.md."

---

## Production notes

- This episode kills the most persistent MFE misconception; resist compressing the
  0:00 cold open — naming the wrong belief out loud is what makes the correction stick.
- If :3100 shows stale UI after a publish: browser cache on the manifest — good improv
  moment, since the store's `no-cache` header is the fix, and you can show it in the
  network tab's response headers.
- The `make host` target owns two processes (shell preview + API); Ctrl-C stops both.
  Port check first: `make ports` (3100/4100 must be free, 4400 for the store).
- Revert the metric-card edit after recording.
