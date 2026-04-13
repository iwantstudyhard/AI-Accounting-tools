// app.ts
import { BASE_URL } from './config'
interface AppGlobalData {
  backgroundType: 'color' | 'image';
  backgroundColor: string;
  backgroundImage: string;
}

// 2. 核心：定义 App 实例上的自定义方法和属性
interface IAppOption {
  globalData: AppGlobalData;
  doLogin: () => void;
  // 使用 WechatMiniprogram.RequestOption 来获得完美的参数提示
  authRequest: (options: WechatMiniprogram.RequestOption) => void;
  updateBackground: (type: 'color' | 'image', value: string) => void;
}

App<IAppOption>({
  globalData: {
    backgroundType: 'color',
    backgroundColor: '#667eea',
    backgroundImage: ''
  } as AppGlobalData,

  onLaunch() {
    const bgSettings = wx.getStorageSync('backgroundSettings');
    if (bgSettings) {
      this.globalData.backgroundType = bgSettings.backgroundType || 'color';
      this.globalData.backgroundColor = bgSettings.backgroundColor || '#667eea';
      this.globalData.backgroundImage = bgSettings.backgroundImage || '';
    }

    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);
    this.doLogin();
  },

 // app.ts 里的 doLogin
  doLogin() {
  console.log("🚀 开始准备登录...");
  wx.login({
    success: (res) => {
      console.log("📦 拿到微信 code:", res.code);
      wx.request({
        url: `${ BASE_URL }/api/user/wxLogin`,
        method: 'POST',
        data: { code: res.code },
        success: (backendRes) => {
          console.log("📥 后端返回原始数据:", backendRes);
          const data = backendRes.data as any;
          if (data.success) {
            wx.setStorageSync('token', data.token);
            console.log("✅ Token 已存入缓存");
          } else {
            console.error("❌ 后端逻辑错误:", data.error);
          }
        },
        fail: (err) => {
          // 如果是因为网络、域名、IP不通，会跑进这里
          console.error("🚨 无法连接到后端服务器:", err);
          wx.showModal({
            title: '连接失败',
            content: '请确认 SpringBoot 已启动，且勾选了“不校验合法域名”'
          });
        }
      })
    }
  })
},
  // 2. 封装一个带 Token 的快捷请求方法（可选，但推荐）
  // 以后在页面里直接用 getApp().authRequest(...) 即可
  authRequest(options) {
    const token = wx.getStorageSync('token');
    const header = options.header || {};
    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }
    

    wx.request({
      ...options,
      header: header,
      success: (res) => {
        if (res.statusCode === 401) {
          // 如果后端返回 401，说明 Token 过期了，重新登录
          this.doLogin();
        }
        options.success && options.success(res);
      }
    });
  },


  updateBackground(type: 'color' | 'image', value: string) {
    if (type === 'color') {
      this.globalData.backgroundType = 'color';
      this.globalData.backgroundColor = value;
    } else {
      this.globalData.backgroundType = 'image';
      this.globalData.backgroundImage = value;
    }
    wx.setStorageSync('backgroundSettings', {
      backgroundType: this.globalData.backgroundType,
      backgroundColor: this.globalData.backgroundColor,
      backgroundImage: this.globalData.backgroundImage
    });
  }
})