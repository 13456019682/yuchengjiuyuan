// @ts-nocheck
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 获取车主订单列表
 * @param {Object} event - 查询参数
 * @param {string} event.ownerId - 车主ID
 * @returns {Object} 查询结果
 */
exports.main = async (event, context) => {
  try {
    const { ownerId } = event;

    // 参数校验
    if (!ownerId) {
      return {
        success: false,
        msg: '缺少车主ID参数'
      };
    }

    // 查询车主订单
    const result = await db.collection('order_info')
      .where({
        car_owner_id: ownerId
      })
      .orderBy('create_time', 'desc')
      .get();

    return {
      success: true,
      msg: '查询成功',
      data: result.data || []
    };
  } catch (error) {
    console.error('获取车主订单失败：', error);
    return {
      success: false,
      msg: error.message || '获取车主订单失败'
    };
  }
};