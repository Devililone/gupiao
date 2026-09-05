/**
 * app-config.js — 远程配置 & OTA更新接口
 *
 * 功能：
 *   1. 远程版本检查 / 热更新（不经过应用商店）
 *   2. 数据源端点配置（可远程切换服务器）
 *   3. 定时数据刷新调度
 *   4. 离线缓存管理
 *   5. 推送通知注册
 *   6. App设置持久化
 */

var AppConfig = (function() {
  // ==================== 默认配置 ====================
  var DEFAULT_CONFIG = {
    // 远程配置服务器（留接口，部署后可通过此URL远程下发配置）
    configServer: 'https://your-api-server.com',
    configEndpoint: '/api/config/version',

    // 数据API端点（可被远程配置覆盖）
    dataEndpoints: {
      sectors:    '/api/market/sectors',
      stocks:     '/api/market/stocks',
      dragon:     '/api/market/dragon',
      dailyReview: '/api/market/daily-review'
    },

    // 数据刷新间隔（毫秒）
    refreshIntervals: {
      market: 60 * 60 * 1000,       // 行情数据：1小时
      dragon: 60 * 60 * 1000,       // 龙头数据：1小时
      daily:  60 * 60 * 1000,        // 复盘数据：1小时
      config: 24 * 60 * 60 * 1000   // 配置检查：24小时
    },

    // 功能开关（可远程控制）
    features: {
      autoRefresh: true,
      pushNotification: true,
      offlineMode: true,
      debugMode: false
    },

    // App版本
    appVersion: '1.0.0',
    minSupportedVersion: '1.0.0',

    // 用户偏好
    preferences: {
      defaultTab: 'funnel',
      theme: 'auto',
      alertThreshold: { limitUp: 5, limitDown: 5 },
      watchlist: []
    }
  };

  var STORAGE_KEY = 'stock-trend-config';
  var config = null;
  var updateAvailable = false;
  var remoteConfig = null;
  var refreshTimers = {};

  // ==================== 初始化 ====================
  function init() {
    loadLocalConfig();
    registerServiceWorker();
    scheduleConfigCheck();
    scheduleDataRefresh();
    log('AppConfig initialized, version:', config.appVersion);
    return this;
  }

  // ==================== 本地配置加载/保存 ====================
  function loadLocalConfig() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        config = deepMerge(DEFAULT_CONFIG, parsed);
      } else {
        config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      }
    } catch(e) {
      config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch(e) {
      log('Failed to save config:', e);
    }
  }

  function deepMerge(base, override) {
    var result = {};
    for (var key in base) {
      if (typeof base[key] === 'object' && !Array.isArray(base[key]) && base[key] !== null) {
        result[key] = deepMerge(base[key] || {}, override[key] || {});
      } else {
        result[key] = override[key] !== undefined ? override[key] : base[key];
      }
    }
    return result;
  }

  // ==================== Service Worker 注册 ====================
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      log('Service Worker not supported');
      return;
    }

    navigator.serviceWorker.register('./sw.js')
      .then(function(reg) {
        log('SW registered, scope:', reg.scope);

        // 监听更新
        reg.addEventListener('updatefound', function() {
          var newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              updateAvailable = true;
              showUpdateNotification();
            }
          });
        });
      })
      .catch(function(err) {
        log('SW registration failed:', err);
      });

    // 监听SW消息
    navigator.serviceWorker.addEventListener('message', function(event) {
      var msg = event.data;
      if (!msg) return;

      switch (msg.action) {
        case 'UPDATE_AVAILABLE':
          updateAvailable = true;
          showUpdateBanner(msg.version, msg.changelog);
          break;
        case 'UPDATE_APPLIED':
          window.location.reload();
          break;
        case 'DATA_PRELOADED':
          log('Data preloaded by SW');
          if (typeof refreshAllData === 'function') refreshAllData();
          break;
        case 'NOTIFICATION_CLICK':
          handleNotificationClick(msg.data);
          break;
      }
    });
  }

  // ==================== 远程配置检查 ====================
  function checkRemoteConfig() {
    var configUrl = config.configServer + config.configEndpoint;
    log('Checking remote config:', configUrl);

    return fetch(configUrl, { cache: 'no-cache' })
      .then(function(r) {
        if (!r.ok) throw new Error('Config fetch failed: ' + r.status);
        return r.json();
      })
      .then(function(remote) {
        remoteConfig = remote;
        log('Remote config received:', remote);

        // 版本检查
        if (remote.version && remote.version !== config.appVersion) {
          if (remote.forceUpdate) {
            showForceUpdateDialog(remote);
          } else {
            updateAvailable = true;
            showUpdateBanner(remote.version, remote.changelog);
          }
        }

        // 远程覆盖数据端点
        if (remote.dataEndpoints) {
          config.dataEndpoints = deepMerge(config.dataEndpoints, remote.dataEndpoints);
          saveConfig();
        }

        // 远程功能开关
        if (remote.features) {
          config.features = deepMerge(config.features, remote.features);
          saveConfig();
        }

        // 远程刷新间隔
        if (remote.refreshIntervals) {
          config.refreshIntervals = deepMerge(config.refreshIntervals, remote.refreshIntervals);
          saveConfig();
          scheduleDataRefresh(); // 重新调度
        }

        return remote;
      })
      .catch(function(err) {
        log('Remote config check failed:', err);
        return null;
      });
  }

  // ==================== 定时调度 ====================
  function scheduleConfigCheck() {
    if (refreshTimers.config) clearInterval(refreshTimers.config);
    refreshTimers.config = setInterval(function() {
      checkRemoteConfig();
    }, config.refreshIntervals.config);
    // 首次立即检查
    setTimeout(checkRemoteConfig, 3000);
  }

  function scheduleDataRefresh() {
    // 行情数据刷新
    if (refreshTimers.market) clearInterval(refreshTimers.market);
    if (config.features.autoRefresh) {
      refreshTimers.market = setInterval(function() {
        if (typeof refreshMarketData === 'function') {
          refreshMarketData();
        }
      }, config.refreshIntervals.market);
    }

    // 龙头数据刷新
    if (refreshTimers.dragon) clearInterval(refreshTimers.dragon);
    if (config.features.autoRefresh) {
      refreshTimers.dragon = setInterval(function() {
        if (typeof refreshDragonModule === 'function') {
          refreshDragonModule();
        }
      }, config.refreshIntervals.dragon);
    }

    // 复盘数据刷新
    if (refreshTimers.daily) clearInterval(refreshTimers.daily);
    if (config.features.autoRefresh) {
      refreshTimers.daily = setInterval(function() {
        if (typeof refreshDailyReview === 'function') {
          refreshDailyReview();
        }
      }, config.refreshIntervals.daily);
    }
  }

  // ==================== 数据获取（带缓存+回退） ====================
  function fetchWithCache(endpoint, options) {
    options = options || {};
    var url = config.configServer + endpoint;

    return fetch(url, options)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function(err) {
        log('Fetch failed, trying cache:', endpoint);
        return caches.match(url).then(function(cached) {
          if (cached) return cached.json();
          throw err;
        });
      });
  }

  // ==================== OTA热更新 ====================
  function applyUpdate() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      window.location.reload();
      return;
    }
    navigator.serviceWorker.controller.postMessage({ action: 'APPLY_UPDATE' });
  }

  function checkUpdate() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage({
      action: 'CHECK_UPDATE',
      configUrl: config.configServer + config.configEndpoint
    });
  }

  // ==================== 推送通知 ====================
  function requestPushPermission() {
    if (!('Notification' in window)) return Promise.reject('Not supported');
    return Notification.requestPermission().then(function(permission) {
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        return navigator.serviceWorker.ready.then(function(reg) {
          return reg.pushManager.subscribe({ userVisibleOnly: true });
        });
      }
      return null;
    });
  }

  function sendPushSubscription(subscription) {
    return fetch(config.configServer + '/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  }

  // ==================== 离线缓存管理 ====================
  function clearCache() {
    return caches.keys().then(function(names) {
      return Promise.all(names.map(function(n) { return caches.delete(n); }));
    });
  }

  function getCacheSize() {
    return caches.keys().then(function(names) {
      return names.length;
    });
  }

  // ==================== UI: 更新提示 ====================
  function showUpdateBanner(version, changelog) {
    var banner = document.getElementById('update-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'update-banner';
      banner.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0',
        'background:linear-gradient(90deg,#6366f1,#8b5cf6)',
        'color:#fff', 'padding:10px 16px', 'font-size:13px',
        'display:flex', 'align-items:center', 'justify-content:space-between',
        'z-index:99999', 'box-shadow:0 2px 12px rgba(99,102,241,0.3)',
        'transform:translateY(-100%)', 'transition:transform 0.3s ease'
      ].join(';');
      banner.innerHTML =
        '<div style="flex:1;">' +
          '<strong>发现新版本 ' + (version || '') + '</strong>' +
          (changelog ? '<div style="font-size:11px;opacity:0.9;margin-top:2px;">' + changelog + '</div>' : '') +
        '</div>' +
        '<button id="update-btn" style="background:#fff;color:#6366f1;border:none;padding:6px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px;">立即更新</button>' +
        '<button id="update-dismiss" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.4);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;margin-left:8px;">稍后</button>';
      document.body.appendChild(banner);

      setTimeout(function() { banner.style.transform = 'translateY(0)'; }, 100);

      document.getElementById('update-btn').addEventListener('click', function() {
        applyUpdate();
      });
      document.getElementById('update-dismiss').addEventListener('click', function() {
        banner.style.transform = 'translateY(-100%)';
      });
    }
  }

  function showForceUpdateDialog(remote) {
    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.7)', 'z-index:100000',
      'display:flex', 'align-items:center', 'justify-content:center'
    ].join(';');
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:32px;max-width:340px;text-align:center;">' +
        '<div style="font-size:48px;margin-bottom:12px;">' + (remote.icon || '') + '</div>' +
        '<h3 style="font-size:18px;margin-bottom:8px;">需要更新到 ' + (remote.version || '最新版') + '</h3>' +
        '<p style="font-size:13px;color:#6b7280;margin-bottom:20px;">' + (remote.updateMessage || '此版本已过期，请更新后继续使用。') + '</p>' +
        '<button id="force-update-btn" style="background:#6366f1;color:#fff;border:none;padding:10px 32px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;width:100%;">立即更新</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('force-update-btn').addEventListener('click', function() {
      if (remote.updateUrl) {
        window.location.href = remote.updateUrl;
      } else {
        applyUpdate();
      }
    });
  }

  function showUpdateNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(function(reg) {
        reg.showNotification('趋势工作台有更新', {
          body: '点击更新到最新版本',
          icon: 'assets/icons/icon-192.png',
          tag: 'app-update'
        });
      });
    }
  }

  function handleNotificationClick(data) {
    if (data && data.tab) {
      var btn = document.querySelector('.tab-btn[data-tab="' + data.tab + '"]');
      if (btn) btn.click();
    }
  }

  // ==================== 设置面板 ====================
  function openSettingsPanel() {
    var existing = document.getElementById('settings-panel');
    if (existing) { existing.remove(); return; }

    var panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.style.cssText = [
      'position:fixed', 'top:0', 'right:0', 'bottom:0', 'width:320px',
      'background:#fff', 'z-index:99998', 'overflow-y:auto',
      'box-shadow:-4px 0 24px rgba(0,0,0,0.15)',
      'transform:translateX(100%)', 'transition:transform 0.3s ease'
    ].join(';');

    panel.innerHTML =
      '<div style="padding:20px;border-bottom:1px solid #eee;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<h3 style="font-size:16px;font-weight:700;">App设置</h3>' +
          '<button id="settings-close" style="border:none;background:none;font-size:20px;cursor:pointer;">' + '\\u00d7' + '</button>' +
        '</div>' +
        '<div style="font-size:11px;color:#6b7280;margin-top:4px;">版本 ' + config.appVersion + '</div>' +
      '</div>' +

      '<div style="padding:16px 20px;">' +
        '<div style="font-size:12px;font-weight:600;color:#6b7280;margin-bottom:12px;">数据刷新</div>' +

        '<label style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;">' +
          '自动刷新' +
          '<input type="checkbox" id="setting-autoRefresh" ' + (config.features.autoRefresh ? 'checked' : '') + ' style="width:18px;height:18px;">' +
        '</label>' +

        '<label style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;">' +
          '刷新间隔' +
          '<select id="setting-interval" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;">' +
            '<option value="1800000" ' + (config.refreshIntervals.market === 1800000 ? 'selected' : '') + '>30分钟</option>' +
            '<option value="3600000" ' + (config.refreshIntervals.market === 3600000 ? 'selected' : '') + '>1小时</option>' +
            '<option value="7200000" ' + (config.refreshIntervals.market === 7200000 ? 'selected' : '') + '>2小时</option>' +
            '<option value="14400000" ' + (config.refreshIntervals.market === 14400000 ? 'selected' : '') + '>4小时</option>' +
          '</select>' +
        '</label>' +
      '</div>' +

      '<div style="padding:16px 20px;border-top:1px solid #f0f0f0;">' +
        '<div style="font-size:12px;font-weight:600;color:#6b7280;margin-bottom:12px;">通知</div>' +
        '<label style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;">' +
          '推送通知' +
          '<input type="checkbox" id="setting-push" ' + (config.features.pushNotification ? 'checked' : '') + ' style="width:18px;height:18px;">' +
        '</label>' +
      '</div>' +

      '<div style="padding:16px 20px;border-top:1px solid #f0f0f0;">' +
        '<div style="font-size:12px;font-weight:600;color:#6b7280;margin-bottom:12px;">离线</div>' +
        '<label style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;">' +
          '离线模式' +
          '<input type="checkbox" id="setting-offline" ' + (config.features.offlineMode ? 'checked' : '') + ' style="width:18px;height:18px;">' +
        '</label>' +
        '<button id="setting-clearCache" style="width:100%;margin-top:8px;padding:8px;background:#fee;color:#ef4444;border:1px solid #fcc;border-radius:6px;font-size:12px;cursor:pointer;">清除缓存</button>' +
      '</div>' +

      '<div style="padding:16px 20px;border-top:1px solid #f0f0f0;">' +
        '<div style="font-size:12px;font-weight:600;color:#6b7280;margin-bottom:12px;">服务器</div>' +
        '<input type="text" id="setting-server" value="' + config.configServer + '" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:12px;" placeholder="https://your-api-server.com">' +
        '<button id="setting-testServer" style="width:100%;margin-top:8px;padding:8px;background:#eef;border:1px solid #ddf;border-radius:6px;font-size:12px;cursor:pointer;">测试连接</button>' +
        '<div id="setting-serverResult" style="font-size:11px;margin-top:4px;"></div>' +
      '</div>' +

      '<div style="padding:16px 20px;border-top:1px solid #f0f0f0;">' +
        '<button id="setting-checkUpdate" style="width:100%;padding:10px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;">检查更新</button>' +
        '<button id="setting-applyUpdate" style="width:100%;margin-top:8px;padding:8px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:6px;font-size:12px;cursor:pointer;' + (updateAvailable ? '' : 'opacity:0.5;') + '" ' + (updateAvailable ? '' : 'disabled') + '>' + (updateAvailable ? '应用更新' : '无可用更新') + '</button>' +
      '</div>';

    document.body.appendChild(panel);
    setTimeout(function() { panel.style.transform = 'translateX(0)'; }, 50);

    // 绑定事件
    document.getElementById('settings-close').addEventListener('click', function() {
      panel.style.transform = 'translateX(100%)';
      setTimeout(function() { panel.remove(); }, 300);
    });

    document.getElementById('setting-autoRefresh').addEventListener('change', function(e) {
      config.features.autoRefresh = e.target.checked;
      saveConfig();
      if (e.target.checked) scheduleDataRefresh();
      else { for (var k in refreshTimers) clearInterval(refreshTimers[k]); }
    });

    document.getElementById('setting-interval').addEventListener('change', function(e) {
      var val = parseInt(e.target.value);
      config.refreshIntervals.market = val;
      config.refreshIntervals.dragon = val;
      config.refreshIntervals.daily = val;
      saveConfig();
      scheduleDataRefresh();
    });

    document.getElementById('setting-push').addEventListener('change', function(e) {
      config.features.pushNotification = e.target.checked;
      saveConfig();
      if (e.target.checked) requestPushPermission().then(sendPushSubscription);
    });

    document.getElementById('setting-offline').addEventListener('change', function(e) {
      config.features.offlineMode = e.target.checked;
      saveConfig();
    });

    document.getElementById('setting-clearCache').addEventListener('click', function() {
      clearCache().then(function() {
        alert('缓存已清除');
      });
    });

    document.getElementById('setting-server').addEventListener('change', function(e) {
      config.configServer = e.target.value;
      saveConfig();
    });

    document.getElementById('setting-testServer').addEventListener('click', function() {
      var resultEl = document.getElementById('setting-serverResult');
      var server = document.getElementById('setting-server').value;
      resultEl.textContent = '测试中...';
      resultEl.style.color = '#6b7280';
      fetch(server + config.configEndpoint, { cache: 'no-cache' })
        .then(function(r) {
          if (r.ok) { resultEl.textContent = '连接成功'; resultEl.style.color = '#10b981'; }
          else { resultEl.textContent = 'HTTP ' + r.status; resultEl.style.color = '#ef4444'; }
        })
        .catch(function() {
          resultEl.textContent = '连接失败';
          resultEl.style.color = '#ef4444';
        });
    });

    document.getElementById('setting-checkUpdate').addEventListener('click', function() {
      checkUpdate();
      alert('正在检查更新...');
    });

    document.getElementById('setting-applyUpdate').addEventListener('click', function() {
      if (updateAvailable) applyUpdate();
    });
  }

  // ==================== 日志 ====================
  function log() {
    if (config && config.features.debugMode) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[AppConfig]');
      console.log.apply(console, args);
    }
  }

  // ==================== 公共API ====================
  return {
    init: init,
    getConfig: function() { return config; },
    getDataEndpoint: function(key) { return config.dataEndpoints[key]; },
    fetchWithCache: fetchWithCache,
    checkUpdate: checkUpdate,
    applyUpdate: applyUpdate,
    checkRemoteConfig: checkRemoteConfig,
    clearCache: clearCache,
    openSettings: openSettingsPanel,
    requestPushPermission: requestPushPermission,
    getRemoteConfig: function() { return remoteConfig; },
    isUpdateAvailable: function() { return updateAvailable; },
    getVersion: function() { return config.appVersion; }
  };
})();

// ==================== 自动初始化 ====================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    AppConfig.init();
  });
} else {
  AppConfig.init();
}
