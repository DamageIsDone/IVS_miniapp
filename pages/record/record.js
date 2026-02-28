const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userId:null,
    message:"",
    originRecords:[],
    hunter:{ career: "暂无" },// 最常用监管者
    survivor: { career: "暂无" },// 最常用求生者
    hunterRoles: [], // 监管者列表
    survivorRoles: [], // 求生者列表
    allRoles: [] ,
    killerTalents: [], // 监管者天赋列表
    survivorTalents: [], // 求生者天赋列表
    allTalents: [] ,//全部天赋列表
    uitCache:[],

    hunterStats: { // 监管者胜率统计
      winCount: 0,
      totalCount: 0,
      winRate: "0.00%",
      winRateNum: 0
    },
    survivorStats: { // 求生者胜率统计
      winCount: 0,
      totalCount: 0,
      winRate: "0.00%",
      winRateNum: 0
    },
    gameList: [], // 历史对局列表
    isLoading: true,
    records:[],
    currentUserId: 1, // 当前登录用户ID
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
    const userId = this.data.userId;
    const baseUrl = app.globalData.baseUrl;
    wx.request({
    url: `${baseUrl}/uits`, 
    method: 'GET',
    success: (res) => {
      
      this.setData({ uitCache: res.data });
      
      console.log("✅ U_I_T缓存初始化完成：", this.data.uitCache);
    }
  });
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
      },
      fail: (err) => reject(err)
    });
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
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '角色数据加载失败', icon: 'none' });
        reject(err);
      }
    });
    wx.request({
      url: `${baseUrl}/games/user/${userId}/most-used-hunter`,
      method: "GET",
      success: (res) => {
        console.log('success');
        if (res.statusCode === 200) {
          this.setData({
            hunter: res.data
          })
        }
      },
      fail: (err) => {
        console.log('error');
        console.log(err);
      },
    });
    wx.request({
      url: `${baseUrl}/games/user/${userId}/most-used-survivor`,
      method: "GET",
      success: (res) => {
        console.log('success');
        if (res.statusCode === 200) {
          this.setData({
            survivor: res.data
          })
        }
      },
      fail: (err) => {
        // console.log('error');
        // console.log(err);
      },
    });
    
    wx.request({
      url: `${baseUrl}/games/user?user_id=${userId}`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log('success');
        if (res.statusCode === 200) {
          this.setData({
            originRecords: res.data
          });
          const frontRecords = this.convertBackendDataToFront(res.data);
          this.setData({ records: frontRecords });

          const gameList = res.data;
          // 初始化统计数据
          let hunterWin = 0, hunterTotal = 0;
          let survivorWin = 0, survivorTotal = 0;

          // 遍历对局，统计胜率+格式化对局数据
          const formatGameList = gameList.map(game => {
            
            const isHunter = game.hunter 
              && game.hunter.user 
              && game.hunter.user.user_id == userId;
            const isSurvivor = 
              (game.survivor1 && game.survivor1.user && game.survivor1.user.user_id == userId) ||
              (game.survivor2 && game.survivor2.user && game.survivor2.user.user_id == userId) ||
              (game.survivor3 && game.survivor3.user && game.survivor3.user.user_id == userId) ||
              (game.survivor4 && game.survivor4.user && game.survivor4.user.user_id == userId);

            // 计算该局胜负（逃脱≥2人算求生者胜）
            const escapeCount = [game.result1, game.result2, game.result3, game.result4].filter(Boolean).length;
            const isSurvivorWin = escapeCount >= 2;
            const isHunterWin = !isSurvivorWin;

            // 统计监管者数据
            if (isHunter) {
              hunterTotal += 1;
              if (isHunterWin) hunterWin += 1;
              game.userIdentity = "监管者";
              game.userResult = isHunterWin ? "胜利" : "失败";
            }
            // 统计求生者数据
            if (isSurvivor) {
              survivorTotal += 1;
              if (isSurvivorWin) survivorWin += 1;
              game.userIdentity = "求生者";
              game.userResult = isSurvivorWin ? "胜利" : "失败";
            }

            // 格式化对局展示信息
            game.escapeCount = escapeCount;
            game.hunterName = game.hunter?.user?.username || "未知监管者";
            game.survivorNames = [
              game.survivor1?.user?.username,
              game.survivor2?.user?.username,
              game.survivor3?.user?.username,
              game.survivor4?.user?.username
            ].filter(Boolean).join("、");

            return game;
          });

          // 计算胜率
          const hunterRate = hunterTotal === 0 
            ? 0 
            : Math.round((hunterWin / hunterTotal) * 10000) / 100;
          const survivorRate = survivorTotal === 0 
            ? 0 
            : Math.round((survivorWin / survivorTotal) * 10000) / 100;

          this.setData({
            gameList: formatGameList,
            hunterStats: {
              winCount: hunterWin,
              totalCount: hunterTotal,
              winRate: `${hunterRate.toFixed(2)}%`,
              winRateNum: hunterRate
            },
            survivorStats: {
              winCount: survivorWin,
              totalCount: survivorTotal,
              winRate: `${survivorRate.toFixed(2)}%`,
              winRateNum: survivorRate
            }
          });
        }
      },
      fail: (err) => {
        console.log('error');
        console.log(err);
      },
    })
  },

convertBackendDataToFront(backendData) {
  return backendData.map(game => {
    // 计算逃生人数
    let escapeCount = 0;
    const survivorResults = [game.result1, game.result2, game.result3, game.result4];
    survivorResults.forEach(res => res && escapeCount++);

    // 判断胜负
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

    const hunter = game.hunter;
    const killerDetail = {
      role: `${hunter.identity.career} (${hunter.user.user_id})\n携带天赋：${hunter.talent1?.name || ''}、${hunter.talent2?.name || ''}`,
      tag: type === 'win' ? '大获全胜' : type === 'draw' ? '勉强获胜' : '一败涂地',
      pureRole: `监管者：${hunter.identity.career} (${hunter.user.user_id})`,
      talent: `${hunter.talent1?.name || ''}、${hunter.talent2?.name || ''}`,
      isKiller: true
    };

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
    this.setData({ currentIndex: index }); // 记录当前战绩的索引

    wx.showActionSheet({
      itemList: ['修改战绩', '删除战绩'], 
      itemColor: '#333', 
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.openEditModal(index);
            break;
          case 1:
            this.deleteRecord(index);
            break;
        }
      },
      fail: (res) => {
        console.log('取消长按操作', res);
      }
    });
  },
  // ========== 修改战绩逻辑 ==========
  openEditModal(index) {
    // 获取当前要修改的战绩原始数据
    const record = this.data.records[index];
    if (!record || !record.details) return;

    // 解析监管者数据
    const killerDetail = record.details.find(d => d.isKiller) || {};
    // 解析监管者角色名
    let editKillerRole = "";
    if (killerDetail.pureRole) {
      editKillerRole = killerDetail.pureRole
        .replace('监管者：', '')
        .replace(' (1)', '')
        .replace('（1）', '')
        .trim();
    }
    // 解析监管者天赋
    const editKillerTalents = killerDetail.talent ? killerDetail.talent.split('、') : ["", ""];

    // 解析求生者数据
    const survivorDetails = record.details.filter(d => !d.isKiller);
    const editDetails = survivorDetails.map(detail => {
      // 解析求生者角色名
      let survivor = "";
      if (detail.pureRole) {
        survivor = detail.pureRole
          .replace('求生者：', '')
          .replace(/（.*）/, '') 
          .trim();
      }
      // 解析求生者结果
      const result = detail.tag || "";
      // 解析求生者天赋
      const talents = detail.talent ? detail.talent.split('、') : ["", ""];
      
      return {
        survivor, 
        result,   
        talents   
      };
    });

    this.setData({
      showEditModal: true,
      currentIndex: index, 
      editKillerRole,      
      editKillerTalents,   
      editDetails          
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
      pickerOptions: this.data.survivorRoles, 
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
    
    this.setData({
      editKillerRole: newEditKillerRole,
      editKillerTalents: newEditKillerTalents,
      editDetails: newEditDetails,
      showBottomPicker: false
    });
  },


confirmEdit() {
  const baseUrl = app.globalData.baseUrl;
  const pageData = this.data;
  
  const uitCache = pageData.uitCache || [];
  const uitCacheMap = {};
  uitCache.forEach(item => {
    uitCacheMap[item.id] = {
      talent1_id: item.talent1?.talent_id || 0,
      talent2_id: item.talent2?.talent_id || 0,
      identity_id: item.identity?.identity_id || 0
    };
  });

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

  const hunterUITId = Number(originGame.hunter_id) || 1;
  const uitRealData = uitCacheMap[hunterUITId] || { talent1_id: 0, talent2_id: 0, identity_id: 0 };
  const REAL_TALENT1_ID = Number(uitRealData.talent1_id) || 0;
  const REAL_TALENT2_ID = Number(uitRealData.talent2_id) || 0;

  const updateTasks = [];

  // 监管者角色更新
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

  // 监管者天赋1更新
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

  // 监管者天赋2更新
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

  // 求生者天赋更新
  safeEditDetails.forEach((item, index) => {
    if (!item) return;
    const survivorUITId = Number(originGame[`${survivorKeys[index]}_id`]) || 0;
    if (survivorUITId <= 0) return;

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

  // 结果更新任务
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

  wx.showLoading({ title: '提交修改...' });

  // 角色+天赋更新
  const callUITUpdate = () => {
    return new Promise((resolve) => {
      if (updateTasks.length === 0) return resolve();
      
      let taskIndex = 0;
      const executeTask = () => {
        if (taskIndex >= updateTasks.length) return resolve();
        
        const task = updateTasks[taskIndex];
        const finalId = Number(task.id) || 0;
        const finalOldTalentId = Number(task.old_talent_id) || 0;
        const finalNewTalentId = Number(task.new_talent_id) || 0;
        
        if (finalId <= 0 || finalOldTalentId <= 0 || finalNewTalentId <= 0) {
          console.warn(`⚠️ 跳过无效任务：id=${finalId}, old=${finalOldTalentId}, new=${finalNewTalentId}`);
          taskIndex++;
          executeTask();
          return;
        }
        
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

  // 结果更新
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

  callUITUpdate()
    .then(callResultUpdate)
    .then(() => {
      wx.hideLoading();
      
      // 同步本地战绩数据
      currentRecord.role = editKillerRole || currentRecord.role;
      currentRecord.details = currentRecord.details || [];
      if (currentRecord.details[0]) {
        currentRecord.details[0].role = `${editKillerRole || ''} (${gameId})\n携带天赋：${safeEditKillerTalents[0] || ''}、${safeEditKillerTalents[1] || ''}`;
        currentRecord.details[0].pureRole = `监管者：${editKillerRole || ''} (${gameId})`;
        currentRecord.details[0].talent = `${safeEditKillerTalents[0] || ''}、${safeEditKillerTalents[1] || ''}`;
      }

      // 同步求生者数据
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

      // 同步战绩结果
      currentRecord.result = escapeCount < 2 ? "胜利" : escapeCount === 2 ? "平局" : "失败";
      currentRecord.type = escapeCount < 2 ? "win" : escapeCount === 2 ? "draw" : "lose";
      if (currentRecord.details[0]) {
        currentRecord.details[0].tag = escapeCount < 2 ? "大获全胜" : escapeCount === 2 ? "平局" : "惜败";
      }

      // 更新原始战绩数据
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

      // 写回页面数据
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

onLoad(options) {
  const app = getApp();
  const baseUrl = app.globalData.baseUrl;

  wx.request({
    url: `${baseUrl}/uits`,
    method: 'GET',
    success: (res) => {
      this.setData({ uitCache: res.data });
      console.log("✅ U_I_T缓存初始化完成：", this.data.uitCache);
    }
  });
},
  // ========== 新增：删除战绩逻辑 ==========
  deleteRecord(index) {
    const pageData = this.data;
    const baseUrl = app.globalData.baseUrl;
    const currentEditIndex = typeof pageData.currentIndex === 'number' ? pageData.currentIndex : -1;
    const safeRecords = Array.isArray(pageData.records) ? pageData.records : [];
    const currentRecord = { ...safeRecords[currentEditIndex] };
    const gameId = Number(currentRecord.game_id) || 0;
    console.log(gameId);
    wx.showModal({
      title: '确认删除',
      content: '是否确定删除这条战绩？删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          // 确认删除，从数组中移除该条数据
          wx.request({
            url: `${baseUrl}/games/delete?game_id=${gameId}`, 
            method: 'DELETE', 
            data: {
            },
            success: (res) => {
              wx.hideLoading();
              console.log('删除战绩响应：', res);
              
              if (res.statusCode === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                // 刷新战绩列表
                this.getData();
              } else if (res.statusCode === 404) {
                wx.showToast({ title: '战绩不存在', icon: 'none' });
              } else if (res.statusCode === 400) {
                wx.showToast({ title: '参数错误：' + (res.data || ''), icon: 'none' });
              } else {
                wx.showToast({ title: '删除失败：' + (res.data?.message || res.errMsg), icon: 'none' });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('删除战绩请求失败：', err);
              wx.showToast({ title: '网络错误：' + err.errMsg, icon: 'none' });
            }
          });
        }
      }
    });
  },

  //预处理战绩数据（分离角色名和天赋）
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

  // ========== 点击角色，弹出天赋详情弹窗 ==========
  onShowRoleTalents(e) {
    const pureRole = e.currentTarget.dataset.pureRole;
    const talent = e.currentTarget.dataset.talent;

    // 解析角色名
    let roleName = "未知";
    const killerMatch = pureRole.match(/监管者：(.+?)(\s*\(|$)/);
    const survivorMatch = pureRole.match(/求生者：(.+?)(\s*\(|$)/);
    
    if (killerMatch) {
      roleName = killerMatch[1]; // 监管者角色名
    } else if (survivorMatch) {
      roleName = survivorMatch[1]; // 求生者角色名
    }

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
      url: '/pages/rank/rank' 
  });
  },
  onRefresh(){
    // this.getData();
    wx.showToast({ title: '刷新成功', icon: 'success' });
  },
  getUid() {
    const userId = wx.getStorageSync('userId');
    this.setData({ 
      userId: userId,
      message: userId ? `当前 UID: ${userId}` : '未绑定账号，请先到首页绑定'
    });
    console.log(this.data.message);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getUid();
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
    this.getUid();
    this.getData();
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