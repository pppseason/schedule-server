const { request } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    isLogin: false,
    currentDate: '',
    currentDateStr: '',
    schedules: [],
    inputText: '',
    loading: false,
    imageLoading: false
  },

  onLoad(options) {
    // 云托管自动携带用户身份，无需 wx.login 获取 code
    this.setData({ isLogin: true });
    const selected = getApp().globalData.selectedDate;
    this.initDate(selected || options.date);
    getApp().globalData.selectedDate = null;
  },

  onShow() {
    const selected = getApp().globalData.selectedDate;
    if (selected) {
      this.initDate(selected);
      getApp().globalData.selectedDate = null;
    } else if (this.data.isLogin && this.data.currentDate) {
      this.loadSchedules();
    }
  },

  initDate(dateStr) {
    const today = dateStr ? new Date(dateStr) : new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const date = `${y}-${m}-${d}`;
    const dateStrFormatted = `${y}年${m}月${d}日`;
    this.setData({ currentDate: date, currentDateStr: dateStrFormatted }, () => {
      this.loadSchedules();
    });
  },

  login() {
    // 云托管模式下 callContainer 自动携带 openid，无需手动登录
    this.setData({ isLogin: true });
    this.initDate();
  },

  loadSchedules() {
    request({
      url: '/schedule/list?date=' + this.data.currentDate,
      method: 'GET'
    }).then((res) => {
      this.setData({ schedules: res.data || [] });
    }).catch((err) => {
      console.error('加载日程失败:', err);
      this.setData({ schedules: [] });
    });
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  onCreateByAI() {
    const text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({ title: '请输入日程内容', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    request({
      url: '/schedule/ai',
      method: 'POST',
      data: { text }
    }).then((res) => {
      this.setData({ inputText: '', loading: false });
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.loadSchedules();
      // 申请订阅消息
      this.requestSubscribeMessage();
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  requestSubscribeMessage() {
    wx.requestSubscribeMessage({
      tmplIds: ['ib2N8c_bfewQB-zGs7a5bTLGQm_9CGwncb08h2h8hm8'],
      success: (res) => {
        console.log('订阅结果:', res);
      },
      fail: (err) => {
        console.log('订阅失败:', err);
      }
    });
  },

  onUploadImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFile = res.tempFiles[0];
        const tempPath = tempFile.tempFilePath;
        // 限制原图不超过 2MB，避免容器 OOM
        const MAX_SIZE = 2 * 1024 * 1024;
        if (tempFile.size > MAX_SIZE) {
          wx.showToast({ title: '图片过大，请压缩后重试（不超过 2MB）', icon: 'none' });
          return;
        }
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: tempPath,
          encoding: 'base64',
          success: (fileRes) => {
            const base64 = `data:image/jpeg;base64,${fileRes.data}`;
            this.setData({ imageLoading: true });
            request({
              url: '/schedule/ai-image',
              method: 'POST',
              data: { image: base64 }
            }).then((res) => {
              this.setData({ imageLoading: false });
              wx.showToast({ title: '识别成功', icon: 'success' });
              this.loadSchedules();
              this.requestSubscribeMessage();
            }).catch((err) => {
              this.setData({ imageLoading: false });
              const msg = err && err.message ? err.message : '识别失败';
              wx.showToast({ title: msg, icon: 'none' });
            });
          },
          fail: (err) => {
            console.error('读取图片失败:', err);
            wx.showToast({ title: '读取图片失败', icon: 'none' });
          }
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
      }
    });
  },

  onPrevDay() {
    const date = new Date(this.data.currentDate);
    date.setDate(date.getDate() - 1);
    this.initDate(date.toISOString());
  },

  onNextDay() {
    const date = new Date(this.data.currentDate);
    date.setDate(date.getDate() + 1);
    this.initDate(date.toISOString());
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这个日程吗？',
      success: (res) => {
        if (res.confirm) {
          request({
            url: '/schedule/' + id,
            method: 'DELETE'
          }).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadSchedules();
          });
        }
      }
    });
  },

  goToCalendar() {
    wx.switchTab({ url: '/pages/calendar/calendar' });
  }
});
