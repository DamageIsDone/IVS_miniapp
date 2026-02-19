Component({
  properties: {},
  data: {
    selected: 'wiki', // 默认选中wiki
    color: "#666666",
    selectedColor: "#0088ff"
  },
  attached() {},
  methods: {
    // 切换tab页面（wiki/record）
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      // 获取当前选中的页面名称
      const selected = path.split('/')[3]; // 从/path/wiki/wiki中提取wiki
      this.setData({ selected });
      // 跳转到对应页面
      wx.switchTab({
        url: path
      });
    },

    // 中间加号按钮点击事件（可自定义逻辑）
    handleAdd() {
      wx.showToast({
        title: '点击了加号按钮',
        icon: 'none'
      });
      // 可在这里添加自定义逻辑，比如：
      // 1. 跳转到新增页面：wx.navigateTo({ url: '/pages/add/add' })
      // 2. 弹出新增表单等
    }
  }
});