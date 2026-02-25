const app = getApp();

Page({
  data: {
    currentTab: 0,
    hunterList: [],    // 监管者列表
    survivorList: [],  // 求生者列表
    talentList: [],    // 人格脉络列表
    allIdentities: [],
    allTalents: [],
    // 新增：弹窗相关数据
    showTalentDetail: false, // 是否显示人格脉络详情弹窗
    currentTalent: null      // 当前选中的人格脉络数据
  },

  onLoad(options) {
    this.getAllIdentities();
    this.getAllTalents();
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
          this.initSplitList();
        }
      },
      fail: (err) => {
        console.error('请求角色数据失败：', err);
        wx.showToast({
          title: `请求失败：${err.errMsg}`,
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  // 请求所有人格脉络数据
  getAllTalents() {
    const baseUrl = app.globalData.baseUrl;
    wx.request({
      url: `${baseUrl}/talents`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            allTalents: res.data,
            talentList: res.data
          });
        }
      },
      fail: (err) => {
        console.error('请求人格脉络数据失败：', err);
        wx.showToast({
          title: `人格脉络数据加载失败：${err.errMsg}`,
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  // 拆分监管者/求生者列表
  initSplitList() {
    const formatGender = (gender) => gender === 'Female' ? '女' : '男';
    const hunterList = this.data.allIdentities
      .filter(item => item.camp === 'Hunter')
      .map(item => ({ ...item, gender: formatGender(item.gender) }));
    const survivorList = this.data.allIdentities
      .filter(item => item.camp === 'Survivor')
      .map(item => ({ ...item, gender: formatGender(item.gender) }));
    
    this.setData({
      hunterList,
      survivorList
    });
  },

  // 切换标签
  switchTab(e) {
    const tabIndex = parseInt(e.currentTarget.dataset.tab);
    if (tabIndex === this.data.currentTab) return;
    this.setData({
      currentTab: tabIndex
    });
    if (tabIndex === 2) {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const searchInput = currentPage.selectComponent('.search-input');
      if (searchInput && searchInput.data.value) {
        this.searchIdentity(searchInput.data.value.trim());
      }
    }
  },

  // 搜索功能
  searchIdentity(str) {
    if (!str) {
      this.initSplitList();
      this.setData({ talentList: this.data.allTalents });
      return;
    }

    const baseUrl = app.globalData.baseUrl;
    wx.request({
      url: `${baseUrl}/identities/search`,
      method: 'GET',
      data: { str },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          res.data.gender = res.data.gender === 'Female' ? '女' : '男';
          if (res.data.camp === 'Hunter') {
            this.setData({ hunterList: [res.data], survivorList: [], talentList: [] });
          } else if (res.data.camp === 'Survivor') {
            this.setData({ survivorList: [res.data], hunterList: [], talentList: [] });
          }
        } else {
          this.searchTalent(str);
        }
      },
      fail: () => {
        this.searchTalent(str);
      }
    });
  },

  // 搜索人格脉络
  searchTalent(str) {
    const baseUrl = app.globalData.baseUrl;
    wx.request({
      url: `${baseUrl}/talents/search`,
      method: 'GET',
      data: { name: str },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            talentList: [res.data],
            hunterList: [],
            survivorList: []
          });
        } else {
          this.setData({
            hunterList: [],
            survivorList: [],
            talentList: []
          });
          wx.showToast({ title: '未找到相关内容', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('搜索人格脉络失败：', err);
        this.setData({
          hunterList: [],
          survivorList: [],
          talentList: []
        });
        wx.showToast({ title: '搜索失败', icon: 'none' });
      }
    });
  },

  onSearchInput(e) {
    this.searchIdentity(e.detail.value.trim());
  },

  // 新增：点击人格脉络卡片，显示详情弹窗
  showTalentDetail(e) {
    const talent = e.currentTarget.dataset.talent;
    this.setData({
      currentTalent: talent,
      showTalentDetail: true
    });
  },

  // 新增：关闭人格脉络详情弹窗
  closeTalentDetail() {
    this.setData({
      showTalentDetail: false,
      currentTalent: null
    });
  }
});