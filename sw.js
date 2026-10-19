// 앱 코드(껍데기)만 캐시합니다. 음악 파일은 IndexedDB에 따로 저장돼요.
// 앱을 수정해서 다시 올릴 때는 아래 버전 숫자를 올리세요 (v1 → v2).
const CACHE = 'mymusic-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 캐시 우선 + 뒤에서 조용히 갱신 (오프라인에서도 즉시 실행)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      const net = fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => null);

      if (cached) { e.waitUntil(net); return cached; }
      return net.then(res => res || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
