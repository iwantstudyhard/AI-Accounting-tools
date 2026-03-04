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

Page({
  data: {
    currentFilter: 'week' as 'week' | 'month' | 'year',
    totalAmount: '0.00',
    filteredRecords: [] as RecordItem[],
    categoryData: [] as CategoryData[],
    chartWidth: 350,
    chartHeight: 350
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const chartSize = Math.min(systemInfo.windowWidth - 80, 350);
    this.setData({
      chartWidth: chartSize,
      chartHeight: chartSize
    });
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const storageData = wx.getStorageSync('records') || { records: [] };
    const allRecords: RecordItem[] = storageData.records || [];
    this.filterAndProcessRecords(allRecords);
  },

  onFilterChange(e: any) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    this.loadData();
  },

  filterAndProcessRecords(records: RecordItem[]) {
    const now = new Date();
    const currentFilter = this.data.currentFilter;
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

    const filteredRecords = records.filter(r => r.createTime >= startTime);

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