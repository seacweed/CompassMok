export function adsEnabled() {
  return import.meta.env.VITE_ADSENSE_ENABLED === 'true'
    && Boolean(import.meta.env.VITE_ADSENSE_CLIENT_ID);
}

export function adsenseClientId() {
  return import.meta.env.VITE_ADSENSE_CLIENT_ID || '';
}

export function adSlot(name) {
  const slots = {
    sidebar: import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT,
    footer: import.meta.env.VITE_ADSENSE_FOOTER_SLOT,
  };

  return slots[name] || '';
}

export function siteMeta() {
  return {
    url: import.meta.env.VITE_SITE_URL || 'https://example.com',
    contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'contact@example.com',
    operatorName: import.meta.env.VITE_OPERATOR_NAME || 'Your Studio Name',
  };
}
