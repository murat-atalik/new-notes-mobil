# Copilot Instructions — new-notes-mobil

These instructions are loaded by GitHub Copilot (Chat, Edits and the coding agent) for every request in this repository. The detailed code rules live in [instructions/code-rules.instructions.md](instructions/code-rules.instructions.md) (auto-applied to `*.ts`/`*.tsx`); the step-by-step guide for new work is [docs/new-feature-playbook.md](../docs/new-feature-playbook.md); the senior React Native role, target folder structure and file templates are in the [react-native-senior skill](skills/react-native-senior/SKILL.md).

## Overview

**new-notes-mobil** ("Akıllı Liste") is the React Native CLI counterpart of the `new-notes-main` web app: family shopping lists, to-dos and notes, with finance / family / analytics / settings tabs. **Expo is not used.**

- React Native **0.87.1**, React **19.2.3**, TypeScript **6.x** with `strict: true` (extends `@react-native/typescript-config`).
- Persistence: `@react-native-async-storage/async-storage`, single key `smart-family-list-mobile-v1` storing `{ user, lists, dark }` as JSON.
- No backend, no navigation library, no state library — navigation is tab/selection state inside `App`.
- The app is Turkish-language; UI strings are Turkish.
- Native iOS and Android projects are committed under `ios/` and `android/`; this is a bare React Native CLI app.

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

## Architecture (current state)

The root [App.tsx](../App.tsx) currently composes the app while feature extraction proceeds incrementally under `src/`:

| Part       | Where                                                               | What it is                                                                                                                          |
| ---------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Types      | [src/types/index.ts](../src/types/index.ts)                         | `ListType` (`SHOPPING` / `TODO` / `NOTE`), `Tab`, `Item`, `AppList`, `User`, `PersistedState`                                       |
| Strings    | [src/strings/tr.ts](../src/strings/tr.ts)                           | `strings` — every user-facing text, including seed data and the placeholder tab content                                             |
| Storage    | [src/services/storageService.ts](../src/services/storageService.ts) | `loadState()` / `saveState()` — the only AsyncStorage caller; validates the stored shape and returns `null` on missing/corrupt data |
| Constants  | [src/constants/](../src/constants/)                                 | `colors`, `LIST_TYPES`, `typeEmoji`, and the seed data                                                                              |
| Utils      | [src/utils/](../src/utils/)                                         | IDs, validation, filtering, completion statistics                                                                                   |
| Hooks      | [src/hooks/](../src/hooks/)                                         | `useAppState` persistence ViewModel and `useLists` list intents                                                                     |
| Components | [src/components/Button/](../src/components/Button/)                 | Shared, memoized button with variants                                                                                               |
| Root       | `App.tsx`                                                           | Root composition and remaining screen wiring                                                                                        |
| Native     | `android/`, `ios/`                                                  | React Native CLI native projects                                                                                                    |
| Tooling    | `eslint.config.mjs`, `.prettierrc.json`, `tsconfig.json`            | ESLint, Prettier, and strict TypeScript enforcement                                                                                 |

Data flow: `App` holds all state and passes values + callbacks down as props; child screens hold only view-local input state (`useState` for text fields, active tab, search).

### Target structure (when the file is split)

As features grow, move code out of `App.tsx` — opportunistically, when you touch that area, never as a big-bang rewrite, and only after the plan is approved:

```
src/
  types/          # domain types (Item, AppList, User, ...)
  constants/      # colors/theme tokens, storage keys, seed data
  strings/        # tr.ts — every user-facing string
  services/       # storageService.ts (the only AsyncStorage caller)
  utils/          # pure helpers: uid, filtering, totals, validation
  hooks/          # ViewModel hooks: useLists, useAuth, useSettings
  components/     # shared UI (Button, ListCard, ...) — one folder each, with styles.ts
  screens/        # AuthScreen, ListsScreen, DetailScreen, SettingsScreen, ...
```

## Conventions

- TypeScript strict: no `any` in new code; type props explicitly.
- Function components + hooks only.
- Keep `App.tsx`'s style: `StyleSheet.create` objects, the `colors` palette, `accessibilityRole` on pressables.
- Dark mode must keep working on every screen (`darkStyles` / theme tokens).
- Update this file when the high-level picture changes (new folder layout, new library, navigation added).
