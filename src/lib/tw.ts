import { create } from 'twrnc';
import type { ClassInput, Style } from 'twrnc';

/**
 * Tailwind for React Native (twrnc), tuned so class strings ported from the
 * `new-notes-main` web app render the same on device.
 *
 * Web-only utilities (hover:, transition, cursor, backdrop-blur, gradients,
 * grid, ring, divide, space-*, ...) are silently dropped by `clean()` so the
 * web class strings can be copied almost verbatim.
 */
const base = create({
  theme: {
    extend: {
      colors: {
        'indigo-150': '#d5dcfd',
        'emerald-150': '#bff5dc',
        'slate-150': '#e9eef4',
      },
    },
  },
});

const DROP_VARIANTS = new Set([
  'hover',
  'focus',
  'focus-visible',
  'focus-within',
  'active',
  'group-hover',
  'group-focus',
  'group-active',
  'disabled',
  'placeholder',
  'placeholder-shown',
  'selection',
  'first',
  'last',
  'odd',
  'even',
  'visited',
  'print',
  'motion-safe',
  'motion-reduce',
  'file',
]);

const DROP_UTILITY =
  /^-?(transition|duration-|delay-|ease-|cursor-|select-|backdrop-|animate-|touch-|outline|ring|divide-|space-[xy]-|bg-gradient-|bg-linear-|from-|via-|to-|truncate$|line-clamp-|whitespace-|break-|scrollbar-|overscroll-|overflow-[xy]-|sticky$|fixed$|inline$|inline-flex$|inline-block$|block$|grid$|grid-cols-|col-span-|grid-rows-|row-span-|object-|pointer-events-|resize|appearance-|antialiased$|subpixel-antialiased$|font-sans$|font-mono$|will-change-|scale-|translate-|rotate-|origin-|filter$|blur|drop-shadow|group$|peer$|isolate$|sr-only$|not-sr-only$|list-|caret-|accent-|placeholder-|decoration-|underline-offset-|shrink$|grow$|justify-self-|place-|content-|leading-none$|shadow-(?!sm$|md$|lg$|xl$|2xl$|none$|inner$)[a-z]+-\d+|min-h-\[calc|pt-\[calc|pb-\[calc|h-\[calc|max-h-\[calc|w-\[calc|top-\[calc|bottom-\[calc|z-\[|-z-)/;

const DISPLAY = /^(inline|inline-flex|inline-block|block|grid)$/;

const ALIASES: Record<string, string> = {
  'shadow-2xs': 'shadow-sm',
  'shadow-xs': 'shadow-sm',
};

const cache = new Map<string, string>();

/** Removes web-only tokens from a Tailwind class string. */
export function clean(classes: string): string {
  const hit = cache.get(classes);
  if (hit !== undefined) return hit;
  const out: string[] = [];
  for (const raw of classes.split(/\s+/)) {
    if (!raw) continue;
    const parts = raw.split(':');
    const utility = parts[parts.length - 1];
    const variants = parts.slice(0, -1);
    if (variants.some((variant) => DROP_VARIANTS.has(variant))) continue;
    // `hidden sm:inline` → keep the responsive reveal as `sm:flex`.
    if (variants.length > 0 && DISPLAY.test(utility)) {
      out.push([...variants, 'flex'].join(':'));
      continue;
    }
    if (DROP_UTILITY.test(utility)) continue;
    const aliased = ALIASES[utility];
    out.push(aliased ? [...variants, aliased].join(':') : raw);
  }
  const result = out.join(' ');
  cache.set(classes, result);
  return result;
}

function cleanInputs(inputs: ClassInput[]): ClassInput[] {
  return inputs.map((input) => (typeof input === 'string' ? clean(input) : input));
}

type Tw = {
  (strings: TemplateStringsArray, ...values: (string | number)[]): Style;
  style: (...inputs: ClassInput[]) => Style;
  color: (color: string) => string | undefined;
  setColorScheme: (scheme: 'light' | 'dark') => void;
  isDark: () => boolean;
};

let dark = false;

const twFn = ((strings: TemplateStringsArray, ...values: (string | number)[]) => {
  let joined = '';
  strings.forEach((part, index) => {
    joined += part + (index < values.length ? String(values[index]) : '');
  });
  return base.style(clean(joined));
}) as Tw;

twFn.style = (...inputs: ClassInput[]) => base.style(...cleanInputs(inputs));
twFn.color = (color: string) => base.color(color);
twFn.setColorScheme = (scheme) => {
  dark = scheme === 'dark';
  (base as unknown as { setColorScheme: (s: 'light' | 'dark') => void }).setColorScheme(scheme);
};
twFn.isDark = () => dark;

export const tw = twFn;

/**
 * Converts a lucide class string like `w-4 h-4 text-emerald-600 dark:text-emerald-400`
 * to lucide-react-native props: `<Plus {...ic('w-4 h-4 text-emerald-600')} />`.
 */
export function ic(classes: string, strokeWidth?: number) {
  const style = tw.style(classes) as { width?: number; height?: number; color?: string };
  const size = typeof style.width === 'number' ? style.width : typeof style.height === 'number' ? style.height : 16;
  return {
    size,
    color: typeof style.color === 'string' ? style.color : dark ? '#f1f5f9' : '#0f172a',
    ...(strokeWidth ? { strokeWidth } : {}),
  };
}
