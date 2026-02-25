const app = getApp();

Page({
  data: {
    currentTab: 0,
    hunterList: [],    // 监管者列表
    survivorList: [],  // 求生者列表
    talentList: [],    // 新增：人格脉络列表
    allIdentities: [],
    allTalents: []     // 新增：所有人格脉络原始数据
  },

  onLoad(options) {
    this.getAllIdentities();
    this.getAllTalents(); // 新增：加载人格脉络数据
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

  // 新增：请求所有人格脉络数据
  getAllTalents() {
    const baseUrl = app.globalData.baseUrl;
    wx.request({
      url: `${baseUrl}/talents`, // 对应后端TalentController的根路径
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            allTalents: res.data,
            talentList: res.data // 初始化人格脉络列表
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

  // 切换标签
  switchTab(e) {
    const tabIndex = parseInt(e.currentTarget.dataset.tab);
    if (tabIndex === this.data.currentTab) return;
    this.setData({
      currentTab: tabIndex
    });
    // 切换到人格脉络标签时，如果搜索框有内容，重新触发搜索
    if (tabIndex === 2) {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const searchInput = currentPage.selectComponent('.search-input');
      if (searchInput && searchInput.data.value) {
        this.searchIdentity(searchInput.data.value.trim());
      }
    }
  },

  // 搜索功能（适配人格脉络）
  searchIdentity(str) {
    if (!str) {
      // 搜索为空时重置所有列表
      this.initSplitList();
      this.setData({ talentList: this.data.allTalents }); // 重置人格脉络列表
      return;
    }

    const baseUrl = app.globalData.baseUrl;
    // 先尝试搜索角色（监管者/求生者）
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
          // 角色搜索无结果，尝试搜索人格脉络
          this.searchTalent(str);
        }
      },
      fail: () => {
        // 角色搜索失败，尝试搜索人格脉络
        this.searchTalent(str);
      }
    });
  },

  // 新增：搜索人格脉络
  searchTalent(str) {
    const baseUrl = app.globalData.baseUrl;
    wx.request({
      url: `${baseUrl}/talents/search`, // 对应后端getTalentByName接口
      method: 'GET',
      data: { name: str }, // 后端参数名是name，不是str
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            talentList: [res.data],
            hunterList: [],
            survivorList: []
          });
        } else {
          // 所有人都没找到
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
  }
});