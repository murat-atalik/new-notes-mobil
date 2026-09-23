# Akıllı Liste — Mobile UX spec

The mobile app is a **native-first redesign** of the `new-notes` web app. Same data, same
business rules (the store in `src/store/useAppStore.ts` is the single source of truth), but
its own information architecture, navigation and interaction patterns.

## Information architecture

```
Auth stack (not logged in):  Welcome → Login | Register

Tabs:   Bugün (Home) · Listeler · [ + Hızlı Ekle ] · Cüzdan · Aile
          │             │                              │          │
          │             ├─ ListDetail ─ ItemForm*       ├─ Expenses ─ ExpenseDetail
          │             │      ├─ NoteEditor*           ├─ ExpenseForm*  Budget*  Reports
          │             │      └─ Checkout*             ├─ Cards ─ CardDetail ─ CardForm* CardTransaction*
          │             ├─ ListForm*  ListShare*        └─ Savings ─ AssetDetail ─ AssetForm* AssetTransaction*
          │             └─ JoinList*                                 FamilyJoin*  FamilyEdit*
          └─ Settings (avatar) ─ Profile* ChangePassword* Categories ─ CategoryForm*  Templates ─ TemplateForm*

* = modal (native sheet, swipe down to dismiss)
```

Routes and params: `src/navigation/types.ts`. Navigate with `useAppNavigation()`;
tab jumps with `useTabNavigation()('Wallet')`.

## Principles

1. **One primary action per screen**, reachable by thumb: FAB (lists), sticky footer button (checkout,
   forms that are not modal), or the modal header's "Kaydet".
2. **Capture first, details later.** Adding an item is one text field + return key (inline quick-add bar);
   price/qty/category/due date are edited afterwards in `ItemForm`.
3. **Tap = primary, long-press = more.** Rows toggle/open on tap; long-press opens `showActionSheet`
   (edit, share, duplicate, delete). Every long-press action is also reachable from a visible "…" button.
4. **Native patterns**: modal forms (`FormScreen`, header Vazgeç / Kaydet), native date picker, native
   Alert for destructive confirmation (`confirmAction`), pull-to-refresh on every data screen
   (`syncWithServer(false)`), iOS back swipe (stack), toasts for success (`showToast`).
5. **Progressive disclosure**: summary first (cards with a few numbers), details one tap away.
6. **Empty states teach**: every list/section has an `EmptyState` with a primary action.
7. **Dark mode** is first class — only use `design` components and `dark:` variants.
8. **Readable**: body 16, secondary 13–15, never below 11. Touch targets ≥ 44pt.
9. **Turkish copy**, short and friendly. Amounts via `formatMoney`, dates via `formatDay`/`formatMonth`.

## Building blocks (import from `src/design`)

| Component | Use |
| --- | --- |
| `Screen` | Tab root: large title, `subtitle`, `right` actions, `header` override, pull-to-refresh, `overlay` (FAB). Content already padded (`px-4`, `gap-5`). |
| `StackScreen` | Pushed screen: back chevron, centered title, `right`, sticky `footer`. |
| `FormScreen` | Modal form: Vazgeç · title · Kaydet (`onSubmit`, `submitDisabled`, `submitting`). |
| `Card`, `Section`, `ListGroup` + `Row`, `SwitchRow` | Content structure. `Row` = icon tile, title, subtitle, value, chevron. |
| `Button`, `IconButton`, `FAB` | Actions. Button variants: primary, secondary, tinted, danger, dangerTinted, ghost. |
| `TextField`, `AmountField`, `SelectField`, `DateField`, `Segmented`, `ChipRow`, `ColorPicker` | Inputs. `TextField` has label/hint/error, password toggle. |
| `Text` (`variant`, `tone`, `weight`) | All text. Variants: largeTitle, title, title2, headline, body, callout, subhead, footnote, caption, overline, amount. |
| `IconTile`, `iconByName`, `Badge`, `ProgressBar`, `ProgressRing`, `Stat`, `UserAvatar`, `EmptyState` | Display. |
| `Sheet`, `showActionSheet`, `confirmAction`, `showToast` | Overlays. |
| `DonutChart`, `BarChart` from `src/design/charts` | Reports. |

Styling: `tw` from `src/lib/tw` (Tailwind classes, `dark:` supported), icons from `lucide-react-native`
(`ic('w-5 h-5 text-slate-400')` helper for className-style props).

## Data & logic

- Store actions (`useAppStore`) are the only way to mutate data; they update locally and sync to the API.
- Read through `src/logic/selectors.ts` (`useMyLists`, `useListItems`, `useFinance`, `expensesInMonth`,
  `sumTRY`, `categoryBreakdown`, `groupByDay`, `netWorth`, `taskBucket`, `CARD_TYPE_META`, …) and
  `src/logic/format.ts` (`formatMoney`, `formatDay`, `formatMonth`, `monthKey`, `parseAmount`, …).
- Money in forms: keep the raw string in state, convert with `parseAmount` on submit.
- Validation: disable submit until required fields are valid; show inline `error` on fields.
- Domain helpers already exist in `src/lib/currencyUnits.ts` (currencies, gold units, billing cycles),
  `src/lib/permissions.ts`, `src/lib/validations.ts` (zod schemas), `src/data/emojis.ts`.
- The web implementation (`../new-notes/src/components/*`) is the reference for business rules
  (e.g. checkout, card spend/top-up, savings contributions) — not for layout.

## Code rules

- TypeScript strict; no `any` (narrow casts with a comment if the store type is loose).
- No `React.memo` (theme switching re-renders from the screen root).
- Lists with many rows: `FlatList`/`SectionList` only when the screen is not already a ScrollView;
  otherwise map inside the Screen (data sizes are small).
- Each screen file exports the named component registered in `App.tsx`; keep file names.
- Verify: `npx tsc --noEmit`, `npx eslint <files>` clean.
