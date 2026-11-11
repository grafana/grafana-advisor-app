# Releasing

Releases are driven by [release-please](https://github.com/googleapis/release-please) (via
[`grafana/plugin-ci-workflows`](https://github.com/grafana/plugin-ci-workflows)) and the
`Plugins - CD` workflow. You never edit the version or `CHANGELOG.md` by hand.

## 1. Write conventional commits

PR titles (squash-merged) decide the next version:

| Prefix | Bump |
| --- | --- |
| `fix:` | patch |
| `feat:` | minor |
| `feat!:` / `BREAKING CHANGE:` | major |
| `chore:`, `docs:`, `ci:`, `chore(deps):` … | none (not released on their own) |

## 2. Merge the release PR

On every push to `main`, release-please opens or updates a PR titled
`chore(main): release X.Y.Z`. It bumps `package.json`, `package-lock.json` and
`.release-please-manifest.json`, and adds the generated entry to `CHANGELOG.md`.

When you want to release, review it and merge it. This creates the `vX.Y.Z` tag and the
GitHub Release.

## 3. Deploy

Merging the release PR also deploys to **dev** automatically.

To release further, run **Actions → Plugins - CD → Run workflow**:

- `branch`: `main` (prod deploys are only allowed from `main`)
- `environment`: `prod`

Deploying to `prod` walks through dev → ops → prod-canary → prod in Argo. All Argo stages are
auto-approved, so there is no manual "Resume" step. Progress is reported in
`#grafana-catalog-ci`.

Deploy `main` right after merging the release PR, so the deployed version matches the tag.

