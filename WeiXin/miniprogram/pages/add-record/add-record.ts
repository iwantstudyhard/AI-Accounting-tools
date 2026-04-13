import { BASE_URL } from '../../config'
interface RecordItem {
  id: string;
  imagePath: string;
  amount: number;
  category: string;
  note: string;
  createTime: number;
}

interface RecordStorage {
  records: RecordItem[];
}

Page({
  data: {
    tempImagePath: '',
    amount: '',
    note: '',
    categories: ['餐饮', '购物', '交通', '娱乐', '居住', '通讯', '医疗', '其他'],
    selectedCategory: 0,
    showManualForm: false,
    showSettings: false,
    colorOptions: ['#667eea', '#764ba2', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'],
    backgroundColor: '#667eea',
    backgroundImage: '',
    backgroundType: 'color'
  },

  onLoad() {
    this.setData({
      selectedCategory: 0
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

  openSettings() {
    this.setData({
      showSettings: true
    });
  },

  closeSettings() {
    this.setData({
      showSettings: false
    });
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
//清除自选的背景图照片
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

// 1. 一键触发：选图/拍照并直接上传
chooseAndUploadImage() {
  wx.chooseMedia({
    count: 1, // 每次只传一张
    mediaType: ['image'],
    sourceType: ['album', 'camera'], // 支持相册截图和直接拍照
    success: (res) => {
      const tempFilePath = res.tempFiles[0].tempFilePath;

      // 立刻把拍好的照片显示在界面上
      this.setData({
        tempImagePath: tempFilePath
      });

      // 🌟 核心 UX：立刻给用户反馈，不让他们干等！
      wx.showToast({
        title: '后台正在记账，请稍后查看统计内容',
        icon: 'none',
        duration: 3000 // 提示框停留 3 秒
      });

      // 执行静默上传
      this.silentUpload(tempFilePath);
    }
  });
},

  // 静默上传到服务器的方法
  silentUpload(filePath: string) {
    // 提示用户正在调用大模型
    wx.uploadFile({
      url: `${BASE_URL}/api/picture/upload`, 
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token') // JWT Token
      },
    
      success: (res) => {
        wx.hideLoading(); // 关掉 loading 框
        
        // 🌟 关键：处理后端返回的数据格式差异
        try {
          // 尝试把返回值解析成 JSON
          const billData = JSON.parse(res.data);
          
          // 如果解析成功，且里面有 id，说明 AI 识别并存库成功了！
          if (billData.id) {
            wx.vibrateShort({ type: 'medium' });
            // 可以把 AI 识别出来的金额和分类展示给用户看一眼
            wx.showToast({ 
              title: `记账成功：${billData.amount}元`, 
              icon: 'success',
              duration: 2000
            });
            
            // 延迟退回首页
            setTimeout(() => {
              wx.navigateBack();
            }, 2000);
          }
        } catch (e) {
          // 如果 JSON.parse 报错，说明后端返回的是纯文字的错误提示
          // 比如你的代码里的："文件为空，请选择一张图片上传" 或 "照片上传出错"
          console.error("AI 识别或解析失败:", res.data);
          wx.showToast({ 
            title: res.data || '识别失败', 
            icon: 'none',
            duration: 3000
          });
          this.setData({ tempImagePath: '' }); // 清理掉识别失败的图片，让用户重试
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("静默上传网络失败:", err);
        wx.showToast({ title: '无法连接服务器', icon: 'error' });
        this.setData({ tempImagePath: '' });
      }
    });
  },

  onAmountInput(e: any) {
    this.setData({
      amount: e.detail.value
    });
  },

  onNoteInput(e: any) {
    this.setData({
      note: e.detail.value
    });
  },

  onCategoryChange(e: WechatMiniprogram.PickerChange) {
    this.setData({
      selectedCategory: Number(e.detail.value)
    });
  },

 // 手动的记账的功能，划分为是否有照片
 saveRecord() {
  const { amount, note, categories, selectedCategory, tempImagePath } = this.data;

  // 基础校验
  if (!amount) {
    wx.showToast({ title: '请输入金额', icon: 'none' });
    return;
  }

  // 组装要提交的数据
  const record: RecordItem = {
    id: `record_${Date.now()}`,
    imagePath: tempImagePath || '', // 如果没图就是空字符串
    amount: parseFloat(amount),
    category: categories[selectedCategory], // 这里取出了具体的分类字符串，比如 "餐饮"
    note: note || '',
    createTime: Date.now()
  };

  // 把组装好的数据传给执行方法
  this.doSaveRecord(record);
},

// 2. 点击切换拍照按钮时，将选项恢复默认值
toggleFormMode() {
  this.setData({
    showManualForm: !this.data.showManualForm,
    tempImagePath: '',
    amount: '',
    note: '',
    selectedCategory: 0
  });
},

// 3. 真正负责和后端通讯的核心方法
doSaveRecord(record: RecordItem) {
  wx.showLoading({ title: '保存中...', mask: true });

  const today = new Date();

const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');

const recordDate = `${year}-${month}-${day}`;
  // 微信小程序要求 formData 里的所有值必须是 string 类型
  const formData = {
    'amount': record.amount.toString(),
    'categoryName': record.category,
    'note': record.note,
    'recordDate': recordDate, // 建议后期改成动态获取当天的 YYYY-MM-DD
    'type': '1'
  };

  // 🌟 核心分流逻辑 🌟
  
  if (record.imagePath) {
    // 【场景 A：有图片】必须用 wx.uploadFile
    wx.uploadFile({
      url: `${BASE_URL}/api/bill/add`,
      filePath: record.imagePath,
      name: 'file',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      formData: formData,
      success: (res) => {
        wx.hideLoading();
        // 注意：uploadFile 返回的是 string，必须 parse
        const data = JSON.parse(res.data);
        if (data.success) {
          wx.showToast({ title: '记账成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500); // 成功后退回上一个页面
        } else {
          wx.showToast({ title: data.error || '上传失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("上传失败:", err);
      }
    });
  } else {
    // 【场景 B：无图片】只是纯文字记账，必须用 wx.request
    wx.request({
      url: `${BASE_URL}/api/bill/add`,
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token'),
        // 因为后端现在不接收 JSON 了，这里要模拟表单提交！
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      data: formData, // 直接把刚才拼好的对象丢过去
      success: (res: any) => {
        wx.hideLoading();
        if (res.data && res.data.success) {
          wx.showToast({ title: '记账成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.data?.error || '保存失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("请求失败:", err);
      }
    });
  }
}
})