Component({
  data: {
    selected: 'wiki', // 初始选中wiki
    color: "#666666",
    selectedColor: "#0088ff",
    showDetail: false // 控制关于我们弹窗显示/隐藏
  },

  // 组件挂载时，同步当前页面的选中状态
  attached() {
    this.updateSelectedTab();
  },

  methods: {
    // 核心：根据当前页面更新选中状态
    updateSelectedTab() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const currentPath = currentPage.route; // 格式：pages/wiki/wiki
      
      // 匹配当前页面对应的tab名称
      if (currentPath.includes('wiki')) {
        this.setData({ selected: 'wiki' });
      } else if (currentPath.includes('record')) {
        this.setData({ selected: 'record' });
      }
    },

    // 切换tab页面
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      wx.switchTab({ url: path }, () => {
        // 跳转后强制更新选中状态
        this.updateSelectedTab();
      });
    },

    // 中间信息按钮点击事件 - 显示关于我们弹窗
    handleInformation() {
      this.setData({ showDetail: true });
    },

    // 隐藏弹窗
    hideDetailPopup() {
      this.setData({ showDetail: false });
    },

    // 阻止点击弹窗内容时触发遮罩的关闭事件
    stopPropagation() {}
  }
});