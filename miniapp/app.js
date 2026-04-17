App({
  globalData: {
    openid: 'test_user_001'
  },

  onLaunch() {
    console.log('小程序启动完成，默认用户ID:', this.globalData.openid);
  }
});
