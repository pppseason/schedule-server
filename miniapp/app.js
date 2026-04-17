App({
  globalData: {
    cloudEnv: 'prod-d7gzti9wmaf3faa49',
    token: null
  },

  onLaunch() {
    try {
      if (wx.cloud) {
        wx.cloud.init({ env: this.globalData.cloudEnv });
      }
    } catch (e) {
      console.error('云初始化失败:', e);
    }
  }
});
