Component({
  data: {
    selected: 'wiki',
    color: "#666666",
    selectedColor: "#0088ff",
    showDetail: false
  },

  attached() {
    wx.nextTick(() => {
      this.updateSelectedTab();
    });
  },

  methods: {
    updateSelectedTab() {
      const pages = getCurrentPages();
      if (pages.length === 0) return;
      const currentPage = pages[pages.length - 1];
      if (!currentPage) return;
      const currentPath = currentPage.route;
      
      if (currentPath.includes('wiki')) {
        this.setData({ selected: 'wiki' });
      } else if (currentPath.includes('record')) {
        this.setData({ selected: 'record' });
      }
    },

    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      wx.switchTab({ url: path }, () => {
        this.updateSelectedTab();
      });
    },

    handleInformation() {
      this.setData({ showDetail: true });
    },

    hideDetailPopup() {
      this.setData({ showDetail: false });
    },

    stopPropagation() {}
  }
});