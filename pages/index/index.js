// index.js
const app = getApp();

Page({
  data: {
    hasUserInfo: false,      // 是否已获取微信用户信息
    userInfo: {},            // 微信用户信息（头像、昵称）
    bound: false,            // 绑定状态
    boundPhone: '',          // 已绑定的手机号（作为游戏名展示）
    userId: null,            // 游戏ID（user_id）
    openid: '',              // 微信openid
    showPopup: false,        // 控制绑定弹窗显示
    phone: '',               // 输入的手机号
    password: '',            // 输入的密码
    result: ''               // 测试结果显示
  },

  onLoad(options) {
    // 尝试从本地存储恢复用户信息（如已登录过）
    const storedUserId = wx.getStorageSync('userId');
    const storedBoundPhone = wx.getStorageSync('boundPhone');
    const storedOpenid = wx.getStorageSync('openid');
    const storedUserInfo = wx.getStorageSync('userInfo');
    if (storedUserId) {
      // 有存储的userId，认为已绑定（可优化为向后端校验，但简化处理）
      this.setData({
        bound: true,
        userId: storedUserId,
        boundPhone: storedBoundPhone || '',
        openid: storedOpenid || '',
        userInfo: storedUserInfo || {},
        hasUserInfo: !!storedUserInfo
      });
    } else {
      // 否则执行自动登录
      this.autoLogin();
    }
  },

  // 自动登录：调用后端login接口获取openid和绑定状态
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
                  // 已绑定，保存user_id和手机号
                  const userId = data.user.user_id;
                  const boundPhone = data.user.username; // username即手机号
                  this.setData({
                    userId: userId,
                    boundPhone: boundPhone
                  });
                  // 存储到本地
                  wx.setStorageSync('userId', userId);
                  wx.setStorageSync('boundPhone', boundPhone);
                  wx.setStorageSync('openid', data.openid);
                } else {
                  // 未绑定，只保存openid
                  wx.setStorageSync('openid', data.openid);
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

  // 获取微信用户信息（头像、昵称）
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于展示用户头像和昵称',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
        wx.setStorageSync('userInfo', userInfo);
      },
      fail: () => {
        wx.showToast({ title: '用户拒绝授权', icon: 'none' });
      }
    });
  },

  // 显示绑定弹窗
  showBindPopup() {
    this.setData({ showPopup: true });
  },

  // 取消绑定
  cancelBind() {
    this.setData({ showPopup: false, phone: '', password: '' });
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  // 确认绑定
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
          // 关闭弹窗，清空输入
          this.setData({
            showPopup: false,
            phone: '',
            password: ''
          });
          // 重新获取登录状态，更新页面（实时显示绑定信息）
          this.autoLogin();
        } else {
          wx.showToast({ title: res.data.message || '绑定失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 解绑账号
  unbindAccount() {
    wx.showModal({
      title: '确认解绑',
      content: '解绑后，该微信将无法登录当前游戏账号，确定吗？',
      success: (res) => {
        if (res.confirm) {
          const { openid } = this.data;
          wx.request({
            url: `${app.globalData.baseUrl}/wechat/unbind`,
            method: 'POST',
            data: { openid },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({ title: '解绑成功', icon: 'success' });
                // 清除本地存储的绑定信息
                wx.removeStorageSync('userId');
                wx.removeStorageSync('boundPhone');
                // 更新页面状态
                this.setData({
                  bound: false,
                  userId: null,
                  boundPhone: ''
                });
              } else {
                wx.showToast({ title: res.data.message || '解绑失败', icon: 'none' });
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

  // 原有跳转方法（保留）
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

  // 测试微信登录按钮（保留）
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