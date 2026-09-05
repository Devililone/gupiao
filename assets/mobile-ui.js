/**
 * mobile-ui.js — 移动端UI增强
 *
 * 功能：
 *   1. 移动端布局自适应（安全区/底部导航/手势）
 *   2. 下拉刷新
 *   3. 底部Tab导航栏（手机端）
 *   4. 触摸手势优化
 *   5. 设置入口
 *   6. 网络状态提示
 *   7. 页面过渡动画
 */

var MobileUI = (function() {
  var isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);
  var pullRefreshState = { startY: 0, pulling: false, threshold: 70 };
  var bottomNavCreated = false;

  // ==================== 初始化 ====================
  function init() {
    if (!isMobile && window.innerWidth > 768) {
      // 桌面端不做移动适配，但仍注册PWA安装
      registerInstallPrompt();
      return;
    }

    injectMobileCSS();
    createBottomNav();
    setupPullToRefresh();
    setupNetworkStatus();
    setupGestures();
    adjustViewport();
    addSettingsButton();
    registerInstallPrompt();

    console.log('[MobileUI] Mobile UI initialized');
  }

  // ==================== 移动端CSS注入 ====================
  function injectMobileCSS() {
    var style = document.createElement('style');
    style.id = 'mobile-ui-styles';
    style.textContent = [
      // 安全区域
      '@media (max-width: 768px) {',
      '  :root {',
      '    --safe-top: env(safe-area-inset-top, 0px);',
      '    --safe-bottom: env(safe-area-inset-bottom, 0px);',
      '    --nav-height: 56px;',
      '  }',
      '',
      // App容器调整
      '  .app-container {',
      '    padding: 8px 8px calc(var(--nav-height) + var(--safe-bottom) + 8px) 8px;',
      '    padding-top: calc(var(--safe-top) + 8px);',
      '  }',
      '',
      // 头部紧凑化
      '  .app-header {',
      '    padding: 10px 14px;',
      '    border-radius: 12px;',
      '    margin-bottom: 8px;',
      '  }',
      '  .app-title h1 { font-size: 16px; }',
      '  .app-subtitle { font-size: 10px; }',
      '',
      // Tab栏隐藏（改用底部导航）
      '  .tab-bar {',
      '    display: none !important;',
      '  }',
      '',
      // Tab内容全宽
      '  .tab-content { padding: 0 !important; }',
      '',
      // 卡片紧凑
      '  .card, .panel, .module-card {',
      '    border-radius: 10px !important;',
      '    margin-bottom: 8px !important;',
      '    padding: 10px 12px !important;',
      '  }',
      '',
      // 表格横滑
      '  .table-container, table {',
      '    font-size: 11px !important;',
      '  }',
      '',
      // 图表容器
      '  .chart-container {',
      '    height: 200px !important;',
      '  }',
      '',
      // 底部导航
      '  .mobile-bottom-nav {',
      '    position: fixed;',
      '    bottom: 0;',
      '    left: 0;',
      '    right: 0;',
      '    height: calc(var(--nav-height) + var(--safe-bottom));',
      '    background: rgba(255,255,255,0.95);',
      '    backdrop-filter: blur(20px);',
      '    border-top: 1px solid rgba(99,102,241,0.12);',
      '    display: flex;',
      '    align-items: flex-start;',
      '    padding-top: 8px;',
      '    padding-bottom: var(--safe-bottom);',
      '    z-index: 999;',
      '    box-shadow: 0 -2px 16px rgba(0,0,0,0.06);',
      '  }',
      '  .mobile-bottom-nav .nav-item {',
      '    flex: 1;',
      '    display: flex;',
      '    flex-direction: column;',
      '    align-items: center;',
      '    gap: 2px;',
      '    padding: 4px 0;',
      '    font-size: 10px;',
      '    color: var(--muted);',
      '    cursor: pointer;',
      '    transition: color 0.2s;',
      '    -webkit-tap-highlight-color: transparent;',
      '  }',
      '  .mobile-bottom-nav .nav-item .nav-icon {',
      '    font-size: 18px;',
      '    line-height: 1;',
      '  }',
      '  .mobile-bottom-nav .nav-item.active {',
      '    color: var(--accent);',
      '  }',
      '  .mobile-bottom-nav .nav-item.active .nav-icon {',
      '    transform: scale(1.1);',
      '  }',
      '',
      // 下拉刷新
      '  .pull-refresh-indicator {',
      '    position: fixed;',
      '    top: calc(var(--safe-top) + 4px);',
      '    left: 50%;',
      '    transform: translateX(-50%) translateY(-60px);',
      '    width: 36px;',
      '    height: 36px;',
      '    border-radius: 50%;',
      '    background: #fff;',
      '    box-shadow: 0 2px 12px rgba(0,0,0,0.1);',
      '    display: flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '    font-size: 18px;',
      '    z-index: 999;',
      '    transition: transform 0.2s ease, opacity 0.2s;',
      '    opacity: 0;',
      '  }',
      '  .pull-refresh-indicator.visible {',
      '    opacity: 1;',
      '  }',
      '  .pull-refresh-indicator.refreshing {',
      '    animation: spin 0.8s linear infinite;',
      '  }',
      '  @keyframes spin {',
      '    from { transform: translateX(-50%) rotate(0deg); }',
      '    to { transform: translateX(-50%) rotate(360deg); }',
      '  }',
      '',
      // 网络状态
      '  .network-status {',
      '    position: fixed;',
      '    top: calc(var(--safe-top) + 50px);',
      '    left: 50%;',
      '    transform: translateX(-50%);',
      '    background: #ef4444;',
      '    color: #fff;',
      '    padding: 4px 16px;',
      '    border-radius: 16px;',
      '    font-size: 11px;',
      '    z-index: 999;',
      '    box-shadow: 0 2px 8px rgba(239,68,68,0.3);',
      '    opacity: 0;',
      '    transition: opacity 0.3s;',
      '  }',
      '  .network-status.visible { opacity: 1; }',
      '',
      // 设置按钮
      '  .mobile-settings-btn {',
      '    position: fixed;',
      '    top: calc(var(--safe-top) + 12px);',
      '    right: 12px;',
      '    width: 32px;',
      '    height: 32px;',
      '    border-radius: 50%;',
      '    background: rgba(99,102,241,0.1);',
      '    border: 1px solid rgba(99,102,241,0.2);',
      '    display: flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '    font-size: 16px;',
      '    cursor: pointer;',
      '    z-index: 900;',
      '    -webkit-tap-highlight-color: transparent;',
      '  }',
      '',
      // 页面切换动画
      '  .tab-content.active {',
      '    animation: fadeInUp 0.3s ease;',
      '  }',
      '  @keyframes fadeInUp {',
      '    from { opacity: 0; transform: translateY(8px); }',
      '    to { opacity: 1; transform: translateY(0); }',
      '  }',
      '',
      // 设置面板移动端适配
      '  #settings-panel {',
      '    width: 100% !important;',
      '  }',
      '',
      '}',
      '',
      // 横屏适配
      '@media (max-width: 768px) and (orientation: landscape) {',
      '  .mobile-bottom-nav { height: 44px; }',
      '  .mobile-bottom-nav .nav-item .nav-icon { font-size: 16px; }',
      '  .mobile-bottom-nav .nav-item { font-size: 9px; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ==================== 底部导航栏 ====================
  function createBottomNav() {
    if (bottomNavCreated) return;
    bottomNavCreated = true;

    var tabs = [
      { id: 'funnel',    icon: '\\u2699',  label: '筛选' },
      { id: 'analysis',  icon: '\\u1f50d', label: '分析' },
      { id: 'sentiment', icon: '\\u1f525', label: '情绪' },
      { id: 'rotation', icon: '\\u1f504', label: '轮动' },
      { id: 'dragon',    icon: '\\u1f409', label: '狙击' },
      { id: 'daily',     icon: '\\u1f4ca', label: '复盘' }
    ];

    var nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.innerHTML = tabs.map(function(t) {
      return '<div class="nav-item" data-tab="' + t.id + '">' +
        '<span class="nav-icon">' + t.icon + '</span>' +
        '<span>' + t.label + '</span>' +
      '</div>';
    }).join('');

    document.body.appendChild(nav);

    // 绑定点击
    nav.querySelectorAll('.nav-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var tabId = this.getAttribute('data-tab');
        switchTab(tabId);
      });
    });

    // 更新active状态
    updateBottomNavActive('funnel');

    // 监听Tab切换
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tabId = this.getAttribute('data-tab');
        updateBottomNavActive(tabId);
      });
    });
  }

  function switchTab(tabId) {
    var tabBtn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
    if (tabBtn) tabBtn.click();
    updateBottomNavActive(tabId);
  }

  function updateBottomNavActive(tabId) {
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(function(item) {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });
  }

  // ==================== 下拉刷新 ====================
  function setupPullToRefresh() {
    var indicator = document.createElement('div');
    indicator.className = 'pull-refresh-indicator';
    indicator.innerHTML = '\\u21bb';
    document.body.appendChild(indicator);

    var container = document.querySelector('.app-container') || document.body;

    container.addEventListener('touchstart', function(e) {
      if (window.scrollY === 0) {
        pullRefreshState.startY = e.touches[0].clientY;
        pullRefreshState.pulling = true;
      } else {
        pullRefreshState.pulling = false;
      }
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
      if (!pullRefreshState.pulling) return;
      var currentY = e.touches[0].clientY;
      var diff = currentY - pullRefreshState.startY;

      if (diff > 0 && diff < 120) {
        indicator.classList.add('visible');
        indicator.style.transform = 'translateX(-50%) translateY(' + (diff * 0.5 - 60) + 'px)';

        if (diff > pullRefreshState.threshold) {
          indicator.innerHTML = '\\u2193';
        } else {
          indicator.innerHTML = '\\u21bb';
        }
      }
    }, { passive: true });

    container.addEventListener('touchend', function(e) {
      if (!pullRefreshState.pulling) return;
      var currentY = e.changedTouches[0].clientY;
      var diff = currentY - pullRefreshState.startY;
      pullRefreshState.pulling = false;

      if (diff > pullRefreshState.threshold) {
        // 触发刷新
        indicator.classList.add('refreshing');
        indicator.innerHTML = '\\u21bb';
        indicator.style.transform = 'translateX(-50%) translateY(8px)';

        // 调用全局刷新函数
        if (typeof refreshAllData === 'function') {
          refreshAllData();
        } else {
          // 逐个调用刷新
          if (typeof refreshMarketData === 'function') refreshMarketData();
          if (typeof refreshDragonModule === 'function') refreshDragonModule();
          if (typeof refreshDailyReview === 'function') refreshDailyReview();
        }

        setTimeout(function() {
          indicator.classList.remove('refreshing', 'visible');
          indicator.style.transform = 'translateX(-50%) translateY(-60px)';
        }, 2000);
      } else {
        indicator.classList.remove('visible');
        indicator.style.transform = 'translateX(-50%) translateY(-60px)';
      }
    }, { passive: true });
  }

  // ==================== 网络状态 ====================
  function setupNetworkStatus() {
    var statusEl = document.createElement('div');
    statusEl.className = 'network-status';
    statusEl.textContent = '网络已断开';
    document.body.appendChild(statusEl);

    window.addEventListener('online', function() {
      statusEl.classList.remove('visible');
      // 恢复后刷新数据
      if (typeof refreshMarketData === 'function') refreshMarketData();
    });

    window.addEventListener('offline', function() {
      statusEl.textContent = '离线模式 · 数据可能过期';
      statusEl.classList.add('visible');
    });

    if (!navigator.onLine) {
      statusEl.textContent = '离线模式 · 数据可能过期';
      statusEl.classList.add('visible');
    }
  }

  // ==================== 手势优化 ====================
  function setupGestures() {
    // 左右滑动切换Tab
    var touchStartX = 0;
    var touchStartY = 0;
    var tabOrder = ['funnel', 'analysis', 'sentiment', 'rotation', 'dragon', 'daily'];

    document.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
      var endX = e.changedTouches[0].clientX;
      var endY = e.changedTouches[0].clientY;
      var diffX = endX - touchStartX;
      var diffY = endY - touchStartY;

      // 水平滑动 > 垂直滑动，且距离 > 50px
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 2) {
        var activeTab = document.querySelector('.tab-btn.active');
        if (!activeTab) return;
        var currentId = activeTab.getAttribute('data-tab');
        var idx = tabOrder.indexOf(currentId);
        if (idx === -1) return;

        // 右滑 = 上一个，左滑 = 下一个
        var newIdx = diffX > 0 ? idx - 1 : idx + 1;
        if (newIdx >= 0 && newIdx < tabOrder.length) {
          switchTab(tabOrder[newIdx]);
        }
      }
    }, { passive: true });

    // 长按禁用（防止文字选中弹菜单）
    document.addEventListener('contextmenu', function(e) {
      if (isMobile) e.preventDefault();
    });
  }

  // ==================== Viewport适配 ====================
  function adjustViewport() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
  }

  // ==================== 设置按钮 ====================
  function addSettingsButton() {
    var btn = document.createElement('button');
    btn.className = 'mobile-settings-btn';
    btn.innerHTML = '\\u2699';
    btn.addEventListener('click', function() {
      if (typeof AppConfig !== 'undefined' && AppConfig.openSettings) {
        AppConfig.openSettings();
      }
    });
    document.body.appendChild(btn);
  }

  // ==================== PWA安装提示 ====================
  var deferredPrompt = null;
  function registerInstallPrompt() {
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButton();
    });

    window.addEventListener('appinstalled', function() {
      console.log('[MobileUI] App installed');
    });
  }

  function showInstallButton() {
    if (!deferredPrompt) return;
    var btn = document.createElement('button');
    btn.style.cssText = [
      'position:fixed', 'bottom:80px', 'right:12px',
      'background:#6366f1', 'color:#fff', 'border:none',
      'padding:8px 16px', 'border-radius:20px', 'font-size:12px',
      'font-weight:600', 'cursor:pointer', 'z-index:900',
      'box-shadow:0 4px 16px rgba(99,102,241,0.4)'
    ].join(';');
    btn.innerHTML = '\\u2193 安装App';
    btn.addEventListener('click', function() {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(result) {
        if (result.outcome === 'accepted') {
          console.log('[MobileUI] User accepted install');
        }
        btn.remove();
        deferredPrompt = null;
      });
    });
    document.body.appendChild(btn);
    setTimeout(function() {
      if (btn.parentNode) btn.remove();
    }, 15000);
  }

  return {
    init: init,
    switchTab: switchTab,
    isMobile: function() { return isMobile; }
  };
})();

// ==================== 全局刷新函数 ====================
window.refreshAllData = function() {
  console.log('[MobileUI] Refreshing all data...');
  if (typeof refreshMarketData === 'function') refreshMarketData();
  if (typeof refreshDragonModule === 'function') refreshDragonModule();
  if (typeof refreshDailyReview === 'function') refreshDailyReview();
};

// ==================== 自动初始化 ====================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    MobileUI.init();
  });
} else {
  MobileUI.init();
}
