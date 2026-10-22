## Summary

<!-- What changed and why? Link the issue if one exists. -->

## Scope and safety

- [ ] No personal study data, runtime demo data, credentials, or generated output is included.
- [ ] Persistence, backup, managed-document, or migration behavior was reviewed if applicable.

## Version label

Add exactly one of `patch`, `minor`, or `major` before merge.

- [ ] `patch` (bug fix, documentation, refactor, or compatible change)
- [ ] `minor` (backwards-compatible feature)
- [ ] `major` (breaking change)

## Verification

- [ ] pm test`
- [ ] pm run lint`
- [ ] px tsc --noEmit`
- [ ] pm run build` when required

## Documentation and release notes

- [ ] Documentation is updated if needed.
- [ ] A changelog fragment was added under `changes/`, or an approved `skip-changelog` exception is explained.
- [ ] This contributor has no other open pull request, unless an approved exemption applies.
