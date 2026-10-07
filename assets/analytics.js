// Basic traffic measurement only on the public production site.
(() => {
  if (location.protocol !== 'https:' ||
      location.hostname !== 'interactive-physical-landscape.vercel.app') return;
  if (document.querySelector('script[data-landscape-analytics]')) return;

  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  // Search and filter state belongs in the browser, not in analytics reports.
  window.va('beforeSend', event => {
    const url = new URL(event.url);
    url.hash = '';
    url.search = '';
    return { ...event, url: url.href };
  });

  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  script.dataset.landscapeAnalytics = 'true';
  document.head.appendChild(script);
})();
