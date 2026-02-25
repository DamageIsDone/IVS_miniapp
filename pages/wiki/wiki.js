// pages/wiki/wiki.js
const app = getApp();

Page({
  data: {
    currentTab: 0,
    hunterList: [],    // 监管者列表
    survivorList: [],  // 求生者列表
    allIdentities: []
  },

  onLoad(options) {
    this.getAllIdentities();
  },

  // 请求所有角色数据
  getAllIdentities() {
    const baseUrl = app.globalData.baseUrl;
    wx.request({
      url: `${baseUrl}/identities`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            allIdentities: res.data
          });
          // 初始化拆分两个列表（只执行一次）
          this.initSplitList();
        }
      },
      fail: (err) => {
        console.error('请求失败详情：', err);
        wx.showToast({
          title: `请求失败：${err.errMsg}`,
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  // 拆分监管者/求生者列表（一次性拆分，避免重复计算）
  initSplitList() {
    const formatGender = (gender) => gender === 'Female' ? '女' : '男';
    // 监管者列表
    const hunterList = this.data.allIdentities
      .filter(item => item.camp === 'Hunter')
      .map(item => ({ ...item, gender: formatGender(item.gender) }));
    // 求生者列表
    const survivorList = this.data.allIdentities
      .filter(item => item.camp === 'Survivor')
      .map(item => ({ ...item, gender: formatGender(item.gender) }));
    
    this.setData({
      hunterList,
      survivorList
    });
  },

  // 切换标签：只切换显示的容器，不修改列表数据
  switchTab(e) {
    const tabIndex = parseInt(e.currentTarget.dataset.tab);
    if (tabIndex === this.data.currentTab) return;
    this.setData({
      currentTab: tabIndex
    });
  },

  // 搜索功能（适配拆分后的列表）
  searchIdentity(str) {
    if (!str) {
      // 搜索为空时重新初始化列表
      this.initSplitList();
      return;
    }
    wx.request({
      url: `${app.globalData.baseUrl}/identities/search`,
      method: 'GET',
      data: { str },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          res.data.gender = res.data.gender === 'Female' ? '女' : '男';
          // 根据搜索结果的camp，更新对应列表
          if (res.data.camp === 'Hunter') {
            this.setData({ hunterList: [res.data] });
          } else if (res.data.camp === 'Survivor') {
            this.setData({ survivorList: [res.data] });
          }
        } else {
          // 搜索无结果时清空对应列表
          if (this.data.currentTab === 0) {
            this.setData({ hunterList: [] });
          } else if (this.data.currentTab === 1) {
            this.setData({ survivorList: [] });
          }
          wx.showToast({ title: '未找到角色', icon: 'none' });
        }
      }
    });
  },

  onSearchInput(e) {
    this.searchIdentity(e.detail.value.trim());
  }
});