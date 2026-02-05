const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { orderId, startTime, endTime, limit = 10, offset = 0 } = event;
    
    // 构建查询条件
    const whereCondition = {};
    
    if (orderId) {
      whereCondition.order_id = orderId;
    }
    
    if (startTime) {
      whereCondition.call_start_time = db.command.gte(startTime);
    }
    
    if (endTime) {
      if (whereCondition.call_start_time) {
        whereCondition.call_start_time = db.command.and(
          whereCondition.call_start_time,
          db.command.lte(endTime)
        );
      } else {
        whereCondition.call_start_time = db.command.lte(endTime);
      }
    }
    
    // 查询通话记录
    const result = await db.collection('call_logs')
      .where(whereCondition)
      .orderBy('call_start_time', 'desc')
      .skip(offset)
      .limit(limit)
      .get();
    
    return {
      isSuccess: true,
      data: result.data || [],
      total: result.data.length
    };
  } catch (err) {
    console.error('查询通话记录失败：', err);
    return {
      isSuccess: false,
      msg: '查询通话记录失败',
      error: err.message
    };
  }
};