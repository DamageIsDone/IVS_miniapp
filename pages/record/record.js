// pages/record/record.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    records: [
      {
        role: "摄影师",
        result: "胜利",
        type: "win",
        expanded: true, // 默认展开第一条
        details: [
          { role: "监管者：摄影师 (1)", tag: "大获全胜" },
          { role: "求生者：古董商（MRC-XiaoD）", tag: "迷失" },
          { role: "求生者：心理学家（MRC-HuaC）", tag: "迷失" },
          { role: "求生者：啦啦队员（MRC-Nanako）", tag: "迷失" },
          { role: "求生者：杂技演员（MRC-XiaoX）", tag: "迷失" }
        ]
      },
      {
        role: "摄影师",
        result: "平局",
        type: "draw",
        expanded: false,
        details: []
      },
      {
        role: "梦之女巫",
        result: "失败",
        type: "lose",
        expanded: false,
        details: [
          { role: "监管者：梦之女巫 (1)", tag: "失败" },
          { role: "求生者：调香师", tag: "逃脱" },
          { role: "求生者：机械师", tag: "逃脱" },
          { role: "求生者：佣兵", tag: "逃脱" },
          { role: "求生者：先知", tag: "迷失" }
        ]
      }
    ]
  },
  toggleExpand(e) {
    const index = e.currentTarget.dataset.index;
    const records = this.data.records;
    records[index].expanded = !records[index].expanded;
    this.setData({ records });
  },

  onRecordLongPress(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentIndex: index }); // 记录当前长按的索引

    // 显示小程序原生操作菜单（修改/删除）
    wx.showActionSheet({
      itemList: ['修改战绩', '删除战绩'], // 菜单选项
      itemColor: '#333', // 文字颜色
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 点击“修改战绩”
            this.editRecord(index);
            break;
          case 1:
            // 点击“删除战绩”
            this.deleteRecord(index);
            break;
        }
      },
      fail: (res) => {
        // 用户取消操作
        console.log('取消长按操作', res);
      }
    });
  },
   // ========== 新增：修改战绩逻辑 ==========
   editRecord(index) {
    const record = this.data.records[index];

    // 解析详情，填充到编辑弹窗
    const editDetails = record.details.map(detail => {
      const isKiller = detail.role.includes("监管");
      const survivorMatch = detail.role.match(/求生者：(.+?)(\s*\(|$)/);
      const survivor = survivorMatch ? survivorMatch[1] : "未知";
      const result = detail.tag.includes("逃脱") ? "逃脱" : "迷失";
      const talentMatch = detail.role.match(/携带天赋：(.+?)、(.+)/);
      const talents = talentMatch ? [talentMatch[1], talentMatch[2]] : ["飞轮效应", "化险为夷"];

      return {
        isKiller,
        survivor,
        result,
        talents
      };
    });

    this.setData({
      showEditModal: true,
      editKillerRole: record.role,
      editKillerTalents: ["挽留", "禁闭空间"],
      editDetails: editDetails.filter(d => !d.isKiller) // 只保留求生者部分
    });
  },

  // ========== 关闭弹窗 ==========
  closeEditModal() {
    this.setData({ showEditModal: false });
  },

  // ========== 选择监管者角色 ==========
  onSelectRole(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ editKillerRole: value });
  },

  // ========== 选择求生者结果/角色 ==========
  onSelectResult(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.currentTarget.dataset.value;
    const editDetails = this.data.editDetails;
    editDetails[index].result = value;
    this.setData({ editDetails });
  },

  onSelectSurvivor(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.currentTarget.dataset.value;
    const editDetails = this.data.editDetails;
    editDetails[index].survivor = value;
    this.setData({ editDetails });
  },

  // ========== 选择天赋 ==========
  onSelectTalent(e) {
    const type = e.currentTarget.dataset.type;
    const index = e.currentTarget.dataset.index;
    const value = e.currentTarget.dataset.value;

    if (type === "killer") {
      let talents = this.data.editKillerTalents;
      if (talents.includes(value)) {
        talents = talents.filter(t => t !== value);
      } else {
        talents.push(value);
      }
      this.setData({ editKillerTalents: talents });
    } else {
      const editDetails = this.data.editDetails;
      let talents = editDetails[index].talents;
      if (talents.includes(value)) {
        talents = talents.filter(t => t !== value);
      } else {
        talents.push(value);
      }
      editDetails[index].talents = talents;
      this.setData({ editDetails });
    }
  },

  // ========== 确认修改 ==========
  confirmEdit() {
    const index = this.data.currentIndex;
    const records = this.data.records;
    const newRecord = records[index];

    // 重新组装详情文本
    const killerDetail = {
      role: `监管者：${this.data.editKillerRole} (1)`,
      tag: newRecord.type === "win" ? "大获全胜" : "失败"
    };

    const survivorDetails = this.data.editDetails.map(d => {
      return {
        role: `求生者：${d.survivor}\n携带天赋：${d.talents.join("、")}`,
        tag: d.result
      };
    });

    newRecord.role = this.data.editKillerRole;
    newRecord.details = [killerDetail, ...survivorDetails];
    records[index] = newRecord;

    this.setData({ records, showEditModal: false });
    wx.showToast({ title: "修改成功", icon: "success" });
  },

  // ========== 新增：删除战绩逻辑 ==========
  deleteRecord(index) {
    wx.showModal({
      title: '确认删除',
      content: '是否确定删除这条战绩？删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          // 确认删除，从数组中移除该条数据
          const records = this.data.records;
          records.splice(index, 1); // 删除索引为index的元素
          this.setData({ records });
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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
        selected: 'record'
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