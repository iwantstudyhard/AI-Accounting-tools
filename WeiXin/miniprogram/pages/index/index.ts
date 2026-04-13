// pages/index/index.ts

const app = getApp<IAppOption>()

Page({
  data: {
    hasLogin: false,
    bgType: 'color',
    bgColor: '#667eea',
    bgImage: ''
  },

  onShow() {
    // 每次进入页面，检查一下是否有 Token
    const token = wx.getStorageSync('token');
    this.setData({
      hasLogin: !!token,
      bgType: app.globalData.backgroundType,
      bgColor: app.globalData.backgroundColor,
      bgImage: app.globalData.backgroundImage
    });
  },

  // 处理登录点击
  handleLogin() {
    wx.showLoading({ title: '安全登录中...' });
    
    app.doLogin();
  
    let attempt = 0;
    const maxAttempts = 10; // 最多等 5 秒（500ms * 10）
  
    let timer = setInterval(() => {
      attempt++;
      const token = wx.getStorageSync('token');
      
      if (token) {
        clearInterval(timer);
        wx.hideLoading();
        this.setData({ hasLogin: true });
        wx.showToast({ title: '登录成功', icon: 'success' });
      } else if (attempt >= maxAttempts) {
        // 5 秒还没拿到 Token，报错并停止转圈
        clearInterval(timer);
        wx.hideLoading();
        wx.showModal({
          title: '登录超时',
          content: '请检查后端服务是否启动，或查看开发者工具控制台报错。',
          showCancel: false
        });
      }
    }, 500);
  },
  goToAddBill(){
    // 震动一下手机
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({
      url: '/pages/add-record/add-record',
      success: () => {
        console.log("🚀 已成功跳转至记账页面");
      },
      fail: (err) => {
        console.error("❌ 跳转失败", err);
        wx.showModal({
          title: '跳转失败',
          content: '请确认页面路径 pages/add/add 是否存在',
          showCancel: false
        });
      }
    });
  }
})