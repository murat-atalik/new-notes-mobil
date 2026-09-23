import { useCallback } from 'react';

// The web app uses the browser Speech Recognition API. There is no built-in
// equivalent in React Native, so the hook reports `isSupported: false` and the
// ported UI hides its microphone controls exactly like unsupported browsers.
export function useSpeechToText(_options: { lang?: string; continuous?: boolean; interimResults?: boolean } = {}) {
  const noop = useCallback(() => {}, []);
  return {
    isListening: false,
    transcript: '',
    interimTranscript: '',
    isSupported: false,
    error: null as string | null,
    startListening: noop,
    stopListening: noop,
    resetTranscript: noop,
  };
}
