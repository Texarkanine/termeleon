# Project Brief: Add Dependabot configuration

## User story

As a maintainer, I want automated dependency update PRs for npm packages and GitHub Actions so termeleon stays aligned with sibling Texarkanine repos.

## Requirements

- Add `.github/dependabot.yaml` matching org conventions (grouping, cadence, commit prefixes, assignees).
- Closest sibling for npm-at-root layout: **tab-yeet** (weekly Monday 09:00, `production-deps` / `development-deps`, `fix(deps)` / `chore(deps-dev)`, `chore(deps-ci)` for Actions).
- Open a PR following repository/org conventions.

## Out of scope

- Changing existing dependencies or CI workflows.
- Adding a PR template to the repo.
