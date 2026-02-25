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
    currentRoleTalents: []
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
    this.setData({
      showBottomPicker: true,
      pickerType: "role",
      pickerSubType: "killer",
      pickerOptions: ["摄影师", "梦之女巫", "宿伞之魂", "红夫人"],
      pickerValue: [this.data.pickerOptions.indexOf(this.data.editKillerRole) || 0]
    });
  },
  // 选择监管者天赋
  onSelectKillerTalent(e) {
    const talentIndex = e.currentTarget.dataset.index;
    this.setData({
      showBottomPicker: true,
      pickerType: "killerTalent",
      pickerTalentIndex: talentIndex,
      pickerOptions: ["挽留", "禁闭空间", "狂暴", "困兽之斗", "通缉", "崩坏"],
      pickerValue: [this.data.pickerOptions.indexOf(this.data.editKillerTalents[talentIndex]) || 0]
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
    const index = e.currentTarget.dataset.index;
    this.setData({
      showBottomPicker: true,
      pickerType: "survivorRole",
      pickerIndex: index,
      pickerOptions: ["古董商", "心理学家", "啦啦队员", "杂技演员", "调香师", "机械师", "佣兵", "先知"],
      pickerValue: [this.data.pickerOptions.indexOf(this.data.editDetails[index].survivor) || 0]
    });
  },

  // 选择求生者天赋
  onSelectSurvivorTalent(e) {
    const index = e.currentTarget.dataset.index;
    const talentIndex = e.currentTarget.dataset.talentIndex;
    this.setData({
      showBottomPicker: true,
      pickerType: "survivorTalent",
      pickerIndex: index,
      pickerTalentIndex: talentIndex,
      pickerOptions: ["飞轮效应", "化险为夷", "膝跳反射", "回光返照", "绝处逢生", "求生意志"],
      pickerValue: [this.data.pickerOptions.indexOf(this.data.editDetails[index].talents[talentIndex]) || 0]
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

  // 确认修改战绩
  // confirmEdit() {
  //   const index = this.data.currentIndex;
  //   const records = [...this.data.records];
  //   const record = records[index];

  //   // 重新组装监管者详情
  //   const killerTalentText = this.data.editKillerTalents.join('、');
  //   const killerDetail = {
  //     role: `监管者：${this.data.editKillerRole} (1)\n携带天赋：${killerTalentText}`,
  //     tag: record.result === "胜利" ? "大获全胜" : "失败",
  //     pureRole: `监管者：${this.data.editKillerRole} (1)`,
  //     talent: killerTalentText,
  //     isKiller: true,
  //     isWin: record.result === "胜利"
  //   };

  //   // 重新组装求生者详情
  //   const survivorDetails = this.data.editDetails.map(d => {
  //     const talentText = d.talents.join('、');
  //     return {
  //       role: `求生者：${d.survivor}\n携带天赋：${talentText}`,
  //       tag: d.result,
  //       pureRole: `求生者：${d.survivor}`,
  //       talent: talentText,
  //       isKiller: false,
  //       isWin: d.result === "逃脱"
  //     };
  //   });

  //   // 更新战绩数据
  //   record.role = this.data.editKillerRole;
  //   record.details = [killerDetail, ...survivorDetails];
  //   records[index] = record;

  //   // 保存数据并关闭弹窗
  //   this.setData({
  //     records,
  //     showEditModal: false
  //   });

  //   // 提示修改成功
  //   wx.showToast({
  //     title: '修改成功',
  //     icon: 'success',
  //     duration: 1500
  //   });
  // },

  confirmEdit() {
    // 1. 校验当前修改的战绩索引是否有效
    const index = this.data.currentIndex;
    if (index === -1 || index >= this.data.records.length) {
      wx.showToast({
        title: '修改失败：未选中战绩',
        icon: 'none',
        duration: 1500
      });
      return;
    }
  
    // 2. 获取编辑弹窗中的最新数据
    const {
      editKillerRole,    // 编辑后的监管者角色
      editKillerTalents, // 编辑后的监管者天赋数组
      editDetails        // 编辑后的求生者详情数组
    } = this.data;
  
    // 3. 基础数据校验（避免空值）
    if (!editKillerRole) {
      wx.showToast({
        title: '请选择监管者角色',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    if (editDetails.length === 0) {
      wx.showToast({
        title: '暂无求生者数据',
        icon: 'none',
        duration: 1500
      });
      return;
    }
  
    // 4. 核心：统计逃脱的求生者数量
    let escapeCount = 0;
    editDetails.forEach(detail => {
      if (detail.result === '逃脱') {
        escapeCount++;
      }
    });
  
    // 5. 根据逃脱人数确定监管者结果
    let killerResult = ''; // 监管者最终结果
    let killerTag = '';    // 监管者详情标签
    let recordType = '';   // 战绩项样式类型
    if (escapeCount === 0) {
      // 0人逃脱 → 大获全胜
      killerResult = '胜利';
      killerTag = '大获全胜';
      recordType = 'win';
    } else if (escapeCount === 2) {
      // 2人逃脱 → 勉强胜利
      killerResult = '平局';
      killerTag = '勉强胜利';
      recordType = 'draw'; 
    } else if (escapeCount > 2) {
      // 2人以上逃脱 → 一败涂地
      killerResult = '失败';
      killerTag = '一败涂地';
      recordType = 'lose'; // 归类为失败样式
    } else {
      // 1人逃脱 → 胜利（默认）
      killerResult = '胜利';
      killerTag = '大获全胜';
      recordType = 'win';
    }
  
    // 6. 深拷贝原始战绩数据（避免直接修改原数据）
    const records = JSON.parse(JSON.stringify(this.data.records));
    const currentRecord = records[index];
  
    // 7. 重组监管者详情（关联逃脱人数的结果）
    const killerTalentText = editKillerTalents.join('、') || '无';
    const killerDetail = {
      role: `监管者：${editKillerRole} (1)\n携带天赋：${killerTalentText}`,
      tag: killerTag, // 自动适配的监管者结果标签
      pureRole: `监管者：${editKillerRole} (1)`,
      talent: killerTalentText,
      isKiller: true,
      isWin: escapeCount <= 2 // 2人及以下逃脱算监管者胜利
    };
  
    // 8. 重组求生者详情（循环处理每个求生者）
    const survivorDetails = editDetails.map((detail, surIndex) => {
      // 补全求生者空值
      const survivorName = detail.survivor || `求生者${surIndex + 1}`;
      const survivorResult = detail.result || '迷失';
      const survivorTalentText = detail.talents?.join('、') || '无';
  
      return {
        role: `求生者：${survivorName}\n携带天赋：${survivorTalentText}`,
        tag: survivorResult,
        pureRole: `求生者：${survivorName}`,
        talent: survivorTalentText,
        isKiller: false,
        isWin: survivorResult === "逃脱"
      };
    });
  
    // 9. 更新当前战绩的所有数据（关联结果）
    currentRecord.role = editKillerRole;        // 监管者角色
    currentRecord.result = killerResult;       // 监管者最终结果（胜利/勉强胜利/一败涂地）
    currentRecord.type = recordType;           // 战绩样式类型（win/lose）
    currentRecord.details = [killerDetail, ...survivorDetails]; // 详情数据
  
    // 10. 保存修改后的数据到数据源
    this.setData({
      records: records,       // 覆盖原始records
      showEditModal: false    // 关闭修改弹窗
    }, () => {
      // 11. 修改成功提示
      wx.showToast({
        title: `修改成功：${killerResult}`,
        icon: 'success',
        duration: 1500,
        mask: true // 防止点击穿透
      });
  
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