import { Share, Vibration } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

/** navigator.clipboard.writeText replacement. */
export function copyToClipboard(text: string): Promise<void> {
  Clipboard.setString(text);
  return Promise.resolve();
}

/** navigator.share replacement (always available on native). */
export async function shareText(data: { title?: string; text?: string; url?: string }): Promise<void> {
  const message = [data.text, data.url].filter(Boolean).join('\n');
  await Share.share({ title: data.title, message });
}

/** navigator.vibrate replacement. */
export function vibrate(ms = 20) {
  Vibration.vibrate(ms);
}

/** canvas-confetti replacement (no-op on native; kept so ported call sites compile). */
export function confetti(_options?: unknown) {
  vibrate(30);
}
