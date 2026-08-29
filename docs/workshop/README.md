# Workshop: build the federation yourself

Each step here matches one video. You start from the `start` branch — five working
apps, zero federation — and wire the federation in yourself, step by step.

## How this works

- **You code on your own branch.** From `start`, make a branch and build:

  ```bash
  git checkout start
  git checkout -b my-workshop
  pnpm install && pnpm dev
  ```

- **Every step has a written guide** (`step-N.md`) with the exact edits, and a
  **solution folder** (`solutions/step-N/`) holding the final version of every file
  that step touches, at its real path. Stuck? Diff your file against the solution:

  ```bash
  diff apps/shell/src/router.tsx docs/workshop/solutions/step-2/apps/shell/src/router.tsx
  ```

  Hopelessly stuck? Copy the step's solution files over yours and keep moving —
  the point is the concepts, not the typing.

- **The finished product is on `main`**, with git tags `step-1`…`step-5` marking
  the canonical state after each step (useful for `git diff step-2` if you want a
  full comparison; you never *need* to check them out).

## The steps

| Step | Video | What you build | New concept |
|---|---|---|---|
| [1](step-1.md) | Hello federation | uikit exposes components; shell consumes them | `exposes` / `remotes` / `shared` singletons, federated types |
| [2](step-2.md) | A whole app as a remote | claims mounts at `/claims/*` inside the shell | routing composition, `basename` |
| [3](step-3.md) | A widget remote | worklist lands on the dashboard | `lazy` + `Suspense` around a remote |
| [4](step-4.md) | A remote becomes a host | worklist consumes uikit while shell consumes it | federation is a graph |
| [5](step-5.md) | Sharing state | one QueryClient across shell + worklist | singleton libraries share React context |

After step 5, run the deploy simulation — this is the payoff:

```bash
make up                    # the five-container "production" stack
make deploy app=claims     # one team ships; watch http://localhost:3100
```

## Ground rules that make this feel real

Every app in `apps/` is written as if it were its own repo owned by its own team —
no shared packages, duplicated configs on purpose. When a guide says "the uikit
team does X," imagine that's a different team than you.
