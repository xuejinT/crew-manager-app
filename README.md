# Crew Manager for Kiro Crew

Private, locally installable beta of Crew Manager. This repository is intentionally local-only while its final team-accessible home is decided.

## Product model

- Work items are primary; sessions are references and potential intervention targets.
- Global Search is separate from All, Needs you, Running, and Done.
- Needs you contains only work with a concrete Reply or Review approval action; failures remain visible as issues outside that queue and offer Discuss when no direct recovery action exists.
- Recovering failures remain Running.
- Selection is silent and Conductor context stays private.
- The Conductor decides when intervention is warranted; validated delivery is automatic and visible through a receipt.

## Current status

The validated Quiet split implementation now runs from this standalone package. It owns its model, narrow host-response types, English copy, and theme-token styles while reusing the host-provided React, app SDK, and UI primitives.

The current Kiro Crew APIs cannot always prove that a larger committed outcome is complete. Inactive sessions and independent outputs may therefore appear in Done provisionally until richer outcome data is available.

## Develop

Requires Node.js 22 or newer.

```sh
npm install --no-package-lock
npm run check
```

The build writes the distributable ESM entry to `ui/index.mjs`. React and Kiro Crew modules remain external so the dashboard supplies its own shared instances. The check runs strict TypeScript, the production build, model tests, manifest tests, and the silent-selection/Conductor-routing behavior tests.

## Install locally

After building:

```sh
kirocrew app install "$PWD"
kirocrew app enable crew-manager
```

A supported, user-driven Kiro Crew restart is required after initial installation. During UI iteration, use:

```sh
kirocrew app dev crew-manager
```

Do not add Crew Manager to `kirodotdev/KiroCrewApps` until teammate review is complete.
