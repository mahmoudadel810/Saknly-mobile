import { getErrorMessage, isNetworkError } from '@/api/client';
import i18n from '@/i18n';

/** A message to show for a failed request: the server's own message, or a translated fallback. */
export const describeError = (error: unknown): string =>
  isNetworkError(error)
    ? i18n.t('common.networkError')
    : getErrorMessage(error, i18n.t('common.unexpectedError'));
