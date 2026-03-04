// components/custom-tabbar/custom-tabbar.ts
Component({
  properties: {
    currentTab: {
      type: Number,
      value: 0
    }
  },
  data: {
    currentTabIndex: 0
  },
  observers: {
    'currentTab': function(currentTab) {
      this.setData({
        currentTabIndex: currentTab
      });
    }
  },
  methods: {
    switchTab(e: any) {
      const index = parseInt(e.currentTarget.dataset.index);
      console.log('点击导航栏:', index, '当前页面:', this.data.currentTabIndex);
      
      if (index === this.data.currentTabIndex) return;
      
      const url = index === 0 ? '/pages/add-record/add-record' : '/pages/statistics/statistics';
      
      wx.switchTab({
        url: url,
        success: (res) => {
          console.log('跳转成功:', url);
        },
        fail: (err) => {
          console.error('跳转失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });
    }
  }
})