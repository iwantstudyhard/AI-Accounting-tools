import { BASE_URL } from '../../config'
interface RecordItem {
  id: string;
  imagePath: string;
  amount: number;
  category: string;
  note: string;
  createTime: number;
  createTimeStr?: string;
}

interface CategoryData {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  '餐饮': '#FF6B6B',
  '购物': '#4ECDC4',
  '交通': '#45B7D1',
  '娱乐': '#96CEB4',
  '居住': '#FFEAA7',
  '通讯': '#DDA0DD',
  '医疗': '#98D8C8',
  '其他': '#B8B8B8'
};

const ALL_CATEGORIES = ['全部', '餐饮', '购物', '交通', '娱乐', '居住', '通讯', '医疗', '其他'];

Page({
  data: {
    currentFilter: 'week' as 'week' | 'month' | 'year',
    totalAmount: '0.00',
    filteredRecords: [] as RecordItem[],
    categoryData: [] as CategoryData[],
    chartWidth: 350,
    chartHeight: 350,
    categories: ALL_CATEGORIES,
    selectedCategory: 0,
    showDetail: false,
    detailRecord: null as RecordItem | null,
    showChart: true,
    showSettings: false,
    colorOptions: ['#667eea', '#764ba2', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'],
    backgroundColor: '#667eea',
    backgroundImage: '',
    backgroundType: 'color'
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const chartSize = Math.min(systemInfo.windowWidth - 80, 350);
    this.setData({
      chartWidth: chartSize,
      chartHeight: chartSize
    });
    this.loadBackgroundSettings();
  },

  loadBackgroundSettings() {
    const app = getApp<IAppOption>();
    const bgSettings = wx.getStorageSync('backgroundSettings');
    if (bgSettings) {
      this.setData({
        backgroundType: bgSettings.backgroundType || 'color',
        backgroundColor: bgSettings.backgroundColor || '#667eea',
        backgroundImage: bgSettings.backgroundImage || ''
      });
    } else {
      this.setData({
        backgroundType: app.globalData.backgroundType,
        backgroundColor: app.globalData.backgroundColor,
        backgroundImage: app.globalData.backgroundImage
      });
    }
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    wx.showLoading({ title: '加载数据中...' });

    // 1. 获取当前选中的分类（如果是 0 '全部'，就不传这个参数）
    const selectedCategoryName = this.data.selectedCategory > 0 
      ? this.data.categories[this.data.selectedCategory] 
      : '';

    // 2. 计算需要请求的开始日期和结束日期 (格式化为 YYYY-MM-DD)
    const { startDate, endDate } = this.calculateDateRange(this.data.currentFilter);

    // 3. 组装要发给后端的参数
    const requestData: any = {
      startDate: startDate,
      endDate: endDate
    };
    // 只有当用户真的选了具体分类（比如“餐饮”）时，才把种类参数带上
    if (selectedCategoryName) {
      requestData.categoryName = selectedCategoryName;
    }

    wx.request({
      url: `${BASE_URL}/api/bill/list`,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      data: requestData, // 🌟 关键：把过滤参数交给后端去拼 SQL！
      success: (res: any) => {
        wx.hideLoading();
        
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const backendBills = res.data;
          
          // 映射字段
          const mappedRecords: RecordItem[] = backendBills.map((bill: any) => {
            return {
              id: bill.id ? bill.id.toString() : `record_${Date.now()}`,
              imagePath: bill.receiptImageUrl || bill.imageUrl || '', 
              amount: bill.amount || 0,
              category: bill.categoryName || '其他',
              note: bill.remark || '',
              createTime: bill.recordDate ? new Date(bill.recordDate).getTime() : Date.now()
            };
          });

          // 🌟 因为后端已经帮我们过滤好了，我们直接渲染即可！
          this.processRenderData(mappedRecords);

        } else {
          wx.showToast({ title: '获取数据失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络异常', icon: 'none' });
      }
    });
  },

  // === 新增的辅助方法 ===

  // 辅助方法 1：根据 week/month/year 计算日期的字符串
  calculateDateRange(filter: 'week' | 'month' | 'year') {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (filter === 'week') {
      start.setDate(now.getDate() - now.getDay()); // 本周日
    } else if (filter === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1); // 本月1号
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // 本月最后一天
    } else {
      start = new Date(now.getFullYear(), 0, 1); // 本年1月1日
      end = new Date(now.getFullYear(), 11, 31); // 本年12月31日
    }

    // 格式化为 YYYY-MM-DD
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    return {
      startDate: formatDate(start),
      endDate: formatDate(end)
    };
  },

  // 辅助方法 2：因为后端已经过滤完了，前端只需要算总和并画图
  processRenderData(filteredRecords: RecordItem[]) {
    // 格式化展示时间
    const processedRecords = filteredRecords.map(r => ({
      ...r,
      createTimeStr: this.formatTime(r.createTime)
    }));

    // 统计各分类总金额供饼图使用
    const categoryMap: { [key: string]: number } = {};
    let total = 0;

    filteredRecords.forEach(r => {
      total += r.amount;
      categoryMap[r.category] = (categoryMap[r.category] || 0) + r.amount;
    });

    const categoryData = Object.keys(categoryMap).map(category => ({
      category,
      amount: categoryMap[category],
      percent: total > 0 ? Math.round((categoryMap[category] / total) * 100) : 0,
      color: CATEGORY_COLORS[category] || '#B8B8B8'
    })).sort((a, b) => b.amount - a.amount);

    this.setData({
      filteredRecords: processedRecords,
      totalAmount: total.toFixed(2),
      categoryData
    });

    // 重绘饼图
    this.drawPieChart(categoryData, total);
  },

//以下是点开详情订单时的更改设置
  onFilterChange(e: any) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    this.loadData();
  },

  onCategoryChange(e: WechatMiniprogram.PickerChange) {
    this.setData({
      selectedCategory: Number(e.detail.value)
    });
    this.loadData();
  },
//更改背景颜色的设置
  openSettings() {
    this.setData({
      showSettings: true,
      showChart: false
    });
  },

  closeSettings() {
    this.setData({
      showSettings: false,
      detailRecord: null,
      showChart: true
    });
    setTimeout(() => {
      this.loadData();
    }, 100);
  },

  selectColor(e: any) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      backgroundColor: color,
      backgroundType: 'color',
      backgroundImage: ''
    });
  
    const app = getApp<IAppOption>();
    if (app && app.updateBackground) {
      app.updateBackground('color', color);
    }
  },

  chooseBackgroundImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          backgroundImage: tempFilePath,
          backgroundType: 'image'
        });
        const app = getApp<IAppOption>();
        if (app && app.updateBackground) {
          app.updateBackground('image', tempFilePath);
        }
      }
    });
  },

  clearBackgroundImage() {
    this.setData({
      backgroundImage: '',
      backgroundType: 'color',
      backgroundColor: '#667eea'
    });
    const app = getApp<IAppOption>();
    if (app && app.updateBackground) {
      app.updateBackground('color', '#667eea');
    }
  },

  onRecordTap(e: any) {
    const record = e.currentTarget.dataset.record;
    this.setData({
      showDetail: true,
      detailRecord: record,
      showChart: false
    });
  },

  onCloseDetail() {
    this.setData({
      showDetail: false,
      detailRecord: null,
      showChart: true
    });
    setTimeout(() => {
      this.loadData();
    }, 100);
  },

  calculateCategoryData(records: RecordItem[]) {
    const now = new Date();
    const currentFilter = this.data.currentFilter;
    const selectedCategory = this.data.selectedCategory;
    let startTime: number;

    if (currentFilter === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      startTime = weekStart.getTime();
    } else if (currentFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startTime = monthStart.getTime();
    } else {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      startTime = yearStart.getTime();
    }

    let filteredRecords = records.filter(r => r.createTime >= startTime);

    if (selectedCategory > 0) {
      const categoryName = ALL_CATEGORIES[selectedCategory];
      filteredRecords = filteredRecords.filter(r => r.category === categoryName);
    }

    const categoryMap: { [key: string]: number } = {};
    let total = 0;

    filteredRecords.forEach(r => {
      total += r.amount;
      categoryMap[r.category] = (categoryMap[r.category] || 0) + r.amount;
    });

    return Object.keys(categoryMap).map(category => ({
      category,
      amount: categoryMap[category],
      percent: total > 0 ? Math.round((categoryMap[category] / total) * 100) : 0,
      color: CATEGORY_COLORS[category] || '#B8B8B8'
    })).sort((a, b) => b.amount - a.amount);
  },

  filterAndProcessRecords(records: RecordItem[]) {
    const now = new Date();
    const currentFilter = this.data.currentFilter;
    const selectedCategory = this.data.selectedCategory;
    let startTime: number;

    if (currentFilter === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      startTime = weekStart.getTime();
    } else if (currentFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startTime = monthStart.getTime();
    } else if(currentFilter === 'year'){
      const yearStart = new Date(now.getFullYear(), 0, 1);
      startTime = yearStart.getTime();
    }else{
      return { startDate: '', endDate: '' };
    }

    let filteredRecords = records.filter(r => r.createTime >= startTime);

    if (selectedCategory > 0) {
      const categoryName = ALL_CATEGORIES[selectedCategory];
      filteredRecords = filteredRecords.filter(r => r.category === categoryName);
    }

    const processedRecords = filteredRecords.map(r => ({
      ...r,
      createTimeStr: this.formatTime(r.createTime)
    }));

    const categoryMap: { [key: string]: number } = {};
    let total = 0;

    filteredRecords.forEach(r => {
      total += r.amount;
      categoryMap[r.category] = (categoryMap[r.category] || 0) + r.amount;
    });

    let categoryData = Object.keys(categoryMap).map(category => ({
      category,
      amount: categoryMap[category],
      percent: total > 0 ? Math.round((categoryMap[category] / total) * 100) : 0,
      color: CATEGORY_COLORS[category] || '#B8B8B8'
    })).sort((a, b) => b.amount - a.amount);

    if (selectedCategory > 0) {
      categoryData = categoryData.filter(item => item.category === ALL_CATEGORIES[selectedCategory]);
    }

    this.setData({
      filteredRecords: processedRecords,
      totalAmount: total.toFixed(2),
      categoryData
    });

    this.drawPieChart(categoryData, total);
  },

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  drawPieChart(categoryData: CategoryData[], total: number) {
    if (total === 0 || categoryData.length === 0) {
      return;
    }

    const query = wx.createSelectorQuery();
    query.select('#pieChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;

        const canvas = res[0].node as any;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const width = res[0].width;
        const height = res[0].height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        let progress = 0;
        const animationDuration = 1000;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          progress = Math.min(elapsed / animationDuration, 1);
          const easeOutProgress = 1 - Math.pow(1 - progress, 3);

          ctx.clearRect(0, 0, width, height);

          let currentAngle = -Math.PI / 2;

          categoryData.forEach((item) => {
            const targetSliceAngle = (item.amount / total) * 2 * Math.PI;
            const currentSliceAngle = targetSliceAngle * easeOutProgress;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + currentSliceAngle);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();

            if (progress >= 1 && item.percent >= 3) {
              const midAngle = currentAngle + currentSliceAngle / 2;
              const labelRadius = radius * 0.65;
              const labelX = centerX + Math.cos(midAngle) * labelRadius;
              const labelY = centerY + Math.sin(midAngle) * labelRadius;

              ctx.fillStyle = '#fff';
              ctx.font = 'bold 24px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${item.percent}%`, labelX, labelY);
            }

            currentAngle += targetSliceAngle;
          });

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#fff';
          ctx.fill();

          if (progress < 1) {
            setTimeout(animate, 16);
          }
        };

        animate();
      });
  }
});