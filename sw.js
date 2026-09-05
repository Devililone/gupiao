/**
 * Service Worker - 股票趋势工作台
 * 功能：离线缓存 / OTA热更新 / 数据预取 / 后台同步
 */

var CACHE_VERSION = 'v1.0.1';
var STATIC_CACHE = 'stock-trend-static-' + CACHE_VERSION;
var DATA_CACHE = 'stock-trend-data-' + CACHE_VERSION;
var RUNTIME_CACHE = 'stock-trend-runtime-' + CACHE_VERSION;

// 核心静态资源（App Shell）
var APP_SHELL = [
  './',
  './stock-trend-workstation.html',
  './assets/app.js',
  './assets/charts.js',
  './assets/app-config.js',
  './assets/mobile-ui.js',
  './_shared/js/echarts.min.js',
  './_shared/fonts/InstrumentSans-Regular.ttf',
  './_shared/fonts/InstrumentSans-Bold.ttf',
  './_shared/fonts/JetBrainsMono-Regular.ttf',
  './manifest.json'
];

// 数据API端点（留给远程更新接口）
var DATA_ENDPOINTS = [
  '/api/market/sectors',
  '/api/market/stocks',
  '/api/market/dragon',
  '/api/market/daily-review',
  '/api/config/version'
];

// ==================== Install: 预缓存App Shell ====================
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      console.log('[SW] Caching App Shell');
      return cache.addAll(APP_SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ==================== Activate: 清理旧缓存 ====================
self.addEventListener('activate', function(event) {
  var currentCaches = [STATIC_CACHE, DATA_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (currentCaches.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ==================== Fetch: 缓存策略 ====================
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // 策略1: 数据API请求 - Network First（优先网络，失败回退缓存）
  if (DATA_ENDPOINTS.some(function(ep) { return url.pathname.indexOf(ep) !== -1; })) {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          var responseClone = response.clone();
          caches.open(DATA_CACHE).then(function(cache) {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(request).then(function(cached) {
            return cached || new Response(JSON.stringify({ error: 'offline', cached: true }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // 策略2: 导航请求 - App Shell优先（SPA离线可用）
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./stock-trend-workstation.html').then(function(cached) {
        return cached || fetch(request);
      })
    );
    return;
  }

  // 策略3: 静态资源 - Cache First（快速加载），后台更新
  event.respondWith(
    caches.match(request).then(function(cachedResponse) {
      var fetchPromise = fetch(request).then(function(response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(function(cache) {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        return cachedResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// ==================== Message: OTA热更新控制 ====================
self.addEventListener('message', function(event) {
  var data = event.data;
  if (!data) return;

  switch (data.action) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CHECK_UPDATE':
      // 检查远程版本配置
      fetch(data.configUrl || '/api/config/version')
        .then(function(r) { return r.json(); })
        .then(function(config) {
          if (config.version && config.version !== CACHE_VERSION) {
            event.source.postMessage({ action: 'UPDATE_AVAILABLE', version: config.version, changelog: config.changelog });
          } else {
            event.source.postMessage({ action: 'NO_UPDATE' });
          }
        })
        .catch(function() {
          event.source.postMessage({ action: 'UPDATE_CHECK_FAILED' });
        });
      break;

    case 'APPLY_UPDATE':
      // 清除所有缓存，强制重新加载
      caches.keys().then(function(names) {
        return Promise.all(names.map(function(n) { return caches.delete(n); }));
      }).then(function() {
        event.source.postMessage({ action: 'UPDATE_APPLIED' });
      });
      break;

    case 'PRELOAD_DATA':
      // 预取数据（盘中定时刷新）
      Promise.all(DATA_ENDPOINTS.map(function(ep) {
        return fetch(ep).then(function(r) {
          return caches.open(DATA_CACHE).then(function(cache) {
            return cache.put(ep, r.clone());
          });
        }).catch(function() { return null; });
      })).then(function() {
        event.source.postMessage({ action: 'DATA_PRELOADED' });
      });
      break;
  }
});

// ==================== Periodic Sync: 后台定时同步 ====================
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'refresh-market-data') {
    event.waitUntil(refreshMarketDataCache());
  }
});

function refreshMarketDataCache() {
  return caches.open(DATA_CACHE).then(function(cache) {
    return Promise.all(DATA_ENDPOINTS.map(function(ep) {
      return fetch(ep).then(function(r) {
        return cache.put(ep, r.clone());
      }).catch(function() { return null; });
    }));
  });
}

// ==================== Push: 行情提醒推送 ====================
self.addEventListener('push', function(event) {
  var payload = { title: '趋势工作台', body: '有新的市场信号', icon: 'assets/icons/icon-192.png' };
  if (event.data) {
    try { payload = event.data.json(); } catch(e) { payload.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || 'assets/icons/icon-192.png',
      badge: 'assets/icons/badge-72.png',
      vibrate: [200, 100, 200],
      tag: payload.tag || 'market-alert',
      data: payload.data || {}
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openAll().then(function(clientList) {
      if (clientList.length > 0) {
        clientList[0].focus();
        clientList[0].postMessage({ action: 'NOTIFICATION_CLICK', data: event.notification.data });
      } else {
        clients.openWindow('./stock-trend-workstation.html');
      }
    })
  );
});
