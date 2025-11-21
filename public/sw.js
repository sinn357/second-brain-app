// Second Brain App - Service Worker
const CACHE_NAME = 'second-brain-v1'
const OFFLINE_URL = '/offline.html'

// 캐시할 핵심 리소스
const CACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// Install 이벤트 - 캐시 생성
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets')
      return cache.addAll(CACHE_ASSETS)
    })
  )
  // 즉시 활성화
  self.skipWaiting()
})

// Activate 이벤트 - 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // 즉시 클라이언트 제어
  return self.clients.claim()
})

// Fetch 이벤트 - 네트워크 우선, 오프라인 시 캐시 사용
self.addEventListener('fetch', (event) => {
  // API 요청은 캐싱하지 않음
  if (event.request.url.includes('/api/')) {
    return
  }

  // POST, PUT, DELETE 등은 캐싱하지 않음
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 유효한 응답만 캐시
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 가져오기
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // HTML 페이지 요청이면 오프라인 페이지 표시
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match(OFFLINE_URL)
          }
        })
      })
  )
})

// Background Sync (선택적)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes())
  }
})

// 노트 동기화 함수 (나중에 구현 가능)
async function syncNotes() {
  // TODO: IndexedDB에서 대기 중인 변경사항을 서버로 전송
  console.log('[SW] Syncing notes...')
}

// Push Notification (선택적)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received')
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body || 'New update available',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(data.title || 'Second Brain', options))
})

// Notification 클릭
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  )
})
