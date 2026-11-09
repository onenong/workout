// WORKOUT 서비스 워커 · 1846203300
const SHELL = 'overload-shell-1846203300', FONTS = 'overload-fonts-v2';
const ASSETS = ['./', './index.html', './app.js', './fonts/fonts.css', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {}))) ).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // 외부 요청은 다루지 않음 (CSP로 이미 차단)
  // 화면: 온라인이면 새 버전, 오프라인이면 저장해 둔 버전
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(SHELL).then(c => c.put('./index.html', copy)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  // 글꼴 조각(woff2): 한 번 받은 건 저장해 두고 계속 사용 (파일 내용이 바뀌지 않음)
  if (url.pathname.includes('/fonts/') && url.pathname.endsWith('.woff2')) {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  // 앱 코드·아이콘 등: 온라인이면 새 버전(화면과 코드 버전이 어긋나지 않게), 오프라인이면 저장본
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
