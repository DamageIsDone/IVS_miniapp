// pages/add-record/add-record.js
Page({
  data: {
    // 监管者数据
    killerPlayer: '',
    killerRole: '',
    killerTalent1: '',
    killerTalent2: '',
    // 求生者数据（现在是4个）
    survivors: [
      { player: '', role: '', result: '', talent1: '', talent2: '' },
      { player: '', role: '', result: '', talent1: '', talent2: '' },
      { player: '', role: '', result: '', talent1: '', talent2: '' },
      { player: '', role: '', result: '', talent1: '', talent2: '' } // 新增求生者4
    ],
    // 选择器数据
    showBottomPicker: false,
    pickerValue: [0],
    pickerOptions: [],
    pickerType: '',
    pickerIndex: -1,
    pickerTalentIndex: -1
  },

  // 导航栏返回
  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // ========== 选择器逻辑 ==========
  onSelectKillerPlayer() {
    this.setData({
      showBottomPicker: true,
      pickerType: 'killerPlayer',
      pickerOptions: ['玩家1', '玩家2', 'MRC-XiaoD', 'MRC-HuaC', 'MRC-Nanako', 'MRC-XiaoX'],
      pickerValue: [0]
    });
  },
  onSelectKillerRole() {
    this.setData({
      showBottomPicker: true,
      pickerType: 'killerRole',
      pickerOptions: ['摄影师', '梦之女巫', '宿伞之魂', '红夫人', '红蝶'],
      pickerValue: [0]
    });
  },
  onSelectKillerTalent1() {
    this.setData({
      showBottomPicker: true,
      pickerType: 'killerTalent1',
      pickerOptions: ['挽留', '禁闭空间', '狂暴', '困兽之斗'],
      pickerValue: [0]
    });
  },
  onSelectKillerTalent2() {
    this.setData({
      showBottomPicker: true,
      pickerType: 'killerTalent2',
      pickerOptions: ['挽留', '禁闭空间', '狂暴', '困兽之斗'],
      pickerValue: [0]
    });
  },
  onSelectSurvivorPlayer(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      showBottomPicker: true,
      pickerType: 'survivorPlayer',
      pickerIndex: index,
      pickerOptions: ['MRC-XiaoD', 'MRC-HuaC', 'MRC-Nanako', 'MRC-XiaoX', '路人A', '路人B'],
      pickerValue: [0]
    });
  },
  onSelectSurvivorResult(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      showBottomPicker: true,
      pickerType: 'survivorResult',
      pickerIndex: index,
      pickerOptions: ['逃脱', '迷失'],
      pickerValue: [0]
    });
  },
  onSelectSurvivorRole(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      showBottomPicker: true,
      pickerType: 'survivorRole',
      pickerIndex: index,
      pickerOptions: ['古董商', '心理学家', '啦啦队员', '杂技演员', '调香师'],
      pickerValue: [0]
    });
  },
  onSelectSurvivorTalent1(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      showBottomPicker: true,
      pickerType: 'survivorTalent1',
      pickerIndex: index,
      pickerTalentIndex: 1,
      pickerOptions: ['飞轮效应', '化险为夷', '膝跳反射', '回光返照'],
      pickerValue: [0]
    });
  },
  onSelectSurvivorTalent2(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      showBottomPicker: true,
      pickerType: 'survivorTalent2',
      pickerIndex: index,
      pickerTalentIndex: 2,
      pickerOptions: ['飞轮效应', '化险为夷', '膝跳反射', '回光返照'],
      pickerValue: [0]
    });
  },
  onPickerChange(e) {
    this.setData({ pickerValue: e.detail.value });
  },
  closeBottomPicker() {
    this.setData({ showBottomPicker: false });
  },
  confirmBottomPicker() {
    const selected = this.data.pickerOptions[this.data.pickerValue[0]];
    const { pickerType, pickerIndex } = this.data;

    let newKillerPlayer = this.data.killerPlayer;
    let newKillerRole = this.data.killerRole;
    let newKillerTalent1 = this.data.killerTalent1;
    let newKillerTalent2 = this.data.killerTalent2;
    let newSurvivors = JSON.parse(JSON.stringify(this.data.survivors));

    switch (pickerType) {
      case 'killerPlayer':
        newKillerPlayer = selected;
        break;
      case 'killerRole':
        newKillerRole = selected;
        break;
      case 'killerTalent1':
        newKillerTalent1 = selected;
        break;
      case 'killerTalent2':
        newKillerTalent2 = selected;
        break;
      case 'survivorPlayer':
        newSurvivors[pickerIndex].player = selected;
        break;
      case 'survivorRole':
        newSurvivors[pickerIndex].role = selected;
        break;
      case 'survivorResult':
        newSurvivors[pickerIndex].result = selected;
        break;
      case 'survivorTalent1':
        newSurvivors[pickerIndex].talent1 = selected;
        break;
      case 'survivorTalent2':
        newSurvivors[pickerIndex].talent2 = selected;
        break;
    }

    this.setData({
      killerPlayer: newKillerPlayer,
      killerRole: newKillerRole,
      killerTalent1: newKillerTalent1,
      killerTalent2: newKillerTalent2,
      survivors: newSurvivors,
      showBottomPicker: false
    });
  },

  // ========== 提交逻辑（已适配4个求生者） ==========
  onSubmit() {
    const { killerPlayer, killerRole, killerTalent1, killerTalent2, survivors } = this.data;

    // 校验必填项（包含4个求生者）
    if (!killerPlayer || !killerRole || !killerTalent1 || !killerTalent2) {
      wx.showToast({ title: '请完善监管者信息', icon: 'none' });
      return;
    }
    for (let i = 0; i < survivors.length; i++) {
      const s = survivors[i];
      if (!s.player || !s.role || !s.result || !s.talent1 || !s.talent2) {
        wx.showToast({ title: `请完善求生者${i+1}信息`, icon: 'none' });
        return;
      }
    }

    // 统计逃脱人数，计算监管者结果
    let escapeCount = 0;
    survivors.forEach(s => {
      if (s.result === '逃脱') escapeCount++;
    });
    let killerResult = '';
    if (escapeCount === 0) killerResult = '胜利';
    else if (escapeCount === 2) killerResult = '勉强胜利';
    else if (escapeCount > 2) killerResult = '一败涂地';
    else killerResult = '胜利';

    // 组装战绩数据（包含4个求生者）
    const newRecord = {
      role: killerRole,
      result: killerResult,
      type: escapeCount <= 2 ? 'win' : 'lose',
      expanded: false,
      details: [
        {
          role: `监管者：${killerRole} (1)\n携带天赋：${killerTalent1}、${killerTalent2}`,
          tag: escapeCount === 0 ? '大获全胜' : (escapeCount === 2 ? '勉强胜利' : '一败涂地'),
          pureRole: `监管者：${killerRole} (1)`,
          talent: `${killerTalent1}、${killerTalent2}`,
          isKiller: true,
          isWin: escapeCount <= 2
        },
        ...survivors.map((s, i) => ({
          role: `求生者：${s.role}（${s.player}）\n携带天赋：${s.talent1}、${s.talent2}`,
          tag: s.result,
          pureRole: `求生者：${s.role}（${s.player}）`,
          talent: `${s.talent1}、${s.talent2}`,
          isKiller: false,
          isWin: s.result === '逃脱'
        }))
      ]
    };

    // 保存到本地存储
    const oldRecords = wx.getStorageSync('ivs_records') || [];
    const newRecords = [newRecord, ...oldRecords];
    wx.setStorageSync('ivs_records', newRecords);

    // 提示成功并返回
    wx.showToast({
      title: '添加战绩成功！',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
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