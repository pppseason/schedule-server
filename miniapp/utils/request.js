function request(options) {
  const app = getApp();
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://schedule-server-247739-4-1423159736.sh.run.tcloudbase.com' + options.url,
      method: options.method || 'GET',
      timeout: 30000,
      header: {
        'Content-Type': 'application/json',
        'X-WX-OPENID': app.globalData.openid || ''
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
        console.error('request fail:', err);
        reject(err);
      }
    });
  });
}

module.exports = {
  request
};