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

    allDistinctions: [],
    allSkills: [],
    allHandhelds: [],
    allID: [],
    allIS: [],
    allIH: [],

    searchKeyword: ''
  },

  onLoad(options) {
    this.loadAllData();
  },

  loadAllData() {
    const baseUrl = app.globalData.baseUrl;
    if (!baseUrl) {
      wx.showToast({ title: '请配置全局baseUrl', icon: 'none' });
      return;
    }

    wx.request({
      url: `${baseUrl}/identities`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ allIdentities: res.data });
          this.splitCamp();
        }
      }
    });
    wx.request({
      url: `${baseUrl}/talents`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ allTalents: res.data, talentList: res.data });
        }
      }
    });
    wx.request({ url: `${baseUrl}/distinctions`, success: res => this.setData({ allDistinctions: res.data }) });
    wx.request({ url: `${baseUrl}/skills`, success: res => this.setData({ allSkills: res.data }) });
    wx.request({ url: `${baseUrl}/handhelds`, success: res => this.setData({ allHandhelds: res.data }) });
    wx.request({ url: `${baseUrl}/ids`, success: res => this.setData({ allID: res.data }) });
    wx.request({ url: `${baseUrl}/iss`, success: res => this.setData({ allIS: res.data }) });
    wx.request({ url: `${baseUrl}/ihs`, success: res => this.setData({ allIH: res.data }) });
  },

  splitCamp() {
    const hunters = this.data.allIdentities
      .filter(item => item.camp === 'Hunter')
      .map(item => ({ ...item, genderText: item.gender === 'Female' ? '女' : '男' }));
    const survivors = this.data.allIdentities
      .filter(item => item.camp === 'Survivor')
      .map(item => ({ ...item, genderText: item.gender === 'Female' ? '女' : '男' }));
    this.setData({ hunterList: hunters, survivorList: survivors });
  },

  switchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({ currentTab: tab });
  },

  // 只记录输入，不搜索
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  // 点按钮才搜索
  onSearchBtnClick() {
    const kw = this.data.searchKeyword?.trim();
    if (!kw) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    this.doSearch(kw);
  },

  doSearch(keyword) {
    const baseUrl = app.globalData.baseUrl;
    wx.request({
      url: `${baseUrl}/identities/search`,
      method: 'GET',
      data: { str: keyword },
      success: res => {
        if (res.statusCode === 200 && res.data) {
          const identity = { ...res.data, genderText: res.data.gender === 'Female' ? '女' : '男' };
          this.loadIdentityRelationsAndShow(identity);
        } else {
          this.searchTalent(keyword);
        }
      },
      fail: () => this.searchTalent(keyword)
    });
  },

  searchTalent(keyword) {
    const baseUrl = app.globalData.baseUrl;
    wx.request({
      url: `${baseUrl}/talents/search`,
      method: 'GET',
      data: { name: keyword },
      success: res => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            currentTalent: res.data,
            showTalentDetail: true,
            showIdentityDetail: false
          });
        } else {
          wx.showToast({ title: '未找到相关内容', icon: 'none' });
        }
      }
    });
  },

  loadIdentityRelationsAndShow(identity) {
    const id = identity.identity_id;
    this.setData({
      currentIdentity: identity,
      showIdentityDetail: true,
      showTalentDetail: false,
      loadingDetail: true
    });

    const dis = this.data.allID
      .filter(x => x.identity?.identity_id === id)
      .map(x => x.distinction)
      .filter(Boolean);

    let skills = [], hands = [];
    if (identity.camp === 'Hunter') {
      skills = this.data.allIS
        .filter(x => x.identity?.identity_id === id)
        .map(x => x.skill)
        .filter(Boolean);
    } else {
      hands = this.data.allIH
        .filter(x => x.identity?.identity_id === id)
        .map(x => x.handheld)
        .filter(Boolean);
    }

    this.setData({
      identityDistinctions: dis,
      identitySkills: skills,
      identityHandhelds: hands,
      loadingDetail: false
    });
  },

  showIdentityDetail(e) {
    this.loadIdentityRelationsAndShow(e.currentTarget.dataset.identity);
  },
  closeIdentityDetail() {
    this.setData({ showIdentityDetail: false, currentIdentity: null });
  },

  showTalentDetail(e) {
    this.setData({
      currentTalent: e.currentTarget.dataset.talent,
      showTalentDetail: true,
      showIdentityDetail: false
    });
  },
  closeTalentDetail() {
    this.setData({ showTalentDetail: false, currentTalent: null });
  }
});