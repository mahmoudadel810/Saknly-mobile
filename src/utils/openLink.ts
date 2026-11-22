import { Linking } from 'react-native';
import Toast from 'react-native-toast-message';

import i18n from '@/i18n';

/** Opens a tel:, https: or wa.me link; tells the user when no app on the phone can open it. */
export const openLink = async (url: string): Promise<boolean> => {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    Toast.show({ type: 'error', text1: i18n.t('common.cantOpenLink') });
    return false;
  }
};
