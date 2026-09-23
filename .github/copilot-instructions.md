# Copilot Instructions — new-notes-mobil

These instructions are loaded by GitHub Copilot (Chat, Edits and the coding agent) for every request in this repository. The detailed code rules live in [instructions/code-rules.instructions.md](instructions/code-rules.instructions.md) (auto-applied to `*.ts`/`*.tsx`); the step-by-step guide for new work is [docs/new-feature-playbook.md](../docs/new-feature-playbook.md); the senior React Native role, target folder structure and file templates are in the [react-native-senior skill](skills/react-native-senior/SKILL.md).

## Overview

**new-notes-mobil** ("Akıllı Liste") is the React Native CLI app of the `new-notes` web product: family shopping lists, to-dos and notes, wallet (expenses, cards, savings, reports) and family sharing. **Expo is not used.** The UI is a **native-first redesign** (not a port of the web layout) — see [docs/mobile-ux.md](../docs/mobile-ux.md) for the IA, principles and component catalog.

- React Native **0.87.1**, React **19.2.3**, TypeScript **6.x** `strict`.
- State: zustand store `src/store/useAppStore.ts` (same business rules as the web store), persisted via a sync `localStorage` facade over AsyncStorage (`src/lib/storage.ts`).
- Backend: the `new-notes` Next.js API. Auth and data use the mobile routes `/api/mobile/*` (server-side login, user-scoped bootstrap without passwords) through `src/services/mobileApi.ts`, which falls back to the legacy routes while an older backend is deployed.
- UI: `twrnc` classes (`src/lib/tw.ts`), design system `src/design/`, icons `lucide-react-native`, charts via `react-native-svg`, native date picker, react-navigation (native stack + custom tab bar).
- The app is Turkish-language.

## Working agreements (read first — these override defaults)

- **Rules first, every time.** Before any coding task, apply [code-rules.instructions.md](instructions/code-rules.instructions.md) — at minimum the seven ⛔ non-negotiables: strings from one source, mandatory validation, no duplication, named style references, docs with the feature, tests with the feature, performance-first in build and UI. For new features/components, follow [docs/new-feature-playbook.md](../docs/new-feature-playbook.md).
- **Act as a senior mobile developer**: mirror existing precedents in the code, run the reuse scan before building, consider edge cases (empty lists, corrupt/missing storage, long text, dark mode, iOS vs Android keyboard) before writing code.
- **Plan before execute.** Present a plan (goal, steps, files, open questions) and wait for explicit confirmation before changing anything. In agent/edit mode, do not modify files until the plan is approved.
- **Ask, don't invent.** If the prompt is missing something — target screen, data shape, expected behavior, a design decision — ask instead of assuming. A plan with silently-chosen defaults is an incomplete plan.
- **No new dependencies** without raising it in the plan first.
- **Commits only on request**, one logical commit per concern, never `--no-verify`.

## Commands

```sh
npm install
npm start           # Metro (react-native start)
npm run ios         # Build & run iOS
npm run android     # Build & run Android
npm run typecheck   # tsc --noEmit — must stay green (strict mode)
npm run lint         # ESLint
npm run format:check # Prettier
```

The committed native folders were generated from the React Native 0.87.1 CLI template. The registered app name is `NewNotesMobile` ([app.json](../app.json)).

## Architecture

| Part | Where |
| --- | --- |
| Domain types, seed data, pure libs | `src/types.ts`, `src/data/`, `src/lib/{currencyUnits,groupingUtils,permissions,validations}.ts` (shared with the web) |
| Store | `src/store/useAppStore.ts` |
| API client | `src/services/mobileApi.ts` |
| Derived data & formatting | `src/logic/selectors.ts`, `src/logic/format.ts` |
| Design system | `src/design/` (`index.tsx` components, `primitives.tsx`, `charts.tsx`) |
| Navigation | `src/navigation/types.ts` (routes & params), `src/navigation/TabBar.tsx`, `App.tsx` (navigators) |
| Screens | `src/screens/<area>/*Screen.tsx` — auth, home, lists, list-detail, wallet, cards, savings, family, settings |

## Conventions

- TypeScript strict: no `any` in new code; type props explicitly.
- Function components + hooks only.
- Keep `App.tsx`'s style: `StyleSheet.create` objects, the `colors` palette, `accessibilityRole` on pressables.
- Dark mode must keep working on every screen (`darkStyles` / theme tokens).
- Update this file when the high-level picture changes (new folder layout, new library, navigation added).
