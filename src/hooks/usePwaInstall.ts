// Native app is always installed; mirrors the web hook in standalone mode.
export function usePwaInstall() {
  return {
    isInstallable: false,
    isInstalled: true,
    isIOS: false,
    isSafari: false,
    isStandalone: true,
    hasNativePrompt: false,
    triggerInstall: async () => false,
  };
}
