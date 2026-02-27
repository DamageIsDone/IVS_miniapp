Page({
  data: {
    currentTab: 0, // 0=监管者，1=求生者
    rankList: [],  
    hunterRankList: [], // 监管者排行数据
    survivorRankList: [], // 求生者排行数据
    allUsers: [], 
    isLoading: false, 
    completedUserCount: 0 // 已统计完成的用户数
  },

  onLoad() {
    this.loadAllUsers();
  },

  // 获取所有用户
  loadAllUsers() {
    this.setData({ isLoading: true });
    const app = getApp();
    const baseUrl = app.globalData.baseUrl;
    
    wx.request({
      url: `${baseUrl}/users`, 
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data) && res.data.length > 0) {
          console.log('【所有用户列表】：', res.data);
          this.setData({ 
            allUsers: res.data,
            completedUserCount: 0 // 重置已完成计数
          }, () => {
            // 获取用户后，开始统计所有用户的胜率
            this.calcAllUserWinRate();
          });
        } else {
          wx.showToast({ title: '暂无用户数据', icon: 'none' });
          this.setData({ isLoading: false });
        }
      },
      fail: (err) => {
        this.setData({ isLoading: false });
        wx.showToast({ title: '加载用户失败：' + err.errMsg, icon: 'none' });
        console.error('【获取用户失败】：', err);
      }
    });
  },

  // 统计所有用户的胜率（监管者+求生者）
  calcAllUserWinRate() {
    const { allUsers } = this.data;
    if (!allUsers.length) return;

    let hunterStatList = []; 
    let survivorStatList = [];

    // 遍历每个用户，拉取对局并统计
    allUsers.forEach(user => {
      const userId = user.user_id || user.userId; 
      const userName = user.username || user.user_name || `用户${userId}`;

      // 调用接口获取该用户的所有对局
      this.loadUserGame(userId, userName, (hunterStat, survivorStat) => {
        hunterStatList.push(hunterStat);
        survivorStatList.push(survivorStat);

        const newCompletedCount = this.data.completedUserCount + 1;
        this.setData({ completedUserCount: newCompletedCount }, () => {
          // 所有用户统计完成后，排序生成排行榜
          if (newCompletedCount === allUsers.length) {
            this.handleRankResult(hunterStatList, survivorStatList);
          }
        });
      });
    });
  },

  // 拉取单个用户的对局并统计胜率
  loadUserGame(userId, userName, callback) {
    
    const hunterStat = {
      userName: userName,
      userId: userId,
      winCount: 0, 
      totalCount: 0, 
      winRate: 0,
      winRateText: '0.00%'
    };
    const survivorStat = {
      userName: userName,
      userId: userId,
      winCount: 0, 
      totalCount: 0, 
      winRate: 0,
      winRateText: '0.00%'
    };

    const app = getApp();
    const baseUrl = app.globalData.baseUrl;
    
    wx.request({
      url: `${baseUrl}/games/user?user_id=${userId}`, 
      method: 'GET',
      data: { }, 
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const userGames = res.data;
          console.log(`【用户${userName}(${userId})】对局数：`, userGames.length);

          // 遍历该用户的所有对局，区分身份统计
          userGames.forEach((game, idx) => {
            const isHunter = game.hunter 
              && game.hunter.user 
              && game.hunter.user.user_id == userId;

            const isSurvivor = 
              (game.survivor1 && game.survivor1.user && game.survivor1.user.user_id == userId) ||
              (game.survivor2 && game.survivor2.user && game.survivor2.user.user_id == userId) ||
              (game.survivor3 && game.survivor3.user && game.survivor3.user.user_id == userId) ||
              (game.survivor4 && game.survivor4.user && game.survivor4.user.user_id == userId);

            console.log(`--- 第${idx+1}局 --- 监管者：${isHunter} | 求生者：${isSurvivor}`);

            // 计算该局胜负（逃脱≥2人算求生者胜利）
            const escapeCount = [game.result1, game.result2, game.result3, game.result4].filter(Boolean).length;
            const isSurvivorWin = escapeCount >= 2; 
            const isHunterWin = !isSurvivorWin;

            // 统计监管者数据
            if (isHunter) {
              hunterStat.totalCount += 1;
              if (isHunterWin) hunterStat.winCount += 1;
            }

            // 统计求生者数据
            if (isSurvivor) {
              survivorStat.totalCount += 1;
              if (isSurvivorWin) survivorStat.winCount += 1;
            }
          });

          // 计算胜率
          hunterStat.winRate = hunterStat.totalCount === 0 
            ? 0 
            : Math.round((hunterStat.winCount / hunterStat.totalCount) * 10000) / 100;
          survivorStat.winRate = survivorStat.totalCount === 0 
            ? 0 
            : Math.round((survivorStat.winCount / survivorStat.totalCount) * 10000) / 100;

          hunterStat.winRateText = `${hunterStat.winRate.toFixed(2)}%`;
          survivorStat.winRateText = `${survivorStat.winRate.toFixed(2)}%`;

          console.log(`【用户${userName}统计结果】监管者：${hunterStat.winCount}胜/${hunterStat.totalCount}场 | 求生者：${survivorStat.winCount}胜/${survivorStat.totalCount}场`);
        }

        callback(hunterStat, survivorStat);
      },
      fail: (err) => {
        console.error(`【获取用户${userName}对局失败】：`, err);
        callback(hunterStat, survivorStat);
      }
    });
  },

  // 处理排行榜结果
  handleRankResult(hunterStatList, survivorStatList) {
    // 按胜率降序排序
    const sortByWinRate = (a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.totalCount - a.totalCount;
    };
    hunterStatList.sort(sortByWinRate);
    survivorStatList.sort(sortByWinRate);

    hunterStatList.forEach((item, index) => item.rank = index + 1);
    survivorStatList.forEach((item, index) => item.rank = index + 1);

    console.log('【最终排行榜】监管者：', hunterStatList);
    console.log('【最终排行榜】求生者：', survivorStatList);

    // 更新页面数据，默认显示监管者排行
    this.setData({
      hunterRankList: hunterStatList,
      survivorRankList: survivorStatList,
      rankList: hunterStatList,
      isLoading: false
    });

    if (hunterStatList.length === 0 && survivorStatList.length === 0) {
      wx.showToast({ title: '暂无用户对局数据', icon: 'none' });
    }
  },

  switchTab(e) {
    const tab = Number(e.currentTarget.dataset.tab);
    if (tab === this.data.currentTab) return;

    this.setData({
      currentTab: tab,
      rankList: tab === 0 ? this.data.hunterRankList : this.data.survivorRankList
    });
  },

  onShareAppMessage() {
    return { title: '用户胜率排行榜' };
  }
});