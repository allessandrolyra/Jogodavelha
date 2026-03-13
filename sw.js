const CACHE_NAME = 'jogo-velha-v3';

// Usa URL absoluta do SW para funcionar em GitHub Pages e localmente
const getBaseUrl = () => {
  const href = self.location.href;
  return href.replace(/\/[^/]*$/, '/');
};

const ASSETS = [
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/ai-worker.js',
  'manifest.json'
];

self.addEventListener('install', (e) => {
  const base = getBaseUrl();
  const urls = [base].concat(ASSETS.map(a => base + a));
  
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urls))
      .catch((err) => console.warn('Cache install falhou:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first para HTML e JS - sempre tenta rede primeiro (atualizações)
  if (e.request.url.match(/\.(html|js)$/)) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first para CSS e outros assets
  e.respondWith(
    caches.match(e.request)
      .then((response) => response || fetch(e.request))
  );
});
