# Releasing Ugmuls 5.5e Automation

Prepared release: **v1.1.0**. Changes are in CHANGELOG.md and RELEASE-NOTES-1.1.0.md. Local preparation does not publish a GitHub release.

Compatibility: Foundry VTT 14 (verified build 14.370) and **D&D5e 6.1.0 exactly** (minimum, verified and maximum all 6.1.0). Earlier system versions are incompatible. PHB class compatibility targets the official **Player’s Handbook (2024) 3.0.0**. Updating the book does not replace owned character items; see the release notes before updating.

The archive includes module.json, LICENSE, RELEASE-NOTES-1.1.0.md, runtime JavaScript, and styles. Guides, changelog, repository instructions, tests, tools, state, and Git data are excluded. Tests and build tools are local-only and Git-ignored; restore the local tooling backup if absent.

1. Run relevant checks with `node tools/run-tests.mjs --filter <feature>`, then the full suite and syntax/manifest/import checks with `node tools/run-tests.mjs --checks`. Fix failures before building. Default concurrency is four isolated processes; use --serial to diagnose failures.
2. Run `./tools/build-release.ps1`, then `./tools/verify-release.ps1`. Verification compares every archived file with source, checks manifest assets and exclusions, and validates the checksum. Rebuild and verify again if packaged files change.
3. Review and commit the prepared changes, complete the intended branch merge, and push the release revision.
4. Create a GitHub release from that revision with the exact tag **v1.1.0** (lowercase v), title **Ugmuls 5.5e Automation v1.1.0**, and RELEASE-NOTES-1.1.0.md as the description.
5. Attach **both** dist/module.json and dist/ugmuls-5-5e-automation.zip. The generated dist folder is Git-ignored. The optional dist/ugmuls-5-5e-automation.zip.sha256 records the archive checksum.
6. Publish, then test installation/update of the packaged v1.1.0 release in a second world or separate Foundry data directory. This final-package smoke test remains pending; development checks are recorded in the local test reports.
7. If listed in Foundry's package directory, register the new release there.

Stable installer manifest:
https://github.com/Ugmul-dnd/ugmuls-5-5e-automation/releases/latest/download/module.json

The release tag, ZIP filename, and manifest download URL must match exactly, including capitalization. GitHub's automatic source archives are not the module ZIP.

For future releases, align module.json version and pinned download URL, release notes, changelog, README, this guide, and local build/verification scripts. Update compatibility only when verified, run checks, and rebuild the matching assets.
