// pages/add-record/add-record.js
Page({
  data: {
    KillerPlayer: '', // 选中的监管者玩家
    KillerRole: '', // 监管者角色
    KillerTalent1: '', // 监管者天赋1
    KillerTalent2: '', // 监管者天赋2
    survivors: [ // 4个求生者完整信息
        { player: '', role: '', talent1: '', talent2: '', result: '' },
        { player: '', role: '', talent1: '', talent2: '', result: '' },
        { player: '', role: '', talent1: '', talent2: '', result: '' },
        { player: '', role: '', talent1: '', talent2: '', result: '' }
      ],
    // 新增战绩核心数据（和选择器绑定）
    addKillerPlayer: '', // 选中的监管者玩家
    addKillerRole: '', // 监管者角色
    addKillerTalent1: '', // 监管者天赋1
    addKillerTalent2: '', // 监管者天赋2
    addSurvivorList: [ // 4个求生者完整信息
        { player: '', role: '', talent1: '', talent2: '', result: '' },
        { player: '', role: '', talent1: '', talent2: '', result: '' },
        { player: '', role: '', talent1: '', talent2: '', result: '' },
        { player: '', role: '', talent1: '', talent2: '', result: '' }
      ],
  // 基础数据源（和你现有代码共用）
  hunterRoles: [], // 监管者列表（Hunter）
    survivorRoles: [], // 求生者列表（Survivor）
  users:[],
  allUsers: [], // 所有玩家列表
  allRoles: [], // 所有角色列表（监管者+求生者）
  killerTalents: [], // 监管者天赋列表（Hunter）
    survivorTalents: [], // 求生者天赋列表
  allTalents: [], // 所有天赋列表
  uitCache: [], // 你原有缓存
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
  loadAddBaseData() {
    const app = getApp();
    const baseUrl = app.globalData.baseUrl;
  
    // 加载所有玩家
    wx.request({
      url: `${baseUrl}/users`,
      method: 'GET',
      success: (res) => {
        this.setData({ allUsers: res.data || [] });
        const users=this.data.allUsers.map(item => item.username);
        this.setData({
          users
        });
      }
    });
  
    // 加载所有角色（监管者+求生者）
    wx.request({
      url: `${baseUrl}/identities`,
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        this.setData({ allRoles: res.data });
        // 按阵营筛选监管者/求生者
        const killerRoles = res.data.filter(item => item.camp === 'Hunter').map(item => item.career);
        const survivorRoles = res.data.filter(item => item.camp === 'Survivor').map(item => item.career);
        this.setData({
          killerRoles,
          survivorRoles
        });
        resolve();
      }
    });
  
    // 加载所有天赋
    wx.request({
      url: `${baseUrl}/talents`,
      method: 'GET',
      success: (res) => {
        const validTalents = res.data.filter(item => item.name && item.camp);
          // 按阵营筛选：Hunter=监管者天赋，Survivor=求生者天赋
          this.setData({ allTalents: res.data });
          const killerTalents = validTalents.filter(item => item.camp === 'Hunter').map(item => item.name);
          const survivorTalents = validTalents.filter(item => item.camp === 'Survivor').map(item => item.name);
          
          this.setData({
            killerTalents,
            survivorTalents,
          });
      }
    });
  },
  // ========== 选择器逻辑 ==========
  onSelectKillerPlayer() {
    
    this.setData({
      showBottomPicker: true,
      pickerType: 'killerPlayer',
      pickerOptions: this.data.users,
      pickerValue: [0]
    });
  },
  onSelectKillerRole() {
    this.setData({
      showBottomPicker: true,
      pickerType: 'killerRole',
      pickerOptions: this.data.killerRoles,
      pickerValue: [0]
    });
  },
  onSelectKillerTalent1() {
    this.setData({
      showBottomPicker: true,
      pickerType: 'killerTalent1',
      pickerOptions: this.data.killerTalents,
      pickerValue: [0]
    });
  },
  onSelectKillerTalent2() {
    this.setData({
      showBottomPicker: true,
      pickerType: 'killerTalent2',
      pickerOptions: this.data.killerTalents,
      pickerValue: [0]
    });
  },
  onSelectSurvivorPlayer(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      showBottomPicker: true,
      pickerType: 'survivorPlayer',
      pickerIndex: index,
      pickerOptions: this.data.users,
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
      pickerOptions: this.data.survivorRoles,
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
      pickerOptions: this.data.survivorTalents,
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
      pickerOptions: this.data.survivorTalents,
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
    let newSurvivors = Array.isArray(this.data.survivors) 
    ? JSON.parse(JSON.stringify(this.data.survivors)) // 深拷贝（有数据时）
    : [ // 无数据时初始化默认结构（4个求生者）
        { player: '', role: '', result: '', talent1: '', talent2: '' },
        { player: '', role: '', result: '', talent1: '', talent2: '' },
        { player: '', role: '', result: '', talent1: '', talent2: '' },
        { player: '', role: '', result: '', talent1: '', talent2: '' }
      ];

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
      addKillerPlayer: newKillerPlayer,
      addKillerRole: newKillerRole,
      addKillerTalent1: newKillerTalent1,
      addKillerTalent2: newKillerTalent2,
      addSurvivorList: newSurvivors,
      showBottomPicker: false
    });
    console.log(this.data.addKillerPlayer);
    console.log(this.data.addKillerRole);
  },
  
  // ========== 提交逻辑（已适配4个求生者） ==========
  onSubmit() {
    const app = getApp();
    const baseUrl = app.globalData.baseUrl;
    const {
      addKillerPlayer, addKillerRole, addKillerTalent1, addKillerTalent2,
      addSurvivorList, allUsers, allRoles, allTalents
    } = this.data;

    console.log('===== 监管者信息校验 =====');
    // 1. 基础校验
    if (!addKillerPlayer || !addKillerRole) {
      wx.showToast({ title: '请完善监管者信息', icon: 'none' });
      return;
    }
    for (let i = 0; i < addSurvivorList.length; i++) {
      const survivor = addSurvivorList[i];
      if (!survivor.player || !survivor.role || !survivor.result) {
        wx.showToast({ title: `请完善第${i+1}名求生者信息`, icon: 'none' });
        return;
      }
    }
    console.log('✅ 基础校验通过');
    console.log('开始名称→ID映射：');
    // 2. 名称→ID映射（从原始数据中查找对应ID）
    // 玩家名称 → user_id
    const getUserID = (username) => {
      const user = allUsers.find(item => item.username === username);
      return user ? user.user_id : 0;
    };
    // 角色名称 → identity_id
    const getIdentityID = (career, camp) => {
      const role = allRoles.find(item => item.career === career && item.camp === camp);
      return role ? role.identity_id : 0;
    };
    // 天赋名称 → talent_id
    const getTalentID = (name, camp) => {
      const talent = allTalents.find(item => item.name === name && item.camp === camp);
      return talent ? talent.talent_id : 0;
    };

    // 3. 构造5个U_I_T参数（1监管者+4求生者）
    const uitParamsList = [
      // 监管者U_I_T参数
      {
        user_id: getUserID(addKillerPlayer),
        identity_id: getIdentityID(addKillerRole, 'Hunter'),
        talent1_id: getTalentID(addKillerTalent1, 'Hunter'),
        talent2_id: getTalentID(addKillerTalent2, 'Hunter')
      },
      // 求生者1
      {
        user_id: getUserID(addSurvivorList[0].player),
        identity_id: getIdentityID(addSurvivorList[0].role, 'Survivor'),
        talent1_id: getTalentID(addSurvivorList[0].talent1, 'Survivor'),
        talent2_id: getTalentID(addSurvivorList[0].talent2, 'Survivor')
      },
      // 求生者2
      {
        user_id: getUserID(addSurvivorList[1].player),
        identity_id: getIdentityID(addSurvivorList[1].role, 'Survivor'),
        talent1_id: getTalentID(addSurvivorList[1].talent1, 'Survivor'),
        talent2_id: getTalentID(addSurvivorList[1].talent2, 'Survivor')
      },
      // 求生者3
      {
        user_id: getUserID(addSurvivorList[2].player),
        identity_id: getIdentityID(addSurvivorList[2].role, 'Survivor'),
        talent1_id: getTalentID(addSurvivorList[2].talent1, 'Survivor'),
        talent2_id: getTalentID(addSurvivorList[2].talent2, 'Survivor')
      },
      // 求生者4
      {
        user_id: getUserID(addSurvivorList[3].player),
        identity_id: getIdentityID(addSurvivorList[3].role, 'Survivor'),
        talent1_id: getTalentID(addSurvivorList[3].talent1, 'Survivor'),
        talent2_id: getTalentID(addSurvivorList[3].talent2, 'Survivor')
      }
    ];

    // 4. 校验ID有效性
    for (let i = 0; i < uitParamsList.length; i++) {
      const params = uitParamsList[i];
      if (params.user_id === 0 || params.identity_id === 0) {
        const type = i === 0 ? '监管者' : `第${i}名求生者`;
        wx.showToast({ title: `${type}信息匹配失败，请检查数据`, icon: 'none' });
        return;
      }
    }
    console.log('✅ ID映射校验通过');

    wx.showLoading({ title: '提交中...' });

    // 5. 批量创建U_I_T
    const createUITList = async () => {
      const uitIdList = [];
      for (let i = 0; i < uitParamsList.length; i++) {
        const params = uitParamsList[i];
        const uitId = await new Promise((resolve, reject) => {
          wx.request({
            url: `${baseUrl}/uits`, // 你的createUIT接口
            method: 'POST',
            header: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: params,
            success: (res) => {
              if (res.statusCode === 201 && res.data) {
                resolve(res.data);
              } else {
                reject(`创建${i===0?'监管者':'第'+i+'名求生者'}U_I_T失败`);
              }
            },
            fail: (err) => {
              reject(`接口调用失败：${err.errMsg}`);
            }
          });
        });
        uitIdList.push(uitId);
      }
      return uitIdList;
    };

    // 6. 执行创建流程
    createUITList()
      .then((uitIdList) => {
        // 构造createGame参数
        const gameParams = {
          hunter_id: uitIdList[0],
          survivor1_id: uitIdList[1],
          survivor2_id: uitIdList[2],
          survivor3_id: uitIdList[3],
          survivor4_id: uitIdList[4],
          result1: addSurvivorList[0].result === '逃脱',
          result2: addSurvivorList[1].result === '逃脱',
          result3: addSurvivorList[2].result === '逃脱',
          result4: addSurvivorList[3].result === '逃脱'
        };

        // 调用createGame接口
        return new Promise((resolve, reject) => {
          wx.request({
            url: `${baseUrl}/games`, // 你的createGame接口
            method: 'POST',
            header: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: gameParams,
            success: (res) => {
              if (res.statusCode === 201 && res.data) {
                resolve(res.data);
              } else {
                reject('创建战绩失败');
              }
            },
            fail: (err) => {
              reject(`战绩接口调用失败：${err.errMsg}`);
            }
          });
        });
      })
      .then((gameId) => {
        // 成功处理
        wx.hideLoading();
        wx.showToast({ title: '新增战绩成功', icon: 'success' });
        //重置数据
        this.setData({
          addKillerPlayer: '',
          addKillerRole: '',
          addKillerTalent1: '',
          addKillerTalent2: '',
          addSurvivorList: [
            { player: '', role: '', talent1: '', talent2: '', result: '' },
            { player: '', role: '', talent1: '', talent2: '', result: '' },
            { player: '', role: '', talent1: '', talent2: '', result: '' },
            { player: '', role: '', talent1: '', talent2: '', result: '' }
          ]
        });
        // 可在此处添加刷新战绩列表的逻辑
        // this.loadRecords();
        this.goBack();
      })
      .catch((errMsg) => {
        // 失败处理
        wx.hideLoading();
        wx.showToast({ title: errMsg || '新增失败，请重试', icon: 'none' });
        console.error('新增失败原因：', errMsg);
      });
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadAddBaseData()
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