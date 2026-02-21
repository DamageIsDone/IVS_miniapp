// index.js
const app = getApp();

Page({
  data: {
    hasUserInfo: false,
    userInfo: {},
    bound: false,
    boundPhone: '',
    openid: '',
    showPopup: false,
    phone: '',
    password: '',
    result: '' // 用于显示测试结果
  },

  onLoad(options) {
    this.autoLogin();
  },

  autoLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.request({
            url: `${app.globalData.baseUrl}/wechat/login`,
            method: 'POST',
            data: { code: res.code },
            success: (resp) => {
              if (resp.data.code === 200) {
                const data = resp.data.data;
                this.setData({
                  openid: data.openid,
                  bound: data.bound
                });
                if (data.bound && data.user) {
                  this.setData({ boundPhone: data.user.username });
                }
              } else {
                wx.showToast({ title: '登录失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    });
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于展示用户头像和昵称',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
      },
      fail: () => {
        wx.showToast({ title: '用户拒绝授权', icon: 'none' });
      }
    });
  },

  showBindPopup() {
    this.setData({ showPopup: true });
  },

  cancelBind() {
    this.setData({ showPopup: false, phone: '', password: '' });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  confirmBind() {
    const { openid, phone, password } = this.data;
    if (!phone || !password) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
    wx.request({
      url: `${app.globalData.baseUrl}/wechat/bind`,
      method: 'POST',
      data: { openid, username: phone, password },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '绑定成功', icon: 'success' });
          this.setData({
            bound: true,
            boundPhone: phone,
            showPopup: false,
            phone: '',
            password: ''
          });
        } else {
          wx.showToast({ title: res.data.message || '绑定失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  gotoWiki() {
    wx.switchTab({
      url: '/pages/wiki/wiki',
      fail: (err) => {
        wx.showToast({ title: 'Wiki页面跳转失败', icon: 'none' });
        console.error('Wiki页面跳转失败：', err);
      }
    });
  },

  gotoRecord() {
    wx.switchTab({
      url: '/pages/record/record',
      fail: (err) => {
        wx.showToast({ title: 'Record页面跳转失败', icon: 'none' });
        console.error('Record页面跳转失败：', err);
      }
    });
  },

  testWechatLogin() {
    const that = this;
    wx.login({
      success: (res) => {
        if (res.code) {
          that.requestLogin(res.code);
        } else {
          that.setData({ result: 'wx.login 失败：' + res.errMsg });
        }
      },
      fail: (err) => {
        that.setData({ result: 'wx.login 调用失败：' + JSON.stringify(err) });
      }
    });
  },

  requestLogin(code) {
    const that = this;
    const url = `${app.globalData.baseUrl}/wechat/login`;
    wx.request({
      url: url,
      method: 'POST',
      data: { code: code },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        console.log('后端返回：', res.data);
        if (res.data.code === 200) {
          that.setData({ result: '成功，openid: ' + res.data.data.openid });
        } else {
          that.setData({ result: '后端返回错误：' + res.data.message });
        }
      },
      fail: (err) => {
        that.setData({ result: '请求失败：' + JSON.stringify(err) });
      }
    });
  }
});