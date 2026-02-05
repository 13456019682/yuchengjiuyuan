const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 自动化阶梯派单函数
 * @param {Object} params - 派单参数
 * @param {string} params.orderId - 订单ID
 * @param {string} params.location - 救援位置
 * @param {number} params.stage - 派单阶段(1:0-30秒,2:30-60秒,3:60-120秒)
 */
exports.main = async (event) => {
  const { orderId, location, stage = 1 } = event;
  
  try {
    // 1. 获取订单信息
    const { data: orders } = await db.collection('order_info')
      .where({ order_id: orderId })
      .get();
    
    if (orders.length === 0) {
      throw new Error('订单不存在');
    }
    
    const order = orders[0];
    
    // 2. 根据阶段设置派单范围
    let distanceRange = 5; // 默认5公里
    switch (stage) {
      case 1:
        distanceRange = 5; // 0-30秒：5公里内
        break;
      case 2:
        distanceRange = 10; // 30-60秒：10公里内
        break;
      case 3:
        distanceRange = 50; // 60-120秒：全城范围
        break;
    }
    
    // 3. 获取符合条件的师傅
    // 这里简化处理，实际应该根据位置计算距离
    const { data: mechanics } = await db.collection('user_info')
      .where({
        user_type: 'mechanic',
        is_online: true,
        is_busy: false,
        rating: db.command.gte(4.0) // 高评级师傅
      })
      .orderBy('rating', 'desc')
      .limit(10)
      .get();
    
    // 4. 过滤黑名单和忙碌师傅
    const availableMechanics = mechanics.filter(mechanic => 
      !mechanic.is_blacklisted && !mechanic.is_busy
    );
    
    if (availableMechanics.length === 0) {
      return {
        isSuccess: true,
        data: {
          dispatched: false,
          message: '当前无可用师傅',
          stage: stage,
          nextStage: stage < 3 ? stage + 1 : null
        }
      };
    }
    
    // 5. 选择最优师傅（评分最高）
    const bestMechanic = availableMechanics[0];
    
    // 6. 更新订单状态
    await db.collection('order_info')
      .where({ order_id: orderId })
      .update({
        data: {
          mechanic_id: bestMechanic.user_id,
          order_status: '已接单',
          update_time: new Date(),
          dispatch_stage: stage,
          dispatch_time: new Date()
        }
      });
    
    // 7. 更新师傅状态
    await db.collection('user_info')
      .where({ user_id: bestMechanic.user_id })
      .update({
        data: {
          is_busy: true,
          current_order: orderId
        }
      });
    
    return {
      isSuccess: true,
      data: {
        dispatched: true,
        mechanic: {
          id: bestMechanic.user_id,
          name: bestMechanic.nick_name || bestMechanic.name,
          phone: bestMechanic.phone,
          rating: bestMechanic.rating
        },
        stage: stage,
        message: '派单成功'
      }
    };
    
  } catch (error) {
    console.error('派单失败:', error);
    return {
      isSuccess: false,
      error: error.message
    };
  }
};