const app = getApp();

Page({
  data: {
    currentTab: 0,
    hunterList: [],
    survivorList: [],
    talentList: [],
    allIdentities: [],
    allTalents: [],
    
    showTalentDetail: false,
    currentTalent: null,
    
    showIdentityDetail: false,
    currentIdentity: null,
    identityDistinctions: [],
    identitySkills: [],
    identityHandhelds: [],
    loadingDetail: false,

    // 全局缓存（匹配后端实际返回结构）
    allDistinctions: [],
    allSkills: [],
    allHandhelds: [],
    allID: [],
    allIS: [],
    allIH: []
  },

  onLoad(options) {
    this.loadAllData();
  },

  // 加载所有全量数据
  loadAllData() {
    const baseUrl = app.globalData.baseUrl;
    if (!baseUrl) {
      wx.showToast({ title: '请配置全局baseUrl', icon: 'none' });
      return;
    }

    // 1. 角色数据
    wx.request({
      url: `${baseUrl}/identities`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ allIdentities: res.data });
          this.splitCamp();
        }
      },
      fail: (err) => {
        console.error('角色数据加载失败：', err);
        wx.showToast({ title: '角色数据加载失败', icon: 'none' });
      }
    });

    // 2. 人格脉络数据
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
        console.error('人格脉络数据加载失败：', err);
      }
    });

    // 3. 外在特质
    wx.request({
      url: `${baseUrl}/distinctions`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ allDistinctions: res.data });
        }
      },
      fail: (err) => {
        console.error('外在特质数据加载失败：', err);
      }
    });

    // 4. 技能
    wx.request({
      url: `${baseUrl}/skills`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ allSkills: res.data });
        }
      },
      fail: (err) => {
        console.error('技能数据加载失败：', err);
      }
    });

    // 5. 手持物
    wx.request({
      url: `${baseUrl}/handhelds`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ allHandhelds: res.data });
        }
      },
      fail: (err) => {
        console.error('手持物数据加载失败：', err);
      }
    });

    // 6. I_D关联表（关键：后端返回含identity和distinction对象）
    wx.request({
      url: `${baseUrl}/ids`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ allID: res.data });
        }
      },
      fail: (err) => {
        console.error('I_D关联表加载失败：', err);
      }
    });

    // 7. I_S关联表
    wx.request({
      url: `${baseUrl}/iss`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ allIS: res.data });
        }
      },
      fail: (err) => {
        console.error('I_S关联表加载失败：', err);
      }
    });

    // 8. I_H关联表
    wx.request({
      url: `${baseUrl}/ihs`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ allIH: res.data });
        }
      },
      fail: (err) => {
        console.error('I_H关联表加载失败：', err);
      }
    });
  },

  // 拆分监管者/求生者列表
  splitCamp() {
    const hunters = this.data.allIdentities
      .filter(item => item.camp === 'Hunter')
      .map(item => ({
        ...item,
        genderText: item.gender === 'Female' ? '女' : '男'
      }));

    const survivors = this.data.allIdentities
      .filter(item => item.camp === 'Survivor')
      .map(item => ({
        ...item,
        genderText: item.gender === 'Female' ? '女' : '男'
      }));

    this.setData({ hunterList: hunters, survivorList: survivors });
  },

  // 切换标签
  switchTab(e) {
    const tabIndex = parseInt(e.currentTarget.dataset.tab);
    if (tabIndex === this.data.currentTab) return;
    this.setData({ currentTab: tabIndex });

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
      this.splitCamp();
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
          const result = {
            ...res.data,
            genderText: res.data.gender === 'Female' ? '女' : '男'
          };
          
          if (result.camp === 'Hunter') {
            this.setData({ hunterList: [result], survivorList: [], talentList: [] });
          } else if (result.camp === 'Survivor') {
            this.setData({ survivorList: [result], hunterList: [], talentList: [] });
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

  // 人格脉络弹窗：显示
  showTalentDetail(e) {
    const talent = e.currentTarget.dataset.talent;
    this.setData({
      currentTalent: talent,
      showTalentDetail: true
    });
  },

  // 人格脉络弹窗：关闭
  closeTalentDetail() {
    this.setData({
      showTalentDetail: false,
      currentTalent: null
    });
  },

  // 角色详情弹窗：显示（终极修复，直接取关联表中的对象）
  showIdentityDetail(e) {
    const identity = e.currentTarget.dataset.identity;
    const identityId = identity.identity_id;

    this.setData({
      currentIdentity: identity,
      showIdentityDetail: true,
      loadingDetail: true,
      identityDistinctions: [],
      identitySkills: [],
      identityHandhelds: []
    });

    try {
      // ========== 1. 筛选外在特质（直接取关联表中的distinction对象） ==========
      const targetDistinctions = this.data.allID
        .filter(item => item.identity?.identity_id === identityId)
        .map(item => item.distinction)
        .filter(item => item); // 过滤空对象

      // ========== 2. 筛选技能/手持物（同理，直接取关联对象） ==========
      let targetSkills = [];
      let targetHandhelds = [];

      if (identity.camp === 'Hunter') {
        targetSkills = this.data.allIS
          .filter(item => item.identity?.identity_id === identityId)
          .map(item => item.skill)
          .filter(item => item);
      } else if (identity.camp === 'Survivor') {
        targetHandhelds = this.data.allIH
          .filter(item => item.identity?.identity_id === identityId)
          .map(item => item.handheld)
          .filter(item => item);
      }

      this.setData({
        identityDistinctions: targetDistinctions,
        identitySkills: targetSkills,
        identityHandhelds: targetHandhelds,
        loadingDetail: false
      });

    } catch (err) {
      console.error('筛选角色详情失败：', err);
      wx.showToast({ title: '加载详情失败', icon: 'none' });
      this.setData({ loadingDetail: false });
    }
  },

  // 角色详情弹窗：关闭
  closeIdentityDetail() {
    this.setData({
      showIdentityDetail: false,
      currentIdentity: null,
      identityDistinctions: [],
      identitySkills: [],
      identityHandhelds: [],
      loadingDetail: false
    });
  }
});