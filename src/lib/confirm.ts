import { Alert, Platform } from 'react-native';

import { tNow } from '@/i18n';

/** Cross-platform confirm dialog. */
export function confirm(title: string, message: string, confirmText: string, onConfirm: () => void, destructive = true) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: tNow('common.cancel'), style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

/** Cross-platform one-button message. */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
