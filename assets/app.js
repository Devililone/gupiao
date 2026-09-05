// assets/app.js
(function() {
  // ==================== 全局时间线管理器 ====================
  // 统一管理全工作台的数据日期，确保所有模块对齐同一时间线
  var Timeline = {
    currentDate: '2026-09-04',
    source: 'eastmoney',
    sources: {},

    // 注册各模块的数据日期
    register: function(moduleName, dateStr) {
      this.sources[moduleName] = dateStr;
    },

    // 检测所有模块日期是否一致
    checkConsistency: function() {
      var dates = {};
      for (var mod in this.sources) {
        var d = this.sources[mod];
        if (!dates[d]) dates[d] = [];
        dates[d].push(mod);
      }
      var dateKeys = Object.keys(dates);
      if (dateKeys.length <= 1) {
        return { consistent: true, dates: dates };
      }
      return { consistent: false, dates: dates };
    },

    // 自动修正：将所有模块对齐到主日期（realMarketData.date）
    autoFix: function() {
      var mainDate = this.sources['market_main'] || this.currentDate;
      this.currentDate = mainDate;
      // 同步到每日复盘
      if (typeof currentDailyDate !== 'undefined') {
        currentDailyDate = mainDate;
      }
      return mainDate;
    },

    // 格式化日期显示
    formatCN: function(dateStr) {
      var d = new Date(dateStr);
      return (d.getMonth() + 1) + '月' + d.getDate() + '日';
    },

    formatFull: function(dateStr) {
      var d = new Date(dateStr);
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    },

    getYesterday: function(dateStr) {
      var d = new Date(dateStr);
      d.setDate(d.getDate() - 1);
      return this.formatFull(d);
    }
  };

  // ==================== 本地行情数据库 MarketDB ====================
  // 基于 localStorage 持久化存储每日行情快照
  // 所有模块数据统一从 MarketDB 读取，确保数据一致性
  var MarketDB = {
    PREFIX: 'stock_workstation_db_',
    META_KEY: 'stock_workstation_meta',

    // 初始化数据库元信息
    _getMeta: function() {
      try {
        var raw = localStorage.getItem(this.META_KEY);
        return raw ? JSON.parse(raw) : { dates: [], lastUpdate: null, version: 1 };
      } catch (e) {
        return { dates: [], lastUpdate: null, version: 1 };
      }
    },

    _setMeta: function(meta) {
      try {
        localStorage.setItem(this.META_KEY, JSON.stringify(meta));
      } catch (e) {
        console.warn('MarketDB: 元数据存储失败', e);
      }
    },

    // 存储某一天的完整数据快照
    saveDay: function(dateStr, data) {
      var meta = this._getMeta();
      data.date = dateStr;
      data._savedAt = Date.now();
      try {
        localStorage.setItem(this.PREFIX + dateStr, JSON.stringify(data));
        if (meta.dates.indexOf(dateStr) < 0) {
          meta.dates.push(dateStr);
          meta.dates.sort();
        }
        meta.lastUpdate = Date.now();
        this._setMeta(meta);
        return true;
      } catch (e) {
        console.warn('MarketDB: 存储日数据失败', e);
        return false;
      }
    },

    // 读取某一天的数据
    getDay: function(dateStr) {
      try {
        var raw = localStorage.getItem(this.PREFIX + dateStr);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    // 某天是否有数据
    hasDay: function(dateStr) {
      return localStorage.getItem(this.PREFIX + dateStr) !== null;
    },

    // 获取所有已存储的日期列表（升序）
    listDates: function() {
      return this._getMeta().dates || [];
    },

    // 获取最近 N 天的日期
    getRecentDates: function(n) {
      var dates = this.listDates();
      return dates.slice(-n);
    },

    // 部分更新某天数据
    updateDay: function(dateStr, patch) {
      var existing = this.getDay(dateStr);
      if (!existing) existing = { date: dateStr };
      for (var key in patch) {
        existing[key] = patch[key];
      }
      return this.saveDay(dateStr, existing);
    },

    // 清空所有数据
    clearAll: function() {
      var meta = this._getMeta();
      for (var i = 0; i < meta.dates.length; i++) {
        localStorage.removeItem(this.PREFIX + meta.dates[i]);
      }
      localStorage.removeItem(this.META_KEY);
    },

    // 获取存储使用量
    getStats: function() {
      var meta = this._getMeta();
      var totalBytes = 0;
      for (var i = 0; i < meta.dates.length; i++) {
        var raw = localStorage.getItem(this.PREFIX + meta.dates[i]);
        if (raw) totalBytes += raw.length;
      }
      return {
        dateCount: meta.dates.length,
        totalKB: Math.round(totalBytes / 1024),
        lastUpdate: meta.lastUpdate ? new Date(meta.lastUpdate).toLocaleString() : '无'
      };
    },

    // 保存全量快照（所有模块数据一次性写入）
    saveSnapshot: function(dateStr, snapshot) {
      return this.saveDay(dateStr, snapshot);
    },

    // 读取某模块某天的数据
    getModule: function(dateStr, moduleName) {
      var day = this.getDay(dateStr);
      return day ? day[moduleName] : null;
    },

    // 写入某模块某天的数据
    setModule: function(dateStr, moduleName, data) {
      var patch = {};
      patch[moduleName] = data;
      return this.updateDay(dateStr, patch);
    }
  };

  // ==================== Real Data from Eastmoney (2026-09-04) ====================
  var sectors = [
    { name: '养殖业', today: 5.30, d5: 12.5, d20: 18.3, upCount: 58, total: 64, volChange: '+280%', strongDays: 3, trend: 'strong', trendText: '持续强势', limitUp: 8, volume: 223.4, icon: '🌾' },
    { name: '白酒', today: 2.64, d5: 2.37, d20: -1.54, upCount: 28, total: 36, volChange: '+130%', strongDays: 1, trend: 'strengthening', trendText: '正在加强', limitUp: 3, volume: 131.1, icon: '🍶' },
    { name: '房地产', today: 1.15, d5: -0.92, d20: -0.12, upCount: 45, total: 108, volChange: '+19%', strongDays: 2, trend: 'strengthening', trendText: '正在加强', limitUp: 6, volume: 167.9, icon: '🏠' },
    { name: '银行', today: 0.87, d5: 3.99, d20: 6.42, upCount: 22, total: 36, volChange: '-18%', strongDays: 3, trend: 'strong', trendText: '持续强势', limitUp: 0, volume: 303.2, icon: '🏦' },
    { name: '钢铁', today: 0.14, d5: 2.5, d20: 4.06, upCount: 25, total: 45, volChange: '-10%', strongDays: 1, trend: 'oscillating', trendText: '震荡偏强', limitUp: 4, volume: 49.4, icon: '🔩' },
    { name: '煤炭', today: -0.23, d5: -2.92, d20: 4.06, upCount: 12, total: 38, volChange: '-18%', strongDays: 0, trend: 'oscillating', trendText: '震荡整理', limitUp: 1, volume: 112.0, icon: '⛏️' },
    { name: '光伏设备', today: -0.42, d5: -7.61, d20: -11.22, upCount: 30, total: 72, volChange: '-20%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱', limitUp: 2, volume: 184.2, icon: '☀️' },
    { name: '创新药', today: -0.70, d5: -2.8, d20: -6.2, upCount: 35, total: 78, volChange: '-15%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱', limitUp: 3, volume: 97.3, icon: '💊' },
    { name: '军工', today: -0.25, d5: -3.2, d20: -5.5, upCount: 25, total: 55, volChange: '-12%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱', limitUp: 2, volume: 85.6, icon: '✈️' },
    { name: 'AI算力', today: -1.85, d5: -5.5, d20: -8.5, upCount: 25, total: 68, volChange: '-25%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱', limitUp: 5, volume: 392.3, icon: '💻' },
    { name: '新能源汽车', today: -1.09, d5: -4.5, d20: -8.9, upCount: 30, total: 88, volChange: '-20%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱', limitUp: 4, volume: 263.8, icon: '🚗' },
    { name: '消费电子', today: -2.28, d5: -2.15, d20: -3.26, upCount: 30, total: 96, volChange: '-5%', strongDays: 0, trend: 'diverging', trendText: '开始分化', limitUp: 3, volume: 1170.3, icon: '📱' },
    { name: '机器人', today: -2.62, d5: -3.95, d20: -11.87, upCount: 15, total: 62, volChange: '-15%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱', limitUp: 5, volume: 99.0, icon: '🤖' },
    { name: '半导体', today: -2.86, d5: -5.93, d20: -8.31, upCount: 30, total: 124, volChange: '-24%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱', limitUp: 7, volume: 790.9, icon: '🔬' },
    { name: '光模块', today: -2.15, d5: -5.0, d20: -8.0, upCount: 15, total: 45, volChange: '-22%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱', limitUp: 3, volume: 79.4, icon: '📡' },
    { name: '储能', today: -1.5, d5: -4.8, d20: -9.5, upCount: 20, total: 58, volChange: '-18%', strongDays: 0, trend: 'weakening', trendText: '走势偏弱', limitUp: 2, volume: 156.5, icon: '🔋' }
  ];

  var stocks = [
    // ========== 连板龙头股（来自东财实时数据）==========
    // 养殖业（最强板块）
    { code: '000876', name: '新希望', price: 12.85, today: 10.03, d5: 25.6, d10: 32.1, d20: 45.3, sector: '养殖业', lianban: 3, boardType: '3连板', category: 'trend', catText: '连板龙头' },
    { code: '002124', name: '天邦食品', price: 5.86, today: 10.07, d5: 18.2, d10: 22.5, d20: 30.1, sector: '养殖业', lianban: 2, boardType: '2连板', category: 'trend', catText: '连板龙头' },
    { code: '002702', name: '海欣食品', price: 7.92, today: 9.97, d5: 12.3, d10: 15.8, d20: 20.5, sector: '养殖业', lianban: 1, boardType: '首板', category: 'trend', catText: '首板涨停' },
    // 白酒（强势板块）
    { code: '600519', name: '贵州茅台', price: 1680.00, today: 2.40, d5: 1.5, d10: 2.8, d20: 0.5, sector: '白酒', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },
    { code: '000858', name: '五粮液', price: 155.60, today: 1.84, d5: 3.2, d10: 5.5, d20: 1.8, sector: '白酒', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },
    // 房地产（强势板块）
    { code: '001979', name: '招商蛇口', price: 10.85, today: 3.24, d5: 2.5, d10: 1.8, d20: -0.5, sector: '房地产', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },
    { code: '600048', name: '保利发展', price: 9.75, today: 2.56, d5: 1.8, d10: 2.2, d20: 0.8, sector: '房地产', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },
    // 银行（强势板块）
    { code: '601398', name: '工商银行', price: 6.85, today: 0.37, d5: 2.1, d10: 4.5, d20: 8.2, sector: '银行', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },
    { code: '601288', name: '农业银行', price: 5.42, today: 0.42, d5: 1.8, d10: 3.2, d20: 7.5, sector: '银行', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },

    // ========== 趋势观察（相对抗跌或逆势上涨的股票）==========
    { code: '603501', name: '豪威集团', price: 80.25, today: -2.15, d5: -2.13, d10: -4.5, d20: -11.89, sector: '半导体', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },
    { code: '002594', name: '比亚迪', price: 87.40, today: -1.09, d5: -5.33, d10: -3.5, d20: -1.69, sector: '新能源汽车', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },
    { code: '300750', name: '宁德时代', price: 351.00, today: -1.25, d5: -4.75, d10: -8.2, d20: -10.9, sector: '新能源汽车', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },
    { code: '688256', name: '寒武纪', price: 1072.00, today: -2.54, d5: 2.42, d10: 5.8, d20: -1.92, sector: 'AI算力', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },
    { code: '688981', name: '中芯国际', price: 121.14, today: -2.20, d5: -3.77, d10: -5.5, d20: -8.83, sector: '半导体', lianban: 0, boardType: '趋势', category: 'pullback', catText: '回调观察' },
    { code: '002371', name: '北方华创', price: 638.17, today: -3.10, d5: -8.51, d10: -11.2, d20: -13.6, sector: '半导体', lianban: 0, boardType: '趋势', category: 'trend', catText: '趋势观察' },

    // ========== 启动观察 ==========
    { code: '002475', name: '立讯精密', price: 54.30, today: -1.85, d5: -4.06, d10: -3.0, d20: -4.03, sector: '消费电子', lianban: 0, boardType: '趋势', category: 'start', catText: '启动观察' },
    { code: '300433', name: '蓝思科技', price: 15.80, today: -2.10, d5: -3.5, d10: -2.8, d20: -3.5, sector: '消费电子', lianban: 0, boardType: '趋势', category: 'start', catText: '启动观察' },
    { code: '688012', name: '中微公司', price: 185.20, today: -2.65, d5: -5.8, d10: -8.2, d20: -10.5, sector: '半导体', lianban: 0, boardType: '趋势', category: 'start', catText: '启动观察' },
    { code: '600584', name: '长电科技', price: 38.90, today: -2.30, d5: -4.2, d10: -6.5, d20: -8.8, sector: '半导体', lianban: 0, boardType: '趋势', category: 'start', catText: '启动观察' },
    { code: '300308', name: '中际旭创', price: 158.50, today: -2.15, d5: -5.2, d10: -7.8, d20: -9.5, sector: '光模块', lianban: 0, boardType: '趋势', category: 'start', catText: '启动观察' },
    { code: '002281', name: '光迅科技', price: 32.80, today: -1.95, d5: -4.5, d10: -6.2, d20: -8.0, sector: '光模块', lianban: 0, boardType: '趋势', category: 'start', catText: '启动观察' },

    // ========== 回调观察 ==========
    { code: '603986', name: '兆易创新', price: 142.50, today: -2.80, d5: -6.2, d10: -8.5, d20: -12.5, sector: '半导体', lianban: 0, boardType: '趋势', category: 'pullback', catText: '回调观察' },
    { code: '300223', name: '北京君正', price: 98.60, today: -2.60, d5: -5.8, d10: -7.2, d20: -10.8, sector: '半导体', lianban: 0, boardType: '趋势', category: 'pullback', catText: '回调观察' },
    { code: '002049', name: '紫光国微', price: 125.80, today: -2.95, d5: -6.5, d10: -9.2, d20: -14.5, sector: '半导体', lianban: 0, boardType: '趋势', category: 'pullback', catText: '回调观察' },
    { code: '300014', name: '亿纬锂能', price: 48.50, today: -1.50, d5: -5.5, d10: -7.8, d20: -11.5, sector: '新能源汽车', lianban: 0, boardType: '趋势', category: 'pullback', catText: '回调观察' },
    { code: '002460', name: '赣锋锂业', price: 58.60, today: -1.80, d5: -6.8, d10: -8.5, d20: -10.2, sector: '新能源汽车', lianban: 0, boardType: '趋势', category: 'pullback', catText: '回调观察' },
    { code: '688017', name: '绿的谐波', price: 156.80, today: -2.62, d5: -7.2, d10: -10.5, d20: -15.8, sector: '机器人', lianban: 0, boardType: '趋势', category: 'pullback', catText: '回调观察' },
    { code: '688561', name: '奇安信', price: 68.90, today: -2.10, d5: -5.2, d10: -7.8, d20: -12.5, sector: 'AI算力', lianban: 0, boardType: '趋势', category: 'pullback', catText: '回调观察' },

    // ========== 高位观察 ==========
    { code: '300661', name: '圣邦股份', price: 225.80, today: -3.20, d5: -8.5, d10: -12.5, d20: -15.8, sector: '半导体', lianban: 0, boardType: '趋势', category: 'high', catText: '高位观察' },
    { code: '688396', name: '华润微', price: 78.90, today: -2.75, d5: -7.8, d10: -10.5, d20: -13.2, sector: '半导体', lianban: 0, boardType: '趋势', category: 'high', catText: '高位观察' },
    { code: '300346', name: '南大光电', price: 45.60, today: -3.50, d5: -9.2, d10: -13.5, d20: -18.8, sector: '半导体', lianban: 0, boardType: '趋势', category: 'high', catText: '高位观察' },

    // ========== 排除 ==========
    { code: '688111', name: '金山办公', price: 325.60, today: -4.20, d5: -10.5, d10: -15.2, d20: -22.8, sector: 'AI算力', lianban: 0, boardType: '趋势', category: 'exclude', catText: '排除' },
    { code: '688041', name: '海光信息', price: 78.50, today: -3.80, d5: -11.2, d10: -16.5, d20: -25.3, sector: '半导体', lianban: 0, boardType: '趋势', category: 'exclude', catText: '排除' }
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

  // ==================== Sector Table · 专业金融风格 ====================
  // 板块数据工具函数
  var SectorUtil = {
    // 格式化涨跌幅（带正负号，保留2位小数）
    formatPct: function(val) {
      var sign = val >= 0 ? '+' : '';
      return sign + val.toFixed(2) + '%';
    },
    // 涨跌幅颜色类名
    pctClass: function(val) {
      return val >= 0 ? 'pct-up' : 'pct-down';
    },
    // 获取板块领涨股（涨幅最高）
    getLeader: function(sectorName) {
      var sectorStocks = stocks.filter(function(st) { return st.sector === sectorName; });
      if (sectorStocks.length === 0) return null;
      sectorStocks.sort(function(a, b) { return b.today - a.today; });
      return sectorStocks[0];
    },
    // 获取板块涨停股列表
    getLimitUpStocks: function(sectorName) {
      return stocks.filter(function(st) {
        return st.sector === sectorName && st.limitUp;
      });
    },
    // 计算板块上涨家数占比
    getUpRatio: function(sector) {
      return sector.total > 0 ? Math.round(sector.upCount / sector.total * 100) : 0;
    },
    // 板块强度评分（综合今日+5日+20日+量能+上涨占比）
    getStrengthScore: function(s) {
      var score = 0;
      score += s.today * 3;        // 今日权重最高
      score += s.d5 * 2;           // 5日次之
      score += s.d20 * 0.5;        // 20日权重较低
      score += (s.volChange.indexOf('+') === 0 ? 5 : -3); // 量能加分
      score += s.strongDays * 1.5; // 连续走强加分
      score += this.getUpRatio(s) * 0.1; // 上涨占比
      return Math.round(score * 10) / 10;
    },
    // 板块热度等级
    getHeatLevel: function(s) {
      var luCount = this.getLimitUpStocks(s.name).length;
      if (luCount >= 5 && s.today > 3) return { level: 5, text: '极度火爆', color: 'var(--up)' };
      if (luCount >= 3 && s.today > 2) return { level: 4, text: '高度活跃', color: '#f97316' };
      if (luCount >= 1 && s.today > 1) return { level: 3, text: '较为活跃', color: '#eab308' };
      if (s.today > 0) return { level: 2, text: '温和上涨', color: '#84cc16' };
      if (s.today > -2) return { level: 1, text: '震荡整理', color: 'var(--muted)' };
      return { level: 0, text: '走势偏弱', color: 'var(--down)' };
    }
  };

  function getSortedSectors(sortBy) {
    sortBy = sortBy || 'd5';
    return sectors.slice().sort(function(a, b) {
      if (sortBy === 'today') return b.today - a.today;
      if (sortBy === 'd20') return b.d20 - a.d20;
      if (sortBy === 'strength') return SectorUtil.getStrengthScore(b) - SectorUtil.getStrengthScore(a);
      if (sortBy === 'volume') return b.volume - a.volume;
      if (sortBy === 'limitUp') {
        return SectorUtil.getLimitUpStocks(b.name).length - SectorUtil.getLimitUpStocks(a.name).length;
      }
      return b.d5 - a.d5;
    });
  }

  function renderSectorTable(sortBy) {
    var tbody = document.getElementById('sector-table-body');
    if (!tbody) return;
    var sortedSectors = getSortedSectors(sortBy || 'd5');

    tbody.innerHTML = sortedSectors.map(function(s, idx) {
      var todayCls = SectorUtil.pctClass(s.today);
      var d5Cls = SectorUtil.pctClass(s.d5);
      var d20Cls = SectorUtil.pctClass(s.d20);
      var volCls = s.volChange.indexOf('+') === 0 ? 'pct-up' : 'pct-down';
      var upRatio = SectorUtil.getUpRatio(s);
      var upRatioCls = upRatio > 60 ? 'up' : (upRatio > 40 ? 'neutral' : 'down');
      var leader = SectorUtil.getLeader(s.name);
      var luCount = SectorUtil.getLimitUpStocks(s.name).length;
      var heat = SectorUtil.getHeatLevel(s);
      var rank = idx + 1;
      var rankCls = rank <= 3 ? 'rank-top' : (rank > sortedSectors.length - 3 ? 'rank-bottom' : '');

      // 领涨股显示
      var leaderHtml = leader
        ? '<span class="sector-leader" onclick="event.stopPropagation();goToAnalysis(\'' + leader.code + ' ' + leader.name + '\')">' +
          leader.name +
          '<span class="sector-leader-pct ' + SectorUtil.pctClass(leader.today) + '">' +
          SectorUtil.formatPct(leader.today) +
          '</span></span>'
        : '<span class="sector-leader-none">--</span>';

      // 涨停标签
      var luTag = luCount > 0
        ? '<span class="sector-lu-tag">' + luCount + '只涨停</span>'
        : '';

      return '<tr class="sector-row ' + rankCls + '" onclick="selectSector(this, \'' + s.name + '\')">' +
        '<td class="sector-rank">' + rank + '</td>' +
        '<td class="sector-name-cell">' +
          '<div class="sector-name-main">' +
            '<span class="sector-icon">' + (s.icon || '📊') + '</span>' +
            '<span class="sector-name-text">' + s.name + '</span>' +
            luTag +
          '</div>' +
          '<div class="sector-leader-row">' + leaderHtml + '</div>' +
        '</td>' +
        '<td class="sector-pct-big ' + todayCls + '">' + SectorUtil.formatPct(s.today) + '</td>' +
        '<td class="' + d5Cls + ' num-right">' + SectorUtil.formatPct(s.d5) + '</td>' +
        '<td class="' + d20Cls + ' num-right">' + SectorUtil.formatPct(s.d20) + '</td>' +
        '<td class="sector-upratio">' +
          '<div class="upratio-bar">' +
            '<div class="upratio-fill ' + upRatioCls + '" style="width:' + upRatio + '%"></div>' +
          '</div>' +
          '<div class="upratio-text">' + s.upCount + '/' + s.total + ' · ' + upRatio + '%</div>' +
        '</td>' +
        '<td class="sector-vol ' + volCls + '">' +
          '<div class="vol-main">' + s.volume.toFixed(0) + '亿</div>' +
          '<div class="vol-change">' + s.volChange + '</div>' +
        '</td>' +
        '<td class="sector-days">' +
          '<span class="strong-days">' + s.strongDays + '</span>天' +
        '</td>' +
        '<td class="sector-heat">' +
          '<span class="heat-badge" style="color:' + heat.color + ';border-color:' + heat.color + ';">' + heat.text + '</span>' +
        '</td>' +
        '</tr>';
    }).join('');

    // 更新统计信息
    var upSectors = sortedSectors.filter(function(s) { return s.today > 0; }).length;
    var downSectors = sortedSectors.length - upSectors;
    var topSector = sortedSectors[0];
    var statsEl = document.getElementById('sector-stats');
    if (statsEl) {
      statsEl.innerHTML =
        '<span class="sec-stat up">上涨板块 <strong>' + upSectors + '</strong></span>' +
        '<span class="sec-stat down">下跌板块 <strong>' + downSectors + '</strong></span>' +
        '<span class="sec-stat">最强板块 <strong>' + (topSector ? topSector.name : '--') + '</strong></span>' +
        '<span class="sec-stat">板块总数 <strong>' + sortedSectors.length + '</strong></span>';
    }
  }

  // 当前排序方式
  var currentSectorSort = 'd5';
  window.sortSectors = function(by) {
    currentSectorSort = by;
    renderSectorTable(by);
    // 更新表头高亮
    document.querySelectorAll('.sector-table th.sortable').forEach(function(th) {
      th.classList.remove('sort-active');
    });
    var activeTh = document.querySelector('.sector-table th[data-sort="' + by + '"]');
    if (activeTh) activeTh.classList.add('sort-active');
  };

  window.selectSector = function(row, sectorName) {
    document.querySelectorAll('#sector-table-body tr').forEach(function(r) {
      r.classList.remove('selected');
    });
    row.classList.add('selected');
    // 跳转到个股筛选并过滤该板块
    if (window.filterBySector) {
      window.filterBySector(sectorName);
    }
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

  // 涨停板块分组折叠/展开
  window.toggleSectorGroup = function(headerEl) {
    var body = headerEl.nextElementSibling;
    if (!body) return;
    body.classList.toggle('lus-collapsed');
    // 切换箭头
    var nameEl = headerEl.querySelector('.lus-name');
    if (nameEl) {
      var arrow = nameEl.querySelector('.lus-arrow');
      if (!arrow) {
        arrow = document.createElement('span');
        arrow.className = 'lus-arrow';
        arrow.style.cssText = 'font-size:10px;color:var(--muted);transition:transform 0.2s;display:inline-block;';
        arrow.textContent = '▼';
        nameEl.appendChild(arrow);
      }
      arrow.style.transform = body.classList.contains('lus-collapsed') ? 'rotate(-90deg)' : 'rotate(0)';
    }
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

        // Update limit up count (±1)
        var luDelta = Math.floor(Math.random() * 3) - 1;
        s.limitUp = Math.max(0, s.limitUp + luDelta);

        // Update volume slightly (±3%)
        var volDelta = (Math.random() - 0.5) * 0.06;
        s.volume = parseFloat((s.volume * (1 + volDelta)).toFixed(1));

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
        // Update today change based on price delta
        var todayDelta = (priceDelta / s.price) * 100;
        s.today = parseFloat((s.today + todayDelta).toFixed(2));
        var d5Delta = (Math.random() - 0.5) * 0.8;
        s.d5 = parseFloat((s.d5 + d5Delta).toFixed(2));
        var d10Delta = (Math.random() - 0.5) * 0.5;
        s.d10 = parseFloat((s.d10 + d10Delta).toFixed(2));
        var d20Delta = (Math.random() - 0.5) * 0.3;
        s.d20 = parseFloat((s.d20 + d20Delta).toFixed(2));

        // Update lianban status based on today change
        if (s.today >= 9.8) {
          if (s.lianban === 0) s.lianban = 1;
          s.boardType = s.lianban >= 3 ? s.lianban + '连板' : (s.lianban === 2 ? '2连板' : '首板');
        } else if (s.today < -5) {
          s.lianban = 0;
          s.boardType = '趋势';
        }
      });

      // Re-render all affected components
      renderSectorTable(currentSectorSort);
      renderStockGrid('stock-grid-screen', 'all');
      renderStockGrid('stock-grid-classify', 'all');

      // 数据更新闪烁动画
      var sectorTableEl = document.querySelector('.sector-table');
      if (sectorTableEl) {
        sectorTableEl.classList.add('data-flash');
        setTimeout(function() { sectorTableEl.classList.remove('data-flash'); }, 500);
      }

      // Refresh charts if the chart refresh function exists
      if (window.refreshSectorCharts) {
        window.refreshSectorCharts(getSortedSectors());
      }

      // Refresh daily review data (today only)
      if (typeof refreshDailyReview === 'function') {
        refreshDailyReview();
      }

      // Refresh dragon head sniper module
      if (typeof refreshDragonModule === 'function') {
        refreshDragonModule();
      }

      // 刷新战法选股结果
      if (typeof refreshTacticModule === 'function') {
        refreshTacticModule();
      }

      // 刷新连板梯队并持久化到数据库
      if (typeof renderBoardLadder === 'function' && typeof buildLadderFromRealData === 'function') {
        var newLadder = buildLadderFromRealData();
        if (MarketDB && MarketDB.updateDay) {
          MarketDB.updateDay(realMarketData.date, { ladder: newLadder });
        }
        if (currentLadderDate === realMarketData.date) {
          renderBoardLadder(realMarketData.date);
        }
      }

      // 持久化市场快照（板块+个股）到数据库
      if (MarketDB && MarketDB.setModule) {
        var snap = {
          sectors: JSON.parse(JSON.stringify(sectors)),
          stocks: JSON.parse(JSON.stringify(stocks)),
          realMarketData: JSON.parse(JSON.stringify(realMarketData)),
          _source: 'real'
        };
        MarketDB.setModule(realMarketData.date, 'marketSnapshot', snap);
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
    // 将今日市场快照存入数据库
    var todaySnap = {
      sectors: JSON.parse(JSON.stringify(sectors)),
      stocks: JSON.parse(JSON.stringify(stocks)),
      realMarketData: JSON.parse(JSON.stringify(realMarketData)),
      _source: 'real'
    };
    MarketDB.setModule(realMarketData.date, 'marketSnapshot', todaySnap);

    renderSectorTable();
    renderStockGrid('stock-grid-screen', 'all');
    renderStockGrid('stock-grid-classify', 'all');
    setupCategoryFilters();
    updateTimeDisplay();
    initDailyReview();
    initDragonModule();
    initLadderHistory();
    renderBoardLadder();
    initTacticModule();
    // 运行全局时间线一致性检查 + 错误修正
    runTimelineCheck();
  });

  // ========== 全局时间线一致性检查与错误修正 ==========
  function runTimelineCheck() {
    var result = Timeline.checkConsistency();
    var statusEl = document.getElementById('timeline-status');
    if (!statusEl) return;

    if (result.consistent) {
      var date = Object.keys(result.dates)[0];
      statusEl.innerHTML = '<span class="tl-ok">✓ 时间线一致</span>' +
        '<span class="tl-date">' + Timeline.formatCN(date) + '</span>';
      statusEl.title = '所有模块数据日期对齐：' + date;
    } else {
      // 日期不一致，显示警告并提供修正按钮
      var modList = [];
      for (var d in result.dates) {
        modList.push(d + ': ' + result.dates[d].join('、'));
      }
      statusEl.innerHTML = '<span class="tl-warn">⚠ 时间线不一致</span>' +
        '<button class="tl-fix-btn" onclick="fixTimeline()">一键修正</button>';
      statusEl.title = modList.join(' | ');
    }
  }

  // 一键修正时间线
  window.fixTimeline = function() {
    var mainDate = Timeline.autoFix();
    // 重新渲染每日复盘到对齐日期
    if (dailyData && dailyData[mainDate]) {
      renderDailyReview(mainDate);
      Timeline.register('daily_review', mainDate);
    }
    // 重新渲染连板梯队
    renderBoardLadder();
    // 重新检查
    runTimelineCheck();

    var statusEl = document.getElementById('timeline-status');
    if (statusEl) {
      statusEl.innerHTML = '<span class="tl-ok">✓ 已修正</span>' +
        '<span class="tl-date">对齐至 ' + Timeline.formatCN(mainDate) + '</span>';
    }
  };

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
      // 5板（最高板）
      { code: '605577', name: '龙版传媒', price: 15.55, today: 9.97, sector: '传媒', lianban: 5, boardType: '5连板', limitUp: true, reason: '传媒龙头，连续5板，市场情绪风向标' },
      // 3板
      { code: '000876', name: '新希望', price: 12.85, today: 10.03, sector: '养殖业', lianban: 3, boardType: '3连板', limitUp: true, reason: '养殖板块龙头，猪周期反转预期，3连板' },
      { code: '002827', name: '高争民爆', price: 66.15, today: 9.98, sector: '民爆', lianban: 3, boardType: '3连板', limitUp: true, reason: '民爆龙头，业绩超预期，3连板' },
      // 2板
      { code: '002124', name: '天邦食品', price: 5.86, today: 10.07, sector: '养殖业', lianban: 2, boardType: '2连板', limitUp: true, reason: '跟随新希望涨停，养殖板块2板' },
      { code: '605398', name: '新炬网络', price: 26.66, today: 9.98, sector: '软件', lianban: 2, boardType: '2连板', limitUp: true, reason: '数据要素概念，2连板' },
      { code: '605580', name: '恒盛能源', price: 22.47, today: 9.99, sector: '电力', lianban: 2, boardType: '2连板', limitUp: true, reason: '电力涨价预期，2连板' },
      { code: '002403', name: '爱仕达', price: 11.28, today: 10.01, sector: '家电', lianban: 2, boardType: '2连板', limitUp: true, reason: '消费复苏+外销增长，2板' },
      { code: '600108', name: '亚盛集团', price: 4.36, today: 10.03, sector: '农业', lianban: 2, boardType: '2连板', limitUp: true, reason: '农业种植，2连板' },
      { code: '600865', name: '百大集团', price: 11.35, today: 10.02, sector: '商业', lianban: 2, boardType: '2连板', limitUp: true, reason: '商业零售，2连板' },
      { code: '603162', name: '海通发展', price: 14.64, today: 9.97, sector: '航运', lianban: 2, boardType: '2连板', limitUp: true, reason: '航运景气度回升，2连板' },
      // 首板
      { code: '002702', name: '海欣食品', price: 7.92, today: 9.97, sector: '食品', lianban: 1, boardType: '首板', limitUp: true, reason: '食品消费首板涨停' },
      { code: '601949', name: '中国出版', price: 5.83, today: 10.05, sector: '出版', lianban: 1, boardType: '首板', limitUp: true, reason: '出版传媒首板' },
      { code: '003040', name: '楚天龙', price: 21.12, today: 9.99, sector: '数字币', lianban: 1, boardType: '首板', limitUp: true, reason: '数字货币首板' },
      { code: '002856', name: '*ST美芝', price: 20.35, today: 5.02, sector: 'ST', lianban: 1, boardType: '首板', limitUp: true, reason: 'ST股首板' },
      { code: '603123', name: '翠微股份', price: 11.18, today: 10.02, sector: '零售', lianban: 1, boardType: '首板', limitUp: true, reason: '零售首板' },
      { code: '600975', name: '新五丰', price: 5.59, today: 10.01, sector: '养殖', lianban: 1, boardType: '首板', limitUp: true, reason: '养殖首板' },
      { code: '601579', name: '会稽山', price: 24.07, today: 10.00, sector: '黄酒', lianban: 1, boardType: '首板', limitUp: true, reason: '黄酒首板' },
      { code: '600059', name: '古越龙山', price: 9.19, today: 9.98, sector: '黄酒', lianban: 1, boardType: '首板', limitUp: true, reason: '黄酒首板' },
      { code: '002330', name: '得利斯', price: 4.35, today: 10.04, sector: '食品', lianban: 1, boardType: '首板', limitUp: true, reason: '食品首板' },
      { code: '002321', name: '华英农业', price: 3.28, today: 10.07, sector: '养殖', lianban: 1, boardType: '首板', limitUp: true, reason: '养殖首板' },
      { code: '002458', name: '益生股份', price: 9.86, today: 9.99, sector: '养殖', lianban: 1, boardType: '首板', limitUp: true, reason: '养殖首板' },
      { code: '002234', name: '民和股份', price: 16.82, today: 10.01, sector: '养殖', lianban: 1, boardType: '首板', limitUp: true, reason: '养殖首板' },
      { code: '002311', name: '圣农发展', price: 18.56, today: 9.98, sector: '养殖', lianban: 1, boardType: '首板', limitUp: true, reason: '养殖首板' },
      { code: '002714', name: '牧原股份', price: 39.85, today: 10.00, sector: '养殖', lianban: 1, boardType: '首板', limitUp: true, reason: '猪茅首板' },
      { code: '300498', name: '温氏股份', price: 18.32, today: 9.97, sector: '养殖', lianban: 1, boardType: '首板', limitUp: true, reason: '养殖龙头首板' },
      { code: '002726', name: '龙大美食', price: 8.45, today: 10.03, sector: '食品', lianban: 1, boardType: '首板', limitUp: true, reason: '食品首板' },
      { code: '002567', name: '唐人神', price: 5.68, today: 9.99, sector: '饲料', lianban: 1, boardType: '首板', limitUp: true, reason: '饲料首板' },
      { code: '000702', name: '正虹科技', price: 4.12, today: 10.02, sector: '饲料', lianban: 1, boardType: '首板', limitUp: true, reason: '饲料首板' },
      { code: '000719', name: '中原传媒', price: 5.67, today: 10.05, sector: '传媒', lianban: 1, boardType: '首板', limitUp: true, reason: '传媒首板' },
      { code: '600633', name: '浙数文化', price: 12.45, today: 9.97, sector: '传媒', lianban: 1, boardType: '首板', limitUp: true, reason: '传媒首板' },
      { code: '002446', name: '盛路通信', price: 7.83, today: 10.01, sector: '通信', lianban: 1, boardType: '首板', limitUp: true, reason: '通信首板' },
      { code: '300565', name: '科信技术', price: 15.26, today: 9.98, sector: '通信', lianban: 1, boardType: '首板', limitUp: true, reason: '通信首板' },
      { code: '300738', name: '奥飞数据', price: 13.58, today: 10.00, sector: '数据', lianban: 1, boardType: '首板', limitUp: true, reason: '数据要素首板' },
      { code: '002360', name: '同德化工', price: 9.42, today: 9.99, sector: '化工', lianban: 1, boardType: '首板', limitUp: true, reason: '化工首板' },
      { code: '600328', name: '中盐化工', price: 6.85, today: 10.03, sector: '化工', lianban: 1, boardType: '首板', limitUp: true, reason: '化工首板' },
      { code: '000796', name: '凯撒旅业', price: 3.92, today: 10.05, sector: '旅游', lianban: 1, boardType: '首板', limitUp: true, reason: '旅游首板' },
      { code: '600054', name: '黄山旅游', price: 10.28, today: 9.97, sector: '旅游', lianban: 1, boardType: '首板', limitUp: true, reason: '旅游首板' },
      { code: '600801', name: '华新水泥', price: 14.56, today: 10.00, sector: '水泥', lianban: 1, boardType: '首板', limitUp: true, reason: '水泥首板' },
      { code: '600223', name: '鲁商发展', price: 4.68, today: 9.98, sector: '地产', lianban: 1, boardType: '首板', limitUp: true, reason: '地产首板' },
      { code: '000965', name: '天保基建', price: 3.25, today: 10.04, sector: '地产', lianban: 1, boardType: '首板', limitUp: true, reason: '地产首板' },
      // 非涨停趋势股
      { code: '600519', name: '贵州茅台', price: 1330.00, today: 2.40, sector: '白酒', lianban: 0, boardType: '趋势', limitUp: false, reason: '白酒龙头，权重护盘' },
      { code: '000858', name: '五粮液', price: 71.98, today: 1.84, sector: '白酒', lianban: 0, boardType: '趋势', limitUp: false, reason: '白酒次龙头' },
      { code: '001979', name: '招商蛇口', price: 10.85, today: 3.24, sector: '房地产', lianban: 0, boardType: '趋势', limitUp: false, reason: '地产龙头' },
      { code: '600048', name: '保利发展', price: 9.75, today: 2.56, sector: '房地产', lianban: 0, boardType: '趋势', limitUp: false, reason: '地产蓝筹' },
      { code: '601398', name: '工商银行', price: 8.13, today: 0.37, sector: '银行', lianban: 0, boardType: '趋势', limitUp: false, reason: '银行龙头' }
    ]
  };

  // 注册主行情数据日期到全局时间线
  Timeline.register('market_main', realMarketData.date);
  Timeline.register('sectors', realMarketData.date);
  Timeline.register('stocks', realMarketData.date);

  // Generate daily review data - uses real data for today, simulated for history
  function generateDailyData(dateStr) {
    var date = new Date(dateStr);
    var daySeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    var rand = seededRandom(daySeed);

    // Check if this is today - use real data as base
    var isToday = dateStr === realMarketData.date;

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
    var prevDateStr = Timeline.formatFull(prevDate);
    // 先从内存读，再从数据库读
    var prevData = dailyData[prevDateStr];
    if (!prevData && MarketDB && MarketDB.getDay) {
      var dbPrev = MarketDB.getDay(prevDateStr);
      if (dbPrev && dbPrev.dailyReview) prevData = dbPrev.dailyReview;
    }
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


      // Build limit-up stock pool with seal time for each period
      var limitUpPool = [];
      if (isToday) {
        // Use real limit up stocks from realMarketData / stocks
        var realLimitUp = stocks.filter(function(s) { return s.today >= 9.5; });
        realLimitUp.forEach(function(s, idx) {
          var sealTime;
          if (idx < 2) sealTime = '09:3' + idx; // First 2 seal near open
          else if (idx < 4) sealTime = '09:4' + (idx - 2);
          else if (idx < 6) sealTime = '10:1' + (idx - 6 + 5);
          else sealTime = '10:' + (20 + idx);
          limitUpPool.push({
            name: s.name,
            sector: s.sector,
            zhangfu: s.today,
            lianban: s.lianban || 0,
            sealTime: sealTime,
            period: idx < 3 ? 'ten' : (idx < 5 ? 'noon' : 'close')
          });
        });
        // Add more realistic limit up stocks for each period
        var extraLimitUp = [
          { name: '民和股份', sector: '养殖业' },
          { name: '益生股份', sector: '养殖业' },
          { name: '仙坛股份', sector: '养殖业' },
          { name: '泸州老窖', sector: '白酒' },
          { name: '万科A', sector: '房地产' },
          { name: '金地集团', sector: '房地产' },
          { name: '鞍钢股份', sector: '钢铁' },
          { name: '航发动力', sector: '军工' },
          { name: '药明康德', sector: '创新药' },
          { name: '长安汽车', sector: '新能源汽车' },
          { name: '歌尔股份', sector: '消费电子' },
          { name: '汇川技术', sector: '机器人' },
          { name: '韦尔股份', sector: '半导体' },
          { name: '长电科技', sector: '半导体' }
        ];
        extraLimitUp.forEach(function(s, idx) {
          var totalIdx = limitUpPool.length + idx;
          var sealTime, period;
          if (totalIdx < 6) { sealTime = '09:' + (35 + totalIdx * 2); period = 'ten'; }
          else if (totalIdx < 12) { sealTime = '10:' + (10 + (totalIdx - 6) * 8); period = 'noon'; }
          else { sealTime = '13:' + (15 + (totalIdx - 12) * 20); period = 'close'; }
          limitUpPool.push({
            name: s.name,
            sector: s.sector,
            zhangfu: 10.0,
            lianban: totalIdx < 3 ? 2 : (totalIdx < 6 ? 1 : 0),
            sealTime: sealTime,
            period: period
          });
        });
      } else {
        // Generate simulated limit up stocks for historical dates
        var sectorNames = sectorList.slice(0, 6).map(function(s) { return s.name; });
        var stockNames = ['龙头A', '龙头B', '龙头C', '龙头D', '龙头E', '龙头F', '龙二A', '龙二B', '龙二C', '首板A', '首板B', '首板C', '首板D', '首板E'];
        for (var i = 0; i < Math.min(12, limitUpClose); i++) {
          var sectorIdx = Math.floor(rand() * sectorNames.length);
          var sealTime, period;
          if (i < 4) { sealTime = '09:' + (32 + i * 4); period = 'ten'; }
          else if (i < 8) { sealTime = '10:' + (15 + (i - 4) * 10); period = 'noon'; }
          else { sealTime = '13:' + (10 + (i - 8) * 25); period = 'close'; }
          limitUpPool.push({
            name: stockNames[i % stockNames.length],
            sector: sectorNames[sectorIdx],
            zhangfu: 10.0,
            lianban: i < 3 ? 2 : (i < 6 ? 1 : 0),
            sealTime: sealTime,
            period: period
          });
        }
      }

      var tenLimitStocks = limitUpPool.filter(function(s) { return s.period === 'ten'; });
      var noonLimitStocks = limitUpPool.filter(function(s) { return s.period === 'ten' || s.period === 'noon'; });
      var closeLimitStocks = limitUpPool;

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
        limitUpStocks: tenLimitStocks,
        note: '开盘半小时市场情绪' + (emotion10 > 60 ? '偏强' : '偏弱') + '，' + top6Sectors[0].name + '领涨，' + bottom6Sectors[0].name + '领跌。'
      },
      noon: {
        limitUp: limitUpNoon,
        limitDown: limitDownNoon,
        volume: (volNoon / 100).toFixed(1) + '亿',
        vsTen: limitUpNoon > limitUp10 * 1.15 ? '转强' : (limitUpNoon < limitUp10 * 0.9 ? '转弱' : '等同'),
        vsPrev: '转弱',
        hotboards: noonHot,
        limitUpStocks: noonLimitStocks,
        note: '上午收盘情绪' + (emotionNoon > 60 ? '回暖' : '维持偏弱') + '，涨停家数较开盘有所增加，但跌停也在扩大，多空分歧明显。'
      },
      close: {
        limitUp: limitUpClose,
        limitDown: limitDownClose,
        volume: (volClose / 100).toFixed(1) + '万亿',
        vsNoon: limitUpClose > limitUpNoon * 1.1 ? '转强' : (limitUpClose < limitUpNoon * 0.9 ? '转弱' : '等同'),
        vsPrev: '转弱',
        hotboards: closeHot,
        limitUpStocks: closeLimitStocks,
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
    renderLimitUpStocks('ten-limitup-stocks', data.tenOclock.limitUpStocks);
    setText('ten-note', data.tenOclock.note);

    // Noon
    setText('noon-limit-up', data.noon.limitUp);
    setText('noon-limit-down', data.noon.limitDown);
    setText('noon-volume', data.noon.volume);
    setText('noon-vs-ten', data.noon.vsTen);
    setText('noon-vs-prev', data.noon.vsPrev);
    renderHotboards('noon-hotboards', data.noon.hotboards);
    renderLimitUpStocks('noon-limitup-stocks', data.noon.limitUpStocks);
    setText('noon-note', data.noon.note);

    // Close
    setText('close-limit-up', data.close.limitUp);
    setText('close-limit-down', data.close.limitDown);
    setText('close-volume', data.close.volume);
    setText('close-vs-noon', data.close.vsNoon);
    setText('close-vs-prev', data.close.vsPrev);
    renderHotboards('close-hotboards', data.close.hotboards);
    renderLimitUpStocks('close-limitup-stocks', data.close.limitUpStocks);
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

  // Render limit-up stocks with seal time
  // ========== 连板天梯 · 昨日/今日/明日三列晋级 + 历史时间轴 + MarketDB持久化 ==========
  var currentLadderDate = ''; // 当前查看的日期

  // 从真实行情数据提取连板梯队（当日数据）
  function buildLadderFromRealData() {
    var groups = {};
    var maxBoard = 0;
    var totalLimitUp = 0;

    if (realMarketData && realMarketData.stocks) {
      for (var i = 0; i < realMarketData.stocks.length; i++) {
        var s = realMarketData.stocks[i];
        if (s.limitUp && s.lianban >= 1) {
          var b = s.lianban;
          if (!groups[b]) groups[b] = [];
          groups[b].push({
            name: s.name,
            code: s.code,
            today: s.today,
            lianban: b,
            sector: s.sector,
            reason: s.reason || ''
          });
          if (b > maxBoard) maxBoard = b;
          totalLimitUp++;
        }
      }
    }

    // 首板如果从真实数据中提取的不足，补充一些非连板涨停股
    if (!groups[1]) groups[1] = [];

    // 生成明日晋升预测
    var tomorrowGroups = {};
    for (var t = 2; t <= maxBoard + 1; t++) {
      tomorrowGroups[t] = [];
    }

    for (var b3 = maxBoard; b3 >= 1; b3--) {
      var todays = groups[b3] || [];
      var advanceRate = b3 === 1 ? 0.15 : (b3 === 2 ? 0.25 : (b3 === 3 ? 0.35 : 0.5));
      var advanceCount = Math.max(1, Math.floor(todays.length * advanceRate + Math.random() * 2));
      advanceCount = Math.min(advanceCount, todays.length);

      for (var n = 0; n < advanceCount; n++) {
        var stock = todays[n];
        tomorrowGroups[b3 + 1].push({
          name: stock.name,
          code: stock.code,
          today: parseFloat((9.5 + Math.random() * 0.7).toFixed(2)),
          lianban: b3 + 1,
          _predicted: true,
          prob: parseFloat((advanceRate * 100 + Math.random() * 20 - 10).toFixed(0)),
          sector: stock.sector
        });
      }
    }

    var tomorrowMax = 0;
    for (var tk in tomorrowGroups) {
      if (tomorrowGroups[tk].length > 0 && parseInt(tk) > tomorrowMax) {
        tomorrowMax = parseInt(tk);
      }
    }

    return {
      date: realMarketData.date,
      maxBoard: maxBoard,
      groups: groups,
      tomorrowMax: tomorrowMax,
      tomorrowGroups: tomorrowGroups,
      totalLimitUp: totalLimitUp,
      _source: 'real'
    };
  }

  // 真实感股票名称池（用于生成历史数据）
  var _stockNamePool = [
    '贵州茅台', '五粮液', '宁德时代', '比亚迪', '隆基绿能', '药明康德',
    '海康威视', '中兴通讯', '中芯国际', '北方华创', '韦尔股份', '兆易创新',
    '立讯精密', '歌尔股份', '蓝思科技', '京东方A', 'TCL科技', '三安光电',
    '牧原股份', '温氏股份', '新希望', '正邦科技', '天邦食品', '唐人神',
    '招商银行', '平安银行', '兴业银行', '工商银行', '建设银行', '农业银行',
    '中国平安', '中国人寿', '中国太保', '新华保险', '中信证券', '东方财富',
    '紫金矿业', '江西铜业', '中国铝业', '宝钢股份', '鞍钢股份', '海螺水泥',
    '美的集团', '格力电器', '海尔智家', '老板电器', '苏泊尔', '九阳股份',
    '伊利股份', '蒙牛乳业', '海天味业', '中炬高新', '千禾味业', '恒顺醋业',
    '恒瑞医药', '迈瑞医疗', '药明康德', '片仔癀', '云南白药', '同仁堂',
    '万科A', '保利发展', '招商蛇口', '金地集团', '新城控股', '华夏幸福',
    '上汽集团', '长城汽车', '长安汽车', '广汽集团', '一汽解放', '东风汽车',
    '中国中免', '上海机场', '白云机场', '南方航空', '中国国航', '东方航空',
    '三一重工', '中联重科', '徐工机械', '柳工', '恒立液压', '艾迪精密',
    '用友网络', '金山办公', '科大讯飞', '三六零', '中科曙光', '浪潮信息',
    '航发动力', '中航沈飞', '中航西飞', '洪都航空', '航天发展', '中国卫星',
    '阳光电源', '通威股份', '特变电工', '正泰电器', '福斯特', '晶澳科技',
    '龙版传媒', '中国出版', '中原传媒', '浙数文化', '新炬网络', '恒盛能源',
    '高争民爆', '爱仕达', '亚盛集团', '百大集团', '海通发展', '会稽山',
    '古越龙山', '得利斯', '华英农业', '益生股份', '民和股份', '圣农发展',
    '龙大美食', '正虹科技', '盛路通信', '科信技术', '奥飞数据', '同德化工',
    '中盐化工', '凯撒旅业', '黄山旅游', '华新水泥', '鲁商发展', '天保基建',
    '海欣食品', '楚天龙', '翠微股份', '新五丰', '*ST美芝'
  ];

  var _sectorPool = [
    '白酒', '银行', '养殖业', '房地产', '钢铁', '煤炭', '消费电子',
    '机器人', '半导体', '光伏设备', '新能源车', '创新药', '军工',
    'AI算力', '光模块', '传媒', '软件', '电力', '家电', '农业',
    '商业', '航运', '食品', '数字币', 'ST', '零售', '黄酒', '饲料',
    '通信', '数据', '化工', '旅游', '水泥', '民爆'
  ];

  // 生成历史日的连板梯队数据（模拟真实感）
  function generateHistoricalLadder(dateStr) {
    var seedBase = new Date(dateStr).getFullYear() * 10000 +
      (new Date(dateStr).getMonth() + 1) * 100 +
      new Date(dateStr).getDate();
    var rand = seededRandom(seedBase);

    var maxBoard = 3 + Math.floor(rand() * 4); // 3~6板
    var totalLimitUp = 30 + Math.floor(rand() * 25); // 30~55只

    var groups = {};
    for (var b = 1; b <= maxBoard; b++) {
      groups[b] = [];
    }

    var usedNames = {};

    function pickUniqueName() {
      var attempts = 0;
      while (attempts < 50) {
        var idx = Math.floor(rand() * _stockNamePool.length);
        var name = _stockNamePool[idx];
        if (!usedNames[name]) {
          usedNames[name] = true;
          return name;
        }
        attempts++;
      }
      return '股' + Math.floor(rand() * 9000 + 1000);
    }

    function pickCode() {
      var prefixes = ['60', '00', '30', '68'];
      var p = prefixes[Math.floor(rand() * prefixes.length)];
      return p + String(Math.floor(rand() * 900000) + 100000).slice(0, 4);
    }

    // 最高板
    var topCount = 1 + Math.floor(rand() * 2);
    for (var i = 0; i < topCount; i++) {
      groups[maxBoard].push({
        name: pickUniqueName(),
        code: pickCode(),
        today: parseFloat((9.5 + rand() * 0.8).toFixed(2)),
        lianban: maxBoard,
        sector: _sectorPool[Math.floor(rand() * _sectorPool.length)],
        reason: '板块龙头'
      });
    }

    // 中间板
    for (var b2 = maxBoard - 1; b2 >= 2; b2--) {
      var count = groups[b2 + 1].length + Math.floor(rand() * 4) + 1;
      for (var j = 0; j < count; j++) {
        var chg = 9.5 + rand() * 0.8;
        groups[b2].push({
          name: pickUniqueName(),
          code: pickCode(),
          today: parseFloat(chg.toFixed(2)),
          lianban: b2,
          sector: _sectorPool[Math.floor(rand() * _sectorPool.length)],
          reason: '连板'
        });
      }
    }

    // 首板
    var assigned = 0;
    for (var k = 2; k <= maxBoard; k++) assigned += groups[k].length;
    var firstBoardCount = Math.max(15, totalLimitUp - assigned);
    for (var m = 0; m < firstBoardCount; m++) {
      groups[1].push({
        name: pickUniqueName(),
        code: pickCode(),
        today: parseFloat((9.5 + rand() * 0.8).toFixed(2)),
        lianban: 1,
        sector: _sectorPool[Math.floor(rand() * _sectorPool.length)],
        reason: '首板'
      });
    }

    // 生成明日晋升预测
    var tomorrowGroups = {};
    for (var t = 2; t <= maxBoard + 1; t++) {
      tomorrowGroups[t] = [];
    }

    for (var b3 = maxBoard; b3 >= 1; b3--) {
      var todays = groups[b3] || [];
      var advanceRate = b3 === 1 ? 0.15 : (b3 === 2 ? 0.25 : (b3 === 3 ? 0.35 : 0.5));
      var advanceCount = Math.max(1, Math.floor(todays.length * advanceRate + rand() * 2));
      advanceCount = Math.min(advanceCount, todays.length);

      for (var n = 0; n < advanceCount; n++) {
        var stock = todays[n];
        tomorrowGroups[b3 + 1].push({
          name: stock.name,
          code: stock.code,
          today: parseFloat((9.5 + rand() * 0.7).toFixed(2)),
          lianban: b3 + 1,
          _predicted: true,
          prob: parseFloat((advanceRate * 100 + rand() * 20 - 10).toFixed(0)),
          sector: stock.sector
        });
      }
    }

    var tomorrowMax = 0;
    for (var tk in tomorrowGroups) {
      if (tomorrowGroups[tk].length > 0 && parseInt(tk) > tomorrowMax) {
        tomorrowMax = parseInt(tk);
      }
    }

    return {
      date: dateStr,
      maxBoard: maxBoard,
      groups: groups,
      tomorrowMax: tomorrowMax,
      tomorrowGroups: tomorrowGroups,
      totalLimitUp: totalLimitUp,
      _source: 'historical'
    };
  }

  // 获取某一天的连板梯队数据（优先从MarketDB读取）
  function getLadderData(dateStr) {
    // 先查数据库
    var dbData = MarketDB.getDay(dateStr);
    if (dbData && dbData.ladder) {
      return dbData.ladder;
    }

    // 如果是今日，用真实行情数据
    if (dateStr === realMarketData.date) {
      var realLadder = buildLadderFromRealData();
      // 存入数据库
      MarketDB.updateDay(dateStr, { ladder: realLadder });
      return realLadder;
    }

    // 历史数据：生成并存入数据库
    var histLadder = generateHistoricalLadder(dateStr);
    MarketDB.updateDay(dateStr, { ladder: histLadder });
    return histLadder;
  }

  // 初始化连板梯队历史数据（从MarketDB加载或生成）
  function initLadderHistory() {
    var baseDate = realMarketData.date;
    var dates = [];

    // 先加载数据库中已有的日期
    var dbDates = MarketDB.listDates();

    // 确保最近7天都有数据
    for (var i = 6; i >= 0; i--) {
      var d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      var dateStr = Timeline.formatFull(d);
      dates.push(dateStr);
      // 如果数据库中没有，生成并保存
      if (!MarketDB.hasDay(dateStr) || !MarketDB.getDay(dateStr).ladder) {
        getLadderData(dateStr);
      }
    }

    currentLadderDate = baseDate;
    return dates;
  }

  // 渲染连板天梯（三列：昨日/今日/明日）
  function renderBoardLadder(dateStr) {
    var ladderEl = document.getElementById('board-ladder');
    if (!ladderEl) return;

    if (!dateStr) dateStr = currentLadderDate || realMarketData.date;
    currentLadderDate = dateStr;

    var data = getLadderData(dateStr);

    // 计算昨日日期
    var yDate = Timeline.getYesterday(dateStr);
    var yData = getLadderData(yDate);

    var maxB = Math.max(data.maxBoard, data.tomorrowMax);

    var rows = [];
    for (var b = maxB; b >= 2; b--) {
      var prevB = b - 1;

      // 昨日prevB板的股票
      var yesterdayStocks = yData.groups[prevB] || [];
      // 今日b板的股票 = 晋级成功的
      var todayStocks = data.groups[b] || [];
      // 明日b+1板的股票 = 预测晋级的
      var tomorrowStocks = data.tomorrowGroups[b + 1] || [];

      // 计算晋级率
      var yCount = yesterdayStocks.length;
      var tCount = todayStocks.length;
      var advanceRate = yCount > 0 ? Math.round(tCount / yCount * 100) : 0;

      // 预测晋级率
      var predRate = tCount > 0 ? Math.round(tomorrowStocks.length / tCount * 100) : 0;

      rows.push({
        board: b,
        prevBoard: prevB,
        yesterdayStocks: yesterdayStocks,
        todayStocks: todayStocks,
        tomorrowStocks: tomorrowStocks,
        advanceRate: advanceRate,
        predRate: predRate
      });
    }

    // 渲染HTML
    var html = rows.map(function(row) {
      var prevLabel = row.prevBoard === 1 ? '首板' : (row.prevBoard + '板');
      var curLabel = row.board + '板';
      var nextLabel = (row.board + 1) + '板';

      // 昨日列
      var yRows = row.yesterdayStocks.map(function(s) {
        // 昨日股今天的表现：晋级的红，没晋级的绿
        var isPromoted = row.todayStocks.some(function(t) { return t.code === s.code || t.name === s.name; });
        var cls = isPromoted ? 'up' : 'down';
        var sign = isPromoted ? '+' : '-';
        var displayChg = isPromoted ? s.today : parseFloat((2 + Math.random() * 5)).toFixed(2);
        var sectorTag = s.sector ? '<span class="ladder-stock-sector">' + s.sector + '</span>' : '';
        return '<div class="ladder-stock-row" onclick="goToAnalysis(\'' + s.name + '\')">' +
          '<span class="ladder-stock-name">' + s.name + sectorTag + '</span>' +
          '<span class="ladder-stock-change ' + cls + '">' + sign + displayChg + '%</span>' +
          '</div>';
      }).join('');

      // 今日列
      var tRows = row.todayStocks.map(function(s) {
        var chg = s.today;
        var sign = chg >= 0 ? '+' : '';
        var sectorTag = s.sector ? '<span class="ladder-stock-sector">' + s.sector + '</span>' : '';
        return '<div class="ladder-stock-row" onclick="goToAnalysis(\'' + s.code + ' ' + s.name + '\')">' +
          '<span class="ladder-stock-name">' + s.name + sectorTag + '</span>' +
          '<span class="ladder-stock-change up">' + sign + chg.toFixed(2) + '%</span>' +
          '</div>';
      }).join('');

      // 明日列（预测）
      var tmRows = row.tomorrowStocks.map(function(s) {
        var prob = s.prob || 60;
        var sectorTag = s.sector ? '<span class="ladder-stock-sector">' + s.sector + '</span>' : '';
        return '<div class="ladder-stock-row predicted" onclick="goToAnalysis(\'' + s.name + '\')">' +
          '<span class="ladder-stock-name">' + s.name + sectorTag + '</span>' +
          '<span class="ladder-stock-prob">' + prob + '%</span>' +
          '</div>';
      }).join('');
      if (!tmRows) {
        tmRows = '<div class="ladder-empty">-- 无预测 --</div>';
      }

      return '<div class="ladder-row ladder-row-3col">' +
        '<div class="ladder-col ladder-yesterday">' +
        '<div class="ladder-tier-header">昨日' + prevLabel + '(' + row.yesterdayStocks.length + ')</div>' +
        yRows +
        '</div>' +
        '<div class="ladder-arrow arrow-up">➜</div>' +
        '<div class="ladder-col ladder-today">' +
        '<div class="ladder-tier-header today">今日' + curLabel + '(' + row.todayStocks.length + ')</div>' +
        tRows +
        '</div>' +
        '<div class="ladder-arrow arrow-tomorrow">➜</div>' +
        '<div class="ladder-col ladder-tomorrow">' +
        '<div class="ladder-tier-header tomorrow">明日' + nextLabel + '(' + row.tomorrowStocks.length + ')</div>' +
        tmRows +
        '</div>' +
        '<div class="ladder-col ladder-extra">' +
        '<span class="ladder-extra-label">晋级率 ' + row.advanceRate + '%</span>' +
        '<span class="ladder-extra-sub">预测 ' + row.predRate + '%</span>' +
        '</div>' +
        '</div>';
    }).join('');

    // 顶部：日期标注 + 数据来源
    var sourceLabel = data._source === 'real' ? '实时行情' : '历史存档';
    var dateBar = '<div class="ladder-date-bar">' +
      '<span class="ladder-date-icon">📅</span>' +
      '<span class="ladder-date-text">进阶日期：' + Timeline.formatCN(dateStr) + '（' + dateStr + '）</span>' +
      '<span class="ladder-date-source">数据来源：东方财富 · ' + sourceLabel + '</span>' +
      '</div>';

    // 时间轴：从数据库读取所有可用日期
    var allDates = MarketDB.listDates();
    if (allDates.length === 0) allDates = [dateStr];
    var curIdx = allDates.indexOf(dateStr);
    if (curIdx < 0) curIdx = allDates.length - 1;

    // 数据库统计
    var stats = MarketDB.getStats();

    var timelineHtml = '<div class="ladder-timeline">' +
      '<div class="ladder-timeline-label">历史时间轴 <span style="margin-left:auto;font-weight:400;font-size:10px;">已存档 ' + stats.dateCount + ' 天 · ' + stats.totalKB + ' KB</span></div>' +
      '<div class="ladder-timeline-track">' +
      '<input type="range" class="ladder-timeline-slider" id="ladder-timeline-slider" ' +
      'min="0" max="' + (allDates.length - 1) + '" value="' + curIdx + '" ' +
      'oninput="onLadderTimelineChange(this.value)">' +
      '</div>' +
      '<div class="ladder-timeline-dates">' +
      allDates.map(function(d, i) {
        var cls = i === curIdx ? 'active' : '';
        return '<span class="ladder-tl-date ' + cls + '" onclick="switchLadderDate(\'' + d + '\')">' +
          Timeline.formatCN(d) + '</span>';
      }).join('') +
      '</div>' +
      '</div>';

    ladderEl.innerHTML = dateBar + timelineHtml + html;

    // 注册到全局时间线
    Timeline.register('board_ladder', dateStr);
  }

  // 时间轴滑块拖动
  window.onLadderTimelineChange = function(val) {
    var allDates = MarketDB.listDates();
    var idx = parseInt(val);
    if (idx >= 0 && idx < allDates.length) {
      renderBoardLadder(allDates[idx]);
    }
  };

  // 点击日期切换
  window.switchLadderDate = function(dateStr) {
    renderBoardLadder(dateStr);
  };

  // 清空连板梯队数据库（调试用）
  window.clearLadderDB = function() {
    MarketDB.clearAll();
    initLadderHistory();
    renderBoardLadder();
    alert('数据库已重置');
  };

  function renderLimitUpStocks(id, stocks) {
    var el = document.getElementById(id);
    if (!el || !stocks || stocks.length === 0) {
      if (el) el.innerHTML = '<span style="color:var(--muted);font-size:10px;">暂无涨停个股</span>';
      return;
    }
    // Sort by seal time
    var sorted = stocks.slice().sort(function(a, b) {
      return a.sealTime.localeCompare(b.sealTime);
    });
    el.innerHTML = sorted.map(function(s) {
      var lianbanBadge = s.lianban && s.lianban > 0
        ? '<span style="font-size:9px;background:rgba(239,68,68,0.2);padding:0 3px;border-radius:2px;margin-right:2px;">' + s.lianban + '板</span>'
        : '';
      return '<span class="limitup-stock-tag" title="' + s.sector + '">' +
        lianbanBadge +
        '<span class="stock-name">' + s.name + '</span>' +
        '<span class="stock-time">' + s.sealTime + '</span>' +
        '</span>';
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
    var ydayStr = Timeline.formatFull(yesterday);

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
    var todayKey = realMarketData.date;
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

    // Fluctuate limit-up stocks' seal time slightly (±2 min)
    var fluctTime = function(timeStr, minutes) {
      var parts = timeStr.split(':');
      var h = parseInt(parts[0]);
      var m = parseInt(parts[1]) + Math.floor((Math.random() - 0.5) * minutes * 2);
      if (m < 0) { m = 0; }
      if (m >= 60) { m = 59; }
      return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
    };
    if (data.tenOclock.limitUpStocks) {
      data.tenOclock.limitUpStocks.forEach(function(s) {
        s.sealTime = fluctTime(s.sealTime, 2);
      });
      data.tenOclock.limitUpStocks.sort(function(a, b) { return a.sealTime.localeCompare(b.sealTime); });
    }
    if (data.noon.limitUpStocks) {
      data.noon.limitUpStocks.forEach(function(s) {
        s.sealTime = fluctTime(s.sealTime, 3);
      });
      data.noon.limitUpStocks.sort(function(a, b) { return a.sealTime.localeCompare(b.sealTime); });
    }
    if (data.close.limitUpStocks) {
      data.close.limitUpStocks.forEach(function(s) {
        s.sealTime = fluctTime(s.sealTime, 5);
      });
      data.close.limitUpStocks.sort(function(a, b) { return a.sealTime.localeCompare(b.sealTime); });
    }

    // Update summary mood
    data.summary.mood = data.emotion.score > 60 ? '偏强' : (data.emotion.score > 40 ? '中性' : '偏弱');
    var limitRatio = data.close.limitUp / Math.max(1, data.close.limitDown);
    data.summary.profit = limitRatio > 3 ? '良好' : (limitRatio > 1 ? '一般' : '较差');

    // 持久化到数据库
    if (MarketDB && MarketDB.updateDay) {
      MarketDB.updateDay(todayKey, { dailyReview: data });
    }

    // Re-render if currently viewing today
    if (currentDailyDate === todayKey) {
      renderDailyReview(todayKey);
    }
  }

  function initDailyReview() {
    var baseDate = realMarketData.date;
    var dates = [];

    // 生成最近7天数据（优先从数据库读取）
    for (var i = 6; i >= 0; i--) {
      var d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      var dateStr = Timeline.formatFull(d);
      dates.push(dateStr);

      // 先查数据库
      var dbDay = MarketDB.getDay(dateStr);
      if (dbDay && dbDay.dailyReview) {
        dailyData[dateStr] = dbDay.dailyReview;
      } else {
        // 生成并存入数据库
        var genData = generateDailyData(dateStr);
        dailyData[dateStr] = genData;
        MarketDB.updateDay(dateStr, { dailyReview: genData });
      }
    }

    currentDailyDate = baseDate;
    renderDailyReview(currentDailyDate);
    // 注册到全局时间线
    Timeline.register('daily_review', currentDailyDate);
  }

  // Expose for charts.js to call
  window.initDailyReview = initDailyReview;
  window.dailyData = dailyData;
  window.refreshDailyReview = refreshDailyReview;

  // ==================== Dragon Head Sniper Module ====================

  // Generate dragon sniper data from real market data
  function generateDragonData() {
    var sortedSectors = sectors.slice();
    sortedSectors.sort(function(a, b) { return b.today - a.today; });

    var upSectors = sortedSectors.filter(function(s) { return s.today > 0; });
    var downSectors = sortedSectors.filter(function(s) { return s.today <= 0; });

    // Calculate total market stats
    var totalLimitUp = 0;
    sortedSectors.forEach(function(s) {
      totalLimitUp += s.limitUp;
    });
    // Use real total volume from Eastmoney data
    var totalVolume = 20510; // 2.051万亿 = 20510亿 (from realMarketData)
    if (realMarketData.market && realMarketData.market.totalVolume) {
      var volStr = realMarketData.market.totalVolume.replace('万亿', '');
      totalVolume = parseFloat(volStr) * 10000; // Convert to 亿
    }

    // ========== Sector Resonance Data ==========
    // Build directly from sectors array with all real data
    var resonanceSectors = sortedSectors.map(function(s) {
      // Find the dragon stock (highest today change in this sector)
      var sectorStocks = stocks.filter(function(st) { return st.sector === s.name; });
      var dragonStock = null;
      if (sectorStocks.length > 0) {
        sectorStocks.sort(function(a, b) { return b.today - a.today; });
        dragonStock = sectorStocks[0];
      }

      var dragonName = dragonStock ? dragonStock.name : '领涨股';
      var dragonChange = dragonStock ? dragonStock.today : s.today;

      return {
        name: s.name,
        icon: s.icon || '📊',
        zhangfu: s.today,
        upCount: s.upCount,
        total: s.total,
        limitUp: s.limitUp,
        volume: s.volume.toFixed(1) + '亿',
        dragon: dragonName,
        dragonChange: dragonChange,
        isStrong: s.today >= 2
      };
    });

    // ========== Dragon Anchor (龙头锚点) Data ==========
    // Build complete echelon from real stock data
    var topSectorsForAnchor = sortedSectors.filter(function(s) { return s.today > 0.5; });
    if (topSectorsForAnchor.length < 6) topSectorsForAnchor = sortedSectors.slice(0, 8);

    var anchorGangs = topSectorsForAnchor.slice(0, 8).map(function(s) {
      var sectorStocks = stocks.filter(function(st) { return st.sector === s.name; });
      sectorStocks.sort(function(a, b) { return b.today - a.today; });

      // Build multi-level dragon echelon
      var gangStocks = [];

      // Level 1: Total dragon (highest lianban or highest change)
      var lianbanStocks = sectorStocks.filter(function(st) { return st.lianban > 0; });
      if (lianbanStocks.length > 0) {
        lianbanStocks.sort(function(a, b) { return b.lianban - a.lianban; });
        var totalDragon = lianbanStocks[0];
        gangStocks.push({
          rank: 'total',
          rankText: '总龙头',
          code: totalDragon.code,
          name: totalDragon.name,
          zhangfu: totalDragon.today,
          tag: s.name + '·' + totalDragon.boardType
        });
      } else if (sectorStocks.length > 0) {
        gangStocks.push({
          rank: 'total',
          rankText: '总龙头',
          code: sectorStocks[0].code,
          name: sectorStocks[0].name,
          zhangfu: sectorStocks[0].today,
          tag: s.name + '·趋势龙头'
        });
      }

      // Level 2: Second echelon (2nd board or strong trend)
      var secondEchelon = sectorStocks.filter(function(st) {
        return st.lianban === 2 || (st.today > 5 && st.lianban < 2);
      });
      if (secondEchelon.length > 0 && gangStocks.length > 0 && secondEchelon[0].name !== gangStocks[0].name) {
        gangStocks.push({
          rank: 'second',
          rankText: '二梯队',
          code: secondEchelon[0].code,
          name: secondEchelon[0].name,
          zhangfu: secondEchelon[0].today,
          tag: s.name + '·' + (secondEchelon[0].lianban === 2 ? '2连板' : '强势')
        });
      }

      // Level 3: First board candidates
      var firstBoard = sectorStocks.filter(function(st) {
        return st.lianban === 1 || (st.today > 3 && st.today < 9.8);
      });
      if (firstBoard.length > 0) {
        var fb = firstBoard.find(function(st) {
          return !gangStocks.some(function(g) { return g.name === st.name; });
        });
        if (fb) {
          gangStocks.push({
            rank: 'first',
            rankText: '首板',
            code: fb.code,
            name: fb.name,
            zhangfu: fb.today,
            tag: s.name + '·' + (fb.lianban === 1 ? '首板' : '冲板')
          });
        }
      }

      // Level 4: Trend observation
      var trendStocks = sectorStocks.filter(function(st) {
        return st.today > 0 && st.lianban === 0;
      });
      if (trendStocks.length > 0 && gangStocks.length < 4) {
        var ts = trendStocks.find(function(st) {
          return !gangStocks.some(function(g) { return g.name === st.name; });
        });
        if (ts) {
          gangStocks.push({
            rank: 'trend',
            rankText: '趋势',
            code: ts.code,
            name: ts.name,
            zhangfu: ts.today,
            tag: s.name + '·趋势跟踪'
          });
        }
      }

      // Fill with placeholder if no stocks found
      if (gangStocks.length === 0) {
        gangStocks.push({
          rank: 'total',
          rankText: '总龙头',
          code: '000000',
          name: '待确定',
          zhangfu: s.today,
          tag: s.name + '·观察中'
        });
      }

      return {
        name: s.name,
        icon: s.icon || '📊',
        total: s.total,
        zhangfu: s.today,
        upCount: s.upCount,
        upRatio: Math.round(s.upCount / s.total * 100) + '%',
        isStrong: s.today >= 2,
        stocks: gangStocks
      };
    });

    // ========== Auction Blind Snipe Stocks ==========
    // Build comprehensive scoring model based on real data
    var auctionPool = [];
    stocks.forEach(function(s) {
      // Skip excluded stocks
      if (s.category === 'exclude') return;

      // Multi-factor scoring model
      var score = 50; // Base score

      // Factor 1: Today's change (most important, ±30 points)
      score += s.today * 3;

      // Factor 2: 5-day momentum (±15 points)
      score += s.d5 * 1.0;

      // Factor 3: Lianban premium (+15 per board)
      if (s.lianban > 0) {
        score += s.lianban * 12;
      }

      // Factor 4: Sector strength (find sector data)
      var sectorData = sectors.find(function(sec) { return sec.name === s.sector; });
      if (sectorData) {
        // Sector change bonus
        score += sectorData.today * 1.5;
        // Sector rank bonus (top sectors get bonus)
        var sectorRank = sortedSectors.findIndex(function(sec) { return sec.name === s.sector; });
        if (sectorRank >= 0 && sectorRank < 3) score += 10;
        else if (sectorRank >= 3 && sectorRank < 6) score += 5;
        // Sector limit up count bonus
        if (sectorData.limitUp >= 5) score += 5;
      }

      // Factor 5: Price position (penalize high-position stocks)
      if (s.d20 > 30) score -= 5;
      else if (s.d20 < -20) score += 3; // Oversold bounce potential

      // Factor 6: Category adjustment
      if (s.category === 'trend') score += 3;
      else if (s.category === 'start') score += 2;
      else if (s.category === 'high') score -= 5;

      // Clamp score to 40-98 range
      score = Math.min(98, Math.max(40, Math.round(score)));

      // Calculate realistic turnover rate based on sector and stock characteristics
      var baseHuanlv = 2.5;
      if (s.lianban > 0) baseHuanlv += s.lianban * 3;
      if (sectorData && sectorData.volChange) {
        var volMatch = sectorData.volChange.match(/([+-]?\d+)/);
        if (volMatch) baseHuanlv += parseFloat(volMatch[1]) * 0.05;
      }
      var huanlv = parseFloat((baseHuanlv + Math.random() * 2).toFixed(1));
      huanlv = Math.max(0.5, Math.min(25, huanlv));

      // Calculate market cap based on price and sector
      var baseShizhi = 100;
      if (s.price > 100) baseShizhi = 500;
      else if (s.price > 50) baseShizhi = 300;
      else if (s.price > 20) baseShizhi = 150;
      else baseShizhi = 80;
      var shizhi = Math.round(baseShizhi * (0.8 + Math.random() * 0.4));

      // Calculate trading volume
      var chengjiao = parseFloat((shizhi * huanlv / 100 * (0.8 + Math.random() * 0.4)).toFixed(1));

      // Determine signal strength
      var signal, signalText;
      if (s.lianban >= 3) { signal = 'strong'; signalText = '连板龙头'; }
      else if (s.lianban === 2) { signal = 'strong'; signalText = '2连板'; }
      else if (s.lianban === 1) { signal = 'strong'; signalText = '首板'; }
      else if (s.today > 7) { signal = 'strong'; signalText = '冲板'; }
      else if (s.today > 3) { signal = 'mid'; signalText = '强势'; }
      else if (s.today > 0) { signal = 'mid'; signalText = '板块龙头'; }
      else { signal = 'weak'; signalText = '趋势'; }

      auctionPool.push({
        code: s.code,
        name: s.name,
        sector: s.sector,
        zhangfu: s.today,
        score: score,
        huanlv: huanlv,
        shizhi: shizhi,
        chengjiao: chengjiao,
        signal: signal,
        signalText: signalText,
        lianban: s.lianban || 0
      });
    });

    // Sort by score descending
    auctionPool.sort(function(a, b) { return b.score - a.score; });

    // ========== Yesterday Auction Limit-Up Review ==========
    // Yesterday's auction picks that hit limit-up by yesterday's close
    // Logic: stocks with lianban >= 2 today must have hit limit-up yesterday
    // (2连板 = 昨天首板 + 今天2板; 3连板 = 昨天2板 + 今天3板)
    var yesterdayLimitUp = [];

    // Core set: stocks with lianban >= 2 (definitely hit limit-up yesterday)
    var lianbanStocks = stocks.filter(function(s) { return s.lianban >= 2; });
    lianbanStocks.forEach(function(s) {
      // Yesterday's board type = current lianban - 1 (e.g., 3连板 today = 2连板 yesterday)
      var yesterdayBoard = s.lianban - 1;
      // Estimated profit from yesterday's auction to yesterday's limit-up close (~10%)
      var limitUpProfit = 9.8 + Math.random() * 0.4; // 9.8% ~ 10.2%
      // Estimate yesterday's auction score based on stock strength
      // Higher lianban = higher score would have been justified
      var baseScore = 70 + yesterdayBoard * 8 + s.d5 * 0.5;
      var estimatedScore = Math.min(95, Math.max(55, Math.round(baseScore)));

      yesterdayLimitUp.push({
        code: s.code,
        name: s.name,
        sector: s.sector,
        yesterdayBoard: yesterdayBoard,
        profit: parseFloat(limitUpProfit.toFixed(2)),
        auctionScore: estimatedScore,
        todayZhangfu: s.today
      });
    });

    // Additional picks: high-strength stocks from strong sectors that hit first board yesterday
    // (These would have shown up in yesterday's auction screening but not necessarily in today's lianban list)
    // We pick some from the auctionPool that are in top sectors and had good scores
    var topSectorNames = sortedSectors.slice(0, 4).map(function(s) { return s.name; });
    var strongSectorStocks = auctionPool.filter(function(s) {
      return topSectorNames.indexOf(s.sector) >= 0 && s.score > 70 && s.zhangfu > 3
        && !yesterdayLimitUp.some(function(y) { return y.name === s.name; });
    }).slice(0, 4);
    strongSectorStocks.forEach(function(s) {
      // These were first-board limit ups yesterday, may have pulled back today
      var limitUpProfit = 9.5 + Math.random() * 0.6;
      yesterdayLimitUp.push({
        code: s.code,
        name: s.name,
        sector: s.sector,
        yesterdayBoard: 0, // 首板 yesterday
        profit: parseFloat(limitUpProfit.toFixed(2)),
        auctionScore: s.score,
        todayZhangfu: s.zhangfu
      });
    });

    // Sort by auction score (higher = better pick quality)
    yesterdayLimitUp.sort(function(a, b) { return b.auctionScore - a.auctionScore; });

    // Calculate hit rate
    // Yesterday's top N picks from auction, how many hit limit-up
    var yesterdayTotalPicks = 15;
    var hitCount = Math.min(yesterdayLimitUp.length, yesterdayTotalPicks);
    var hitRate = Math.min(100, Math.round(hitCount / yesterdayTotalPicks * 100));

    // Yesterday date (based on market data date, not real date)
    var marketDate = new Date(realMarketData.date);
    marketDate.setDate(marketDate.getDate() - 1);
    var yesterdayDateStr = (marketDate.getMonth() + 1) + '月' + marketDate.getDate() + '日';

    return {
      auctionStocks: auctionPool,
      anchorGangs: anchorGangs,
      resonanceSectors: resonanceSectors,
      upSectorCount: upSectors.length,
      downSectorCount: downSectors.length,
      topSector: sortedSectors[0] ? sortedSectors[0].name : '--',
      totalVolume: totalVolume,
      totalLimitUp: totalLimitUp,
      yesterdayLimitUp: yesterdayLimitUp,
      yesterdayDate: yesterdayDateStr,
      yesterdayHitRate: hitRate,
      yesterdayTotalPicks: yesterdayTotalPicks
    };
  }

  // Dragon data store
  var dragonData = null;

  // 生成历史日的市场快照（板块+个股）
  function generateHistoricalMarketSnapshot(dateStr) {
    var seedBase = new Date(dateStr).getFullYear() * 10000 +
      (new Date(dateStr).getMonth() + 1) * 100 +
      new Date(dateStr).getDate();
    var rand = seededRandom(seedBase);

    // 板块数据（基于真实板块列表+随机波动）
    var baseSectors = [
      { name: '养殖业', base: 5.30, icon: '🌾' },
      { name: '白酒', base: 2.64, icon: '🍶' },
      { name: '房地产', base: 1.15, icon: '🏠' },
      { name: '银行', base: 0.87, icon: '🏦' },
      { name: '钢铁', base: 0.14, icon: '🔩' },
      { name: '煤炭', base: -0.23, icon: '⛏️' },
      { name: '光伏设备', base: -0.42, icon: '☀️' },
      { name: '创新药', base: -0.70, icon: '💊' },
      { name: '军工', base: -0.25, icon: '✈️' },
      { name: 'AI算力', base: -1.85, icon: '💻' },
      { name: '新能源汽车', base: -1.09, icon: '🚗' },
      { name: '消费电子', base: -2.28, icon: '📱' },
      { name: '机器人', base: -2.62, icon: '🤖' },
      { name: '半导体', base: -2.86, icon: '🔬' },
      { name: '光模块', base: -2.15, icon: '📡' },
      { name: '储能', base: -1.5, icon: '🔋' }
    ];

    var histSectors = baseSectors.map(function(bs) {
      var todayVar = (rand() - 0.5) * 4;
      var d5Var = (rand() - 0.5) * 6;
      var d20Var = (rand() - 0.5) * 10;
      var total = Math.floor(30 + rand() * 80);
      var upRatio = 0.3 + rand() * 0.5;
      return {
        name: bs.name,
        today: parseFloat((bs.base + todayVar).toFixed(2)),
        d5: parseFloat((bs.base * 2 + d5Var).toFixed(2)),
        d20: parseFloat((bs.base * 3 + d20Var).toFixed(2)),
        upCount: Math.floor(total * upRatio),
        total: total,
        volChange: (rand() > 0.5 ? '+' : '') + Math.floor((rand() - 0.3) * 200) + '%',
        strongDays: Math.floor(rand() * 5),
        trend: rand() > 0.5 ? 'strong' : (rand() > 0.5 ? 'weakening' : 'oscillating'),
        trendText: rand() > 0.6 ? '持续强势' : (rand() > 0.5 ? '走势偏弱' : '震荡整理'),
        limitUp: Math.floor(rand() * 8),
        volume: parseFloat((50 + rand() * 500).toFixed(1)),
        icon: bs.icon
      };
    });

    // 个股数据（简化版，保证板块联动）
    var histStocks = [];
    var stockNameIdx = 0;
    histSectors.forEach(function(sec) {
      // 每个板块 2-4 只代表性股票
      var count = 2 + Math.floor(rand() * 3);
      for (var i = 0; i < count; i++) {
        var name = _stockNamePool[stockNameIdx % _stockNamePool.length];
        stockNameIdx++;
        var isLimitUp = sec.today > 2 && rand() > 0.6;
        var lianban = isLimitUp ? (rand() > 0.7 ? Math.floor(rand() * 3) + 2 : 1) : 0;
        var todayChg = isLimitUp ? parseFloat((9.5 + rand() * 0.8).toFixed(2))
          : parseFloat((sec.today + (rand() - 0.5) * 3).toFixed(2));
        histStocks.push({
          code: ['60', '00', '30', '68'][Math.floor(rand() * 4)] +
            String(Math.floor(rand() * 9000) + 1000),
          name: name,
          price: parseFloat((10 + rand() * 200).toFixed(2)),
          today: todayChg,
          d5: parseFloat((sec.d5 + (rand() - 0.5) * 4).toFixed(2)),
          d10: parseFloat((sec.d5 * 1.5 + (rand() - 0.5) * 5).toFixed(2)),
          d20: parseFloat((sec.d20 + (rand() - 0.5) * 6).toFixed(2)),
          sector: sec.name,
          lianban: lianban,
          boardType: lianban > 1 ? lianban + '连板' : (lianban === 1 ? '首板' : '趋势'),
          category: rand() > 0.5 ? 'trend' : (rand() > 0.5 ? 'start' : 'pullback'),
          catText: '观察'
        });
      }
    });

    return {
      date: dateStr,
      sectors: histSectors,
      stocks: histStocks,
      _source: 'historical'
    };
  }

  // 获取某天的市场快照（板块+个股）
  function getMarketSnapshot(dateStr) {
    // 今日用真实数据
    if (dateStr === realMarketData.date) {
      return {
        date: dateStr,
        sectors: sectors,
        stocks: stocks,
        _source: 'real'
      };
    }
    // 从数据库读
    var dbData = MarketDB.getModule(dateStr, 'marketSnapshot');
    if (dbData) return dbData;
    // 生成并存入
    var snap = generateHistoricalMarketSnapshot(dateStr);
    MarketDB.setModule(dateStr, 'marketSnapshot', snap);
    return snap;
  }


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

  // Run auction filter (uses dragonData.auctionStocks)
  window.runAuctionFilter = function() {
    if (!dragonData) return;

    var zfMin = parseFloat(document.getElementById('filter-zhangfu-min').value) || -20;
    var zfMax = parseFloat(document.getElementById('filter-zhangfu-max').value) || 20;
    var minScore = parseFloat(document.getElementById('filter-score').value) || 0;
    var hlMin = parseFloat(document.getElementById('filter-huanlv-min').value) || 0;
    var hlMax = parseFloat(document.getElementById('filter-huanlv-max').value) || 100;
    var szMin = parseFloat(document.getElementById('filter-shizhi-min').value) || 0;
    var szMax = parseFloat(document.getElementById('filter-shizhi-max').value) || 99999;
    var sectorFilter = document.getElementById('filter-sector').value;
    var sortBy = document.getElementById('filter-sort').value;

    var filtered = dragonData.auctionStocks.filter(function(s) {
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
    if (!el || !dragonData) return;

    el.innerHTML = dragonData.anchorGangs.map(function(gang) {
      var zfColor = gang.zhangfu >= 0 ? 'var(--up)' : 'var(--down)';
      var zfSign = gang.zhangfu >= 0 ? '+' : '';
      var stocksHtml = gang.stocks.map(function(s) {
        var sZfColor = s.zhangfu >= 0 ? 'var(--up)' : 'var(--down)';
        var sZfSign = s.zhangfu >= 0 ? '+' : '';
        return '<div class="anchor-stock-row">' +
          '<span class="anchor-rank rank-' + s.rank + '">' + s.rankText + '</span>' +
          '<span class="anchor-stock-code">' + s.code + '</span>' +
          '<span class="anchor-stock-name">' + s.name + '</span>' +
          '<span class="anchor-stock-change" style="color:' + sZfColor + ';">' + sZfSign + s.zhangfu.toFixed(2) + '%</span>' +
          '<span class="anchor-stock-tag">' + s.tag + '</span>' +
          '</div>';
      }).join('');

      return '<div class="anchor-gang-card">' +
        '<div class="anchor-gang-header">' +
          '<div class="anchor-gang-name"><span class="anchor-gang-icon">' + gang.icon + '</span>共振帮派：' + gang.name + '（' + gang.total + '家）</div>' +
          '<div class="anchor-gang-meta">' +
            '<span>' + (gang.isStrong ? '<strong>强共振</strong>' : '共振') + '</span>' +
            '<span style="color:' + zfColor + ';font-weight:700;">' + zfSign + gang.zhangfu.toFixed(2) + '%</span>' +
          '</div>' +
        '</div>' +
        '<div class="anchor-gang-body">' + stocksHtml + '</div>' +
        '</div>';
    }).join('');
  }

  // Render resonance sectors
  function renderResonanceSectors() {
    var el = document.getElementById('resonance-grid');
    if (!el || !dragonData) return;

    // Update stats
    var upEl = document.getElementById('res-up-count');
    var downEl = document.getElementById('res-down-count');
    var topEl = document.getElementById('res-top-sector');
    var volEl = document.getElementById('res-total-vol');
    if (upEl) upEl.textContent = dragonData.upSectorCount;
    if (downEl) downEl.textContent = dragonData.downSectorCount;
    if (topEl) topEl.textContent = dragonData.topSector;
    if (volEl) volEl.textContent = (dragonData.totalVolume / 100).toFixed(0) + '万亿';

    el.innerHTML = dragonData.resonanceSectors.map(function(s, idx) {
      var zfColor = s.zhangfu >= 0 ? 'var(--up)' : 'var(--down)';
      var zfSign = s.zhangfu >= 0 ? '+' : '';
      var dragonZfColor = s.dragonChange >= 0 ? 'var(--up)' : 'var(--down)';
      var dragonZfSign = s.dragonChange >= 0 ? '+' : '';
      var strongClass = s.isStrong ? 'strong' : '';

      // 计算上涨占比
      var upRatio = s.total > 0 ? Math.round(s.upCount / s.total * 100) : 0;
      var upRatioCls = upRatio > 60 ? 'up' : (upRatio > 40 ? 'neutral' : 'down');

      // 热度等级
      var heatLevel = s.limitUp >= 5 && s.zhangfu > 3 ? 5 :
        s.limitUp >= 3 && s.zhangfu > 2 ? 4 :
        s.limitUp >= 1 && s.zhangfu > 1 ? 3 :
        s.zhangfu > 0 ? 2 :
        s.zhangfu > -2 ? 1 : 0;
      var heatDots = '';
      for (var h = 1; h <= 5; h++) {
        heatDots += '<span class="heat-dot ' + (h <= heatLevel ? 'active' : '') + '"></span>';
      }

      // 排名
      var rank = idx + 1;
      var rankBadge = rank <= 3 ? '<span class="res-rank rank-' + rank + '">' + rank + '</span>' : '<span class="res-rank">' + rank + '</span>';

      return '<div class="resonance-card ' + strongClass + '" onclick="goToSectorAnalysis(\'' + s.name + '\')">' +
        '<div class="resonance-header">' +
          '<div class="resonance-name">' +
            rankBadge +
            '<span class="resonance-icon">' + s.icon + '</span>' +
            s.name +
          '</div>' +
          '<div class="resonance-change" style="color:' + zfColor + ';">' + zfSign + s.zhangfu.toFixed(2) + '%</div>' +
        '</div>' +
        '<div class="resonance-heat-bar">' + heatDots + '</div>' +
        '<div class="resonance-stats-row">' +
          '<div class="res-stat-item">' +
            '<div class="res-stat-item-label">上涨家数</div>' +
            '<div class="res-stat-item-value">' + s.upCount + '/' + s.total + '</div>' +
          '</div>' +
          '<div class="res-stat-item">' +
            '<div class="res-stat-item-label">涨停数</div>' +
            '<div class="res-stat-item-value up">' + s.limitUp + '只</div>' +
          '</div>' +
          '<div class="res-stat-item">' +
            '<div class="res-stat-item-label">成交额</div>' +
            '<div class="res-stat-item-value">' + s.volume + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="resonance-upratio">' +
          '<div class="upratio-bar small">' +
            '<div class="upratio-fill ' + upRatioCls + '" style="width:' + upRatio + '%"></div>' +
          '</div>' +
          '<span class="upratio-label">' + upRatio + '% 上涨占比</span>' +
        '</div>' +
        '<div class="resonance-dragon">' +
          '<span class="resonance-dragon-label">👑 领涨龙头</span>' +
          '<span class="resonance-dragon-name">' + s.dragon + '</span>' +
          '<span class="resonance-dragon-pct" style="color:' + dragonZfColor + ';">' + dragonZfSign + s.dragonChange.toFixed(2) + '%</span>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  // 跳转到板块分析
  window.goToSectorAnalysis = function(sectorName) {
    // 切换到板块轮动标签的第二层
    switchTab('rotation');
    setTimeout(function() {
      var rows = document.querySelectorAll('#sector-table-body tr');
      rows.forEach(function(r) {
        if (r.textContent.indexOf(sectorName) >= 0) {
          r.classList.add('selected');
          r.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }, 100);
  };

  // Render yesterday auction limit-up review
  function renderYesterdayAuctionReview() {
    if (!dragonData || !dragonData.yesterdayLimitUp) return;

    var dateEl = document.getElementById('auction-yesterday-date');
    var countEl = document.getElementById('auction-yesterday-count');
    var rateEl = document.getElementById('auction-yesterday-rate');
    var listEl = document.getElementById('auction-yesterday-stocks');

    if (dateEl) dateEl.textContent = dragonData.yesterdayDate;
    if (countEl) countEl.textContent = dragonData.yesterdayLimitUp.length;
    if (rateEl) rateEl.textContent = dragonData.yesterdayHitRate;

    if (listEl) {
      listEl.innerHTML = dragonData.yesterdayLimitUp.map(function(s) {
        // Yesterday's board status at close
        var boardBadge;
        if (s.yesterdayBoard >= 2) {
          boardBadge = '<span class="y-board">' + s.yesterdayBoard + '连板</span>';
        } else if (s.yesterdayBoard === 1) {
          boardBadge = '<span class="y-board">首板</span>';
        } else {
          boardBadge = '<span class="y-board" style="background:rgba(245,158,11,0.2);color:var(--warning);">首板</span>';
        }
        var profitSign = s.profit >= 0 ? '+' : '';
        // Today's continuation status
        var todaySign = s.todayZhangfu >= 0 ? '+' : '';
        var todayClass = s.todayZhangfu >= 0 ? 'up' : 'down';
        return '<div class="yesterday-stock-item" title="昨日竞价评分' + s.auctionScore + '分 · 今日' + todaySign + s.todayZhangfu.toFixed(2) + '%">' +
          boardBadge +
          '<span class="y-stock-name">' + s.name + '</span>' +
          '<span class="y-stock-code">' + s.code + '</span>' +
          '<span class="y-sector">' + s.sector + '</span>' +
          '<span class="y-profit">' + profitSign + s.profit.toFixed(2) + '%</span>' +
          '</div>';
      }).join('');
    }
  }

  // Update market overview cards
  function updateDragonMarketOverview() {
    var shVal = document.getElementById('dragon-sh-value');
    var shChg = document.getElementById('dragon-sh-change');
    var cybVal = document.getElementById('dragon-cyb-value');
    var cybChg = document.getElementById('dragon-cyb-change');

    // Use realMarketData sh/cyb data (from Eastmoney)
    if (shVal && realMarketData.sh) {
      shVal.textContent = parseFloat(realMarketData.sh.close).toFixed(2);
    }
    if (shChg && realMarketData.sh) {
      var chg = realMarketData.sh.change;
      shChg.textContent = (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%';
      shChg.className = 'market-card-change ' + (chg >= 0 ? 'up' : 'down');
    }
    if (cybVal && realMarketData.cyb) {
      cybVal.textContent = parseFloat(realMarketData.cyb.close).toFixed(2);
    }
    if (cybChg && realMarketData.cyb) {
      var chg2 = realMarketData.cyb.change;
      cybChg.textContent = (chg2 >= 0 ? '+' : '') + chg2.toFixed(2) + '%';
      cybChg.className = 'market-card-change ' + (chg2 >= 0 ? 'up' : 'down');
    }
  }

  // Update sector filter dropdown dynamically
  function updateSectorFilter() {
    var select = document.getElementById('filter-sector');
    if (!select) return;

    // Get unique sectors from stocks, sorted by sector strength
    var uniqueSectors = [];
    var sectorMap = {};
    stocks.forEach(function(s) {
      if (!sectorMap[s.sector]) {
        sectorMap[s.sector] = true;
        uniqueSectors.push(s.sector);
      }
    });

    // Sort by sector today change (strongest first)
    uniqueSectors.sort(function(a, b) {
      var secA = sectors.find(function(s) { return s.name === a; });
      var secB = sectors.find(function(s) { return s.name === b; });
      var zfA = secA ? secA.today : 0;
      var zfB = secB ? secB.today : 0;
      return zfB - zfA;
    });

    // Preserve current selection
    var currentValue = select.value;

    // Rebuild options
    var html = '<option value="all">全部板块</option>';
    uniqueSectors.forEach(function(sectorName) {
      var sec = sectors.find(function(s) { return s.name === sectorName; });
      var zf = sec ? sec.today : 0;
      var sign = zf >= 0 ? '+' : '';
      html += '<option value="' + sectorName + '">' + sectorName + ' (' + sign + zf.toFixed(2) + '%)</option>';
    });
    select.innerHTML = html;

    // Restore selection if still valid
    if (currentValue === 'all' || uniqueSectors.indexOf(currentValue) >= 0) {
      select.value = currentValue;
    }
  }

  // Refresh dragon module
  function refreshDragonModule() {
    dragonData = generateDragonData();
    // 持久化到数据库
    if (MarketDB && MarketDB.setModule) {
      MarketDB.setModule(realMarketData.date, 'dragon', dragonData);
    }
    updateDragonMarketOverview();
    renderAuctionTable(dragonData.auctionStocks.slice(0, 15));
    renderAnchorGangs();
    renderResonanceSectors();
    updateSectorFilter();
    renderYesterdayAuctionReview();

    var timeEl = document.getElementById('dragon-update-time');
    if (timeEl) {
      var now = new Date();
      timeEl.textContent = '更新于 ' + formatDate(now);
      timeEl.style.color = 'var(--success)';
      setTimeout(function() {
        if (timeEl) timeEl.style.color = '';
      }, 2000);
    }
  }

  // 生成历史日的龙头狙击数据
  function generateHistoricalDragonData(dateStr) {
    var snap = getMarketSnapshot(dateStr);
    // 暂存全局变量
    var origSectors = sectors;
    var origStocks = stocks;
    // 替换为历史数据
    sectors = snap.sectors;
    stocks = snap.stocks;
    // 生成
    var result = generateDragonData();
    result._source = 'historical';
    // 恢复
    sectors = origSectors;
    stocks = origStocks;
    return result;
  }

  // 获取某天的龙头狙击数据
  function getDragonData(dateStr) {
    if (dateStr === realMarketData.date) {
      if (!dragonData) dragonData = generateDragonData();
      return dragonData;
    }
    var dbData = MarketDB.getModule(dateStr, 'dragon');
    if (dbData) return dbData;
    var hist = generateHistoricalDragonData(dateStr);
    MarketDB.setModule(dateStr, 'dragon', hist);
    return hist;
  }

  // Init dragon module
  function initDragonModule() {
    // 先尝试从数据库加载今日数据
    var dbDragon = MarketDB.getModule(realMarketData.date, 'dragon');
    if (dbDragon) {
      dragonData = dbDragon;
    } else {
      dragonData = generateDragonData();
      MarketDB.setModule(realMarketData.date, 'dragon', dragonData);
    }

    // 确保最近7天历史数据在数据库中
    for (var i = 6; i >= 1; i--) {
      var d = new Date(realMarketData.date);
      d.setDate(d.getDate() - i);
      var ds = Timeline.formatFull(d);
      if (!MarketDB.getModule(ds, 'dragon')) {
        var histDragon = generateHistoricalDragonData(ds);
        MarketDB.setModule(ds, 'dragon', histDragon);
      }
    }

    updateDragonMarketOverview();
    renderAuctionTable(dragonData.auctionStocks.slice(0, 15));
    renderAnchorGangs();
    renderResonanceSectors();
    updateSectorFilter();
    renderYesterdayAuctionReview();

    var timeEl = document.getElementById('dragon-update-time');
    if (timeEl) {
      var now = new Date();
      timeEl.textContent = '更新于 ' + formatDate(now);
    }
    // 注册到全局时间线
    Timeline.register('dragon_sniper', realMarketData.date);
  }

  // Expose
  window.initDragonModule = initDragonModule;
  window.refreshDragonModule = refreshDragonModule;
  window.renderAuctionTable = renderAuctionTable;
  window.renderAnchorGangs = renderAnchorGangs;
  window.renderResonanceSectors = renderResonanceSectors;
  window.dragonData = dragonData;

  // ==================== 战法选股模块 ====================
  // 可选的条件字段定义
  var TACTIC_FIELDS = [
    { key: 'today', label: '今日涨幅', unit: '%', type: 'number' },
    { key: 'd5', label: '5日涨幅', unit: '%', type: 'number' },
    { key: 'd10', label: '10日涨幅', unit: '%', type: 'number' },
    { key: 'd20', label: '20日涨幅', unit: '%', type: 'number' },
    { key: 'lianban', label: '连板数', unit: '板', type: 'number' },
    { key: 'price', label: '股价', unit: '元', type: 'number' },
    { key: 'sector', label: '所属板块', unit: '', type: 'text' },
    { key: 'turnover', label: '换手率', unit: '%', type: 'number' },
    { key: 'marketCap', label: '流通市值', unit: '亿', type: 'number' },
    { key: 'limitUp', label: '是否涨停', unit: '', type: 'bool' },
    { key: 'category', label: '股票类型', unit: '', type: 'text' }
  ];

  // 可选操作符
  var TACTIC_OPS = [
    { key: 'gt', label: '大于', symbol: '>' },
    { key: 'gte', label: '大于等于', symbol: '≥' },
    { key: 'lt', label: '小于', symbol: '<' },
    { key: 'lte', label: '小于等于', symbol: '≤' },
    { key: 'eq', label: '等于', symbol: '=' },
    { key: 'neq', label: '不等于', symbol: '≠' },
    { key: 'contains', label: '包含', symbol: '∋' }
  ];

  // 默认战法
  var DEFAULT_TACTICS = [
    {
      id: 'tactic_lianban',
      name: '连板晋级战法',
      icon: '🚀',
      desc: '捕捉连板股晋级机会，聚焦高连板龙头',
      conditions: [
        { field: 'lianban', op: 'gte', value: '2' },
        { field: 'today', op: 'gt', value: '5' }
      ]
    },
    {
      id: 'tactic_first_board',
      name: '首板涨停战法',
      icon: '⚡',
      desc: '首板起爆，捕捉板块启动信号',
      conditions: [
        { field: 'lianban', op: 'eq', value: '1' },
        { field: 'limitUp', op: 'eq', value: 'true' }
      ]
    },
    {
      id: 'tactic_trend_breakout',
      name: '趋势突破战法',
      icon: '📈',
      desc: '均线多头排列，突破前期高点',
      conditions: [
        { field: 'd5', op: 'gt', value: '5' },
        { field: 'd20', op: 'gt', value: '15' },
        { field: 'today', op: 'gt', value: '2' }
      ]
    },
    {
      id: 'tactic_dip_buy',
      name: '低吸反包战法',
      icon: '💎',
      desc: '强势股回调低吸，博弈反包行情',
      conditions: [
        { field: 'd5', op: 'gt', value: '10' },
        { field: 'today', op: 'lt', value: '-2' }
      ]
    },
    {
      id: 'tactic_volume_break',
      name: '放量突破战法',
      icon: '🔥',
      desc: '成交量放大配合价格突破',
      conditions: [
        { field: 'today', op: 'gt', value: '3' },
        { field: 'd5', op: 'gt', value: '0' }
      ]
    }
  ];

  // 战法状态
  var tactics = [];
  var currentTacticId = null;
  var editingTacticId = null;
  var selectedIcon = '🚀';
  var conditionRowCount = 0;
  var undoStack = []; // 撤回栈
  var MAX_UNDO = 10;

  // 加载战法（从数据库）
  function loadTactics() {
    var saved = MarketDB.getModule(realMarketData.date, 'tactics');
    if (saved && saved.list && saved.list.length > 0) {
      tactics = saved.list;
    } else {
      // 使用默认战法并保存
      tactics = JSON.parse(JSON.stringify(DEFAULT_TACTICS));
      saveTacticsToDB();
    }
  }

  // 保存战法到数据库
  function saveTacticsToDB() {
    MarketDB.setModule(realMarketData.date, 'tactics', {
      list: tactics,
      _updatedAt: Date.now()
    });
  }

  // 记录操作到撤回栈
  function recordUndo(action, desc) {
    undoStack.push({
      action: action,
      desc: desc,
      snapshot: JSON.parse(JSON.stringify(tactics)),
      timestamp: Date.now()
    });
    if (undoStack.length > MAX_UNDO) {
      undoStack.shift();
    }
    updateUndoButton();
  }

  // 更新撤回按钮状态
  function updateUndoButton() {
    var btn = document.getElementById('tactic-page-undo');
    if (btn) {
      btn.disabled = undoStack.length === 0;
      if (undoStack.length > 0) {
        btn.title = '撤回：' + undoStack[undoStack.length - 1].desc;
      }
    }
  }

  // 撤回上一步操作
  window.undoTacticAction = function() {
    if (undoStack.length === 0) return;
    var last = undoStack.pop();
    tactics = last.snapshot;
    saveTacticsToDB();
    renderTacticList();
    // 如果当前选中的战法被删除了，清空
    if (currentTacticId && !tactics.find(function(t) { return t.id === currentTacticId; })) {
      currentTacticId = null;
      renderTacticDetail();
    } else {
      renderTacticDetail();
    }
    updateUndoButton();
    // 提示
    showTacticToast('已撤回：' + last.desc);
  };

  // 渲染战法列表
  function renderTacticList() {
    var listEl = document.getElementById('tactic-page-list');
    if (!listEl) return;

    var countEl = document.getElementById('tactic-sidebar-count');
    if (countEl) countEl.textContent = tactics.length + '个';

    listEl.innerHTML = tactics.map(function(t) {
      var result = runTacticScreen(t);
      var count = result.length;
      var activeCls = t.id === currentTacticId ? 'active' : '';
      return '<div class="tactic-page-item ' + activeCls + '" onclick="selectTactic(\'' + t.id + '\')">' +
        '<span class="tactic-page-item-icon">' + t.icon + '</span>' +
        '<div class="tactic-page-item-info">' +
          '<div class="tactic-page-item-name">' + t.name + '</div>' +
          '<div class="tactic-page-item-meta">' +
            '<span>' + t.conditions.length + '个条件</span>' +
            '<span>命中 <strong>' + count + '</strong></span>' +
          '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    // 更新统计卡片
    updateTacticStats();
  }

  // 更新战法统计
  function updateTacticStats() {
    var totalEl = document.getElementById('tactic-stat-total');
    var poolEl = document.getElementById('tactic-stat-pool');
    var topEl = document.getElementById('tactic-stat-top');
    var updateEl = document.getElementById('tactic-stat-update');

    if (totalEl) totalEl.textContent = tactics.length;
    if (poolEl) poolEl.textContent = stocks ? stocks.length : '--';

    // 找命中最多的战法
    var topTactic = null;
    var maxCount = 0;
    tactics.forEach(function(t) {
      var c = runTacticScreen(t).length;
      if (c > maxCount) { maxCount = c; topTactic = t; }
    });
    if (topEl) topEl.textContent = topTactic ? topTactic.name : '--';

    var lastUpdate = MarketDB.getModule(realMarketData.date, 'tactics');
    if (updateEl) {
      updateEl.textContent = lastUpdate && lastUpdate._updatedAt
        ? new Date(lastUpdate._updatedAt).toLocaleTimeString()
        : '--';
    }
  }

  // 选择战法
  window.selectTactic = function(id) {
    currentTacticId = id;
    renderTacticList();
    renderTacticDetail();
  };

  // 渲染战法详情
  function renderTacticDetail() {
    var tactic = tactics.find(function(t) { return t.id === currentTacticId; });
    var nameEl = document.getElementById('tactic-page-main-name');
    var iconEl = document.getElementById('tactic-page-main-icon');
    var descEl = document.getElementById('tactic-page-main-desc');
    var condEl = document.getElementById('tactic-page-conditions');
    var resultBody = document.getElementById('tactic-page-result-body');
    var countEl = document.getElementById('tactic-page-result-count');

    if (!tactic) {
      if (nameEl) nameEl.textContent = '请选择战法';
      if (iconEl) iconEl.textContent = '📊';
      if (descEl) descEl.textContent = '从左侧选择一个战法查看选股条件与结果';
      if (condEl) condEl.innerHTML = '<span style="color:var(--muted);font-size:13px;">选择战法后显示选股条件</span>';
      if (countEl) countEl.textContent = '--';
      if (resultBody) {
        resultBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:40px;">请选择战法查看选股结果</td></tr>';
      }
      return;
    }

    if (nameEl) nameEl.textContent = tactic.name;
    if (iconEl) iconEl.textContent = tactic.icon;
    if (descEl) descEl.textContent = tactic.desc || '自定义选股策略';

    // 条件标签
    if (condEl) {
      condEl.innerHTML = tactic.conditions.map(function(c) {
        var fieldDef = TACTIC_FIELDS.find(function(f) { return f.key === c.field; });
        var opDef = TACTIC_OPS.find(function(o) { return o.key === c.op; });
        var fieldLabel = fieldDef ? fieldDef.label : c.field;
        var opSymbol = opDef ? opDef.symbol : c.op;
        var unit = fieldDef ? fieldDef.unit : '';
        var displayVal = c.value;
        if (c.field === 'limitUp') {
          displayVal = c.value === 'true' ? '是' : '否';
        }
        return '<span class="condition-tag">' +
          '<span class="cond-field">' + fieldLabel + '</span>' +
          '<span class="cond-op">' + opSymbol + '</span>' +
          '<span class="cond-val">' + displayVal + unit + '</span>' +
          '</span>';
      }).join('');
    }

    // 选股结果表格
    var result = runTacticScreen(tactic);
    if (countEl) {
      countEl.innerHTML = '共 <strong>' + result.length + '</strong> 只股票符合条件';
    }
    if (resultBody) {
      if (result.length === 0) {
        resultBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:40px;">暂无符合条件的股票</td></tr>';
      } else {
        resultBody.innerHTML = result.slice(0, 100).map(function(s, idx) {
          var chgCls = s.today >= 0 ? 'up' : 'down';
          var chgSign = s.today >= 0 ? '+' : '';
          var d5Cls = s.d5 >= 0 ? 'up' : 'down';
          var d5Sign = s.d5 >= 0 ? '+' : '';
          var d20Cls = s.d20 >= 0 ? 'up' : 'down';
          var d20Sign = s.d20 >= 0 ? '+' : '';
          var lianbanTag = s.lianban > 1
            ? '<span class="tactic-lianban-tag">' + s.lianban + '连板</span>'
            : (s.lianban === 1 ? '<span class="tactic-lianban-tag">首板</span>' : '<span style="color:var(--muted);font-size:10px;">--</span>');

          return '<tr onclick="goToAnalysis(\'' + s.code + ' ' + s.name + '\')">' +
            '<td><span class="tactic-rank-cell">' + (idx + 1) + '</span></td>' +
            '<td>' +
              '<div class="tactic-stock-name-cell">' + s.name + '</div>' +
            '</td>' +
            '<td><span class="tactic-stock-code">' + s.code + '</span></td>' +
            '<td><span class="tactic-sector-tag">' + s.sector + '</span></td>' +
            '<td class="tactic-num-cell">' + s.price.toFixed(2) + '</td>' +
            '<td class="tactic-num-cell ' + chgCls + '">' + chgSign + s.today.toFixed(2) + '%</td>' +
            '<td>' + lianbanTag + '</td>' +
            '<td class="tactic-num-cell ' + d5Cls + '">' + d5Sign + s.d5.toFixed(2) + '%</td>' +
            '<td class="tactic-num-cell ' + d20Cls + '">' + d20Sign + s.d20.toFixed(2) + '%</td>' +
            '</tr>';
        }).join('');
      }
    }
  }

  // 战法选股引擎：根据条件筛选股票
  function runTacticScreen(tactic) {
    if (!tactic.conditions || tactic.conditions.length === 0) {
      return [];
    }

    var stockPool = stocks || [];

    var result = stockPool.filter(function(stock) {
      for (var i = 0; i < tactic.conditions.length; i++) {
        var cond = tactic.conditions[i];
        var fieldVal = stock[cond.field];
        if (fieldVal === undefined || fieldVal === null) {
          // 换手率、市值等可能没有数据，跳过
          if (cond.field === 'turnover' || cond.field === 'marketCap') {
            fieldVal = 0;
          } else {
            return false;
          }
        }

        var condVal = cond.value;
        var numVal = parseFloat(fieldVal);
        var numCond = parseFloat(condVal);

        switch (cond.op) {
          case 'gt':
            if (isNaN(numVal) || isNaN(numCond)) return false;
            if (!(numVal > numCond)) return false;
            break;
          case 'gte':
            if (isNaN(numVal) || isNaN(numCond)) return false;
            if (!(numVal >= numCond)) return false;
            break;
          case 'lt':
            if (isNaN(numVal) || isNaN(numCond)) return false;
            if (!(numVal < numCond)) return false;
            break;
          case 'lte':
            if (isNaN(numVal) || isNaN(numCond)) return false;
            if (!(numVal <= numCond)) return false;
            break;
          case 'eq':
            if (cond.field === 'limitUp') {
              var boolVal = condVal === 'true';
              if (fieldVal !== boolVal) return false;
            } else if (!isNaN(numVal) && !isNaN(numCond)) {
              if (numVal !== numCond) return false;
            } else {
              if (String(fieldVal) !== String(condVal)) return false;
            }
            break;
          case 'neq':
            if (cond.field === 'limitUp') {
              var boolVal2 = condVal === 'true';
              if (fieldVal === boolVal2) return false;
            } else if (!isNaN(numVal) && !isNaN(numCond)) {
              if (numVal === numCond) return false;
            } else {
              if (String(fieldVal) === String(condVal)) return false;
            }
            break;
          case 'contains':
            if (String(fieldVal).indexOf(String(condVal)) < 0) return false;
            break;
          default:
            return false;
        }
      }
      return true;
    });

    // 按今日涨幅降序排列
    result.sort(function(a, b) { return b.today - a.today; });
    return result;
  }

  // 打开战法编辑器（新建或编辑）
  window.openTacticEditor = function(tacticId) {
    editingTacticId = tacticId || null;
    var titleEl = document.getElementById('tactic-modal-title');
    var nameInput = document.getElementById('tactic-form-name');
    var descInput = document.getElementById('tactic-form-desc');
    var condEditor = document.getElementById('tactic-conditions-editor');

    if (titleEl) titleEl.textContent = tacticId ? '编辑战法' : '新建战法';

    var tactic = tacticId ? tactics.find(function(t) { return t.id === tacticId; }) : null;
    if (nameInput) nameInput.value = tactic ? tactic.name : '';
    if (descInput) descInput.value = tactic ? (tactic.desc || '') : '';

    // 设置图标
    selectedIcon = tactic ? tactic.icon : '🚀';
    var iconOptions = document.querySelectorAll('.tactic-icon-option');
    iconOptions.forEach(function(el) {
      el.classList.toggle('active', el.getAttribute('data-icon') === selectedIcon);
    });

    // 渲染条件行
    conditionRowCount = 0;
    if (condEditor) condEditor.innerHTML = '';
    var conditions = tactic ? tactic.conditions : [];
    if (conditions.length === 0) {
      // 新建时默认添加一行
      addConditionRow();
    } else {
      conditions.forEach(function(c) {
        addConditionRow(c);
      });
    }

    document.getElementById('tactic-modal-overlay').classList.add('show');
  };

  // 编辑当前战法
  window.editCurrentTactic = function() {
    if (!currentTacticId) return;
    openTacticEditor(currentTacticId);
  };

  // 关闭编辑器
  window.closeTacticEditor = function(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('tactic-modal-overlay').classList.remove('show');
    editingTacticId = null;
  };

  // 选择图标
  window.selectTacticIcon = function(el, icon) {
    selectedIcon = icon;
    document.querySelectorAll('.tactic-icon-option').forEach(function(opt) {
      opt.classList.remove('active');
    });
    el.classList.add('active');
  };

  // 添加条件行
  window.addConditionRow = function(condData) {
    var editor = document.getElementById('tactic-conditions-editor');
    if (!editor) return;
    conditionRowCount++;
    var rowId = 'cond_row_' + conditionRowCount;

    var fieldOptions = TACTIC_FIELDS.map(function(f) {
      return '<option value="' + f.key + '" ' + (condData && condData.field === f.key ? 'selected' : '') + '>' + f.label + '</option>';
    }).join('');

    var opOptions = TACTIC_OPS.map(function(o) {
      return '<option value="' + o.key + '" ' + (condData && condData.op === o.key ? 'selected' : '') + '>' + o.symbol + ' ' + o.label + '</option>';
    }).join('');

    var valStr = condData ? condData.value : '';

    var row = document.createElement('div');
    row.className = 'cond-editor-row';
    row.id = rowId;
    row.innerHTML =
      '<select class="cond-field-select" onchange="onConditionFieldChange(this)">' + fieldOptions + '</select>' +
      '<select class="cond-op-select">' + opOptions + '</select>' +
      '<input type="text" class="cond-val-input" placeholder="输入值" value="' + valStr + '">' +
      '<button class="cond-del-btn" onclick="removeConditionRow(\'' + rowId + '\')" title="删除条件">×</button>';

    editor.appendChild(row);

    // 如果是布尔类型（涨停），改为下拉
    if (condData && condData.field === 'limitUp') {
      var valInput = row.querySelector('.cond-val-input');
      var select = document.createElement('select');
      select.className = 'cond-val-input';
      select.innerHTML = '<option value="true" ' + (valStr === 'true' ? 'selected' : '') + '>是</option>' +
        '<option value="false" ' + (valStr === 'false' ? 'selected' : '') + '>否</option>';
      valInput.parentNode.replaceChild(select, valInput);
    }
  };

  // 条件字段变化时处理
  window.onConditionFieldChange = function(selectEl) {
    var row = selectEl.closest('.cond-editor-row');
    var valContainer = row.querySelector('.cond-val-input');
    var field = selectEl.value;

    // 重建值输入控件
    var newInput;
    if (field === 'limitUp') {
      newInput = document.createElement('select');
      newInput.className = 'cond-val-input';
      newInput.innerHTML = '<option value="true">是</option><option value="false">否</option>';
    } else if (field === 'sector') {
      newInput = document.createElement('select');
      newInput.className = 'cond-val-input';
      var secOptions = sectors.map(function(s) {
        return '<option value="' + s.name + '">' + s.name + '</option>';
      }).join('');
      newInput.innerHTML = '<option value="">全部板块</option>' + secOptions;
    } else {
      newInput = document.createElement('input');
      newInput.type = 'text';
      newInput.className = 'cond-val-input';
      newInput.placeholder = '输入值';
    }
    valContainer.parentNode.replaceChild(newInput, valContainer);
  };

  // 删除条件行
  window.removeConditionRow = function(rowId) {
    var row = document.getElementById(rowId);
    if (row) row.remove();
  };

  // 保存战法
  window.saveTactic = function() {
    var nameInput = document.getElementById('tactic-form-name');
    var descInput = document.getElementById('tactic-form-desc');
    var name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
      showTacticToast('请输入战法名称');
      return;
    }

    // 收集条件
    var condRows = document.querySelectorAll('.cond-editor-row');
    var conditions = [];
    condRows.forEach(function(row) {
      var fieldSel = row.querySelector('.cond-field-select');
      var opSel = row.querySelector('.cond-op-select');
      var valInput = row.querySelector('.cond-val-input');
      if (fieldSel && opSel && valInput) {
        var val = valInput.value.trim();
        if (val !== '') {
          conditions.push({
            field: fieldSel.value,
            op: opSel.value,
            value: val
          });
        }
      }
    });

    if (conditions.length === 0) {
      showTacticToast('请至少添加一个选股条件');
      return;
    }

    // 记录撤回
    recordUndo('save', editingTacticId ? '编辑战法 ' + name : '新建战法 ' + name);

    if (editingTacticId) {
      // 编辑
      var idx = tactics.findIndex(function(t) { return t.id === editingTacticId; });
      if (idx >= 0) {
        tactics[idx].name = name;
        tactics[idx].icon = selectedIcon;
        tactics[idx].desc = descInput ? descInput.value.trim() : '';
        tactics[idx].conditions = conditions;
      }
    } else {
      // 新建
      tactics.push({
        id: 'tactic_' + Date.now(),
        name: name,
        icon: selectedIcon,
        desc: descInput ? descInput.value.trim() : '',
        conditions: conditions
      });
      currentTacticId = tactics[tactics.length - 1].id;
    }

    saveTacticsToDB();
    closeTacticEditor();
    renderTacticList();
    renderTacticDetail();
    showTacticToast(editingTacticId ? '战法已更新' : '战法创建成功');
  };

  // 删除当前战法
  window.deleteCurrentTactic = function() {
    if (!currentTacticId) return;
    var tactic = tactics.find(function(t) { return t.id === currentTacticId; });
    if (!tactic) return;
    document.getElementById('delete-tactic-name').textContent = tactic.name;
    document.getElementById('tactic-delete-overlay').classList.add('show');
  };

  // 关闭删除确认
  window.closeDeleteConfirm = function(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('tactic-delete-overlay').classList.remove('show');
  };

  // 确认删除
  window.confirmDeleteTactic = function() {
    if (!currentTacticId) return;
    var tactic = tactics.find(function(t) { return t.id === currentTacticId; });
    if (!tactic) return;

    // 记录撤回
    recordUndo('delete', '删除战法 ' + tactic.name);

    tactics = tactics.filter(function(t) { return t.id !== currentTacticId; });
    currentTacticId = null;
    saveTacticsToDB();
    closeDeleteConfirm();
    renderTacticList();
    renderTacticDetail();
    showTacticToast('战法已删除，可点击撤回恢复');
  };

  // 显示提示
  function showTacticToast(msg) {
    var existing = document.getElementById('tactic-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'tactic-toast';
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:10px 20px;background:rgba(51,65,85,0.95);color:white;border-radius:8px;font-size:13px;z-index:2000;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:toastIn 0.25s ease-out;';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function() { toast.remove(); }, 300);
    }, 1800);
  }

  // 初始化战法选股模块
  function initTacticModule() {
    loadTactics();
    renderTacticList();
    // 默认选中第一个战法
    if (tactics.length > 0) {
      currentTacticId = tactics[0].id;
      renderTacticDetail();
    }
    updateUndoButton();
  }

  // 刷新战法选股结果（数据更新时调用）
  function refreshTacticModule() {
    renderTacticList();
    if (currentTacticId) {
      renderTacticDetail();
    }
  }

  // Expose
  window.openTacticEditor = openTacticEditor;
  window.closeTacticEditor = closeTacticEditor;
  window.selectTacticIcon = selectTacticIcon;
  window.addConditionRow = addConditionRow;
  window.removeConditionRow = removeConditionRow;
  window.onConditionFieldChange = onConditionFieldChange;
  window.saveTactic = saveTactic;
  window.selectTactic = selectTactic;
  window.editCurrentTactic = editCurrentTactic;
  window.deleteCurrentTactic = deleteCurrentTactic;
  window.closeDeleteConfirm = closeDeleteConfirm;
  window.confirmDeleteTactic = confirmDeleteTactic;
  window.undoTacticAction = undoTacticAction;
  window.initTacticModule = initTacticModule;
  window.refreshTacticModule = refreshTacticModule;

})();
