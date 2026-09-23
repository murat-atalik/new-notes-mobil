# Web → Mobile port guide

`new-notes-mobil` must look and behave **1:1 like the phone-width view of `new-notes-main`**.
Every web component in `new-notes-main/src/components/X.tsx` has a React Native twin at
`new-notes-mobil/src/components/X.tsx` with **the same export name, same props, same texts,
same logic, same store calls, same layout order, same colors/spacing**.

## What is already in place (do not rewrite)

| Mobile file | What it is |
| --- | --- |
| `src/types.ts`, `src/data/*`, `src/lib/{currencyUnits,groupingUtils,permissions,validations}.ts` | Copied verbatim from web. Import exactly like the web does. |
| `src/store/useAppStore.ts` | Web zustand store, same API (`useAppStore()`), fetches the web API via `API_BASE_URL`. |
| `src/lib/tw.ts` | `tw` (twrnc) + `ic()` helper. Web Tailwind class strings work almost verbatim. |
| `src/lib/router.ts` | `useRouter()` (`push`, `back`) and `usePathname()` – same as `next/navigation`. |
| `src/lib/native.ts` | `copyToClipboard(text)`, `shareText({title,text,url})`, `vibrate()`, `confetti()` (no-op). |
| `src/hooks/useTheme.ts` | Same API as web (`themeMode`, `setThemeMode`, `toggleTheme`) + `isDark`. |
| `src/hooks/useSpeechToText.ts` | Same API, `isSupported` is always `false` (web hides mic UI then – do the same). |
| `src/hooks/usePwaInstall.ts` | Returns installed/standalone → PWA install UI never shows. |
| `src/hooks/useLockBodyScroll.ts` | No-op – you may simply drop the call. |
| `src/components/ui/index.tsx` | Primitives: `Text`, `Btn`, `Input`, `Select`, `DateInput`, `Overlay`, `Panel`, `Gradient`, `Grid`, `Progress`. |
| `src/components/{UserAvatar,ThemeToggle,ConfirmModal,Header,BottomNav,AppShell}.tsx` | Already ported – **read them as reference examples** of the style below. |

## Translation rules

### Elements
| Web | Mobile |
| --- | --- |
| `<div className="...">` | `<View style={tw\`...\`}>` or `style={tw.style('...', cond && '...')}` |
| `<span>/<p>/<h1..h6>/<label>` text | `<Text className="...">` from `./ui` (never RN `Text` directly – `./ui` Text carries the dark-mode default color) |
| `<button onClick>` / clickable div | `<Btn className="..." onPress>` from `./ui` |
| `<input>` / `<textarea>` | `<Input className="..." value onChangeText placeholder />` (`multiline` for textarea; `keyboardType="decimal-pad"` for number inputs; `secureTextEntry` for passwords; `autoCapitalize="none"` for usernames) |
| `<select>` | `<Select value onChange options={[{value,label}]} className="..." />` |
| `<input type="date">` / `type="month"` | `<DateInput value onChange className mode="date"|"month" />` |
| `<input type="checkbox">` / toggle | `<Btn>` rendering the same box/switch visuals |
| `<input type="color">` | row of color swatch `<Btn>`s |
| modal `fixed inset-0 bg-black/60 ... flex items-center justify-center` | `<Overlay onClose>` (center) or `<Overlay position="bottom">` when the web uses `items-end sm:items-center` (bottom sheet on phones) ; panel with scrollable content → `<Panel className="...">` |
| `bg-gradient-to-br from-A via-B to-C` | `<Gradient dir="br" colors={['A','B','C']} className="...rest">` |
| `grid grid-cols-N gap-G` | `<Grid cols={N} gap={G}>` (use the **mobile** column count, i.e. the class without `sm:`/`md:` prefix) |
| `space-y-N` | `gap-N` on a column View (`flex-col` is default in RN) |
| `divide-y` | `border-b` on each child except the last |
| `truncate` / `line-clamp-N` | `numberOfLines={1}` / `numberOfLines={N}` on the `Text` |
| progress bar with `style={{width: pct+'%'}}` | `<Progress value={pct} className barClassName />` or a View with `{ width: \`${pct}%\` }` |
| `<svg>`/icons from `lucide-react` | same name from `lucide-react-native`: `<Plus {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />` (all icon names exist) |
| dynamic icon lookup `(Icons as any)[name]` | `import * as Icons from 'lucide-react-native'` and the same lookup |
| `motion.div` / `AnimatePresence` | plain `View` (drop animation props) – keep conditional rendering identical |
| `window.confirm` / `alert` | `Alert.alert(...)` from react-native (or the existing `ConfirmModal` if the web uses it) |
| `navigator.clipboard.writeText` / `navigator.share` | `copyToClipboard` / `shareText` from `../lib/native` |
| `confetti(...)` | `confetti()` from `../lib/native` |
| `setTimeout` feedback toasts | keep as-is |
| `e.preventDefault()` form submit | a `Btn onPress={handleSubmit}`; `onSubmitEditing` on the last input |
| `useRouter` from `next/navigation` | `useRouter` from `../lib/router` |
| inline `style={{ backgroundColor: c.color }}` | keep – `style={[tw\`...\`, { backgroundColor: c.color }]}` |

### Text styling – IMPORTANT
RN does **not** inherit text styles from a parent View. When the web puts
`text-xs font-bold text-white` on a `<button>`/`<div>`, move those text classes onto every
`<Text>` inside it and keep layout/background/border classes on the `Btn`/`View`.
Text directly inside a View must be wrapped in `<Text>`. Numbers too: `<Text>{count}</Text>`.
Never render a raw string/number outside `<Text>` (crashes on RN). Watch `{cond && 'string'}` and `{0 && ...}` patterns: use `cond ? ... : null` and `!!count &&`.

### Classes
- Copy the web class strings **verbatim**; `tw` drops unsupported web-only tokens automatically
  (hover:, focus:, active:, transition, cursor, backdrop-blur, ring, gradients, grid, truncate…).
- `flex` on the web is row by default; in RN it is column. Any web `flex` container without
  `flex-col` must get `flex-row`. `flex-col` stays (harmless).
- `inline-flex items-center` → `flex-row items-center self-start`.
- `hidden sm:inline` etc. are handled (sm: never applies on phones – same as web phone view).
- `w-full` inside a row → `flex-1`. `mx-auto` + `max-w-*` → add `self-center`/`w-full`.
- `absolute` works; `fixed` does not – see list detail views: top bar and bottom bar are normal
  Views above/below a `ScrollView`, floating buttons are `absolute` inside the screen root.
- `rounded-*`, `border*`, `shadow-sm|md|lg|xl|2xl`, `opacity-*`, `/NN` color alpha, arbitrary
  values `text-[10px]`, `min-w-[17px]` all work.
- `overflow-hidden` works. `aspect-square` works.

### Dark mode
Keep every `dark:` class. `tw` resolves it from the current theme. Use `useTheme().isDark` only
when you must pick a raw color (charts, `ic()` already handles `dark:`).

### Performance / structure
- Scroll: tab views (`ListsView`, `FinanceView`, `FamilyView`, `AnalyticsView`, `SettingsView`,
  `CategoriesView`, `TemplatesView`) are rendered **inside** `AppShell`'s ScrollView – do not add
  another vertical ScrollView at their root (horizontal chip rows → `<ScrollView horizontal showsHorizontalScrollIndicator={false}>`).
  List detail views (`ShoppingListView`, `TodoListView`, `NoteListView`) are full screens: they own
  their header + `ScrollView` + footer and use `useSafeAreaInsets()` for top/bottom padding.
- Do **not** wrap components in `React.memo` (theme switching relies on re-render cascade).
- Keep all business logic, computed values, handlers, `useMemo`s, state and texts identical to the web.
- TypeScript is `strict` with `noUnusedLocals`/`noUnusedParameters`: no implicit `any`
  (web code is non-strict – add types), remove unused imports/vars, prefix unused params with `_`.
  `as any` only where the web relies on loose typing (keep a short comment).

### Keyboard
Inputs in modals: `Overlay` already wraps a `KeyboardAvoidingView`. Scrollable forms use `Panel`
or a `ScrollView keyboardShouldPersistTaps="handled"`.

## Verify
From `new-notes-mobil/`: `npx tsc --noEmit 2>&1 | grep 'src/components/<YourFile>'` must print nothing.

## Mobile UX layer (on top of the 1:1 port)

The app keeps the web's content, texts, colors and logic, but uses phone-native interaction patterns.
Already handled centrally — do not re-implement per screen:

- **Type scale** (`src/lib/tw.ts`): `text-[9px]→10`, `[10px]→11`, `[11px]→12`, `text-xs→13`, `text-sm→15`.
- **Modals** (`Overlay`): default `position="sheet"` = bottom-anchored floating sheet, slides up,
  drag handle + backdrop tap to dismiss. `position="center"` only for alert-style confirmations and auth.
  `position="bottom"` for full-width drawers that draw their own `rounded-t-3xl` panel.
- **Btn** has `hitSlop={8}`; press feedback is built in.
- **DateInput** opens the native date picker (value format unchanged).
- **Toasts**: `showToast(message, tone?)` from `./ui` — non-blocking, rendered by `<ToastHost/>` in App.
- **Header**: brand + avatar menu (theme, sync, profile, logout) + "Yeni" pill. Pull-to-refresh syncs.

Per-screen rules:

1. **Dark mode everywhere.** Where the web forgot `dark:` classes (white modals/cards in dark mode),
   add them using the app's dark palette: surfaces `dark:bg-slate-900` (cards) / `dark:bg-slate-800`
   (inputs, chips, secondary buttons), borders `dark:border-slate-800|700`, primary text
   `dark:text-white`, secondary `dark:text-slate-400`, tinted badges `dark:bg-<hue>-950/60 dark:text-<hue>-300`.
   Remove any hard pinning like `dark:text-slate-900` that exists only to survive a white panel.
2. **Touch targets ≥ 44pt** for anything tappable: small icon buttons → `w-10 h-10 items-center justify-center`
   (or `p-2.5`), chip/tab buttons → at least `py-2`, list-row checkboxes → at least `w-6 h-6` with the whole row tappable where the web row is clickable.
3. **Forms in sheets**: inputs `h-12 px-4 rounded-2xl text-[16px]` (16px avoids cramped typing), labels `text-[13px] font-semibold mb-1.5`,
   fields spaced `gap-4`. Primary action: full-width `h-12 rounded-2xl` at the bottom (secondary "Vazgeç" beside it or above it).
   Correct `keyboardType` (`decimal-pad` money, `number-pad` integers, `email-address`), `returnKeyType`,
   `autoCapitalize` (`none` for usernames/codes/emails, `sentences` for titles/notes), `secureTextEntry` for passwords.
4. **Close buttons**: X in sheets `w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center`.
5. **Horizontal overflow**: tab/chip/pill rows that can exceed the phone width → `ScrollView horizontal showsHorizontalScrollIndicator={false}` with `contentContainerStyle` gap/padding; never let a row squeeze text into wrapping.
6. **Density**: cards `p-4`, sections `gap-4`/`gap-5`, list rows `py-3`. Avoid 2-column grids for content with long text on phones; KPI stat tiles may stay 2-up.
7. **Numbers**: amounts use `numberOfLines={1}` + `adjustsFontSizeToFit` where a large figure may overflow.
8. **Don't** change texts, business logic, store calls, colors of brand/semantic accents, or the order of sections.
