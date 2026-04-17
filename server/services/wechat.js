const axios = require('axios');
require('dotenv').config();

const APPID = process.env.WECHAT_APPID || 'wxbba514c6a919d753';
const SECRET = process.env.WECHAT_SECRET || 'fe5fc1e360863f21df50899990cdf1ea';

async function code2Session(code) {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
  const { data } = await axios.get(url);
  return data;
}

async function getAccessToken() {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
  const { data } = await axios.get(url);
  return data.access_token;
}

async function sendSubscribeMessage(openid, templateId, page, data) {
  const accessToken = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
  const { data: res } = await axios.post(url, {
    touser: openid,
    template_id: templateId,
    page,
    data
  });
  return res;
}

module.exports = {
  code2Session,
  getAccessToken,
  sendSubscribeMessage
};
