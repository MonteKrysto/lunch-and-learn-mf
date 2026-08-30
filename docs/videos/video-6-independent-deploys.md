# Video 6 — Independent Deploys, the Finale (6–8 min)

**Teaches:** what all of this was *for* — production-style containers, and one team
deploying without anyone else rebuilding. No new code; the payoff run.
**Starts from:** end of video 5 (= the finished build; `make catchup step=5` recreates it).
**Ends at:** same code — the change made on camera is throwaway demo material.

## Pre-flight

- [ ] State = end of step 5; **Docker Desktop running**
- [ ] `pnpm dev` STOPPED (`make ports` should show the demo ports free) — say why on camera
- [ ] Browser tab ready for :3100; terminal big; `apps/claims/src/pages/claims-list.tsx` open in the editor

---

## 0:00–0:40 · Cold open — the promise

**Screen:** terminal.

**Say:** "Every episode so far ran on dev servers — great for building, but the entire
pitch of module federation is about *deploying*. So: five containers, each app behind
its own nginx, and then the moment this series exists for — the claims team ships to
production and nobody else lifts a finger."

**Recovery line:** "Joining here? `make catchup step=5`, and stop `pnpm dev` — docker
uses the same ports on purpose."

## 0:40–2:10 · Stand up production

**Type:**

```bash
make up
```

While it builds (cut the wait): "Each image builds from *only its own app folder* —
the docker build can't even see the other apps. That's the single-repo simulation
running all the way down."

**When it's up, tour fast:** :3100 dashboard → claims → deep link. "Same product,
but now every piece is a production build served by its own container. One thing's
missing —" open the corner where devtools lived "— the query devtools. Dev-only by
design. Everything else is identical, because the ports are identical: the manifest
URLs baked into the shell work in both worlds."

## 2:10–4:30 · THE moment — one team ships

**Setup the stakes:** open :3100/claims in a tab and *leave it there*. "This tab is a
biller in the middle of their workday. Remember it."

**Make the change:** in `apps/claims/src/claims-list.tsx`'s heading, change `Claims`
to `Claims — v2 ✨` (any visible edit). "The claims team shipped a feature."

**Deploy it:**

```bash
make deploy app=claims
```

**Read the output as it scrolls — it narrates itself:** "Building the claims release —
their pipeline, nobody else's… rolling out only that container… and look at the ages:
claims, seconds old; shell, uikit, worklist, minutes old. **The host was never rebuilt.
The host was never redeployed.**"

**Now the tab:** "Our biller? Still on the old UI — a deploy never yanks code out of a
running session. But the moment they reload—" **reload** "—v2. The shell fetched the
claims manifest, found a new remoteEntry, composed the new release. At runtime."

## 4:30–5:30 · Why that worked (30 seconds of caching theory)

**Say over the network tab:** "Two rules made that safe. The manifest lives at a
stable URL and is never long-cached — that's how a reload discovers the release. The
chunks behind it are content-hashed and cacheable forever — that's why unchanged apps
cost nothing. If you remember one operational rule from this series: **never let a CDN
long-cache mf-manifest.json.**"

**Optional beat if time:** `make deploy app=uikit` with no change — "same machinery,
any team, any day, any cadence."

## 5:30–7:00 · Series wrap

**Screen:** the dashboard, then the editor's file tree.

**Say:** "What you built: four applications and an API, five deployables, one product.
Composed at runtime by module federation; one React via shared singletons; a whole app
mounted under a route with one prop; a widget that's both remote and host; state
crossing app boundaries through a shared singleton; and teams that ship on their own
clock. When should you actually do this? When the *team* problem is real — multiple
teams blocked on one release train. If one team owns the frontend, you just watched a
great party trick; don't ship it. And every slice you expose is a contract: the module
for UI, the endpoints for data, the shared deps you negotiate. Keep all three small.
Thanks for building along — the repo, the guides, and `make catchup` aren't going
anywhere."

**Cleanup on camera:** `make down` — leave the machine as you found it.

---

## Production notes

- Do a full `make up` dry-run before recording — first build is slow (fine to cut),
  and it confirms port availability.
- The open-tab-then-reload beat is the emotional peak of the series; don't talk over
  the reload. Click, pause, let the heading change speak.
- If the open tab shows a federation error after the deploy instead of old UI: the
  browser revalidated mid-rollout during the container swap — reload again; worth
  keeping in the take if it happens ("that was the two seconds of container swap —
  real deploys put a health check in front").
- Revert the `v2 ✨` edit after recording (it's demo garbage, not repo content).
