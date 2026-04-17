function request(options) {
  const app = getApp();
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: {
        env: app && app.globalData ? app.globalData.cloudEnv : 'prod-d7gzti9wmaf3faa49'
      },
      path: options.url,
      method: options.method || 'GET',
      header: {
        'X-WX-SERVICE': 'schedule-server',
        'Content-Type': 'application/json'
      },
      data: options.data || {},
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          wx.showToast({ title: '登录已过期', icon: 'none' });
          reject(res.data);
        } else {
          const msg = res.data && res.data.message ? res.data.message : '请求失败';
          wx.showToast({ title: msg, icon: 'none' });
          reject(res.data);
        }
      },
      fail: (err) => {
        console.error('callContainer fail:', err);
        reject(err);
      }
    });
  });
}

module.exports = {
  request
};
