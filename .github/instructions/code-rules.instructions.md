---
applyTo: '**/*.ts,**/*.tsx'
---

# Code Rules — new-notes-mobil

Every rule is marked:

- ✅ **Standing rule** — the code already works this way; the rule codifies it.
- 🔶 **Target rule** — the code partially deviates today (e.g. everything is still in `App.tsx`); **new code must comply**, existing code is fixed opportunistically when touched, never in big-bang rewrites.

## ⛔ Non-negotiables (review blockers)

1. **No static display strings in components.** ✅ Every user-facing string (titles, labels, placeholders, buttons, alerts, validation messages, empty states) comes from `strings` in `src/strings/tr.ts`; parameterized texts are functions there (`strings.lists.progress(done, total)`). Literals in JSX are allowed only for non-display values (test IDs, keys, icon glyphs). Persisted values such as `Item.priority` stay literals because they are stored data.
2. **Validation is mandatory where input matters.** 🔶 Any user input that is stored or used in a calculation (list title, item title, quantity, price, login/register fields) is validated by a pure function in `utils/validation.ts` before state changes. Validation rules live in one place — never inline in JSX, never duplicated between screens. Messages come from the strings module.
3. **One reference per thing — never duplicate components or functions.** Before building a component, check the existing ones (`Button`, `ListCard`, `Header`, `CreateModal`, …); before writing a helper, check `utils/`. Extend with props/variants instead of forking a near-copy; a second consumer means promoting it to `components/` or `utils/`.
4. **No inline styles.** ✅ Every style is a named reference into a `StyleSheet.create` object (sibling `styles.ts` once a component has its own folder). `style={{ marginTop: 8 }}` is not allowed. Runtime-dependent values (dark mode colors, computed sizes) are composed onto a named style — `style={[styles.title, dark && darkStyles.title]}` — and contain only the dynamic properties.
5. **Every new feature is documented.** The change that adds a feature also updates [.github/copilot-instructions.md](../copilot-instructions.md) (architecture table / structure) and the [README](../../README.md) if run steps change.
6. **Every new feature ships unit tests.** 🔶 Jest + `@testing-library/react-native` are not set up yet — the first feature that needs tests adds them (raise it in the plan). From then on, pure helpers, validation, ViewModel hooks and shared components get colocated `<Name>.test.ts(x)` tests. Minimum bar: happy path + edge cases (empty input, whitespace-only, corrupt storage JSON).
7. **Performance is part of done.** See the Performance section below — code that wastes renders or blocks the JS thread is rejected like any other rule break.

## Layering (MVVM, adapted)

| Role          | Here                                                                               | Rules                                                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **View**      | Screens and components                                                             | Passive: render props/state, forward intent via callbacks, hold only view-local `useState` (input text, active filter). No business rules, no AsyncStorage calls. |
| **ViewModel** | 🔶 Custom hooks (`useLists`, `useAuth`, `useSettings`); today: the `App` component | Own the state and the intent methods (`createList`, `updateList`, `toggleItem`, `reset`). Immutable updates (`setLists(current => …)`). No JSX.                   |
| **Model**     | Types, pure utils, validation                                                      | Pure, side-effect-free, testable: filtering, totals, `uid`, validation.                                                                                           |
| **Data**      | ✅ `src/services/storageService.ts`                                                | The **only** place that touches AsyncStorage and the storage key.                                                                                                 |

Dependencies point downward only: screens → components/hooks → services/utils → types/constants. Lower layers never import higher ones.

## Data & storage rules

- ✅ One storage key, one serialized shape `{ user, lists, dark }`. Changing the shape requires a versioned key or a migration — never silently break existing installs.
- ✅ `JSON.parse` of stored data is wrapped in `try/catch` and shape-validated (`loadState`); corrupt data falls back to defaults instead of crashing. Extend the guards when the stored shape grows.
- ✅ Every AsyncStorage promise has error handling (no unhandled rejections).
- Never store passwords. The mock login keeps only the `User` profile.
- IDs come from the single `uid()` helper.

## UI rules

- Colors only from the `colors` palette / theme tokens — no new hard-coded hex values in components.
- Light and dark mode must both work on every screen touched.
- Pressables get `accessibilityRole` and a label when there is no visible text.
- Destructive actions (delete list, reset data) require confirmation.
- `KeyboardAvoidingView` on screens with inputs (iOS `padding`).

## Performance

- **Lists**: variable-length data (lists, items) renders through `FlatList` with a stable `keyExtractor` and a stable `renderItem` — not `.map()` inside a `ScrollView`. ✅ `ListsScreen` and `DetailScreen` follow this (header/empty state via `ListHeaderComponent`/`ListEmptyComponent`, memoized `ListCard`/`ItemRow` rows).
- **Derivations**: filtering/search/totals over lists go in `useMemo` (or a pure util called from one), not recalculated on every render.
- **Callbacks**: callbacks passed to list rows or memoized children are stable (`useCallback`); rows are `React.memo` when the list is long.
- **Storage writes**: don't write on every keystroke — persist on committed changes; debounce if a write can fire rapidly.
- **Dependencies**: no new package when React Native or a small util covers it — raise any new dependency in the plan.
- **Animations**: native driver / UI thread, never `setInterval` + `setState`.

## Hygiene

- `npm run typecheck` stays green (strict mode); no `any`, no `@ts-ignore` without a comment explaining why.
- Import order: react / react-native → external packages → local modules.
- `_`-prefix for intentionally unused variables.

## Review checklist

- [ ] No display literals in components — strings from the strings module.
- [ ] All stored/calculated input validated in `utils/validation.ts`.
- [ ] Nothing duplicated; shared things promoted.
- [ ] No inline style objects; dark mode works.
- [ ] Docs updated (copilot-instructions / README).
- [ ] Tests added (or test setup raised in the plan).
- [ ] Lists virtualized, derivations memoized, storage errors handled.
- [ ] `npm run typecheck` passes.
