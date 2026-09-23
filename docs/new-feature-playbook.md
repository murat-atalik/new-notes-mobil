# New Feature & Component Playbook

**Read this before starting anything new.** It is the step-by-step companion to the [code rules](../.github/instructions/code-rules.instructions.md): the rules say _what must hold_, this playbook says _what to do, in which order_ — including how to run the work with GitHub Copilot. When the two disagree, the rules win.

---

## 1. Before you start — the gate checklist

- [ ] **Scope is clear** — which screen/tab, what data changes, expected behavior (including empty and error states).
- [ ] **You know the seven non-negotiables** — strings from one source, validation mandatory, no duplication, named styles, docs with the feature, tests with the feature, performance-first.
- [ ] **Reuse scan done**:
  - _Component_: check existing components (`Button`, `ListCard`, `Header`, `CreateModal`, …). Something close? Extend it with props, don't fork it.
  - _Helper_: check `utils/` (and `uid`, `typeLabels`, `typeEmoji`, `colors` in `App.tsx` until split).
  - _Precedent_: find the existing screen that looks like yours (e.g. `ListsScreen` for a filterable list, `DetailScreen` for add/toggle/remove, `CreateModal` for a form modal) and mirror its shape.
- [ ] **Data shape decided** — does the feature change `AppList`/`Item`/`User` or the stored `{ user, lists, dark }` shape? If yes, plan the migration (versioned key or default-filling on load).
- [ ] **Placement decided** — the lowest level that fits today's consumers: inside the screen → `components/` → `utils/`/`hooks/`.

## 2. Working with Copilot

Use **Copilot Chat** (Ask/Plan) for the plan and **Copilot Edits / Agent mode** for execution. The repo's [copilot-instructions.md](../.github/copilot-instructions.md) and [code-rules.instructions.md](../.github/instructions/code-rules.instructions.md) are applied automatically.

1. **Describe the task with context**: the screen/tab, the scope (UI? state? storage?), and the expected behavior. Reference files with `#file:App.tsx` so Copilot reads the right code.
2. **Copilot answers with a plan first** — steps, files to be touched, open questions. _Nothing is changed yet._
3. **You review and confirm** (or adjust and ask for a revised plan).
4. **Copilot executes the approved plan** honoring the non-negotiables (strings module, validation util, reuse, named styles, docs, tests, performance). If reality diverges from the plan, it reports instead of improvising.
5. **You review the diff** in the editor and run `npm run typecheck` + the app on iOS and Android.
6. **Commit only when you ask** — one logical commit per concern.

Useful prompts at step 1: _"check what exists before proposing anything new"_ and _"show me the precedent component you'll mirror"_.

## 3. Path A — new feature on an existing screen/tab

| #   | Step                                                                                     | Where                                |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| 1   | **Mirror a precedent** — copy the _shape_ of the closest existing screen                 | `screens/` (today `App.tsx`)         |
| 2   | **Types** — extend `Item`/`AppList`/`User` if needed; plan storage migration             | `types/`                             |
| 3   | **Strings** — every display text for the feature                                         | `strings/tr.ts` ⛔                   |
| 4   | **Validation** — pure validator for every stored/calculated input; messages from strings | `utils/validation.ts` ⛔             |
| 5   | **ViewModel** — state + intent methods, immutable updates, no JSX                        | `hooks/` (today `App`)               |
| 6   | **View** — passive screen/components; `FlatList` for variable-length data                | `screens/`, `components/`            |
| 7   | **Styles** — named `StyleSheet.create` entries; dark variants                            | `styles.ts` next to the component ⛔ |
| 8   | **Storage** — only through the storage service; error handling on every call             | `services/storageService.ts`         |
| 9   | **Tests** — validators, pure utils, hooks, shared components                             | colocated `*.test.ts(x)` ⛔          |
| 10  | **Docs** — architecture table in `copilot-instructions.md`, README if run steps change   | `.github/`, `README.md` ⛔           |
| 11  | **Verify** — `npm run typecheck`, run on iOS + Android, light + dark                     | —                                    |

## 4. Path B — new tab / screen

Everything in Path A, plus:

1. Add the value to the `Tab` union and the bottom navigation.
2. Render the screen from `App` (or the navigator, once one is introduced — adding a navigation library is a plan-level decision).
3. Replace the `SimpleScreen` placeholder when a finance/family/analytics tab gets real content.

## 5. Path C — new shared component

1. **Reuse scan verdict first** — if something close exists, extend it with props/variants instead.
2. **Anatomy**:
   ```
   src/components/<Name>/
     <Name>.tsx        # typed props; no business logic, no storage access
     styles.ts         # StyleSheet.create — every style named here
     index.ts
     <Name>.test.tsx
   ```
3. Display strings arrive via props or the strings module; colors from the palette/theme tokens; `accessibilityRole` on interactive elements.
4. Document it in the architecture table of [copilot-instructions.md](../.github/copilot-instructions.md).

## 6. Definition of done

- [ ] ⛔ All display strings from the strings module.
- [ ] ⛔ Every stored/calculated input validated.
- [ ] ⛔ Nothing duplicated.
- [ ] ⛔ All styles are named references; dark mode works.
- [ ] ⛔ Docs updated.
- [ ] ⛔ Tests added and passing (or test setup raised and agreed in the plan).
- [ ] Lists virtualized, derivations memoized, storage errors handled.
- [ ] `npm run typecheck` passes; checked on iOS and Android.
