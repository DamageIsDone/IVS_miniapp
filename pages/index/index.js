// index.js
const app = getApp();

Page({
  data: {
    // 原有数据
    hasUserInfo: false,      // 是否已获取微信用户信息
    userInfo: {},            // 微信用户信息（头像、昵称）
    bound: false,            // 绑定状态
    boundPhone: '',          // 绑定游戏名
    userId: null,            // 游戏ID
    openid: '',              // 微信openid
    showPopup: false,        // 控制绑定弹窗显示
    phone: '',               // 输入的手机号
    password: '',            // 输入的密码
    signTotalDays: 0,          // 累计签到天数
    signedToday: false,        // 今日是否已签到
    signLoading: false,        // 签到按钮加载状态
    showDetail: false,         // 控制详情弹窗显示
    todayFortune: { text: '' }, // 今日签文
  },

 
  fortunes: [
    { text: '伊塔库亚远袭观鸟中！' },
    { text: '格蕾丝在想鱼儿为什么不会说话...' },
    { text: '约瑟夫今天暗杀又没有人。' },
    { text: '全体ob位决定今天不要出现在你的排位里' },
    { text: '愚人金还在傻笑' },
    { text: '卢卡今天依旧双弹飞轮' },
    { text: '玛丽觉得可以一镜双刀' },
    { text: '开发者们祝您今天开心~' },
  ],

  onLoad(options) {
    const storedUserId = wx.getStorageSync('userId');
    const storedBoundPhone = wx.getStorageSync('boundPhone');
    const storedOpenid = wx.getStorageSync('openid');
    const storedUserInfo = wx.getStorageSync('userInfo');
    if (storedUserId) {
      // 已绑定
      this.setData({
        bound: true,
        userId: storedUserId,
        boundPhone: storedBoundPhone || '',
        openid: storedOpenid || '',
        userInfo: storedUserInfo || {},
        hasUserInfo: !!storedUserInfo
      });
      // 获取签到状态
      this.fetchSignStatus();
    } else {
      this.autoLogin();
    }
    this.initFortune();
  },

  // 调用后端login接口获取openid和绑定状态
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
                  // 已绑定
                  const userId = data.user.user_id;
                  const boundPhone = data.user.username; 
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
                // 获取签到状态
                this.fetchSignStatus();
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

  // 获取签到状态
  fetchSignStatus() {
    const { openid } = this.data;
    if (!openid) return;
    wx.request({
      url: `${app.globalData.baseUrl}/wechat/sign/status`,
      method: 'GET',
      data: { openid },
      success: (res) => {
        if (res.data.code === 200) {
          const { totalDays, signedToday } = res.data.data;
          this.setData({
            signTotalDays: totalDays,
            signedToday: signedToday
          });
        } else {
          console.error('获取签到状态失败', res.data.message);
        }
      },
      fail: (err) => {
        console.error('网络错误', err);
      }
    });
  },

  //签到
  handleSign() {
    const { openid, signedToday, signLoading } = this.data;
    if (signedToday || signLoading) return;
    this.setData({ signLoading: true });
    wx.request({
      url: `${app.globalData.baseUrl}/wechat/sign`,
      method: 'POST',
      data: { openid },
      success: (res) => {
        if (res.data.code === 200) {
          const { totalDays } = res.data.data;
          this.setData({
            signTotalDays: totalDays,
            signedToday: true,
            signLoading: false
          });
          wx.showToast({ title: '签到成功', icon: 'success' });
        } else {
          wx.showToast({ title: res.data.message || '签到失败', icon: 'none' });
          this.setData({ signLoading: false });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误', icon: 'none' });
        this.setData({ signLoading: false });
      }
    });
  },

  // 初始化抽签
initFortune() {
  const stored = wx.getStorageSync('fortune');
  if (stored && stored.text) {
    this.setData({ todayFortune: stored });
  } else {
    this.drawFortune(); 
  }
},

// 抽签
drawFortune() {
  const randomIndex = Math.floor(Math.random() * this.fortunes.length);
  const fortune = this.fortunes[randomIndex];
  wx.setStorageSync('fortune', fortune); 
  this.setData({ todayFortune: fortune });
},

  // 检查并跳转 Record
  checkAndGotoRecord() {
    if (!this.data.bound) {
      wx.showModal({
        title: '提示',
        content: '请先绑定账号',
        confirmText: '去绑定',
        success: (res) => {
          if (res.confirm) {
            this.showBindPopup(); // 弹出绑定弹窗
          }
        }
      });
      return;
    }
    // 已绑定，跳转
    wx.switchTab({
      url: '/pages/record/record',
      fail: (err) => {
        wx.showToast({ title: 'Record页面跳转失败', icon: 'none' });
        console.error('Record页面跳转失败：', err);
      }
    });
  },

  // 显示详情弹窗
  showDetailPopup() {
    this.setData({ showDetail: true });
  },

  // 隐藏详情弹窗
  hideDetailPopup() {
    this.setData({ showDetail: false });
  },

  // 获取微信用户头像、昵称
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
  cancelBind(e) {
    if (e.target.dataset.type === 'mask') {
      this.setData({ showPopup: false, phone: '', password: '' });
    } else {
      this.setData({ showPopup: false, phone: '', password: '' });
    }
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
      content: '解绑后，将无法使用战绩功能，确定吗？',
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

 
  stopPropagation() {},

  // 跳转Wiki页面
  gotoWiki() {
    wx.switchTab({
      url: '/pages/wiki/wiki',
      fail: (err) => {
        wx.showToast({ title: 'Wiki页面跳转失败', icon: 'none' });
        console.error('Wiki页面跳转失败：', err);
      }
    });
  }

  

 
});