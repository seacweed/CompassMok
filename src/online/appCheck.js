import { ReCaptchaEnterpriseProvider, initializeAppCheck } from 'firebase/app-check';

let appCheck = null;

export function initializeOptionalAppCheck(app) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey || appCheck) return appCheck;

  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  return appCheck;
}
