# Releasing Recall

This document is for maintainers. End users should install from [GitHub Releases](https://github.com/TheoGue1/recall-flashcard-overlay/releases).

## Automated release workflow

Releases are built manually via GitHub Actions (**Actions → Release → Run workflow**).

| Input | Description |
|-------|-------------|
| **bump** | Semver increment: `patch` (default), `minor`, or `major` |
| **draft** | If enabled, creates a draft release for review before publishing |

The workflow will:

1. Run `npm test`
2. Bump `package.json` / `package-lock.json` with `npm version <bump>`
3. Commit, push to `main`, and tag `vX.Y.Z`
4. Build installers on Windows, macOS, and Linux
5. Publish a GitHub Release with all artifacts

## Platform status

| Platform | CI build | Manual testing |
|----------|----------|----------------|
| Windows | NSIS `.exe` | Primary platform — tested |
| macOS | `.dmg`, `.zip` | **Not tested** — unsigned |
| Linux | `.AppImage` | **Not tested** |

Release notes are generated with this disclaimer for macOS and Linux.

## Local builds

```bash
npm run dist        # Windows
npm run dist:mac    # macOS (unsigned)
npm run dist:linux  # Linux AppImage
```

Set `CSC_IDENTITY_AUTO_DISCOVERY=false` if code signing causes issues on Windows.
