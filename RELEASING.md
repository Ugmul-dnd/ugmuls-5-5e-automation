# Releasing Ugmuls 5.5e Automation

Prepared release: **v1.0.0**. Changes are in `CHANGELOG.md` and `RELEASE-NOTES-1.0.0.md`.

The notes and local assets are prepared for v1.0.0. This preparation does not publish a GitHub release.
Compatibility: Foundry VTT 14 (verified build 14.370) and D&D5e 6.0.6 (minimum 6.0.5). Release validation results are recorded in RELEASE-NOTES-1.0.0.md. The fresh-install archive includes only module.json, LICENSE, runtime scripts, and styles. Release notes, guides, changelog, and repository instructions remain outside the ZIP.

Tests and build tooling are local-only and ignored by Git. Restore your local
tooling before running the commands below if those folders are absent.

1. Run relevant local checks with `node tools/run-tests.mjs --filter <feature>`, then the full suite and syntax/manifest/import checks with `node tools/run-tests.mjs --checks`. Fix failures before running `./tools/build-release.ps1`. Default concurrency is four isolated processes; use `--serial` to diagnose a failure. Local tests/tools are ignored and excluded from the ZIP. If they are absent, restore the local tooling before claiming release verification.
2. Review and commit the prepared changes, complete your branch merge, and push the intended release revision.
3. Create a GitHub release from main with the exact tag **v1.0.0** (lowercase v).
4. Use the title **Ugmuls 5.5e Automation v1.0.0** and the contents of
   `RELEASE-NOTES-1.0.0.md` as the release description.
5. Attach **both** `dist/module.json` and `dist/ugmuls-5-5e-automation.zip`.
   The generated dist folder is intentionally ignored by Git. The optional ZIP .sha256 checksum is regenerated with each build; release notes belong in the GitHub release description, not inside the ZIP.
6. Publish the release, then test installation/update of v1.0.0 in the second world or a separate Foundry data directory. This packaged-release smoke test remains pending; earlier multi-computer/session combat and limited second-world checks were user-reported on the development build.
7. If listed in Foundry's package directory, register the new release there.

Stable installer manifest:
https://github.com/Ugmul-dnd/ugmuls-5-5e-automation/releases/latest/download/module.json

The release tag, ZIP filename, and manifest download URL must match exactly,
including capitalization. GitHub's automatic source archives are not the module ZIP.

For future releases, update `module.json` version and its pinned download URL,
update tested compatibility and notes, run tests, and rebuild the matching assets.
