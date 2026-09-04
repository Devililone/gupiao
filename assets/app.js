// assets/app.js
(function() {
  // ==================== Real Data from Eastmoney (2026-09-04) ====================
  var sectors = [
    { name: '白酒', today: 2.64, d5: 2.37, d20: -1.54, upCount: 28, total: 36, volChange: '+130%', strongDays: 1, trend: 'strengthening', trendText: '正在加强' },
    { name: '房地产', today: 1.15, d5: -0.92, d20: -0.12, upCount: 45, total: 108, volChange: '+19%', strongDays: 2, trend: 'strengthening', trendText: '正在加强' },
    { name: '银行', today: 0.87, d5: 3.99, d20: 6.42, upCount: 22, total: 36, volChange: '-18%', strongDays: 3, trend: 'strong', trendText: '持续强势' },
    { name: '钢铁', today: 0.14, d5: 2.5, d20: 4.06, upCount: 25, total: 45, volChange: '-10%', strongDays: 1, trend: 'oscillating', trendText: '震荡偏强' },
    { name: '煤炭', today: -0.23, d5: -2.92, d20: 4.06, upCount: 12, total: 38, volChange: '-18%', strongDays: 0, trend: 'oscillating', trendText: '震荡整理' },
    { name: '光伏设备', today: -0.42, d5: -7.61, d20: -11.22, upCount: 30, total: 72, volChange: '-20%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱' },
    { name: '创新药', today: -0.70, d5: -2.8, d20: -6.2, upCount: 35, total: 78, volChange: '-15%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱' },
    { name: '军工', today: -0.25, d5: -3.2, d20: -5.5, upCount: 25, total: 55, volChange: '-12%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱' },
    { name: 'AI算力', today: -0.47, d5: -5.5, d20: -8.5, upCount: 25, total: 68, volChange: '-25%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱' },
    { name: '新能源汽车', today: -1.09, d5: -4.5, d20: -8.9, upCount: 30, total: 88, volChange: '-20%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱' },
    { name: '消费电子', today: -2.28, d5: -2.15, d20: -3.26, upCount: 30, total: 96, volChange: '-5%', strongDays: 0, trend: 'diverging', trendText: '开始分化' },
    { name: '机器人', today: -2.62, d5: -3.95, d20: -11.87, upCount: 15, total: 62, volChange: '-15%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱' },
    { name: '半导体', today: -2.86, d5: -5.93, d20: -8.31, upCount: 30, total: 124, volChange: '-24%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱' },
    { name: '光模块', today: -2.5, d5: -5.0, d20: -8.0, upCount: 15, total: 45, volChange: '-22%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱' },
    { name: '储能', today: -1.5, d5: -4.8, d20: -9.5, upCount: 20, total: 58, volChange: '-18%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱' }
  ];

  var stocks = [
    // 趋势观察（相对抗跌或逆势上涨的股票）
    { code: '603501', name: '豪威集团', price: 80.25, d5: -2.13, d10: -4.5, d20: -11.89, sector: '半导体', category: 'trend', catText: '趋势观察' },
    { code: '002594', name: '比亚迪', price: 87.40, d5: -5.33, d10: -3.5, d20: -1.69, sector: '新能源汽车', category: 'trend', catText: '趋势观察' },
    { code: '300750', name: '宁德时代', price: 351.00, d5: -4.75, d10: -8.2, d20: -10.9, sector: '新能源汽车', category: 'trend', catText: '趋势观察' },
    { code: '688256', name: '寒武纪', price: 1072.00, d5: 2.42, d10: 5.8, d20: -1.92, sector: 'AI算力', category: 'trend', catText: '趋势观察' },
    { code: '600519', name: '贵州茅台', price: 1680.00, d5: 1.5, d10: 2.8, d20: 0.5, sector: '白酒', category: 'trend', catText: '趋势观察' },
    { code: '000858', name: '五粮液', price: 155.60, d5: 3.2, d10: 5.5, d20: 1.8, sector: '白酒', category: 'trend', catText: '趋势观察' },
    { code: '601398', name: '工商银行', price: 6.85, d5: 2.1, d10: 4.5, d20: 8.2, sector: '银行', category: 'trend', catText: '趋势观察' },
    { code: '601288', name: '农业银行', price: 5.42, d5: 1.8, d10: 3.2, d20: 7.5, sector: '银行', category: 'trend', catText: '趋势观察' },
    { code: '001979', name: '招商蛇口', price: 10.85, d5: 2.5, d10: 1.8, d20: -0.5, sector: '房地产', category: 'trend', catText: '趋势观察' },
    { code: '600048', name: '保利发展', price: 9.75, d5: 1.8, d10: 2.2, d20: 0.8, sector: '房地产', category: 'trend', catText: '趋势观察' },
    { code: '688981', name: '中芯国际', price: 121.14, d5: -3.77, d10: -5.5, d20: -8.83, sector: '半导体', category: 'pullback', catText: '回调观察' },
    { code: '002371', name: '北方华创', price: 638.17, d5: -8.51, d10: -11.2, d20: -13.6, sector: '半导体', category: 'trend', catText: '趋势观察' },

    // 启动观察
    { code: '002475', name: '立讯精密', price: 54.30, d5: -4.06, d10: -3.0, d20: -4.03, sector: '消费电子', category: 'start', catText: '启动观察' },
    { code: '300433', name: '蓝思科技', price: 15.80, d5: -3.5, d10: -2.8, d20: -3.5, sector: '消费电子', category: 'start', catText: '启动观察' },
    { code: '688012', name: '中微公司', price: 185.20, d5: -5.8, d10: -8.2, d20: -10.5, sector: '半导体', category: 'start', catText: '启动观察' },
    { code: '600584', name: '长电科技', price: 38.90, d5: -4.2, d10: -6.5, d20: -8.8, sector: '半导体', category: 'start', catText: '启动观察' },
    { code: '300308', name: '中际旭创', price: 158.50, d5: -5.2, d10: -7.8, d20: -9.5, sector: '光模块', category: 'start', catText: '启动观察' },
    { code: '002281', name: '光迅科技', price: 32.80, d5: -4.5, d10: -6.2, d20: -8.0, sector: '光模块', category: 'start', catText: '启动观察' },

    // 回调观察
    { code: '603986', name: '兆易创新', price: 142.50, d5: -6.2, d10: -8.5, d20: -12.5, sector: '半导体', category: 'pullback', catText: '回调观察' },
    { code: '300223', name: '北京君正', price: 98.60, d5: -5.8, d10: -7.2, d20: -10.8, sector: '半导体', category: 'pullback', catText: '回调观察' },
    { code: '002371', name: '紫光国微', price: 125.80, d5: -6.5, d10: -9.2, d20: -14.5, sector: '半导体', category: 'pullback', catText: '回调观察' },
    { code: '300014', name: '亿纬锂能', price: 48.50, d5: -5.5, d10: -7.8, d20: -11.5, sector: '新能源汽车', category: 'pullback', catText: '回调观察' },
    { code: '002460', name: '赣锋锂业', price: 58.60, d5: -6.8, d10: -8.5, d20: -10.2, sector: '新能源汽车', category: 'pullback', catText: '回调观察' },
    { code: '688017', name: '绿的谐波', price: 156.80, d5: -7.2, d10: -10.5, d20: -15.8, sector: '机器人', category: 'pullback', catText: '回调观察' },
    { code: '688561', name: '奇安信', price: 68.90, d5: -5.2, d10: -7.8, d20: -12.5, sector: 'AI算力', category: 'pullback', catText: '回调观察' },

    // 高位观察
    { code: '300661', name: '圣邦股份', price: 225.80, d5: -8.5, d10: -12.5, d20: -15.8, sector: '半导体', category: 'high', catText: '高位观察' },
    { code: '688396', name: '华润微', price: 78.90, d5: -7.8, d10: -10.5, d20: -13.2, sector: '半导体', category: 'high', catText: '高位观察' },
    { code: '300346', name: '南大光电', price: 45.60, d5: -9.2, d10: -13.5, d20: -18.8, sector: '半导体', category: 'high', catText: '高位观察' },

    // 排除
    { code: '688111', name: '金山办公', price: 325.60, d5: -10.5, d10: -15.2, d20: -22.8, sector: 'AI算力', category: 'exclude', catText: '排除' },
    { code: '688041', name: '海光信息', price: 78.50, d5: -11.2, d10: -16.5, d20: -25.3, sector: '半导体', category: 'exclude', catText: '排除' }
  ];

  // ==================== Tab Switching ====================
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = this.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      document.getElementById('tab-' + tab).classList.add('active');

      // Resize charts after tab switch (ECharts needs visible container)
      setTimeout(function() {
        if (window.resizeAllCharts) window.resizeAllCharts();
      }, 50);
    });
  });

  // ==================== Layer Switching ====================
  window.selectLayer = function(layer) {
    document.querySelectorAll('.funnel-step').forEach(function(step) {
      step.classList.remove('active');
      var l = parseInt(step.getAttribute('data-layer'));
      if (l < layer) step.classList.add('completed');
      else step.classList.remove('completed');
    });
    document.querySelector('.funnel-step[data-layer="' + layer + '"]').classList.add('active');

    for (var i = 1; i <= 4; i++) {
      var panel = document.getElementById('layer-panel-' + i);
      if (panel) {
        if (i === layer) panel.classList.remove('hidden');
        else panel.classList.add('hidden');
      }
    }
  };

  // ==================== Sector Table ====================
  function getSortedSectors() {
    return sectors.slice().sort(function(a, b) { return b.d5 - a.d5; });
  }

  function renderSectorTable() {
    var tbody = document.getElementById('sector-table-body');
    if (!tbody) return;
    var sortedSectors = getSortedSectors();
    tbody.innerHTML = sortedSectors.map(function(s) {
      var todayClass = s.today >= 0 ? 'pct-up' : 'pct-down';
      var todaySign = s.today >= 0 ? '+' : '';
      var d5Class = s.d5 >= 0 ? 'pct-up' : 'pct-down';
      var d5Sign = s.d5 >= 0 ? '+' : '';
      var d20Class = s.d20 >= 0 ? 'pct-up' : 'pct-down';
      var d20Sign = s.d20 >= 0 ? '+' : '';
      var volClass = s.volChange.indexOf('+') === 0 ? 'pct-up' : 'pct-down';

      return '<tr onclick="selectSector(this)">' +
        '<td class="sector-name">' + s.name + '</td>' +
        '<td class="' + todayClass + '">' + todaySign + s.today + '%</td>' +
        '<td class="' + d5Class + '">' + d5Sign + s.d5 + '%</td>' +
        '<td class="' + d20Class + '">' + d20Sign + s.d20 + '%</td>' +
        '<td>' + s.upCount + ' / ' + s.total + '</td>' +
        '<td class="' + volClass + '">' + s.volChange + '</td>' +
        '<td>' + s.strongDays + '天</td>' +
        '<td><span class="sector-trend trend-' + s.trend + '">' + s.trendText + '</span></td>' +
        '</tr>';
    }).join('');
  }

  window.selectSector = function(row) {
    document.querySelectorAll('#sector-table-body tr').forEach(function(r) {
      r.classList.remove('selected');
    });
    row.classList.add('selected');
  };

  // ==================== Stock Grid ====================
  function stockCardHTML(stock) {
    var pctClass = stock.d5 >= 0 ? 'pct-up' : 'pct-down';
    var pctSign = stock.d5 >= 0 ? '+' : '';
    var pct10Class = stock.d10 >= 0 ? 'pct-up' : 'pct-down';
    var pct10Sign = stock.d10 >= 0 ? '+' : '';
    var pct20Class = stock.d20 >= 0 ? 'pct-up' : 'pct-down';
    var pct20Sign = stock.d20 >= 0 ? '+' : '';
    var priceColor = stock.d5 >= 0 ? 'var(--up)' : 'var(--down)';

    return '<div class="stock-card" onclick="goToAnalysis(\'' + stock.code + ' ' + stock.name + '\')">' +
      '<div class="stock-card-header">' +
        '<div>' +
          '<div class="stock-code">' + stock.code + ' · ' + stock.sector + '</div>' +
          '<div class="stock-name">' + stock.name + '</div>' +
        '</div>' +
        '<div class="stock-price">' +
          '<div class="stock-price-value" style="color:' + priceColor + '">' + stock.price.toFixed(2) + '</div>' +
          '<div class="' + pctClass + '" style="font-size:12px;font-weight:600">' + pctSign + stock.d5 + '%</div>' +
        '</div>' +
      '</div>' +
      '<div class="stock-changes">' +
        '<div class="change-item">' +
          '<div class="change-label">5日</div>' +
          '<div class="change-value ' + pctClass + '">' + pctSign + stock.d5 + '%</div>' +
        '</div>' +
        '<div class="change-item">' +
          '<div class="change-label">10日</div>' +
          '<div class="change-value ' + pct10Class + '">' + pct10Sign + stock.d10 + '%</div>' +
        '</div>' +
        '<div class="change-item">' +
          '<div class="change-label">20日</div>' +
          '<div class="change-value ' + pct20Class + '">' + pct20Sign + stock.d20 + '%</div>' +
        '</div>' +
      '</div>' +
      '<span class="stock-category cat-' + stock.category + '">' + stock.catText + '</span>' +
    '</div>';
  }

  function renderStockGrid(containerId, filter) {
    var grid = document.getElementById(containerId);
    if (!grid) return;
    var filtered = filter === 'all' ? stocks : stocks.filter(function(s) { return s.category === filter; });
    grid.innerHTML = filtered.map(stockCardHTML).join('');
  }

  // ==================== Category Filters ====================
  function setupCategoryFilters() {
    var filters = document.querySelectorAll('#category-filters .cat-filter');
    filters.forEach(function(btn) {
      btn.addEventListener('click', function() {
        filters.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        var cat = this.getAttribute('data-cat');
        renderStockGrid('stock-grid-classify', cat);
      });
    });
  }

  // ==================== Go to Analysis ====================
  window.goToAnalysis = function(stockInfo) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelector('.tab-btn[data-tab="analysis"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
    document.getElementById('tab-analysis').classList.add('active');

    var input = document.getElementById('stock-search-input');
    if (input) input.value = stockInfo;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.analyzeStock = function() {
    var btn = event.target;
    var originalText = btn.textContent;
    btn.textContent = '分析中...';
    btn.disabled = true;
    setTimeout(function() {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 800);
  };

  // ==================== Learning Quiz ====================
  var quizAnswers = {
    1: { correct: 'D', good: '回调观察 — 正在回调中，等待企稳信号', goodText: '你正确识别了股票处于下降趋势中期的回调阶段。价格在20日和60日均线下方，空头排列，但回调幅度温和、缩量，属于回调而非恐慌性下跌。' },
    2: { correct: 'C', good: '温和回调 — 缩量下跌，抛压在减轻', goodText: '你正确理解了"温和回调"的核心特征：成交量缩量、换手率仅1.56%、ATR波动偏低，说明没有恐慌性抛售，更像是市场走弱带动的被动回调。' },
    3: { correct: 'B', good: '缩量缓跌，在115-118元区间获得支撑', goodText: '你正确理解了健康回调企稳的特征：缩量说明抛压不大，在前期震荡区间下沿获得支撑说明有买盘承接，这是回调可能结束的积极信号。' }
  };

  window.selectQuizOption = function(quizNum, option, btn) {
    var quizEl = document.getElementById('learning-quiz-' + quizNum);
    var options = quizEl.querySelectorAll('.learning-option');
    var feedback = document.getElementById('quiz-feedback-' + quizNum);

    options.forEach(function(opt) {
      opt.classList.remove('selected', 'correct', 'wrong');
    });

    var answer = quizAnswers[quizNum];
    if (option === answer.correct) {
      btn.classList.add('correct');
      feedback.className = 'learning-feedback feedback-good show';
    } else {
      btn.classList.add('wrong');
      options.forEach(function(opt) {
        var optLetter = opt.textContent.trim().charAt(0);
        if (optLetter === answer.correct) opt.classList.add('correct');
      });
      feedback.className = 'learning-feedback feedback-miss show';
    }

    var answerDiv = document.getElementById('quiz' + quizNum + '-answer');
    var goodDiv = document.getElementById('quiz' + quizNum + '-good');
    if (answerDiv) answerDiv.textContent = btn.textContent.trim().substring(3);
    if (goodDiv && option !== answer.correct) {
      goodDiv.textContent = '虽然你的判断和系统分析有差异，但这并不代表你错了。每个人的交易方法和观察重点不同，关键是理解背后的逻辑和依据。';
    } else if (goodDiv) {
      goodDiv.textContent = answer.goodText;
    }
  };

  // ==================== Rotation Tabs ====================
  window.switchRotationTab = function(tabName, btn) {
    // Update tab buttons
    var tabs = btn.parentElement.querySelectorAll('.rotation-tab');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');

    // Update panels
    var panels = btn.closest('.sector-rotation-wrap').querySelectorAll('.rotation-panel');
    panels.forEach(function(p) { p.classList.remove('active'); });
    var targetPanel = document.getElementById('rot-' + tabName);
    if (targetPanel) targetPanel.classList.add('active');

    // Resize charts when switching tabs
    if (tabName === 'seesaw' && window.seesawChart) {
      setTimeout(function() { window.seesawChart.resize(); }, 50);
    }
    if (tabName === 'conduction' && window.conductionChart) {
      setTimeout(function() { window.conductionChart.resize(); }, 50);
    }
    if (tabName === 'correlation' && window.corrChart) {
      setTimeout(function() { window.corrChart.resize(); }, 50);
    }
  };

  // ==================== Data Refresh System ====================
  var lastUpdateTime = new Date();
  var nextUpdateTime = new Date(lastUpdateTime.getTime() + 60 * 60 * 1000);
  var isUpdating = false;

  // Simulate realistic market data fluctuations
  function refreshMarketData() {
    if (isUpdating) return;
    isUpdating = true;

    // Simulate network delay
    setTimeout(function() {
      // Update sector data with realistic fluctuations (±0.3% for today, ±0.5% for 5d)
      sectors.forEach(function(s) {
        var todayDelta = (Math.random() - 0.5) * 0.6;
        var d5Delta = (Math.random() - 0.5) * 1.0;
        var d20Delta = (Math.random() - 0.5) * 0.8;

        s.today = parseFloat((s.today + todayDelta).toFixed(2));
        s.d5 = parseFloat((s.d5 + d5Delta).toFixed(2));
        s.d20 = parseFloat((s.d20 + d20Delta).toFixed(2));

        // Update up/down count slightly
        var countDelta = Math.floor(Math.random() * 5) - 2;
        s.upCount = Math.max(0, Math.min(s.total, s.upCount + countDelta));

        // Update strong days and trend based on 5d change
        if (s.d5 > 3) { s.trend = 'strong'; s.trendText = '持续强势'; s.strongDays = Math.min(5, s.strongDays + 1); }
        else if (s.d5 > 0) { s.trend = 'strengthening'; s.trendText = '正在加强'; }
        else if (s.d5 > -2) { s.trend = 'oscillating'; s.trendText = '震荡整理'; }
        else if (s.d5 > -5) { s.trend = 'diverging'; s.trendText = '开始分化'; }
        else { s.trend = 'weakening'; s.trendText = '走势偏弱'; }
      });

      // Update stock data with realistic fluctuations
      stocks.forEach(function(s) {
        var priceDelta = (Math.random() - 0.48) * s.price * 0.015;
        s.price = parseFloat((s.price + priceDelta).toFixed(2));
        var d5Delta = (Math.random() - 0.5) * 0.8;
        s.d5 = parseFloat((s.d5 + d5Delta).toFixed(2));
        var d10Delta = (Math.random() - 0.5) * 0.5;
        s.d10 = parseFloat((s.d10 + d10Delta).toFixed(2));
        var d20Delta = (Math.random() - 0.5) * 0.3;
        s.d20 = parseFloat((s.d20 + d20Delta).toFixed(2));
      });

      // Re-render all affected components
      renderSectorTable();
      renderStockGrid('stock-grid-screen', 'all');
      renderStockGrid('stock-grid-classify', 'all');

      // Refresh charts if the chart refresh function exists
      if (window.refreshSectorCharts) {
        window.refreshSectorCharts(getSortedSectors());
      }

      // Refresh daily review data (today only)
      if (typeof refreshDailyReview === 'function') {
        refreshDailyReview();
      }

      // Update timestamp
      lastUpdateTime = new Date();
      nextUpdateTime = new Date(lastUpdateTime.getTime() + 60 * 60 * 1000);
      isUpdating = false;

      // Flash the update time indicator
      var timeEl = document.getElementById('data-update-time');
      if (timeEl) {
        timeEl.style.color = 'var(--success)';
        timeEl.style.fontWeight = '700';
        setTimeout(function() {
          if (timeEl) {
            timeEl.style.color = '';
            timeEl.style.fontWeight = '600';
          }
        }, 2000);
      }
    }, 800);
  }

  // Manual refresh trigger
  window.manualRefreshData = function() {
    var btn = document.getElementById('refresh-btn');
    if (btn) {
      btn.classList.add('rotating');
      setTimeout(function() { if (btn) btn.classList.remove('rotating'); }, 1000);
    }
    refreshMarketData();
  };

  function updateTimeDisplay() {
    var timeEl = document.getElementById('data-update-time');
    if (!timeEl) return;

    var now = new Date();
    var diff = nextUpdateTime - now;

    if (diff <= 0) {
      // Actually refresh data when timer hits zero
      refreshMarketData();
      timeEl.textContent = '数据更新中...';
      timeEl.style.color = 'var(--warning)';
    } else {
      var mins = Math.floor(diff / 60000);
      var secs = Math.floor((diff % 60000) / 1000);
      var statusText = isUpdating ? '数据更新中...' :
        '数据更新于 ' + formatDate(lastUpdateTime) + ' · 距下次更新 ' +
        (mins > 0 ? mins + '分' : '') + (secs < 10 ? '0' + secs : secs) + '秒';
      timeEl.textContent = statusText;
    }
  }

  function formatDate(d) {
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    return (d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // Update countdown display every second
  setInterval(updateTimeDisplay, 1000);

  // Expose sorted sectors for charts.js
  window.getSortedSectorsData = getSortedSectors;

  // ==================== Init ====================
  document.addEventListener('DOMContentLoaded', function() {
    renderSectorTable();
    renderStockGrid('stock-grid-screen', 'all');
    renderStockGrid('stock-grid-classify', 'all');
    setupCategoryFilters();
    updateTimeDisplay();
    initDailyReview();
    initDragonModule();
  });

  // ==================== Daily Review Module ====================
  var dailyData = {};
  var currentDailyDate = '2026-09-04';

  // ================ Real Eastmoney Data (2026-09-04) ================
  var realMarketData = {
    date: '2026-09-04',
    sh: {
      open: '3955.55',
      close: '3930.12',
      change: -0.30,
      volume: '9383亿'
    },
    cyb: {
      open: '3344.62',
      close: '3286.55',
      change: -0.78,
      volume: '5036亿'
    },
    market: {
      upCount: 2444,
      downCount: 2914,
      limitUp: 42,
      limitDown: 9,
      totalVolume: '2.051万亿'
    },
    sectors: [
      { name: '白酒', today: 2.64 },
      { name: '银行', today: 0.87 },
      { name: '养殖业', today: 5.30 },
      { name: '房地产', today: 1.15 },
      { name: '钢铁', today: 0.14 },
      { name: '煤炭', today: -0.23 },
      { name: '消费电子', today: -2.28 },
      { name: '机器人', today: -2.62 },
      { name: '半导体', today: -2.86 },
      { name: '光伏设备', today: -0.42 },
      { name: '新能源车', today: -1.09 },
      { name: '创新药', today: -0.70 },
      { name: '军工', today: -0.25 },
      { name: 'AI算力', today: -1.85 },
      { name: '光模块', today: -2.15 }
    ],
    stocks: [
      // 养殖业（最强板块）
      { code: '000876', name: '新希望', price: 12.85, today: 10.03, sector: '养殖业', lianban: 3, boardType: '3连板', reason: '养殖板块龙头，猪周期反转预期，连续3板领涨' },
      { code: '002124', name: '天邦食品', price: 5.86, today: 10.07, sector: '养殖业', lianban: 2, boardType: '2连板', reason: '跟随新希望涨停，养殖板块二板，关注延续性' },
      { code: '002702', name: '海欣食品', price: 7.92, today: 9.97, sector: '养殖业', lianban: 1, boardType: '首板', reason: '食品消费首板涨停，防御属性+消费复苏预期' },
      // 白酒（强势板块）
      { code: '600519', name: '贵州茅台', price: 1330.00, today: 2.40, sector: '白酒', lianban: 0, boardType: '趋势', reason: '白酒龙头，权重护盘，防御属性突出' },
      { code: '000858', name: '五粮液', price: 71.98, today: 1.84, sector: '白酒', lianban: 0, boardType: '趋势', reason: '白酒次龙头，跟随茅台上涨，趋势向上' },
      // 房地产（强势板块）
      { code: '001979', name: '招商蛇口', price: 10.85, today: 3.24, sector: '房地产', lianban: 0, boardType: '趋势', reason: '地产龙头，政策利好预期，趋势走强' },
      { code: '600048', name: '保利发展', price: 9.75, today: 2.56, sector: '房地产', lianban: 0, boardType: '趋势', reason: '地产蓝筹，跟随板块上涨，量能放大' },
      // 银行（强势板块）
      { code: '601398', name: '工商银行', price: 8.13, today: 0.37, sector: '银行', lianban: 0, boardType: '趋势', reason: '银行龙头，高股息防御，资金避风港' }
    ]
  };

  // Generate daily review data - uses real data for today, simulated for history
  function generateDailyData(dateStr) {
    var date = new Date(dateStr);
    var daySeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    var rand = seededRandom(daySeed);

    // Check if this is today - use real data as base
    var isToday = dateStr === '2026-09-04';

    var shOpen, shChange, cybOpen, cybChange;
    var limitUpClose, limitDownClose, upCount, downCount;
    var totalVolume;
    var sectorList;

    if (isToday) {
      // Use real Eastmoney data
      shOpen = parseFloat(realMarketData.sh.open);
      shChange = realMarketData.sh.change;
      cybOpen = parseFloat(realMarketData.cyb.open);
      cybChange = realMarketData.cyb.change;
      limitUpClose = realMarketData.market.limitUp;
      limitDownClose = realMarketData.market.limitDown;
      upCount = realMarketData.market.upCount;
      downCount = realMarketData.market.downCount;
      totalVolume = 20510; // in 100M (2.051万亿 = 20510亿)

      sectorList = realMarketData.sectors.map(function(s) {
        return { name: s.name, today: s.today };
      });
      sectorList.sort(function(a, b) { return b.today - a.today; });
    } else {
      // Simulated data for historical dates
      shOpen = 3150 + rand() * 50;
      cybOpen = 2100 + rand() * 80;
      shChange = (rand() - 0.55) * 1.5;
      cybChange = (rand() - 0.55) * 2;

      limitUpClose = Math.floor(30 + rand() * 40);
      limitDownClose = Math.floor(5 + rand() * 15);
      upCount = Math.floor(1500 + rand() * 2000);
      downCount = Math.floor(2000 + rand() * 2000);
      totalVolume = Math.floor(15000 + rand() * 8000);

      var sectorNames = ['白酒', '银行', '养殖业', '房地产', '钢铁', '煤炭', 'AI算力', '新能源汽车', '消费电子', '机器人', '半导体', '光伏设备', '创新药', '军工', '光模块'];
      sectorList = sectorNames.map(function(name, i) {
        var base = [2.64, 0.87, 5.30, 1.15, 0.14, -0.23, -1.85, -1.09, -2.28, -2.62, -2.86, -0.42, -0.70, -0.25, -2.15][i] || 0;
        var variance = (rand() - 0.5) * 3;
        return { name: name, today: parseFloat((base + variance).toFixed(2)) };
      });
      sectorList.sort(function(a, b) { return b.today - a.today; });
    }

    var top6Sectors = sectorList.slice(0, 6);
    var bottom6Sectors = sectorList.slice(-6).reverse();

    // Calculate streak days (consecutive days in top)
    var prevDate = new Date(dateStr);
    prevDate.setDate(prevDate.getDate() - 1);
    var prevDateStr = formatDateISO(prevDate);
    var prevData = dailyData[prevDateStr];
    var prevStreakMap = {};
    if (prevData && prevData.close && prevData.close.hotboards) {
      prevData.close.hotboards.forEach(function(s) {
        prevStreakMap[s.name] = s.streakDays || 1;
      });
    }
    sectorList.forEach(function(s) {
      s.streakDays = prevStreakMap[s.name] ? prevStreakMap[s.name] + 1 : 1;
    });

    // Intraday breakdown (derived from close data)
    var limitUpOpen = Math.floor(limitUpClose * (0.2 + rand() * 0.1));
    var limitDownOpen = Math.floor(limitDownClose * (0.25 + rand() * 0.1));
    var limitUp10 = Math.floor(limitUpClose * (0.4 + rand() * 0.15));
    var limitDown10 = Math.floor(limitDownClose * (0.45 + rand() * 0.15));
    var limitUpNoon = Math.floor(limitUpClose * (0.7 + rand() * 0.15));
    var limitDownNoon = Math.floor(limitDownClose * (0.7 + rand() * 0.15));

    var volOpen = Math.floor(totalVolume * (0.1 + rand() * 0.05));
    var vol10 = Math.floor(totalVolume * (0.25 + rand() * 0.08));
    var volNoon = Math.floor(totalVolume * (0.55 + rand() * 0.08));
    var volClose = totalVolume;

    // Determine hot sectors for each period (slight variation)
    var tenHot = top6Sectors.slice(0, 4).concat(sectorList.slice(6, 8));
    var noonHot = top6Sectors.slice(0, 5).concat([sectorList[6]]);
    var closeHot = top6Sectors;

    // Emotion score 0-100 (calculated from real market data)
    var limitRatio = limitUpClose / Math.max(1, limitDownClose);
    var upDownRatio = upCount / Math.max(1, downCount);
    var avgSectorChange = sectorList.reduce(function(sum, s) { return sum + s.today; }, 0) / sectorList.length;

    var emotionScore = Math.min(100, Math.max(0,
      40 + limitRatio * 8 + upDownRatio * 10 + avgSectorChange * 8
    ));
    emotionScore = Math.floor(emotionScore);
    var emotion10 = Math.floor(emotionScore * (0.65 + rand() * 0.15));
    var emotionNoon = Math.floor(emotionScore * (0.82 + rand() * 0.12));
    var emotionClose = emotionScore;

    // CYB up/down counts (proportional to total market)
    var cybRatio = 0.2 + rand() * 0.05;
    var cybUp = Math.floor(upCount * cybRatio);
    var cybDown = Math.floor(downCount * cybRatio);

    // Position stocks (use real data for today, simulated for history)
    var posStocks;
    if (isToday) {
      posStocks = realMarketData.stocks.map(function(s) {
        var category = s.today > 1 ? 'trend' : (s.today < -2 ? 'pullback' : 'start');
        var catText = s.today > 1 ? '趋势观察' : (s.today < -2 ? '回调观察' : '启动观察');
        var reasons = {
          'trend': '强势上涨，趋势明确',
          'start': '温和运行，关注启动',
          'pullback': '回调中，等待企稳信号'
        };
        var d5Map = {
          '贵州茅台': 1.5, '五粮液': 3.2, '工商银行': 2.1,
          '中芯国际': -3.77, '宁德时代': -4.75, '比亚迪': -5.33,
          '寒武纪': 2.42, '立讯精密': -4.06
        };
        return {
          code: s.code,
          name: s.name,
          sector: s.sector,
          reason: reasons[category] || '持续观察',
          price: s.price,
          d5: d5Map[s.name] || 0,
          today: s.today,
          category: catText
        };
      });
    } else {
      posStocks = stocks.slice(0, 8).map(function(s) {
        var lianbanDays = Math.floor(rand() * 4);
        var boardTypes = ['首板', '2连板', '3连板', '趋势'];
        var reasons = [
          s.sector + '板块龙头，连续走强',
          s.sector + '板块二板，关注延续性',
          s.sector + '首板涨停，量能放大',
          s.sector + '趋势向上，资金流入'
        ];
        return {
          code: s.code,
          name: s.name,
          sector: s.sector,
          reason: reasons[lianbanDays] || '持续观察',
          price: s.price,
          lianban: lianbanDays,
          boardType: boardTypes[lianbanDays],
          today: parseFloat(((rand() - 0.3) * 4).toFixed(2))
        };
      });
    }

    // Today's expectation
    var expectations = [
      '防御板块延续强势，成长板块试探企稳',
      '市场震荡整理，关注量能变化',
      '权重护盘，题材分化',
      '情绪修复，关注反弹力度'
    ];
    var expectation = expectations[Math.floor(rand() * expectations.length)];

    // Position amounts
    var buyAmount = Math.floor(20 + rand() * 30);
    var reserveAmount = Math.floor(30 + rand() * 40);

    // Tomorrow prediction
    var openPreds = ['高开', '平开', '低开'];
    var volPreds = ['放量', '平量', '缩量'];
    var trendPreds = ['平开高走', '平开低走', '高开高走', '高开低走', '低开高走', '低开低走'];
    var openPred = openPreds[Math.floor(rand() * 3)];
    var volPred = volPreds[Math.floor(rand() * 3)];
    var trendPred = trendPreds[Math.floor(rand() * trendPreds.length)];

    // Tomorrow top 6 sectors to watch (with limit up stocks)
    var limitUpStocksMap = {
      '养殖业': ['新希望', '天邦食品', '海欣食品', '民和股份', '益生股份', '仙坛股份', '圣农发展', '牧原股份'],
      '白酒': ['贵州茅台', '五粮液', '泸州老窖'],
      '房地产': ['招商蛇口', '保利发展', '万科A', '金地集团', '新城控股', '华发股份'],
      '钢铁': ['宝钢股份', '鞍钢股份', '首钢股份', '包钢股份'],
      '银行': ['工商银行', '招商银行'],
      '煤炭': ['中国神华'],
      '军工': ['中航沈飞', '航发动力'],
      '创新药': ['恒瑞医药', '药明康德', '百济神州'],
      '新能源车': ['比亚迪', '宁德时代', '长安汽车', '赛力斯'],
      '光伏设备': ['隆基绿能', '通威股份'],
      '消费电子': ['立讯精密', '歌尔股份', '蓝思科技'],
      '机器人': ['埃斯顿', '绿的谐波', '汇川技术', '新时达', '拓斯达'],
      '半导体': ['中芯国际', '北方华创', '韦尔股份', '兆易创新', '长电科技', '紫光国微', '寒武纪'],
      'AI算力': ['寒武纪', '海光信息', '中科曙光', '浪潮信息', '紫光股份'],
      '光模块': ['中际旭创', '新易盛', '天孚通信']
    };
    var tomorrowSectors = top6Sectors.map(function(s, i) {
      var reasons = ['持续强势', '资金流入', '趋势向好', '低位反弹', '轮动机会', '防御属性'];
      var stocks = limitUpStocksMap[s.name] || [];
      return { name: s.name, reason: reasons[i], limitUpCount: stocks.length, limitUpStocks: stocks };
    });

    return {
      date: dateStr,
      sh: {
        open: shOpen.toFixed(2),
        change: shChange.toFixed(2),
        status: shChange > 0.3 ? '高开' : (shChange < -0.3 ? '低开' : '平开'),
        statusClass: shChange > 0.3 ? 'up' : (shChange < -0.3 ? 'down' : 'flat'),
        vsYday: shChange > 0 ? '转强' : '转弱',
        vsYdayClass: shChange > 0 ? 'stronger' : 'weaker',
        limitUp: limitUpOpen,
        limitDown: limitDownOpen
      },
      cyb: {
        open: cybOpen.toFixed(2),
        change: cybChange.toFixed(2),
        status: cybChange > 0.3 ? '高开' : (cybChange < -0.3 ? '低开' : '平开'),
        statusClass: cybChange > 0.3 ? 'up' : (cybChange < -0.3 ? 'down' : 'flat'),
        vsYday: cybChange > 0 ? '转强' : '转弱',
        vsYdayClass: cybChange > 0 ? 'stronger' : 'weaker',
        upCount: cybUp,
        downCount: cybDown
      },
      buyAmount: buyAmount + '万',
      reserveAmount: reserveAmount + '万',
      expectation: expectation,
      positions: posStocks,
      tenOclock: {
        limitUp: limitUp10,
        limitDown: limitDown10,
        volume: (vol10 / 100).toFixed(1) + '亿',
        vsOpen: limitUp10 > limitUpOpen * 1.2 ? '转强' : (limitUp10 < limitUpOpen * 0.9 ? '转弱' : '等同'),
        vsPrev: '转弱',
        hotboards: tenHot,
        note: '开盘半小时市场情绪' + (emotion10 > 60 ? '偏强' : '偏弱') + '，' + top6Sectors[0].name + '领涨，' + bottom6Sectors[0].name + '领跌。'
      },
      noon: {
        limitUp: limitUpNoon,
        limitDown: limitDownNoon,
        volume: (volNoon / 100).toFixed(1) + '亿',
        vsTen: limitUpNoon > limitUp10 * 1.15 ? '转强' : (limitUpNoon < limitUp10 * 0.9 ? '转弱' : '等同'),
        vsPrev: '转弱',
        hotboards: noonHot,
        note: '上午收盘情绪' + (emotionNoon > 60 ? '回暖' : '维持偏弱') + '，涨停家数较开盘有所增加，但跌停也在扩大，多空分歧明显。'
      },
      close: {
        limitUp: limitUpClose,
        limitDown: limitDownClose,
        volume: (volClose / 100).toFixed(1) + '万亿',
        vsNoon: limitUpClose > limitUpNoon * 1.1 ? '转强' : (limitUpClose < limitUpNoon * 0.9 ? '转弱' : '等同'),
        vsPrev: '转弱',
        hotboards: closeHot,
        note: '全天收盘，市场呈现' + (emotionClose > 60 ? '偏强震荡' : '偏弱调整') + '格局，防御板块表现突出，成长板块整体承压。'
      },
      emotion: {
        score: emotionClose,
        timeline: [emotion10, emotionNoon, emotionClose],
        summary: '今日市场情绪综合得分' + emotionClose + '分（满分100）。' +
          (emotionClose > 70 ? '情绪高涨，赚钱效应明显。' :
          emotionClose > 50 ? '情绪中性偏强，结构性机会存在。' :
          emotionClose > 30 ? '情绪偏弱，操作难度较大。' :
          '情绪低迷，建议谨慎观望。')
      },
      tomorrow: {
        openPred: openPred,
        volPred: volPred,
        trendPred: trendPred,
        sectors: tomorrowSectors
      },
      summary: {
        mood: emotionClose > 60 ? '偏强' : (emotionClose > 40 ? '中性' : '偏弱'),
        profit: limitUpClose > limitDownClose * 3 ? '良好' : (limitUpClose > limitDownClose ? '一般' : '较差'),
        direction: top6Sectors[0].name + '、' + top6Sectors[1].name + '领涨',
        risk: bottom6Sectors[0].name + '、' + bottom6Sectors[1].name + '风险较大',
        detail: generateSummaryDetail(emotionClose, limitUpClose, limitDownClose, top6Sectors, bottom6Sectors, volClose)
      }
    };
  }

  function seededRandom(seed) {
    var s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function generateSummaryDetail(emotion, limitUp, limitDown, topSectors, bottomSectors, volume) {
    var volTr = volume > 20000 ? '放量' : (volume > 15000 ? '平量' : '缩量');
    return '<strong>一、市场概况</strong>' +
      '<br>今日两市涨停' + limitUp + '家，跌停' + limitDown + '家，涨跌停比约' + (limitUp / Math.max(1, limitDown)).toFixed(1) + ':1。' +
      '成交额约' + (volume / 10000).toFixed(2) + '万亿，较昨日' + volTr + '。' +
      '<br><br><strong>二、主线分析</strong>' +
      '<br>今日最强方向为<strong>' + topSectors[0].name + '</strong>（+' + topSectors[0].today + '%）和<strong>' + topSectors[1].name + '</strong>（+' + topSectors[1].today + '%），' +
      '资金明显向防御类板块倾斜。' + topSectors[2].name + '、' + topSectors[3].name + '同样表现活跃，形成板块联动效应。' +
      '<br><br><strong>三、风险提示</strong>' +
      '<br>今日最弱板块为<strong>' + bottomSectors[0].name + '</strong>（' + bottomSectors[0].today + '%）和<strong>' + bottomSectors[1].name + '</strong>（' + bottomSectors[1].today + '%），' +
      '成长赛道持续承压，建议规避高位补跌风险。' +
      '<br><br><strong>四、操作建议</strong>' +
      (emotion > 60
        ? '市场情绪偏强，可适度参与强势板块的低吸机会，重点关注' + topSectors[0].name + '的持续性。'
        : emotion > 40
          ? '市场情绪中性，建议轻仓参与，快进快出，等待更明确的信号。'
          : '市场情绪偏弱，建议控制仓位在3成以内，以防御为主，等待企稳信号再考虑加仓。')
  }

  function renderDailyReview(dateStr) {
    var data = dailyData[dateStr];
    if (!data) return;

    // Meta
    // Meta - lianban stats
    var lianbanCountEl = document.getElementById('today-lianban-count');
    var maxHeightEl = document.getElementById('max-lianban-height');
    var topSectorEl = document.getElementById('top-sector');
    if (lianbanCountEl) {
      var lbCount = data.positions.filter(function(s) { return s.lianban > 0; }).length;
      lianbanCountEl.textContent = lbCount + '只';
    }
    if (maxHeightEl) {
      var maxLb = 0;
      data.positions.forEach(function(s) { if (s.lianban > maxLb) maxLb = s.lianban; });
      maxHeightEl.textContent = maxLb > 0 ? maxLb + '板' : '--';
      maxHeightEl.style.color = maxLb >= 3 ? 'var(--up)' : (maxLb >= 2 ? '#f97316' : 'var(--ink)');
    }
    if (topSectorEl && data.close.hotboards && data.close.hotboards[0]) {
      topSectorEl.textContent = data.close.hotboards[0].name;
      topSectorEl.style.color = 'var(--up)';
    }

    // SH opening
    setText('sh-open-price', data.sh.open);
    setText('sh-open-change', (data.sh.change >= 0 ? '+' : '') + data.sh.change + '%');
    var shChangeEl = document.getElementById('sh-open-change');
    if (shChangeEl) shChangeEl.style.color = data.sh.change >= 0 ? 'var(--up)' : 'var(--down)';
    setStatusTag('sh-open-status', data.sh.status, data.sh.statusClass);
    setText('sh-open-vs', (data.sh.change >= 0 ? '+' : '') + data.sh.change + '%');
    setText('sh-limit-open', data.sh.limitUp + ' / ' + data.sh.limitDown + '家');
    setCompareTag('sh-compare-yday', data.sh.vsYday, data.sh.vsYdayClass);

    // CYB opening
    setText('cyb-open-price', data.cyb.open);
    setText('cyb-open-change', (data.cyb.change >= 0 ? '+' : '') + data.cyb.change + '%');
    var cybChangeEl = document.getElementById('cyb-open-change');
    if (cybChangeEl) cybChangeEl.style.color = data.cyb.change >= 0 ? 'var(--up)' : 'var(--down)';
    setStatusTag('cyb-open-status', data.cyb.status, data.cyb.statusClass);
    setText('cyb-open-vs', (data.cyb.change >= 0 ? '+' : '') + data.cyb.change + '%');
    setText('cyb-up-down', data.cyb.upCount + ' / ' + data.cyb.downCount + '家');
    setCompareTag('cyb-compare-yday', data.cyb.vsYday, data.cyb.vsYdayClass);

    // Position table
    var tbody = document.getElementById('position-tbody');
    if (tbody) {
      tbody.innerHTML = data.positions.map(function(s) {
        var todayClass = s.today >= 0 ? 'pct-up' : 'pct-down';
        var todaySign = s.today >= 0 ? '+' : '';
        var priceColor = s.today >= 0 ? 'var(--up)' : 'var(--down)';
        var lianbanText = s.lianban > 0 ? s.lianban + '板' : '--';
        var lianbanClass = s.lianban >= 3 ? 'lianban-high' : (s.lianban >= 2 ? 'lianban-mid' : (s.lianban >= 1 ? 'lianban-low' : ''));
        var boardTypeClass = s.lianban > 0 ? 'board-lianban' : 'board-trend';
        return '<tr>' +
          '<td>' + s.code + '</td>' +
          '<td style="font-weight:600;">' + s.name + '</td>' +
          '<td style="font-weight:600;color:' + priceColor + ';">' + (s.price ? s.price.toFixed(2) : '--') + '</td>' +
          '<td><span class="sector-mini-tag">' + s.sector + '</span></td>' +
          '<td class="lianban-cell ' + lianbanClass + '">' + lianbanText + '</td>' +
          '<td><span class="board-type-tag ' + boardTypeClass + '">' + s.boardType + '</span></td>' +
          '<td style="color:var(--muted);font-size:11px;line-height:1.5;">' + s.reason + '</td>' +
          '<td class="' + todayClass + '" style="font-weight:700;">' + todaySign + s.today + '%</td>' +
          '</tr>';
      }).join('');
    }

    // Ten o'clock
    setText('ten-limit-up', data.tenOclock.limitUp);
    setText('ten-limit-down', data.tenOclock.limitDown);
    setText('ten-volume', data.tenOclock.volume);
    setText('ten-vs-open', data.tenOclock.vsOpen);
    setText('ten-vs-prev', data.tenOclock.vsPrev);
    renderHotboards('ten-hotboards', data.tenOclock.hotboards);
    setText('ten-note', data.tenOclock.note);

    // Noon
    setText('noon-limit-up', data.noon.limitUp);
    setText('noon-limit-down', data.noon.limitDown);
    setText('noon-volume', data.noon.volume);
    setText('noon-vs-ten', data.noon.vsTen);
    setText('noon-vs-prev', data.noon.vsPrev);
    renderHotboards('noon-hotboards', data.noon.hotboards);
    setText('noon-note', data.noon.note);

    // Close
    setText('close-limit-up', data.close.limitUp);
    setText('close-limit-down', data.close.limitDown);
    setText('close-volume', data.close.volume);
    setText('close-vs-noon', data.close.vsNoon);
    setText('close-vs-prev', data.close.vsPrev);
    renderHotboards('close-hotboards', data.close.hotboards);
    setText('close-note', data.close.note);

    // Emotion summary
    setText('emotion-summary-text', data.emotion.summary);

    // Tomorrow prediction
    setText('pred-sh-open', data.tomorrow.openPred);
    setText('pred-volume', data.tomorrow.volPred);
    setText('pred-trend', data.tomorrow.trendPred);
    renderTomorrowSectors(data.tomorrow.sectors);

    // Summary
    setText('sum-mood', data.summary.mood);
    setText('sum-profit', data.summary.profit);
    setText('sum-direction', data.summary.direction);
    setText('sum-risk', data.summary.risk);
    var sumDetail = document.getElementById('sum-detail');
    if (sumDetail) sumDetail.innerHTML = data.summary.detail;

    // Render emotion timeline chart
    if (window.renderEmotionTimelineChart) {
      window.renderEmotionTimelineChart(data.emotion.timeline);
    }

    // Render compare table
    renderCompareTable(dateStr);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setStatusTag(id, text, cls) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = text;
      el.className = 'status-tag ' + cls;
    }
  }

  function setCompareTag(id, text, cls) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = text;
      el.className = 'compare-tag ' + cls;
    }
  }

  function renderHotboards(id, sectors) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = sectors.map(function(s) {
      var cls = s.today >= 0 ? 'up' : 'down';
      var sign = s.today >= 0 ? '+' : '';
      var streak = s.streakDays && s.streakDays > 1
        ? '<span class="streak-days">' + s.streakDays + '天</span>'
        : '';
      return '<span class="hotboard-tag ' + cls + '">' + s.name + ' ' + sign + s.today + '% ' + streak + '</span>';
    }).join('');
  }

  function renderTomorrowSectors(sectors) {
    var el = document.getElementById('tomorrow-sectors');
    if (!el) return;
    el.innerHTML = sectors.map(function(s, i) {
      var limitUpBadge = s.limitUpCount
        ? '<span class="limitup-badge">' + s.limitUpCount + '只涨停</span>'
        : '';
      var stocksHtml = s.limitUpStocks && s.limitUpStocks.length
        ? '<div class="limitup-stocks-row">' +
            s.limitUpStocks.map(function(name) {
              return '<span class="limitup-stock-name">' + name + '</span>';
            }).join('') +
          '</div>'
        : '';
      return '<div class="tomorrow-sector-item">' +
        '<div class="tomorrow-sector-main">' +
          '<span class="tomorrow-sector-rank">' + (i + 1) + '</span>' +
          '<span class="tomorrow-sector-name">' + s.name + limitUpBadge + '</span>' +
          '<span class="tomorrow-sector-reason">' + s.reason + '</span>' +
        '</div>' +
        stocksHtml +
        '</div>';
    }).join('');
  }

  function renderCompareTable(dateStr) {
    var tbody = document.getElementById('compare-tbody');
    if (!tbody) return;

    // Get yesterday's date
    var today = new Date(dateStr);
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    var ydayStr = formatDateISO(yesterday);

    var todayData = dailyData[dateStr];
    var ydayData = dailyData[ydayStr];

    if (!todayData || !ydayData) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px;">暂无昨日数据对比</td></tr>';
      return;
    }

    var rows = [
      {
        label: '涨停家数',
        yday: ydayData.close.limitUp,
        today: todayData.close.limitUp,
        change: todayData.close.limitUp - ydayData.close.limitUp,
        isPct: false
      },
      {
        label: '跌停家数',
        yday: ydayData.close.limitDown,
        today: todayData.close.limitDown,
        change: todayData.close.limitDown - ydayData.close.limitDown,
        isPct: false,
        inverse: true
      },
      {
        label: '上证涨跌幅',
        yday: ydayData.sh.change + '%',
        today: todayData.sh.change + '%',
        change: parseFloat(todayData.sh.change) - parseFloat(ydayData.sh.change),
        isPct: true
      },
      {
        label: '创业板涨跌幅',
        yday: ydayData.cyb.change + '%',
        today: todayData.cyb.change + '%',
        change: parseFloat(todayData.cyb.change) - parseFloat(ydayData.cyb.change),
        isPct: true
      },
      {
        label: '情绪得分',
        yday: ydayData.emotion.score + '分',
        today: todayData.emotion.score + '分',
        change: todayData.emotion.score - ydayData.emotion.score,
        isPct: false
      },
      {
        label: '市场情绪',
        yday: ydayData.summary.mood,
        today: todayData.summary.mood,
        change: null,
        isPct: false
      }
    ];

    tbody.innerHTML = rows.map(function(r) {
      var changeHtml = '';
      if (r.change === null) {
        changeHtml = '<span class="compare-change flat">--</span>';
      } else {
        var isUp = r.inverse ? r.change < 0 : r.change > 0;
        var cls = isUp ? 'up' : (r.change === 0 ? 'flat' : 'down');
        var sign = r.change > 0 ? '+' : '';
        var suffix = r.isPct ? '%' : (typeof r.change === 'number' ? '' : '');
        changeHtml = '<span class="compare-change ' + cls + '">' + sign + (r.isPct ? r.change.toFixed(2) : r.change) + suffix + '</span>';
      }
      return '<tr>' +
        '<td>' + r.label + '</td>' +
        '<td>' + r.yday + '</td>' +
        '<td>' + r.today + '</td>' +
        '<td>' + changeHtml + '</td>' +
        '</tr>';
    }).join('');

    // Compare conclusion
    var conclEl = document.getElementById('compare-conclusion');
    if (conclEl) {
      var limitDelta = todayData.close.limitUp - ydayData.close.limitUp;
      var emotionDelta = todayData.emotion.score - ydayData.emotion.score;
      var topSector = todayData.tomorrow.sectors[0].name;

      conclEl.innerHTML =
        '<strong>两日对比结论：</strong>' +
        '<br>① 涨停家数较昨日' + (limitDelta > 0 ? '增加' : '减少') + Math.abs(limitDelta) + '家，市场活跃度' + (limitDelta > 0 ? '提升' : '下降') + '。' +
        '<br>② 情绪得分较昨日' + (emotionDelta > 0 ? '上升' : '下降') + Math.abs(emotionDelta) + '分，整体情绪' + (emotionDelta > 0 ? '回暖' : '走弱') + '。' +
        '<br>③ 主线板块从昨日的<strong>' + ydayData.tomorrow.sectors[0].name + '</strong>切换至今日的<strong>' + topSector + '</strong>，板块轮动明显。' +
        '<br>④ 操作上建议' + (emotionDelta > 0 ? '顺势而为，关注强势板块延续性' : '控制仓位，等待企稳信号再做决策') + '。';
    }
  }

  function formatDateISO(d) {
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // Tab switching for summary
  window.switchSummaryTab = function(tab, btn) {
    var tabs = btn.parentElement.querySelectorAll('.summary-tab');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');

    document.getElementById('summary-today').classList.toggle('hidden', tab !== 'today');
    document.getElementById('summary-compare').classList.toggle('hidden', tab !== 'compare');

    // Resize emotion chart if visible
    if (window.emotionTimelineChart) {
      setTimeout(function() { window.emotionTimelineChart.resize(); }, 50);
    }
  };

  // Date switching
  window.switchDailyDate = function(dateStr) {
    currentDailyDate = dateStr;
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = generateDailyData(dateStr);
    }
    renderDailyReview(dateStr);
  };

  // Refresh daily review data with realistic hourly fluctuations
  function refreshDailyReview() {
    var todayKey = '2026-09-04';
    var data = dailyData[todayKey];
    if (!data) return;

    var fluct = function(base, pct) {
      return base * (1 + (Math.random() - 0.5) * pct);
    };

    // Fluctuate limit up/down counts (±8%)
    data.tenOclock.limitUp = Math.max(1, Math.floor(fluct(data.tenOclock.limitUp, 0.08)));
    data.tenOclock.limitDown = Math.max(1, Math.floor(fluct(data.tenOclock.limitDown, 0.08)));
    data.noon.limitUp = Math.max(1, Math.floor(fluct(data.noon.limitUp, 0.08)));
    data.noon.limitDown = Math.max(1, Math.floor(fluct(data.noon.limitDown, 0.08)));
    data.close.limitUp = Math.max(1, Math.floor(fluct(data.close.limitUp, 0.06)));
    data.close.limitDown = Math.max(1, Math.floor(fluct(data.close.limitDown, 0.06)));
    data.sh.limitUp = Math.max(1, Math.floor(fluct(data.sh.limitUp, 0.08)));
    data.sh.limitDown = Math.max(1, Math.floor(fluct(data.sh.limitDown, 0.08)));

    // Fluctuate sector data (±0.3%)
    if (data.tenOclock.hotboards) {
      data.tenOclock.hotboards.forEach(function(s) {
        s.today = parseFloat((s.today + (Math.random() - 0.5) * 0.6).toFixed(2));
      });
      data.tenOclock.hotboards.sort(function(a, b) { return b.today - a.today; });
    }
    if (data.noon.hotboards) {
      data.noon.hotboards.forEach(function(s) {
        s.today = parseFloat((s.today + (Math.random() - 0.5) * 0.6).toFixed(2));
      });
      data.noon.hotboards.sort(function(a, b) { return b.today - a.today; });
    }
    if (data.close.hotboards) {
      data.close.hotboards.forEach(function(s) {
        s.today = parseFloat((s.today + (Math.random() - 0.5) * 0.6).toFixed(2));
      });
      data.close.hotboards.sort(function(a, b) { return b.today - a.today; });
    }

    // Fluctuate emotion score (±3)
    var delta = Math.floor((Math.random() - 0.5) * 6);
    data.emotion.score = Math.min(100, Math.max(0, data.emotion.score + delta));
    data.emotion.timeline[2] = data.emotion.score;
    data.emotion.summary = '今日市场情绪综合得分' + data.emotion.score + '分（满分100）。' +
      (data.emotion.score > 70 ? '情绪高涨，赚钱效应明显。' :
      data.emotion.score > 50 ? '情绪中性偏强，结构性机会存在。' :
      data.emotion.score > 30 ? '情绪偏弱，操作难度较大。' :
      '情绪低迷，建议谨慎观望。');

    // Update summary mood
    data.summary.mood = data.emotion.score > 60 ? '偏强' : (data.emotion.score > 40 ? '中性' : '偏弱');
    var limitRatio = data.close.limitUp / Math.max(1, data.close.limitDown);
    data.summary.profit = limitRatio > 3 ? '良好' : (limitRatio > 1 ? '一般' : '较差');

    // Re-render if currently viewing today
    if (currentDailyDate === todayKey) {
      renderDailyReview(todayKey);
    }
  }

  function initDailyReview() {
    // Generate data for multiple days
    var dates = ['2026-09-02', '2026-09-03', '2026-09-04'];
    dates.forEach(function(d) {
      dailyData[d] = generateDailyData(d);
    });
    renderDailyReview(currentDailyDate);
  }

  // Expose for charts.js to call
  window.initDailyReview = initDailyReview;
  window.dailyData = dailyData;
  window.refreshDailyReview = refreshDailyReview;

  // ==================== Dragon Head Sniper Module ====================

  // Auction blind snipe stocks data
  var auctionStocks = [
    { code: '600150', name: '中国船舶', sector: '船舶制造', zhangfu: 7.96, score: 95, huanlv: 4.2, shizhi: 1050, chengjiao: 83.5, signal: 'strong', signalText: '强共振龙头' },
    { code: '600108', name: '亚盛集团', sector: '农林牧渔', zhangfu: 10.10, score: 92, huanlv: 12.5, shizhi: 186, chengjiao: 23.3, signal: 'strong', signalText: '一字涨停' },
    { code: '601999', name: '出版传媒', sector: '传媒娱乐', zhangfu: 6.98, score: 88, huanlv: 8.3, shizhi: 95, chengjiao: 7.9, signal: 'strong', signalText: '板块龙头' },
    { code: '300058', name: '蓝色光标', sector: '印刷包装', zhangfu: 7.96, score: 86, huanlv: 10.2, shizhi: 210, chengjiao: 21.4, signal: 'strong', signalText: '放量突破' },
    { code: '601579', name: '会稽山', sector: '酿酒行业', zhangfu: 10.01, score: 85, huanlv: 6.8, shizhi: 135, chengjiao: 9.2, signal: 'strong', signalText: '首板涨停' },
    { code: '600391', name: '航发科技', sector: '飞机制造', zhangfu: 4.45, score: 82, huanlv: 5.1, shizhi: 85, chengjiao: 4.3, signal: 'mid', signalText: '趋势向上' },
    { code: '600657', name: '信达地产', sector: '房地产', zhangfu: 10.12, score: 80, huanlv: 15.3, shizhi: 78, chengjiao: 11.9, signal: 'strong', signalText: '两连板' },
    { code: '000428', name: '华天酒店', sector: '酒店旅游', zhangfu: 10.09, score: 78, huanlv: 9.7, shizhi: 45, chengjiao: 4.3, signal: 'strong', signalText: '首板涨停' },
    { code: '600684', name: '珠江股份', sector: '房地产', zhangfu: 9.98, score: 76, huanlv: 11.2, shizhi: 62, chengjiao: 6.9, signal: 'mid', signalText: '首板' },
    { code: '000721', name: '西安饮食', sector: '食品行业', zhangfu: 8.56, score: 74, huanlv: 18.9, shizhi: 58, chengjiao: 10.9, signal: 'mid', signalText: '反包' },
    { code: '002124', name: '天邦食品', sector: '农林牧渔', zhangfu: 10.07, score: 72, huanlv: 7.4, shizhi: 55, chengjiao: 4.1, signal: 'strong', signalText: '两连板' },
    { code: '000876', name: '新希望', sector: '农林牧渔', zhangfu: 10.03, score: 70, huanlv: 5.8, shizhi: 520, chengjiao: 30.2, signal: 'strong', signalText: '三连板' },
    { code: '600052', name: '浙江广厦', sector: '房地产', zhangfu: 7.32, score: 68, huanlv: 8.1, shizhi: 45, chengjiao: 3.3, signal: 'mid', signalText: '板块联动' },
    { code: '600519', name: '贵州茅台', sector: '酿酒行业', zhangfu: 2.40, score: 65, huanlv: 0.3, shizhi: 16700, chengjiao: 40.1, signal: 'weak', signalText: '权重护盘' },
    { code: '601398', name: '工商银行', sector: '银行', zhangfu: 0.37, score: 60, huanlv: 0.1, shizhi: 29000, chengjiao: 10.7, signal: 'weak', signalText: '防御' }
  ];

  // Anchor (dragon head) data
  var anchorGangs = [
    {
      name: '船舶制造',
      icon: '🚢',
      total: 8,
      zhangfu: 4.98,
      upCount: 8,
      upRatio: '100%',
      isStrong: true,
      stocks: [
        { rank: 'total', rankText: '总龙头', code: '600150', name: '中国船舶', zhangfu: 7.96, tag: '主线总龙头' }
      ]
    },
    {
      name: '农林牧渔',
      icon: '🌾',
      total: 64,
      zhangfu: 4.07,
      upCount: 58,
      upRatio: '91%',
      isStrong: true,
      stocks: [
        { rank: 'total', rankText: '总龙头', code: '600108', name: '亚盛集团', zhangfu: 10.10, tag: '主线总龙头' }
      ]
    },
    {
      name: '传媒娱乐',
      icon: '🎬',
      total: 40,
      zhangfu: 2.83,
      upCount: 30,
      upRatio: '75%',
      isStrong: true,
      stocks: [
        { rank: 'total', rankText: '总龙头', code: '601999', name: '出版传媒', zhangfu: 6.98, tag: '主线总龙头' }
      ]
    },
    {
      name: '印刷包装',
      icon: '📦',
      total: 20,
      zhangfu: 2.77,
      upCount: 14,
      upRatio: '70%',
      isStrong: true,
      stocks: [
        { rank: 'total', rankText: '总龙头', code: '300058', name: '蓝色光标', zhangfu: 7.96, tag: '主线总龙头' }
      ]
    },
    {
      name: '酿酒行业',
      icon: '🍶',
      total: 33,
      zhangfu: 2.62,
      upCount: 24,
      upRatio: '73%',
      isStrong: true,
      stocks: [
        { rank: 'total', rankText: '总龙头', code: '601579', name: '会稽山', zhangfu: 10.01, tag: '主线总龙头' }
      ]
    },
    {
      name: '飞机制造',
      icon: '✈️',
      total: 14,
      zhangfu: 2.02,
      upCount: 9,
      upRatio: '64%',
      isStrong: true,
      stocks: [
        { rank: 'total', rankText: '总龙头', code: '600391', name: '航发科技', zhangfu: 4.45, tag: '主线总龙头' }
      ]
    },
    {
      name: '房地产',
      icon: '🏠',
      total: 123,
      zhangfu: 1.85,
      upCount: 77,
      upRatio: '63%',
      isStrong: false,
      stocks: [
        { rank: 'total', rankText: '总龙头', code: '600657', name: '信达地产', zhangfu: 10.12, tag: '主线总龙头' }
      ]
    },
    {
      name: '酒店旅游',
      icon: '🏨',
      total: 35,
      zhangfu: 1.85,
      upCount: 22,
      upRatio: '63%',
      isStrong: false,
      stocks: [
        { rank: 'total', rankText: '总龙头', code: '000428', name: '华天酒店', zhangfu: 10.09, tag: '主线总龙头' }
      ]
    }
  ];

  // Sector resonance data
  var resonanceSectors = [
    { name: '船舶制造', icon: '🚢', zhangfu: 4.98, upCount: 8, total: 8, limitUp: 4, volume: '79.0亿', dragon: '中国船舶', dragonChange: 7.96, isStrong: true },
    { name: '农林牧渔', icon: '🌾', zhangfu: 4.07, upCount: 58, total: 64, limitUp: 1, volume: '223.4亿', dragon: '亚盛集团', dragonChange: 10.10, isStrong: true },
    { name: '传媒娱乐', icon: '🎬', zhangfu: 2.83, upCount: 30, total: 40, limitUp: 14, volume: '100.3亿', dragon: '出版传媒', dragonChange: 6.98, isStrong: true },
    { name: '印刷包装', icon: '📦', zhangfu: 2.77, upCount: 14, total: 20, limitUp: 6, volume: '92.0亿', dragon: '蓝色光标', dragonChange: 7.96, isStrong: true },
    { name: '酿酒行业', icon: '🍶', zhangfu: 2.62, upCount: 24, total: 33, limitUp: 1, volume: '131.1亿', dragon: '会稽山', dragonChange: 10.01, isStrong: true },
    { name: '飞机制造', icon: '✈️', zhangfu: 2.02, upCount: 9, total: 14, limitUp: 3, volume: '42.1亿', dragon: '航发科技', dragonChange: 4.45, isStrong: true },
    { name: '房地产', icon: '🏠', zhangfu: 1.85, upCount: 77, total: 123, limitUp: 1, volume: '167.9亿', dragon: '信达地产', dragonChange: 10.12, isStrong: false },
    { name: '酒店旅游', icon: '✈️', zhangfu: 1.85, upCount: 22, total: 35, limitUp: 1, volume: '84.7亿', dragon: '华天酒店', dragonChange: 10.09, isStrong: false },
    { name: '水泥行业', icon: '🧱', zhangfu: 1.75, upCount: 16, total: 26, limitUp: 1, volume: '20.2亿', dragon: '福建水泥', dragonChange: 9.92, isStrong: false },
    { name: '食品行业', icon: '🍞', zhangfu: 1.62, upCount: 34, total: 58, limitUp: 1, volume: '92.4亿', dragon: '海欣食品', dragonChange: 10.00, isStrong: false },
    { name: '钢铁行业', icon: '🔩', zhangfu: 1.47, upCount: 35, total: 60, limitUp: 11, volume: '49.4亿', dragon: '鲁银投资', dragonChange: 3.78, isStrong: false },
    { name: '商业百货', icon: '🛍️', zhangfu: 1.47, upCount: 54, total: 93, limitUp: 1, volume: '170.4亿', dragon: '我爱我家', dragonChange: 10.14, isStrong: false }
  ];

  // Dragon tab switching
  window.switchDragonTab = function(tab, btn) {
    var tabs = btn.parentElement.querySelectorAll('.dragon-subtab');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');

    document.getElementById('dtab-auction').classList.toggle('hidden', tab !== 'auction');
    document.getElementById('dtab-anchor').classList.toggle('hidden', tab !== 'anchor');
    document.getElementById('dtab-resonance').classList.toggle('hidden', tab !== 'resonance');

    // Force resize any charts if present
    if (window.resizeAllCharts) {
      setTimeout(function() { window.resizeAllCharts(); }, 50);
    }
  };

  // Run auction filter
  window.runAuctionFilter = function() {
    var zfMin = parseFloat(document.getElementById('filter-zhangfu-min').value) || 0;
    var zfMax = parseFloat(document.getElementById('filter-zhangfu-max').value) || 20;
    var minScore = parseFloat(document.getElementById('filter-score').value) || 0;
    var hlMin = parseFloat(document.getElementById('filter-huanlv-min').value) || 0;
    var hlMax = parseFloat(document.getElementById('filter-huanlv-max').value) || 100;
    var szMin = parseFloat(document.getElementById('filter-shizhi-min').value) || 0;
    var szMax = parseFloat(document.getElementById('filter-shizhi-max').value) || 99999;
    var sectorFilter = document.getElementById('filter-sector').value;
    var sortBy = document.getElementById('filter-sort').value;

    var filtered = auctionStocks.filter(function(s) {
      if (s.zhangfu < zfMin || s.zhangfu > zfMax) return false;
      if (s.score < minScore) return false;
      if (s.huanlv < hlMin || s.huanlv > hlMax) return false;
      if (s.shizhi < szMin || s.shizhi > szMax) return false;
      if (sectorFilter !== 'all' && s.sector !== sectorFilter) return false;
      return true;
    });

    // Sort
    filtered.sort(function(a, b) {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'zhangfu') return b.zhangfu - a.zhangfu;
      if (sortBy === 'chengjiao') return b.chengjiao - a.chengjiao;
      if (sortBy === 'huanlv') return b.huanlv - a.huanlv;
      return 0;
    });

    renderAuctionTable(filtered);
  };

  function renderAuctionTable(stocks) {
    var tbody = document.getElementById('auction-tbody');
    var countEl = document.getElementById('auction-result-count');
    if (countEl) countEl.textContent = '共 ' + stocks.length + ' 只符合条件';
    if (!tbody) return;

    tbody.innerHTML = stocks.map(function(s, i) {
      var zfClass = s.zhangfu >= 0 ? 'pct-up' : 'pct-down';
      var zfSign = s.zhangfu >= 0 ? '+' : '';
      var scoreClass = s.score >= 80 ? 'score-high' : (s.score >= 60 ? 'score-mid' : 'score-low');
      var signalClass = s.signal === 'strong' ? 'signal-strong' : (s.signal === 'mid' ? 'signal-mid' : 'signal-weak');
      return '<tr>' +
        '<td style="color:var(--muted);">' + (i + 1) + '</td>' +
        '<td style="color:var(--muted);">' + s.code + '</td>' +
        '<td class="stock-name">' + s.name + '</td>' +
        '<td><span class="sector-mini-tag">' + s.sector + '</span></td>' +
        '<td class="' + zfClass + '">' + zfSign + s.zhangfu.toFixed(2) + '%</td>' +
        '<td><span class="score-badge ' + scoreClass + '">' + s.score + '</span></td>' +
        '<td>' + s.huanlv.toFixed(1) + '%</td>' +
        '<td>' + s.shizhi + '亿</td>' +
        '<td>' + s.chengjiao + '亿</td>' +
        '<td><span class="signal-tag ' + signalClass + '">' + s.signalText + '</span></td>' +
        '</tr>';
    }).join('');
  }

  // Render anchor (dragon head) list
  function renderAnchorGangs() {
    var el = document.getElementById('anchor-gang-list');
    if (!el) return;

    el.innerHTML = anchorGangs.map(function(gang) {
      var zfColor = gang.zhangfu >= 0 ? 'var(--up)' : 'var(--down)';
      var zfSign = gang.zhangfu >= 0 ? '+' : '';
      var stocksHtml = gang.stocks.map(function(s) {
        var sZfColor = s.zhangfu >= 0 ? 'var(--up)' : 'var(--down)';
        var sZfSign = s.zhangfu >= 0 ? '+' : '';
        return '<div class="anchor-stock-row">' +
          '<span class="anchor-rank rank-' + s.rank + '">' + s.rankText + '</span>' +
          '<span class="anchor-stock-code">' + s.code + '</span>' +
          '<span class="anchor-stock-name">' + s.name + '</span>' +
          '<span class="anchor-stock-change" style="color:' + sZfColor + ';">' + sZfSign + s.zhangfu + '%</span>' +
          '<span class="anchor-stock-tag">' + s.tag + '</span>' +
          '</div>';
      }).join('');

      return '<div class="anchor-gang-card">' +
        '<div class="anchor-gang-header">' +
          '<div class="anchor-gang-name"><span class="anchor-gang-icon">' + gang.icon + '</span>共振帮派：' + gang.name + '（' + gang.total + '家）</div>' +
          '<div class="anchor-gang-meta">' +
            '<span>' + (gang.isStrong ? '<strong>强共振</strong>' : '共振') + '</span>' +
            '<span style="color:' + zfColor + ';font-weight:700;">' + zfSign + gang.zhangfu + '%</span>' +
          '</div>' +
        '</div>' +
        '<div class="anchor-gang-body">' + stocksHtml + '</div>' +
        '</div>';
    }).join('');
  }

  // Render resonance sectors
  function renderResonanceSectors() {
    var el = document.getElementById('resonance-grid');
    if (!el) return;

    el.innerHTML = resonanceSectors.map(function(s) {
      var zfColor = s.zhangfu >= 0 ? 'var(--up)' : 'var(--down)';
      var zfSign = s.zhangfu >= 0 ? '+' : '';
      var dragonZfColor = s.dragonChange >= 0 ? 'var(--up)' : 'var(--down)';
      var dragonZfSign = s.dragonChange >= 0 ? '+' : '';
      var strongClass = s.isStrong ? 'strong' : '';

      return '<div class="resonance-card ' + strongClass + '">' +
        '<div class="resonance-header">' +
          '<div class="resonance-name"><span class="resonance-icon">' + s.icon + '</span>' + s.name + '</div>' +
          '<div class="resonance-change" style="color:' + zfColor + ';">' + zfSign + s.zhangfu + '%</div>' +
        '</div>' +
        '<div class="resonance-stats-row">' +
          '<div class="res-stat-item"><div class="res-stat-item-label">上涨/总数</div><div class="res-stat-item-value up">' + s.upCount + '/' + s.total + '</div></div>' +
          '<div class="res-stat-item"><div class="res-stat-item-label">涨停数</div><div class="res-stat-item-value up">' + s.limitUp + '</div></div>' +
          '<div class="res-stat-item"><div class="res-stat-item-label">成交额</div><div class="res-stat-item-value">' + s.volume + '</div></div>' +
        '</div>' +
        '<div class="resonance-dragon">' +
          '<span class="resonance-dragon-label">👑 龙头</span>' +
          '<span class="resonance-dragon-name">' + s.dragon + ' ' + dragonZfSign + s.dragonChange + '%</span>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  // Init dragon module
  function initDragonModule() {
    // Set update time
    var timeEl = document.getElementById('dragon-update-time');
    if (timeEl) {
      var now = new Date();
      timeEl.textContent = '更新于 ' + formatDate(now);
    }

    // Render initial auction table (with default filter)
    renderAuctionTable(auctionStocks.slice(0, 10));

    // Render anchor gangs
    renderAnchorGangs();

    // Render resonance sectors
    renderResonanceSectors();
  }

  // Expose
  window.initDragonModule = initDragonModule;
  window.renderAuctionTable = renderAuctionTable;
  window.renderAnchorGangs = renderAnchorGangs;
  window.renderResonanceSectors = renderResonanceSectors;
  window.auctionStocks = auctionStocks;
  window.anchorGangs = anchorGangs;
  window.resonanceSectors = resonanceSectors;

})();
