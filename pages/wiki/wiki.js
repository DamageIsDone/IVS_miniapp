// pages/wiki/wiki.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 0, // 默认选中第一个标签（监管者）
    // 分类数据：索引0=监管者，1=求生者，2=人格脉络
    categoryData: [
      // 监管者数据
      [
        { id: 1, name: "摄影师", realName: "约瑟夫" },
        { id: 2, name: "梦之女巫", realName: "伊德海拉" },
        { id: 3, name: "红蝶", realName: "美智子" },
        { id: 4, name: "杰克", realName: "开膛手" }
      ],
      // 求生者数据
      [
        { id: 101, name: "医生", realName: "艾米丽" },
        { id: 102, name: "律师", realName: "弗雷迪" },
        { id: 103, name: "园丁", realName: "艾玛" },
        { id: 104, name: "调香师", realName: "薇拉" }
      ],
      // 人格脉络数据
      [
        { id: 201, name: "勇敢", realName: "攻击向" },
        { id: 202, name: "执着", realName: "守椅向" },
        { id: 203, name: "友善", realName: "辅助向" },
        { id: 204, name: "冷静", realName: "运营向" }
      ]
    ],
    currentList: [] // 当前显示的列表数据
  },

  // 切换标签的核心方法
  switchTab(e) {
    const tabIndex = Number(e.currentTarget.dataset.tab);
    this.setData({
      currentTab: tabIndex,
      currentList: this.data.categoryData[tabIndex] // 切换为对应标签的数据
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      currentList: this.data.categoryData[0]
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 'wiki'
      });
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})