App({
  globalData: {
    openid: null
  },

  async onLaunch() {
    // 微信登录获取openid
    await this.login();
  },

  // 微信登录
  async login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (res) => {
          if (res.code) {
            // 调用登录接口
            wx.request({
              url: 'https://schedule-server-247739-4-1423159736.sh.run.tcloudbase.com/auth/login',
              method: 'POST',
              data: { code: res.code },
              success: (result) => {
                if (result.data.code === 0) {
                  this.globalData.openid = result.data.openid;
                  console.log('登录成功，openid:', this.globalData.openid);
                  resolve(result.data.openid);
                } else {
                  console.error('登录接口返回错误:', result.data.message);
                  reject(result.data.message);
                }
              },
              fail: (err) => {
                console.error('登录接口请求失败:', err);
                reject(err);
              }
            });
          } else {
            console.error('登录失败，没有code:', res.errMsg);
            reject(res.errMsg);
          }
        },
        fail: (err) => {
          console.error('wx.login失败:', err);
          reject(err);
        }
      });
    });
  }
});
