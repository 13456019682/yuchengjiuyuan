const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { page = 1, pageSize = 10 } = event;
    
    // 计算分页偏移量
    const offset = (page - 1) * pageSize;
    
    // 查询待接单订单（状态为 pending）
    const result = await db.collection('order_info')
      .where({
        order_status: 'pending'
      })
      .orderBy('create_time', 'desc')
      .skip(offset)
      .limit(pageSize)
      .get();
    
    return {
      success: true,
      data: result.data || [],
      page,
      pageSize,
      total: result.data.length
    };
  } catch (err) {
    console.error('查询待接单订单失败：', err);
    return {
      success: false,
      msg: '查询待接单订单失败',
      error: err.message
    };
  }
};