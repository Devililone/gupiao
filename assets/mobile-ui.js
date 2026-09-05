/**
 * mobile-ui.js — 移动端UI增强
 *
 * 功能：
 *   1. 设备识别与移动端布局自适应（安全区/底部导航/手势）
 *   2. 下拉刷新
 *   3. 底部Tab导航栏（手机端）
 *   4. 触摸手势优化
 *   5. 设置入口
 *   6. 网络状态提示
 *   7. 页面过渡动画
 */

var MobileUI = (function() {
  // ==================== 设备识别 ====================
  var ua = navigator.userAgent || '';
  var isIPhone = /iPhone/i.test(ua) && !/iPad/i.test(ua);
  var isIPad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isIOS = isIPhone || isIPad;
  var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  var isSmallScreen = window.innerWidth <= 768;
  var isMobile = isMobileUA || (isTouchDevice && isSmallScreen);
  var deviceType = isIPhone ? 'iphone' : isIPad ? 'ipad' : isAndroid ? 'android' : isTouchDevice ? 'tablet' : 'desktop';

  var pullRefreshState = { startY: 0, pulling: false, threshold: 70 };
  var bottomNavCreated = false;

  // ==================== 初始化 ====================
  function init() {
    // 输出设备信息
    console.log('[MobileUI] Device:', deviceType, '| Screen:', window.innerWidth + 'x' + window.innerHeight, '| Touch:', isTouchDevice, '| UA:', isMobileUA);

    if (!isMobile && !isTouchDevice) {
      // 纯桌面端：仅注册PWA安装
      registerInstallPrompt();
      return;
    }

    // 触摸设备或小屏幕：注入移动端适配
    injectMobileCSS();
    createBottomNav();
    setupPullToRefresh();
    setupNetworkStatus();
    setupGestures();
    adjustViewport();
    addSettingsButton();
    registerInstallPrompt();

    // 标记body设备类型
    document.body.setAttribute('data-device', deviceType);
    if (isSmallScreen) document.body.classList.add('small-screen');
    if (isIOS) document.body.classList.add('ios-device');
    if (isAndroid) document.body.classList.add('android-device');

    console.log('[MobileUI] Mobile UI initialized for', deviceType);
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
      '    --nav-height: 52px;',
      '  }',
      '',
      // App容器调整 — 适配底部导航高度
      '  .app-container {',
      '    padding: 6px 10px calc(var(--nav-height) + var(--safe-bottom) + 12px) 10px !important;',
      '    padding-top: calc(var(--safe-top) + 6px) !important;',
      '    max-width: 100% !important;',
      '  }',
      '',
      // 头部紧凑化 — 减小高度
      '  .app-header {',
      '    padding: 8px 12px !important;',
      '    border-radius: 12px !important;',
      '    margin-bottom: 8px !important;',
      '    gap: 8px !important;',
      '  }',
      '  .app-title { gap: 8px !important; }',
      '  .app-title-icon { width: 32px !important; height: 32px !important; font-size: 16px !important; border-radius: 8px !important; }',
      '  .app-title-text h1 { font-size: 15px !important; }',
      '  .app-title-text p { font-size: 10px !important; margin-top: 1px !important; }',
      '',
      // 隐藏顶部Tab栏（改用底部导航）
      '  .app-tabs {',
      '    display: none !important;',
      '  }',
      '',
      // 时间线状态移到标题行右侧
      '  .timeline-status {',
      '    font-size: 10px !important;',
      '    padding: 4px 8px !important;',
      '    gap: 4px !important;',
      '  }',
      '',
      // Tab内容全宽
      '  .tab-content { padding: 0 !important; }',
      '  .tab-content.active { animation: fadeInUp 0.3s ease; }',
      '  @keyframes fadeInUp {',
      '    from { opacity: 0; transform: translateY(8px); }',
      '    to { opacity: 1; transform: translateY(0); }',
      '  }',
      '',
      // 卡片紧凑
      '  .card, .panel, .module-card, .funnel-step, .panel-box, .daily-section, .daily-review-wrap, .tactic-page-wrap {',
      '    border-radius: 10px !important;',
      '    margin-bottom: 8px !important;',
      '    padding: 10px 12px !important;',
      '  }',
      '',
      // 主布局单列
      '  .main-layout, .analysis-layout, .sentiment-dashboard, .daily-layout, .tactic-layout {',
      '    grid-template-columns: 1fr !important;',
      '    gap: 8px !important;',
      '  }',
      '  .funnel-sidebar, .analysis-side { position: static !important; }',
      '',
      // 表格横滑
      '  .table-container, table {',
      '    font-size: 11px !important;',
      '  }',
      '',
      // 图表容器缩小
      '  .chart-container {',
      '    height: 180px !important;',
      '  }',
      '',
      // 标题缩小
      '  .panel-title, .section-title, .funnel-title, .dragon-section-title {',
      '    font-size: 14px !important;',
      '  }',
      '  .sub-title, .sub-section-title {',
      '    font-size: 12px !important;',
      '  }',
      '',
      // 步骤数字缩小
      '  .step-number { width: 24px !important; height: 24px !important; font-size: 12px !important; }',
      '  .step-name { font-size: 13px !important; }',
      '  .step-desc { font-size: 11px !important; }',
      '',
      // 底部导航 — 纯文字、紧凑
      '  .mobile-bottom-nav {',
      '    position: fixed;',
      '    bottom: 0;',
      '    left: 0;',
      '    right: 0;',
      '    height: calc(var(--nav-height) + var(--safe-bottom));',
      '    background: rgba(255,255,255,0.96);',
      '    backdrop-filter: blur(20px);',
      '    -webkit-backdrop-filter: blur(20px);',
      '    border-top: 1px solid rgba(99,102,241,0.12);',
      '    display: flex;',
      '    align-items: center;',
      '    justify-content: space-around;',
      '    padding-bottom: var(--safe-bottom);',
      '    z-index: 999;',
      '    box-shadow: 0 -2px 12px rgba(0,0,0,0.06);',
      '  }',
      '  .mobile-bottom-nav .nav-item {',
      '    flex: 1;',
      '    display: flex;',
      '    flex-direction: column;',
      '    align-items: center;',
      '    justify-content: center;',
      '    padding: 6px 2px;',
      '    font-size: 10px;',
      '    font-weight: 600;',
      '    color: #999;',
      '    cursor: pointer;',
      '    transition: color 0.2s;',
      '    -webkit-tap-highlight-color: transparent;',
      '    min-width: 0;',
      '  }',
      '  .mobile-bottom-nav .nav-item .nav-label {',
      '    line-height: 1.2;',
      '    white-space: nowrap;',
      '    overflow: hidden;',
      '    text-overflow: ellipsis;',
      '    max-width: 100%;',
      '  }',
      '  .mobile-bottom-nav .nav-item.active {',
      '    color: #6366f1;',
      '  }',
      '  .mobile-bottom-nav .nav-item.active .nav-label {',
      '    transform: scale(1.06);',
      '    font-weight: 700;',
      '  }',
      '  .mobile-bottom-nav .nav-item.active::before {',
      '    content: "";',
      '    position: absolute;',
      '    top: 0;',
      '    width: 24px;',
      '    height: 3px;',
      '    border-radius: 0 0 3px 3px;',
      '    background: linear-gradient(135deg, #6366f1, #8b5cf6);',
      '  }',
      '  .mobile-bottom-nav .nav-item { position: relative; }',
      '',
      // 下拉刷新 — 用文字代替图标
      '  .pull-refresh-indicator {',
      '    position: fixed;',
      '    top: calc(var(--safe-top) + 4px);',
      '    left: 50%;',
      '    transform: translateX(-50%) translateY(-60px);',
      '    min-width: 40px;',
      '    height: 32px;',
      '    border-radius: 16px;',
      '    background: #fff;',
      '    box-shadow: 0 2px 12px rgba(0,0,0,0.12);',
      '    display: flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '    font-size: 11px;',
      '    font-weight: 600;',
      '    color: #6366f1;',
      '    z-index: 999;',
      '    transition: transform 0.2s ease, opacity 0.2s;',
      '    opacity: 0;',
      '    padding: 0 12px;',
      '    white-space: nowrap;',
      '  }',
      '  .pull-refresh-indicator.visible { opacity: 1; }',
      '  .pull-refresh-indicator.refreshing { animation: spin 0.8s linear infinite; }',
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
      // 设置按钮 — 纯文字
      '  .mobile-settings-btn {',
      '    position: fixed;',
      '    top: calc(var(--safe-top) + 10px);',
      '    right: 10px;',
      '    min-width: 28px;',
      '    height: 28px;',
      '    border-radius: 14px;',
      '    background: rgba(99,102,241,0.12);',
      '    border: 1px solid rgba(99,102,241,0.2);',
      '    display: flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '    font-size: 10px;',
      '    font-weight: 700;',
      '    color: #6366f1;',
      '    cursor: pointer;',
      '    z-index: 900;',
      '    -webkit-tap-highlight-color: transparent;',
      '    padding: 0 8px;',
      '  }',
      '',
      // 设置面板移动端适配
      '  #settings-panel {',
      '    width: 100% !important;',
      '  }',
      '',
      // 网格自适应
      '  .market-stats { grid-template-columns: repeat(2, 1fr) !important; }',
      '  .stock-grid { grid-template-columns: 1fr !important; }',
      '  .sentiment-dashboard { grid-template-columns: repeat(2, 1fr) !important; }',
      '  .sentiment-grid { grid-template-columns: 1fr !important; }',
      '  .category-filters { gap: 6px !important; }',
      '  .cat-filter { padding: 5px 10px !important; font-size: 11px !important; }',
      '  .resonance-grid { grid-template-columns: 1fr !important; }',
      '  .anchor-gang-list { grid-template-columns: 1fr !important; }',
      '',
      '}',
      '',
      // 超小屏幕（<375px）进一步压缩
      '@media (max-width: 374px) {',
      '  .mobile-bottom-nav .nav-item { font-size: 9px !important; padding: 4px 1px !important; }',
      '  .app-title-text p { display: none; }',
      '  .timeline-status { font-size: 9px !important; padding: 3px 6px !important; }',
      '}',
      '',
      // 横屏适配
      '@media (max-width: 768px) and (orientation: landscape) {',
      '  .mobile-bottom-nav { height: 40px; }',
      '  .mobile-bottom-nav .nav-item { font-size: 10px; padding: 2px !important; }',
      '  .mobile-bottom-nav .nav-item.active::before { height: 2px; width: 20px; }',
      '}',
      '',
      // iOS特殊处理
      'body.ios-device { -webkit-overflow-scrolling: touch; }',
      'body.ios-device .mobile-bottom-nav { padding-bottom: env(safe-area-inset-bottom, 0px); }',
      '',
      // Android特殊处理
      'body.android-device .mobile-bottom-nav { box-shadow: 0 -1px 8px rgba(0,0,0,0.08); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ==================== 底部导航栏 ====================
  function createBottomNav() {
    if (bottomNavCreated) return;
    bottomNavCreated = true;

    var tabs = [
      { id: 'funnel',    label: '筛选' },
      { id: 'analysis',  label: '分析' },
      { id: 'sentiment', label: '情绪' },
      { id: 'rotation',  label: '轮动' },
      { id: 'dragon',    label: '狙击' },
      { id: 'daily',     label: '复盘' },
      { id: 'tactic',    label: '战法' }
    ];

    var nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.innerHTML = tabs.map(function(t) {
      return '<div class="nav-item" data-tab="' + t.id + '">' +
        '<span class="nav-label">' + t.label + '</span>' +
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
    // 滚动到顶部
    window.scrollTo(0, 0);
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
    indicator.textContent = '下拉刷新';
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
          indicator.textContent = '松开刷新';
        } else {
          indicator.textContent = '下拉刷新';
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
        indicator.textContent = '刷新中';
        indicator.style.transform = 'translateX(-50%) translateY(8px)';

        // 调用全局刷新函数
        if (typeof refreshAllData === 'function') {
          refreshAllData();
        } else {
          if (typeof refreshMarketData === 'function') refreshMarketData();
          if (typeof refreshDragonModule === 'function') refreshDragonModule();
          if (typeof refreshDailyReview === 'function') refreshDailyReview();
        }

        setTimeout(function() {
          indicator.classList.remove('refreshing', 'visible');
          indicator.style.transform = 'translateX(-50%) translateY(-60px)';
          indicator.textContent = '下拉刷新';
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
    var tabOrder = ['funnel', 'analysis', 'sentiment', 'rotation', 'dragon', 'daily', 'tactic'];

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
    btn.textContent = '设置';
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
      'position:fixed', 'bottom:72px', 'right:12px',
      'background:#6366f1', 'color:#fff', 'border:none',
      'padding:8px 16px', 'border-radius:20px', 'font-size:12px',
      'font-weight:600', 'cursor:pointer', 'z-index:900',
      'box-shadow:0 4px 16px rgba(99,102,241,0.4)'
    ].join(';');
    btn.textContent = '安装App';
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
    isMobile: function() { return isMobile; },
    getDeviceType: function() { return deviceType; }
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
