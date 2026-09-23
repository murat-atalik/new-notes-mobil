# Copilot Instructions — new-notes-mobil

These instructions are loaded by GitHub Copilot (Chat, Edits and the coding agent) for every request in this repository. The detailed code rules live in [instructions/code-rules.instructions.md](instructions/code-rules.instructions.md) (auto-applied to `*.ts`/`*.tsx`); the step-by-step guide for new work is [docs/new-feature-playbook.md](../docs/new-feature-playbook.md); the senior React Native role, target folder structure and file templates are in the [react-native-senior skill](skills/react-native-senior/SKILL.md).

## Overview

**new-notes-mobil** ("Akıllı Liste") is the React Native CLI twin of the `new-notes-main` web app: family shopping lists, to-dos and notes, finance (cards, savings, expenses), family, analytics and settings. **Expo is not used.** The mobile UI must stay **1:1 identical to the web app's phone-width view** — every web component in `new-notes-main/src/components/X.tsx` has a twin at `src/components/X.tsx` with the same name, props, texts and logic. See [docs/web-port-guide.md](../docs/web-port-guide.md) — it overrides the style/strings rules below for ported components.

- React Native **0.87.1**, React **19.2.3**, TypeScript **6.x** with `strict: true`.
- State: the web's zustand store (`src/store/useAppStore.ts`), persisted through a synchronous `localStorage` facade over AsyncStorage (`src/lib/storage.ts`), talking to the `new-notes-main` API (`src/config/api.ts`).
- Styling: `twrnc` Tailwind classes (`src/lib/tw.ts`) copied from the web; icons from `lucide-react-native`; gradients via `react-native-linear-gradient`; charts drawn with `react-native-svg`.
- Navigation: react-navigation (native stack + bottom tabs with the custom `BottomNav`), wrapped by a Next-style `useRouter()/usePathname()` shim (`src/lib/router.ts`).
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

| Part | Where | Mirrors web |
| --- | --- | --- |
| Types, seed data, pure libs | `src/types.ts`, `src/data/`, `src/lib/{currencyUnits,groupingUtils,permissions,validations}.ts` | copied verbatim from `new-notes-main/src` |
| Store | `src/store/useAppStore.ts` | web store; hash routing removed, `fetch` prefixed with `API_BASE_URL`, `rehydrate()` after storage preload |
| Storage | `src/lib/storage.ts` | `localStorage` API over AsyncStorage (`preloadStorage()` runs before first render) |
| Styling | `src/lib/tw.ts` | Tailwind classes; web-only tokens are dropped by `clean()` |
| Router | `src/lib/router.ts` | `next/navigation` `useRouter` / `usePathname` |
| Native helpers | `src/lib/native.ts` | clipboard, share, vibrate |
| Hooks | `src/hooks/` | `useTheme` (same API + `isDark`), stubs for speech/PWA/body-scroll |
| UI primitives | `src/components/ui/` | `Text`, `Btn`, `Input`, `Select`, `DateInput`, `Overlay`, `Panel`, `Gradient`, `Grid`, `Progress` |
| Components | `src/components/*.tsx` | one file per web component |
| Root | `App.tsx` | web `app/*/page.tsx` routes + `AppShell` global modals |

When the web app changes, port the same change to the twin file here.

## Conventions

- TypeScript strict: no `any` in new code; type props explicitly.
- Function components + hooks only.
- Keep `App.tsx`'s style: `StyleSheet.create` objects, the `colors` palette, `accessibilityRole` on pressables.
- Dark mode must keep working on every screen (`darkStyles` / theme tokens).
- Update this file when the high-level picture changes (new folder layout, new library, navigation added).
