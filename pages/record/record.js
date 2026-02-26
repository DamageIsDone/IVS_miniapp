const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    originRecords:[],
    hunter:null,// 最常用监管者
    survivor: null ,// 最常用求生者
    hunterRoles: [], // 监管者列表（Hunter）
    survivorRoles: [], // 求生者列表（Survivor）
    allRoles: [] ,
    // 新增：天赋数据（从后端拉取）
    killerTalents: [], // 监管者天赋列表（Hunter）
    survivorTalents: [], // 求生者天赋列表（Survivor）
    allTalents: [] ,// 保存完整天赋数据，用于匹配ID
    uitCache:[],
    records: [
      {
        role: "摄影师",
        result: "胜利",
        type: "win",
        expanded: true,
        details: [
          // 监管者补充天赋：挽留、禁闭空间
          { role: "监管者：摄影师 (1)\n携带天赋：挽留、禁闭空间", tag: "大获全胜", pureRole: "监管者：摄影师 (1)", talent: "挽留、禁闭空间" ,isKiller: true, },
          { role: "求生者：古董商（MRC-XiaoD）\n携带天赋：飞轮效应、膝跳反射", tag: "迷失", pureRole: "求生者：古董商（MRC-XiaoD）", talent: "飞轮效应、膝跳反射" },
          { role: "求生者：心理学家（MRC-HuaC）\n携带天赋：飞轮效应、化险为夷", tag: "迷失", pureRole: "求生者：心理学家（MRC-HuaC）", talent: "飞轮效应、化险为夷" },
          { role: "求生者：啦啦队员（MRC-Nanako）\n携带天赋：飞轮效应、化险为夷", tag: "迷失", pureRole: "求生者：啦啦队员（MRC-Nanako）", talent: "飞轮效应、化险为夷" },
          { role: "求生者：杂技演员（MRC-XiaoX）\n携带天赋：飞轮效应、化险为夷", tag: "迷失", pureRole: "求生者：杂技演员（MRC-XiaoX）", talent: "飞轮效应、化险为夷" }
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
          // 监管者补充天赋：狂暴、困兽之斗
          { role: "监管者：梦之女巫 (1)\n携带天赋：狂暴、困兽之斗", tag: "一败涂地", pureRole: "监管者：梦之女巫 (1)", talent: "狂暴、困兽之斗" },
          { role: "求生者：调香师\n携带天赋：飞轮效应、回光返照", tag: "逃脱", pureRole: "求生者：调香师", talent: "飞轮效应、回光返照" },
          { role: "求生者：机械师\n携带天赋：飞轮效应、回光返照", tag: "逃脱", pureRole: "求生者：机械师", talent: "飞轮效应、回光返照" },
          { role: "求生者：佣兵\n携带天赋：化险为夷、回光返照", tag: "逃脱", pureRole: "求生者：佣兵", talent: "化险为夷、回光返照" },
          { role: "求生者：先知\n携带天赋：飞轮效应、回光返照", tag: "迷失", pureRole: "求生者：先知", talent: "飞轮效应、回光返照" }
        ]
      }
    ],
    currentUserId: 1, // 当前登录用户ID（替换为实际用户ID）
    showEditModal: false,
    currentIndex: -1,
    editKillerRole: "",
    editKillerTalents: [],
    editDetails: [],
    showBottomPicker: false,
    pickerValue: [0],
    pickerOptions: [],
    pickerType: "",
    pickerSubType: "",
    pickerIndex: -1,
    pickerTalentIndex: -1,
    // 角色天赋弹窗
    showRoleTalentModal: false,
    currentRoleName: "",
    currentRoleTalents: [],
    
  },

  getData() {
    const userId = this.data.currentUserId;
    const baseUrl = app.globalData.baseUrl;
    wx.request({
    url: `${baseUrl}/uits`, // 后端查询所有U_I_T的接口
    method: 'GET',
    success: (res) => {
      
      this.setData({ uitCache: res.data });
      
      console.log("✅ U_I_T缓存初始化完成：", this.uitCache);
    }
  });
    wx.request({
      url: `http://localhost:8080/talents`,
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
          resolve();
      },
      fail: (err) => reject(err)
    });
    wx.request({
      url: `http://localhost:8080/identities`,
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
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '角色数据加载失败', icon: 'none' });
        reject(err);
      }
    });
    wx.request({
      url: `http://localhost:8080/games/user/${userId}/most-used-hunter`,
      method: "GET",
      success: (res) => {
        console.log('success');
        //把后台服务器的数据绑定到变量中供页面提取显示
        if (res.statusCode === 200) {
          this.setData({
            hunter: res.data
          })
        }
      },
      //失败后,执行回调
      fail: (err) => {
        console.log('error');
        console.log(err);
      },
    });
    wx.request({
      url: `http://localhost:8080/games/user/2/most-used-survivor`,
      method: "GET",
      success: (res) => {
        console.log('success');
        //把后台服务器的数据绑定到变量中供页面提取显示
        if (res.statusCode === 200) {
          this.setData({
            survivor: res.data
          })
        }
      },
      //失败后,执行回调
      fail: (err) => {
        console.log('error');
        console.log(err);
      },
    });
    //发起网络请求获取数据
    wx.request({
      //请求接口地址
      url: 'http://localhost:8080/games/user?user_id=1',
      //请求方式
      method: 'GET',
      //请求参数
      data: {},
      //请求头
      header: {},
      //成功后,执行回调
      success: (res) => {
        console.log('success');
        //把后台服务器的数据绑定到变量中供页面提取显示
        if (res.statusCode === 200) {
          this.setData({
            originRecords: res.data
          });
          const frontRecords = this.convertBackendDataToFront(res.data);
          this.setData({ records: frontRecords });
        }
      },
      //失败后,执行回调
      fail: (err) => {
        console.log('error');
        console.log(err);
      },
      //无论失败还是成功,始终执行回调
      // complete: (res) => {
      //   console.log('complete');
      //   console.log(res);
      // }
    })
  },
// 后端数据 → 前端渲染格式转换（核心适配）
convertBackendDataToFront(backendData) {
  return backendData.map(game => {
    // 1. 计算逃生人数
    let escapeCount = 0;
    const survivorResults = [game.result1, game.result2, game.result3, game.result4];
    survivorResults.forEach(res => res && escapeCount++);

    // 2. 按新规则判断胜负
    let resultText, type;
    if (escapeCount < 2) { // 0/1人逃生 → 监管胜利
      resultText = "胜利";
      type = "win";
    } else if (escapeCount === 2) { // 2人逃生 → 平局
      resultText = "平局";
      type = "draw";
    } else { // 3/4人逃生 → 监管失败
      resultText = "失败";
      type = "lose";
    }

    // 3. 组装监管者详情项
    const hunter = game.hunter;
    const killerDetail = {
      role: `${hunter.identity.career} (${hunter.user.user_id})\n携带天赋：${hunter.talent1?.name || ''}、${hunter.talent2?.name || ''}`,
      tag: type === 'win' ? '大获全胜' : type === 'draw' ? '勉强获胜' : '一败涂地',
      pureRole: `监管者：${hunter.identity.career} (${hunter.user.user_id})`,
      talent: `${hunter.talent1?.name || ''}、${hunter.talent2?.name || ''}`,
      isKiller: true
    };

    // 4. 组装4个求生者详情项
    const survivorList = [game.survivor1, game.survivor2, game.survivor3, game.survivor4];
    const survivorDetails = survivorList.map((survivor, index) => {
      const isEscape = survivorResults[index];
      return {
        role: `${survivor.identity.career}（${survivor.user.username}）\n携带天赋：${survivor.talent1?.name || ''}、${survivor.talent2?.name || ''}`,
        tag: isEscape ? "逃脱" : "迷失",
        pureRole: `求生者：${survivor.identity.career}（${survivor.user.username}）`,
        talent: `${survivor.talent1?.name || ''}、${survivor.talent2?.name || ''}`
      };
    });

    // 5. 最终数据结构（匹配原有格式）
    return {
      game_id: game.game_id,
      role: hunter.identity.career,
      result: resultText,
      type: type,
      expanded: false,
      details: [killerDetail, ...survivorDetails]
    };
  });
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
            this.openEditModal(index);
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
   
  // 打开修改弹窗，初始化编辑数据（核心：精准解析原始数据）
  openEditModal(index) {
    // 1. 获取当前要修改的战绩原始数据
    const record = this.data.records[index];
    if (!record || !record.details) return;

    // 2. 解析监管者数据（从details中筛选监管者条目）
    const killerDetail = record.details.find(d => d.isKiller) || {};
    // 解析监管者角色名（去掉“监管者：”和“ (1)”等后缀）
    let editKillerRole = "";
    if (killerDetail.pureRole) {
      editKillerRole = killerDetail.pureRole
        .replace('监管者：', '')
        .replace(' (1)', '')
        .replace('（1）', '')
        .trim();
    }
    // 解析监管者天赋（按“、”分割成数组）
    const editKillerTalents = killerDetail.talent ? killerDetail.talent.split('、') : ["", ""];

    // 3. 解析求生者数据（从details中筛选求生者条目）
    const survivorDetails = record.details.filter(d => !d.isKiller);
    const editDetails = survivorDetails.map(detail => {
      // 解析求生者角色名（去掉“求生者：”）
      let survivor = "";
      if (detail.pureRole) {
        survivor = detail.pureRole
          .replace('求生者：', '')
          .replace(/（.*）/, '') // 去掉括号里的玩家名（如“（MRC-XiaoD）”）
          .trim();
      }
      // 解析求生者结果（迷失/逃脱）
      const result = detail.tag || "";
      // 解析求生者天赋
      const talents = detail.talent ? detail.talent.split('、') : ["", ""];
      
      return {
        survivor, // 求生者角色名
        result,   // 求生者结果（迷失/逃脱）
        talents   // 求生者天赋数组
      };
    });

    // 4. 赋值给编辑字段，确保界面显示和原始数据一致
    this.setData({
      showEditModal: true,
      currentIndex: index, // 记录当前修改的战绩索引
      editKillerRole,      // 监管者角色（对应界面“监管者”标签）
      editKillerTalents,   // 监管者天赋（对应界面“携带天赋”标签）
      editDetails          // 求生者数据（对应界面所有求生者标签）
    });
  },
  // ========== 关闭弹窗 ==========
  closeEditModal() {
    this.setData({ showEditModal: false });
  },

  // ========== 选择监管者角色 ==========
  onSelectKillerRole() {
    const defaultIndex = this.data.killerRoles.indexOf(this.data.editKillerRole);
    const pickerValue = defaultIndex > -1 ? [defaultIndex] : [0];

    this.setData({
      showBottomPicker: true,
      pickerType: "killerRole",
      pickerSubType: "killer",
      pickerOptions: this.data.killerRoles,
      pickerValue: pickerValue
    });
  },
  // 选择监管者天赋
  onSelectKillerTalent(e) {
    if (this.data.killerRoles.length === 0) {
      wx.showToast({ title: '暂无监管者数据', icon: 'none' });
      return;
    }
    const talentIndex = e.currentTarget.dataset.index;
    const currentTalent = this.data.editKillerTalents[talentIndex];
    const defaultIndex = this.data.killerTalents.indexOf(currentTalent);
    const pickerValue = defaultIndex > -1 ? [defaultIndex] : [0];
    this.setData({
      showBottomPicker: true,
      pickerType: "killerTalent",
      pickerTalentIndex: talentIndex,
      pickerOptions: this.data.killerTalents,
      pickerValue: pickerValue
    });
  },
  // 选择求生者结果
  onSelectSurvivorResult(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      showBottomPicker: true,
      pickerType: "survivorResult",
      pickerIndex: index,
      pickerOptions: ["迷失", "逃脱"],
      pickerValue: [this.data.pickerOptions.indexOf(this.data.editDetails[index].result) || 0]
    });
  },

  // 选择求生者角色
  onSelectSurvivorRole(e) {
    const surIndex = e.currentTarget.dataset.index;

    // 2. 计算默认选中值
    const currentSurvivor = this.data.editDetails[surIndex].survivor;
    const defaultIndex = this.data.survivorRoles.indexOf(currentSurvivor);
    const pickerValue = defaultIndex > -1 ? [defaultIndex] : [0];

    this.setData({
      showBottomPicker: true,
      pickerType: "survivorRole",
      pickerSubType: "survivor",
      pickerOptions: this.data.survivorRoles, // 后端动态列表
      pickerValue: pickerValue,
      pickerIndex: surIndex // 标记当前编辑的求生者索引
    });
  },

  // 选择求生者天赋
  onSelectSurvivorTalent(e) {
    const surIndex = e.currentTarget.dataset.index;
    const talentIndex = e.currentTarget.dataset.talentIndex;
    if (this.data.survivorTalents.length === 0) {
      wx.showToast({ title: '暂无求生者天赋数据', icon: 'none' });
      return;
    }
    const currentTalent = this.data.editDetails[surIndex].talents[talentIndex];
    const defaultIndex = this.data.survivorTalents.indexOf(currentTalent);
    const pickerValue = defaultIndex > -1 ? [defaultIndex] : [0];
    this.setData({
      showBottomPicker: true,
      pickerType: "survivorTalent",
      pickerIndex: surIndex,
      pickerTalentIndex: talentIndex,
      pickerOptions: this.data.survivorTalents,
      pickerValue: pickerValue
    });
  },
  // 底部选择器值变化
onPickerChange(e) {
  this.setData({ pickerValue: e.detail.value });
},

// 关闭底部选择器
closeBottomPicker() {
  this.setData({ showBottomPicker: false });
},
  // ========== 确认修改 ==========
  
  confirmBottomPicker() {
    const selectedValue = this.data.pickerOptions[this.data.pickerValue[0]];
    const { pickerType, pickerIndex, pickerTalentIndex } = this.data;
    let newEditKillerRole = this.data.editKillerRole;
    let newEditKillerTalents = [...this.data.editKillerTalents];
    let newEditDetails = [...this.data.editDetails];
  
    switch (pickerType) {
      case "killerRole":
        newEditKillerRole = selectedValue;
        break;
      case "killerTalent":
        newEditKillerTalents[pickerTalentIndex] = selectedValue;
        break;
      case "survivorRole":
        newEditDetails[pickerIndex].survivor = selectedValue;
        break;
      case "survivorResult":
        newEditDetails[pickerIndex].result = selectedValue;
        break;
      case "survivorTalent":
        newEditDetails[pickerIndex].talents[pickerTalentIndex] = selectedValue;
        break;
    }
    // 角色选择逻辑（监管者/求生者）
    // if (pickerType === "role") {
    //   if (pickerSubType === "killer") {
    //     // 选中监管者
    //     newEditKillerRole = selectedValue;
    //   } else if (pickerSubType === "survivor") {
    //     // 选中求生者
    //     // const editDetails = [...this.data.editDetails];
    //     // editDetails[currentSurIndex].survivor = selectedValue;
    //     // this.setData({ editDetails });

    //     newEditDetails[pickerIndex].survivor = selectedValue;
    //   }
    // }
    // 天赋选择逻辑（保留你原有代码）
    // else if (pickerType === "talent") {
    //   // 你的天赋选择逻辑...
    // }
  
    this.setData({
      editKillerRole: newEditKillerRole,
      editKillerTalents: newEditKillerTalents,
      editDetails: newEditDetails,
      showBottomPicker: false
    });
  },

// confirmEdit() {
//   const { 
//     currentIndex, editKillerRole, editKillerTalents, editDetails, 
//     records, originRecords, allRoles, allTalents, baseUrl 
//   } = this.data;
//   // ========== 1. 全量数据校验（避免undefined报错） ==========
//   if (currentIndex === undefined || currentIndex === null || currentIndex < 0) {
//     wx.showToast({ title: '未选择要修改的战绩', icon: 'none' });
//     return;
//   }
//   if (!Array.isArray(records) || records.length === 0 || !records[currentIndex]) {
//     wx.showToast({ title: '战绩数据异常', icon: 'none' });
//     return;
//   }
//   if (!Array.isArray(originRecords) || originRecords.length === 0) {
//     wx.showToast({ title: '原始战绩数据为空', icon: 'none' });
//     return;
//   }

//   // 基础数据赋值
//   const currentRecord = { ...records[currentIndex] };
//   const gameId = currentRecord.game_id;
//   if (!gameId) {
//     wx.showToast({ title: '战绩ID不存在', icon: 'none' });
//     return;
//   }
//   const originGameIndex = originRecords.findIndex(item => item && item.game_id === gameId);
//   if (originGameIndex === -1) {
//     wx.showToast({ title: '未找到对应原始战绩', icon: 'none' });
//     return;
//   }
//   const originGame = { ...originRecords[originGameIndex] }; // 深拷贝原始数据
//   const survivorKeys = ['survivor1', 'survivor2', 'survivor3', 'survivor4']; // 求生者字段
//   const resultKeys = ['result1', 'result2', 'result3', 'result4']; // 结果字段

//   // ========== 2. 准备所有更新任务参数 ==========
//   // 2.1 角色更新任务（调用 /identities/update）
//   const roleUpdateTasks = [];
//   // 监管者角色更新
//   const oldKillerIdentity = allRoles.find(item => item && item.career === (originGame.hunter?.identity?.career || ''));
//   const newKillerIdentity = allRoles.find(item => item && item.career === editKillerRole);
//   if (oldKillerIdentity && newKillerIdentity && oldKillerIdentity.identity_id !== newKillerIdentity.identity_id) {
//     roleUpdateTasks.push({
//       game_id: gameId,
//       old_identity_id: oldKillerIdentity.identity_id,
//       new_identity_id: newKillerIdentity.identity_id
//     });
//   }
//   // 求生者角色更新
//   editDetails.forEach((item, index) => {
//     if (!item) return;
//     const oldSurCareer = originGame[survivorKeys[index]]?.identity?.career || '';
//     const oldSurIdentity = allRoles.find(i => i && i.career === oldSurCareer);
//     const newSurIdentity = allRoles.find(i => i && i.career === item.survivor);
//     if (oldSurIdentity && newSurIdentity && oldSurIdentity.identity_id !== newSurIdentity.identity_id) {
//       roleUpdateTasks.push({
//         game_id: gameId,
//         old_identity_id: oldSurIdentity.identity_id,
//         new_identity_id: newSurIdentity.identity_id
//       });
//     }
//   });

//   // 2.2 天赋更新任务（调用 /update，适配U_I_T.id + 旧/新天赋ID）
//   const talentUpdateTasks = [];
//   // 监管者天赋更新（U_I_T.id = originGame.hunter_id）
//   const hunterUITId = originGame.hunter_id; // Game表中的hunter_id对应U_I_T.id
//   if (hunterUITId) {
//     // 监管者天赋1
//     const oldKillerTal1 = allTalents.find(t => t && t.name === (originGame.hunter?.talent1?.name || ''));
//     const newKillerTal1 = allTalents.find(t => t && t.name === (editKillerTalents[0] || ''));
//     if (oldKillerTal1 && newKillerTal1 && oldKillerTal1.talent_id !== newKillerTal1.talent_id) {
//       talentUpdateTasks.push({
//         id: hunterUITId, // U_I_T表主键ID
//         old_talent_id: oldKillerTal1.talent_id,
//         new_talent_id: newKillerTal1.talent_id
//       });
//     }
//     // 监管者天赋2
//     const oldKillerTal2 = allTalents.find(t => t && t.name === (originGame.hunter?.talent2?.name || ''));
//     const newKillerTal2 = allTalents.find(t => t && t.name === (editKillerTalents[1] || ''));
//     if (oldKillerTal2 && newKillerTal2 && oldKillerTal2.talent_id !== newKillerTal2.talent_id) {
//       talentUpdateTasks.push({
//         id: hunterUITId,
//         old_talent_id: oldKillerTal2.talent_id,
//         new_talent_id: newKillerTal2.talent_id
//       });
//     }
//   }
//   // 求生者天赋更新（U_I_T.id = originGame.survivor1_id/2_id/3_id/4_id）
//   editDetails.forEach((item, index) => {
//     if (!item) return;
//     const survivorUITId = originGame[`${survivorKeys[index]}_id`]; // 求生者U_I_T.id
//     if (!survivorUITId) return;
//     // 求生者天赋1
//     const oldSurTal1 = allTalents.find(t => t && t.name === (originGame[survivorKeys[index]]?.talent1?.name || ''));
//     const newSurTal1 = allTalents.find(t => t && t.name === (item.talents[0] || ''));
//     if (oldSurTal1 && newSurTal1 && oldSurTal1.talent_id !== newSurTal1.talent_id) {
//       talentUpdateTasks.push({
//         id: survivorUITId,
//         old_talent_id: oldSurTal1.talent_id,
//         new_talent_id: newSurTal1.talent_id
//       });
//     }
//     // 求生者天赋2
//     const oldSurTal2 = allTalents.find(t => t && t.name === (originGame[survivorKeys[index]]?.talent2?.name || ''));
//     const newSurTal2 = allTalents.find(t => t && t.name === (item.talents[1] || ''));
//     if (oldSurTal2 && newSurTal2 && oldSurTal2.talent_id !== newSurTal2.talent_id) {
//       talentUpdateTasks.push({
//         id: survivorUITId,
//         old_talent_id: oldSurTal2.talent_id,
//         new_talent_id: newSurTal2.talent_id
//       });
//     }
//   });

//   // 2.3 求生者结果更新任务（调用 /update/result）
//   const resultUpdateTasks = [];
//   editDetails.forEach((item, index) => {
//     if (!item) return;
//     const oldResult = originGame[resultKeys[index]]; // 原始结果（boolean）
//     const newResult = item.result === '逃脱'; // 新结果转boolean
//     if (oldResult !== newResult) {
//       resultUpdateTasks.push({
//         game_id: gameId,
//         result: newResult,
//         index: index + 1 // 后端要求1-4，前端是0-3，需+1
//       });
//     }
//   });

//   // ========== 3. 按顺序调用后端接口（角色→天赋→结果） ==========
//   wx.showLoading({ title: '提交修改...' });

//   // 3.1 调用角色更新接口
//   const callRoleUpdate = () => {
//     if (roleUpdateTasks.length === 0) return Promise.resolve();
//     const rolePromises = roleUpdateTasks.map(task => {
//       return new Promise((resolve, reject) => {
//         // 手动拼接URL参数
//         const paramStr = `game_id=${task.game_id}&old_identity_id=${task.old_identity_id}&new_identity_id=${task.new_identity_id}`;
//         // 确认后端角色接口路径（比如/identities/update）
//         const requestUrl = `${app.globalData.baseUrl}/uits/update?${paramStr}`;
  
//         wx.request({
//           url: requestUrl,
//           method: 'PUT',
//           header: {
//             'Content-Type': 'application/x-www-form-urlencoded'
//           },
//           data: {},
//           success: (res) => {
//             if (res.statusCode === 200 && res.data) {
//               resolve(res.data);
//             } else {
//               reject(`角色更新失败，返回值：${JSON.stringify(res.data)}`);
//             }
//           },
//           fail: (err) => reject(`角色请求失败：${err.errMsg}`)
//         });
//       });
//     });
//     return Promise.all(rolePromises);
//   };

//   // 3.2 调用天赋更新接口
//   const callTalentUpdate = () => {
//     if (talentUpdateTasks.length === 0) return Promise.resolve();
//     const talentPromises = talentUpdateTasks.map(task => {
//       return new Promise((resolve, reject) => {
//         // ========== 关键1：手动拼接URL参数（替代JSON请求体） ==========
//         const paramStr = `id=${task.id}&old_talent_id=${task.old_talent_id}&new_talent_id=${task.new_talent_id}`;
//         // ========== 关键2：确认后端接口路径（必须和后端@PutMapping一致） ==========
//         // 注意：如果后端实际路径是 /uits/update，这里要改成 `${baseUrl}/uits/update`
//         const requestUrl = `${app.globalData.baseUrl}/uits/update?${paramStr}`;
  
//         wx.request({
//           url: requestUrl, // 带参数的URL
//           method: 'PUT',
//           // 关键3：设置表单参数格式，适配@RequestParam
//           header: {
//             'Content-Type': 'application/x-www-form-urlencoded'
//           },
//           data: {}, // 数据留空，参数已拼在URL
//           success: (res) => {
//             // 后端返回U_I_T对象，非null即成功
//             if (res.statusCode === 200 && res.data) {
//               resolve(res.data);
//             } else {
//               reject(`天赋更新失败，返回值：${JSON.stringify(res.data)}`);
//             }
//           },
//           fail: (err) => reject(`天赋请求失败：${err.errMsg}`)
//         });
//       });
//     });
//     return Promise.all(talentPromises);
//   };

//   // 3.3 调用结果更新接口
//   const callResultUpdate = () => {
//     if (resultUpdateTasks.length === 0) return Promise.resolve();
//     const resultPromises = resultUpdateTasks.map(task => {
//       return new Promise((resolve, reject) => {
//         // ========== 关键修改：手动拼接URL参数（替代URLSearchParams） ==========
//         // 1. 手动拼接参数，确保格式正确
//         const paramStr = `game_id=${task.game_id}&result=${task.result}&index=${task.index}`;
//         const requestUrl = `${app.globalData.baseUrl}/games/update/result?${paramStr}`;
  
//         wx.request({
//           url: requestUrl, // 带手动拼接参数的URL
//           method: 'PUT',
//           // 设置表单参数格式（适配后端@RequestParam）
//           header: {
//             'Content-Type': 'application/x-www-form-urlencoded'
//           },
//           data: {}, // 数据为空，参数已拼在URL
//           success: (res) => {
//             // 后端返回void，状态码200即成功
//             if (res.statusCode === 200) {
//               resolve();
//             } else {
//               reject(`结果更新失败，状态码：${res.statusCode}`);
//             }
//           },
//           fail: (err) => reject(`请求失败：${err.errMsg}`)
//         });
//       });
//     });
//     return Promise.all(resultPromises);
//   };

//   // 按顺序执行：角色→天赋→结果
//   callRoleUpdate()
//     .then(callTalentUpdate)
//     .then(callResultUpdate)
//     .then(() => {
//       // ========== 4. 后端更新成功，同步本地数据 ==========
//       wx.hideLoading();

//       // 4.1 更新前端展示数据
//       // 监管者信息
//       currentRecord.role = editKillerRole || currentRecord.role;
//       currentRecord.details = currentRecord.details || [];
//       if (currentRecord.details[0]) {
//         currentRecord.details[0].role = `${editKillerRole || ''} (${gameId})\n携带天赋：${editKillerTalents[0] || ''}、${editKillerTalents[1] || ''}`;
//         currentRecord.details[0].pureRole = `监管者：${editKillerRole || ''} (${gameId})`;
//         currentRecord.details[0].talent = `${editKillerTalents[0] || ''}、${editKillerTalents[1] || ''}`;
//       }

//       // 求生者信息 + 统计逃生人数
//       let escapeCount = 0;
//       editDetails.forEach((item, index) => {
//         if (!item || !currentRecord.details[index + 1]) return;
//         const survivorItem = currentRecord.details[index + 1];
//         const username = (survivorItem.pureRole || '').match(/（(.*)）/)?.[1] || '';
//         survivorItem.role = `${item.survivor || ''}（${username}）\n携带天赋：${item.talents[0] || ''}、${item.talents[1] || ''}`;
//         survivorItem.tag = item.result || '';
//         survivorItem.pureRole = `求生者：${item.survivor || ''}（${username}）`;
//         survivorItem.talent = `${item.talents[0] || ''}、${item.talents[1] || ''}`;
//         escapeCount += item.result === '逃脱' ? 1 : 0;
//       });

//       // 更新胜负结果
//       currentRecord.result = escapeCount < 2 ? "胜利" : escapeCount === 2 ? "平局" : "失败";
//       currentRecord.type = escapeCount < 2 ? "win" : escapeCount === 2 ? "draw" : "lose";
//       if (currentRecord.details[0]) {
//         currentRecord.details[0].tag = escapeCount < 2 ? "大获全胜" : escapeCount === 2 ? "平局" : "惜败";
//       }

//       // 4.2 更新originRecords原始数据
//       // 监管者
//       originGame.hunter = originGame.hunter || {};
//       originGame.hunter.identity = newKillerIdentity || originGame.hunter.identity;
//       originGame.hunter.talent1 = originGame.hunter.talent1 || { name: '' };
//       originGame.hunter.talent2 = originGame.hunter.talent2 || { name: '' };
//       originGame.hunter.talent1.name = editKillerTalents[0] || '';
//       originGame.hunter.talent2.name = editKillerTalents[1] || '';
//       // 求生者
//       survivorKeys.forEach((key, index) => {
//         if (!originGame[key]) originGame[key] = { identity: {}, talent1: { name: '' }, talent2: { name: '' } };
//         const newSurIdentity = allRoles.find(i => i && i.career === (editDetails[index]?.survivor || ''));
//         originGame[key].identity = newSurIdentity || originGame[key].identity;
//         originGame[key].talent1.name = editDetails[index]?.talents[0] || '';
//         originGame[key].talent2.name = editDetails[index]?.talents[1] || '';
//         originGame[resultKeys[index]] = editDetails[index]?.result === '逃脱';
//       });

//       // 4.3 写回本地数据
//       const newRecords = [...records];
//       newRecords[currentIndex] = currentRecord;
//       const newOriginRecords = [...originRecords];
//       newOriginRecords[originGameIndex] = originGame;

//       this.setData({
//         records: newRecords,
//         originRecords: newOriginRecords,
//         showEditModal: false
//       });

//       wx.showToast({ title: '修改成功', icon: 'success' });
//     })
//     .catch((err) => {
//       // ========== 5. 接口调用失败处理 ==========
//       wx.hideLoading();
//       console.error('修改失败：', err);
//       wx.showToast({ title: '修改失败，请重试', icon: 'none' });
//     });
// },

// 确认修改战绩（匹配/uits接口，修复所有路径/参数错误）
// 确认修改战绩（完整最终版，保证后端同步更新）
// 确认修改战绩（不修改后端版，解决404）
// 确认修改战绩（最终完整版，修复所有已知错误）
// 最终稳定版 - 适配data中的uitCache
confirmEdit() {
  // 1. 全局变量与基础数据获取（兜底保护）
  const baseUrl = app.globalData.baseUrl;
  const pageData = this.data;
  
  // 核心：从data中取uitCache，且强制初始化
  const uitCache = pageData.uitCache || [];
  // 转成 key-value 结构（方便按id取值）
  const uitCacheMap = {};
  uitCache.forEach(item => {
    uitCacheMap[item.id] = {
      talent1_id: item.talent1?.talent_id || 0,
      talent2_id: item.talent2?.talent_id || 0,
      identity_id: item.identity?.identity_id || 0
    };
  });

  // 其他变量兜底
  const currentEditIndex = typeof pageData.currentIndex === 'number' ? pageData.currentIndex : -1;
  const editKillerRole = pageData.editKillerRole || '';
  const safeEditKillerTalents = Array.isArray(pageData.editKillerTalents) ? pageData.editKillerTalents : [];
  const safeEditDetails = Array.isArray(pageData.editDetails) ? pageData.editDetails : [];
  const safeRecords = Array.isArray(pageData.records) ? pageData.records : [];
  const safeOriginRecords = Array.isArray(pageData.originRecords) ? pageData.originRecords : [];
  const safeAllRoles = Array.isArray(pageData.allRoles) ? pageData.allRoles : [];
  const safeAllTalents = Array.isArray(pageData.allTalents) ? pageData.allTalents : [];

  // 2. 基础校验（提前拦截无效操作）
  if (currentEditIndex < 0 || !safeRecords[currentEditIndex]) {
    wx.showToast({ title: '未选择要修改的战绩或数据异常', icon: 'none' });
    return;
  }
  if (safeOriginRecords.length === 0) {
    wx.showToast({ title: '原始战绩数据为空', icon: 'none' });
    return;
  }
  if (Object.keys(uitCacheMap).length === 0) {
    wx.showToast({ title: 'U_I_T缓存未加载完成', icon: 'none' });
    return;
  }

  // 3. 核心数据赋值（数字兜底）
  const currentRecord = { ...safeRecords[currentEditIndex] };
  const gameId = Number(currentRecord.game_id) || 0;
  if (!gameId || isNaN(gameId)) {
    wx.showToast({ title: '战绩ID格式错误', icon: 'none' });
    return;
  }

  // 查找原始战绩索引
  const originGameIndex = safeOriginRecords.findIndex(item => item && item.game_id === gameId);
  if (originGameIndex === -1) {
    wx.showToast({ title: '未找到对应原始战绩', icon: 'none' });
    return;
  }
  const originGame = { ...safeOriginRecords[originGameIndex] };
  const survivorKeys = ['survivor1', 'survivor2', 'survivor3', 'survivor4'];
  const resultKeys = ['result1', 'result2', 'result3', 'result4'];

  // 4. 从缓存获取真实的old_talent_id（适配data中的数组结构）
  const hunterUITId = Number(originGame.hunter_id) || 1;
  // 从转换后的map中取值 + 双重兜底
  const uitRealData = uitCacheMap[hunterUITId] || { talent1_id: 0, talent2_id: 0, identity_id: 0 };
  const REAL_TALENT1_ID = Number(uitRealData.talent1_id) || 0;
  const REAL_TALENT2_ID = Number(uitRealData.talent2_id) || 0;

  // 5. 生成更新任务（确保所有ID都是有效数字）
  const updateTasks = [];

  // 5.1 监管者角色更新（复用talent1_id的真实值）
  const newKillerIdentity = safeAllRoles.find(item => item && item.career === editKillerRole);
  if (newKillerIdentity) {
    const identityId = Number(newKillerIdentity.identity_id) || 0;
    if (identityId > 0 && REAL_TALENT1_ID > 0) {
      updateTasks.push({
        id: hunterUITId,
        old_talent_id: REAL_TALENT1_ID,
        new_talent_id: identityId,
        type: "identity"
      });
      console.log("🔧 角色更新任务：", updateTasks[updateTasks.length - 1]);
    }
  }

  // 5.2 监管者天赋1更新
  const newKillerTal1 = safeAllTalents.find(t => t && t.name === (safeEditKillerTalents[1] || ''));
  if (newKillerTal1) {
    const talent1Id = Number(newKillerTal1.talent_id) || 0;
    if (talent1Id > 0 && REAL_TALENT1_ID > 0) {
      updateTasks.push({
        id: hunterUITId,
        old_talent_id: REAL_TALENT1_ID,
        new_talent_id: talent1Id,
        type: "talent1"
      });
    }
  }

  // 5.3 监管者天赋2更新
  const newKillerTal2 = safeAllTalents.find(t => t && t.name === (safeEditKillerTalents[0] || ''));
  if (newKillerTal2) {
    const talent2Id = Number(newKillerTal2.talent_id) || 0;
    if (talent2Id > 0 && REAL_TALENT2_ID > 0) {
      updateTasks.push({
        id: hunterUITId,
        old_talent_id: REAL_TALENT2_ID,
        new_talent_id: talent2Id,
        type: "talent2"
      });
    }
  }

  // 5.4 求生者天赋更新（安全遍历+有效数字校验）
  safeEditDetails.forEach((item, index) => {
    if (!item) return;
    const survivorUITId = Number(originGame[`${survivorKeys[index]}_id`]) || 0;
    if (survivorUITId <= 0) return;

    // 求生者缓存取值 + 兜底
    const surRealData = uitCacheMap[survivorUITId] || { talent1_id: 0 };
    const surTalent1Id = Number(surRealData.talent1_id) || 0;
    
    const newSurTal1 = safeAllTalents.find(t => t && t.name === (item.talents[0] || ''));
    if (newSurTal1) {
      const newSurId = Number(newSurTal1.talent_id) || 0;
      if (newSurId > 0 && surTalent1Id > 0) {
        updateTasks.push({
          id: survivorUITId,
          old_talent_id: surTalent1Id,
          new_talent_id: newSurId,
          type: `survivor${index+1}_talent1`
        });
      }
    }
  });

  // 5.5 结果更新任务
  const resultUpdateTasks = [];
  safeEditDetails.forEach((item, index) => {
    if (!item) return;
    const oldResult = originGame[resultKeys[index]];
    const newResult = item.result === '逃脱';
    if (oldResult !== newResult) {
      resultUpdateTasks.push({
        game_id: gameId,
        result: newResult,
        index: Number(index + 1) || 0
      });
    }
  });

  // 6. 接口调用（最终参数兜底，避免NaN）
  wx.showLoading({ title: '提交修改...' });

  // 6.1 角色+天赋更新（调用/uits/update）
  const callUITUpdate = () => {
    return new Promise((resolve) => {
      if (updateTasks.length === 0) return resolve();
      
      let taskIndex = 0;
      const executeTask = () => {
        if (taskIndex >= updateTasks.length) return resolve();
        
        const task = updateTasks[taskIndex];
        // 最终参数兜底：确保无NaN
        const finalId = Number(task.id) || 0;
        const finalOldTalentId = Number(task.old_talent_id) || 0;
        const finalNewTalentId = Number(task.new_talent_id) || 0;
        
        // 跳过无效参数请求
        if (finalId <= 0 || finalOldTalentId <= 0 || finalNewTalentId <= 0) {
          console.warn(`⚠️ 跳过无效任务：id=${finalId}, old=${finalOldTalentId}, new=${finalNewTalentId}`);
          taskIndex++;
          executeTask();
          return;
        }
        
        // 构造请求参数（有效数字）
        const paramStr = `id=${finalId}&old_talent_id=${finalOldTalentId}&new_talent_id=${finalNewTalentId}`;
        const url = `${baseUrl}/uits/update?${paramStr}`;
        
        console.log(`🚀 发送${task.type}更新请求：`, url);
        
        wx.request({
          url: url,
          method: 'PUT',
          header: { 'Content-Type': 'application/x-www-form-urlencoded' },
          data: {},
          success: (res) => {
            console.log(`✅ ${task.type}更新响应：`, res);
            // 更新data中的uitCache（同步最新值）
            const newUitCache = [...pageData.uitCache];
            const targetIndex = newUitCache.findIndex(item => item.id === finalId);
            if (targetIndex !== -1) {
              if (task.type === "talent1") {
                newUitCache[targetIndex].talent1.talent_id = finalNewTalentId;
              } else if (task.type === "talent2") {
                newUitCache[targetIndex].talent2.talent_id = finalNewTalentId;
              }
              this.setData({ uitCache: newUitCache });
            }
            taskIndex++;
            executeTask();
          },
          fail: (err) => {
            console.warn(`⚠️ ${task.type}更新失败：`, err);
            taskIndex++;
            executeTask(); // 失败不阻断流程
          }
        });
      };
      
      executeTask();
    });
  };

  // 6.2 结果更新
  const callResultUpdate = () => {
    return new Promise((resolve) => {
      if (resultUpdateTasks.length === 0) return resolve();
      
      const task = resultUpdateTasks[0];
      const finalGameId = Number(task.game_id) || 0;
      const finalIndex = Number(task.index) || 0;
      if (finalGameId <= 0 || finalIndex <= 0) {
        resolve();
        return;
      }
      
      const paramStr = `game_id=${finalGameId}&result=${task.result}&index=${finalIndex}`;
      const url = `${baseUrl}/games/update/result?${paramStr}`;
      
      wx.request({
        url: url,
        method: 'PUT',
        header: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: {},
        success: (res) => resolve(),
        fail: (err) => {
          console.warn(`⚠️ 结果更新错误：`, err);
          resolve();
        }
      });
    });
  };

  // 7. 执行请求 + 本地数据更新
  callUITUpdate()
    .then(callResultUpdate)
    .then(() => {
      wx.hideLoading();
      
      // 7.1 同步本地战绩数据
      currentRecord.role = editKillerRole || currentRecord.role;
      currentRecord.details = currentRecord.details || [];
      if (currentRecord.details[0]) {
        currentRecord.details[0].role = `${editKillerRole || ''} (${gameId})\n携带天赋：${safeEditKillerTalents[0] || ''}、${safeEditKillerTalents[1] || ''}`;
        currentRecord.details[0].pureRole = `监管者：${editKillerRole || ''} (${gameId})`;
        currentRecord.details[0].talent = `${safeEditKillerTalents[0] || ''}、${safeEditKillerTalents[1] || ''}`;
      }

      // 7.2 同步求生者数据
      let escapeCount = 0;
      safeEditDetails.forEach((item, index) => {
        if (!item || !currentRecord.details[index + 1]) return;
        const survivorItem = currentRecord.details[index + 1];
        const username = (survivorItem.pureRole || '').match(/（(.*)）/)?.[1] || '';
        survivorItem.role = `${item.survivor || ''}（${username}）\n携带天赋：${item.talents[0] || ''}、${item.talents[1] || ''}`;
        survivorItem.tag = item.result || '';
        survivorItem.pureRole = `求生者：${item.survivor || ''}（${username}）`;
        survivorItem.talent = `${item.talents[0] || ''}、${item.talents[1] || ''}`;
        escapeCount += item.result === '逃脱' ? 1 : 0;
      });

      // 7.3 同步战绩结果
      currentRecord.result = escapeCount < 2 ? "胜利" : escapeCount === 2 ? "平局" : "失败";
      currentRecord.type = escapeCount < 2 ? "win" : escapeCount === 2 ? "draw" : "lose";
      if (currentRecord.details[0]) {
        currentRecord.details[0].tag = escapeCount < 2 ? "大获全胜" : escapeCount === 2 ? "平局" : "惜败";
      }

      // 7.4 更新原始战绩数据
      originGame.hunter = originGame.hunter || {};
      originGame.hunter.identity = safeAllRoles.find(i => i.career === editKillerRole) || originGame.hunter.identity;
      originGame.hunter.talent1 = { name: safeEditKillerTalents[0] || '' };
      originGame.hunter.talent2 = { name: safeEditKillerTalents[1] || '' };
      survivorKeys.forEach((key, index) => {
        if (!originGame[key]) originGame[key] = { identity: {}, talent1: { name: '' }, talent2: { name: '' } };
        originGame[key].identity = safeAllRoles.find(i => i.career === safeEditDetails[index]?.survivor) || originGame[key].identity;
        originGame[key].talent1.name = safeEditDetails[index]?.talents[0] || '';
        originGame[key].talent2.name = safeEditDetails[index]?.talents[1] || '';
        originGame[resultKeys[index]] = safeEditDetails[index]?.result === '逃脱';
      });

      // 7.5 写回页面数据
      const newRecords = [...safeRecords];
      newRecords[currentEditIndex] = currentRecord;
      const newOriginRecords = [...safeOriginRecords];
      newOriginRecords[originGameIndex] = originGame;

      this.setData({
        records: newRecords,
        originRecords: newOriginRecords,
        showEditModal: false
      });

      wx.showToast({ title: '修改成功', icon: 'success' });
    })
    .catch((err) => {
      wx.hideLoading();
      console.error("❌ 修改流程异常：", err);
      wx.showToast({ title: '修改失败，请重试', icon: 'none' });
    });
},

// 你的onLoad（无需改动，保留你原来的写法）
onLoad(options) {
  const app = getApp();
  const baseUrl = app.globalData.baseUrl;

  wx.request({
    url: `${baseUrl}/uits`, // 后端查询所有U_I_T的接口
    method: 'GET',
    success: (res) => {
      this.setData({ uitCache: res.data });
      console.log("✅ U_I_T缓存初始化完成：", this.data.uitCache);
    }
  });
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

  // 新增：预处理战绩数据（分离角色名和天赋）
  preprocessRecordData(records) {
    return records.map(record => {
      const details = record.details.map(detail => {
        let pureRole = detail.role;
        let talent = "";
        const talentMatch = detail.role.match(/\n携带天赋：(.+)/);
        
        if (talentMatch) {
          pureRole = detail.role.replace(/\n携带天赋：.+$/, "");
          talent = talentMatch[1];
        }
        
        return {
          ...detail,
          pureRole,
          talent
        };
      });
      
      return {
        ...record,
        details
      };
    });
  },

  onLoad() {
    const processedRecords = this.preprocessRecordData(this.data.records);
    this.setData({ records: processedRecords });
    this.loadRecordData();
  },

  // ========== 新增：点击角色，弹出天赋详情弹窗 ==========
  onShowRoleTalents(e) {
    const pureRole = e.currentTarget.dataset.pureRole;
    const talent = e.currentTarget.dataset.talent;

    // 解析角色名（兼容监管者/求生者）
    let roleName = "未知";
    const killerMatch = pureRole.match(/监管者：(.+?)(\s*\(|$)/);
    const survivorMatch = pureRole.match(/求生者：(.+?)(\s*\(|$)/);
    
    if (killerMatch) {
      roleName = killerMatch[1]; // 监管者角色名
    } else if (survivorMatch) {
      roleName = survivorMatch[1]; // 求生者角色名
    }

    // 拆分天赋为数组
    const talents = talent ? talent.split("、") : ["无", "无"];

    this.setData({
      showRoleTalentModal: true,
      currentRoleName: roleName,
      currentRoleTalents: talents
    });
  },

  // 关闭天赋弹窗
  closeRoleTalentModal() {
    this.setData({ showRoleTalentModal: false });
  },
  // 跳转到战绩添加页面
  onAdd() {
    wx.navigateTo({
      url: '/pages/add-record/add-record' // 确保路径正确
  });
},
  onRankClick(){
    wx.navigateTo({
      url: '/pages/rank/rank' // 确保路径正确
  });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getData();
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