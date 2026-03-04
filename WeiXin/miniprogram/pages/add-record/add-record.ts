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
    selectedCategory: 0
  },

  onLoad() {
    this.initTestData();
    this.setData({
      selectedCategory: 0
    });
  },

  initTestData() {
    const storageData = wx.getStorageSync('records');
    if (!storageData || !storageData.records || storageData.records.length === 0) {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const testRecords: RecordItem[] = [
        { id: 'record_1', imagePath: '', amount: 156.00, category: '餐饮', note: '午餐', createTime: now - 1 * day },
        { id: 'record_2', imagePath: '', amount: 299.00, category: '购物', note: '日用品', createTime: now - 2 * day },
        { id: 'record_3', imagePath: '', amount: 45.00, category: '交通', note: '地铁', createTime: now - 2 * day },
        { id: 'record_4', imagePath: '', amount: 128.00, category: '娱乐', note: '电影', createTime: now - 3 * day },
        { id: 'record_5', imagePath: '', amount: 2500.00, category: '居住', note: '房租', createTime: now - 5 * day },
        { id: 'record_6', imagePath: '', amount: 58.00, category: '通讯', note: '话费', createTime: now - 6 * day },
        { id: 'record_7', imagePath: '', amount: 88.00, category: '医疗', note: '感冒药', createTime: now - 7 * day },
        { id: 'record_8', imagePath: '', amount: 35.00, category: '其他', note: '零钱', createTime: now - 1 * day },
      ];
      wx.setStorageSync('records', { records: testRecords });
    }
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          tempImagePath: tempFilePath
        });
      },
      fail: (err) => {
        console.error('选择图片失败', err);
        wx.showToast({
          title: '请先选择图片',
          icon: 'none'
        });
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

  saveRecord() {
    const { tempImagePath, amount, note, categories, selectedCategory } = this.data;

    if (!tempImagePath) {
      wx.showToast({
        title: '请先上传图片',
        icon: 'none'
      });
      return;
    }

    if (!amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      });
      return;
    }

    const record: RecordItem = {
      id: `record_${Date.now()}`,
      imagePath: tempImagePath,
      amount: parseFloat(amount),
      category: categories[selectedCategory],
      note: note,
      createTime: Date.now()
    };

    const storageData = wx.getStorageSync('records') || { records: [] };
    storageData.records.unshift(record);
    wx.setStorageSync('records', storageData);

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });

    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/statistics/statistics'
      });
    }, 1500);
  }
});