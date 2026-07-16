import { useEffect, useMemo } from 'react';
import { adSlot, adsEnabled, adsenseClientId } from '../ads/adsConfig';

let scriptPromise = null;

function loadAdSenseScript(clientId) {
  if (!clientId) return Promise.resolve(false);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-adsense-client="${clientId}"]`);
    if (existing) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.adsenseClient = clientId;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('AdSense 스크립트를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function AdSenseAd({ placement = 'sidebar', label = '광고' }) {
  const enabled = adsEnabled();
  const clientId = adsenseClientId();
  const slot = adSlot(placement);
  const adKey = useMemo(() => `${placement}-${slot || 'placeholder'}`, [placement, slot]);

  useEffect(() => {
    if (!enabled || !clientId || !slot) return undefined;

    let cancelled = false;

    loadAdSenseScript(clientId)
      .then(() => {
        if (cancelled) return;
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      })
      .catch((error) => {
        console.warn(error);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, clientId, slot, adKey]);

  if (!enabled || !clientId || !slot) {
    return (
      <aside className="ad-card ad-placeholder" aria-label={`${label} 자리`}>
        <span>{label}</span>
        <strong>AdSense 자리</strong>
        <p>.env.local에 AdSense client/slot을 넣으면 실제 광고가 표시됩니다.</p>
      </aside>
    );
  }

  return (
    <aside className="ad-card" aria-label={label}>
      <span>{label}</span>
      <ins
        key={adKey}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
