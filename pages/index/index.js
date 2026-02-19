// index.js
Page({
  data: {
    // 页面默认数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 跳转至wiki页面
   */
  gotoWiki() {
    wx.switchTab({
      url: '/pages/wiki/wiki',
      fail: (err) => {
        wx.showToast({
          title: 'Wiki页面跳转失败',
          icon: 'none',
          duration: 2000
        })
        console.error('Wiki页面跳转失败：', err);
      }
    })
  },

  /**
   * 跳转至record页面
   */
  gotoRecord() {
    wx.switchTab({
      url: '/pages/record/record',
      fail: (err) => {
        wx.showToast({
          title: 'Record页面跳转失败',
          icon: 'none',
          duration: 2000
        })
        console.error('Record页面跳转失败：', err);
      }
    })
  }
})