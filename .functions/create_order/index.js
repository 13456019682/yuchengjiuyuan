// @ts-nocheck
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 创建救援订单
 * @param {Object} event - 订单数据
 * @returns {Object} 创建结果
 */
exports.main = async (event, context) => {
  try {
    const {
      order_id,
      car_owner_id,
      service_type,
      order_status,
      phone,
      address,
      car_model,
      fault_desc,
      create_time,
      update_time
    } = event;

    // 参数校验
    if (!order_id || !car_owner_id || !service_type || !order_status || !phone || !address) {
      return {
        success: false,
        msg: '缺少必要参数'
      };
    }

    // 校验服务类型（移除拖车）
    const validServiceTypes = ['搭电', '换胎', '补胎'];
    if (!validServiceTypes.includes(service_type)) {
      return {
        success: false,
        msg: '无效的服务类型'
      };
    }

    // 校验订单状态
    const validOrderStatuses = ['待接单', '已接单', '已完成', '已取消'];
    if (!validOrderStatuses.includes(order_status)) {
      return {
        success: false,
        msg: '无效的订单状态'
      };
    }

    // 创建订单
    const result = await db.collection('order_info').add({
      data: {
        order_id,
        car_owner_id,
        mechanic_id: '',
        service_type,
        order_status,
        phone,
        address,
        car_model: car_model || '',
        fault_desc: fault_desc || '',
        create_time: create_time || new Date().toISOString(),
        update_time: update_time || new Date().toISOString(),
        health_confirmation: false
      }
    });

    if (result._id) {
      return {
        success: true,
        msg: '订单创建成功',
        data: {
          order_id,
          _id: result._id
        }
      };
    } else {
      return {
        success: false,
        msg: '订单创建失败'
      };
    }
  } catch (error) {
    console.error('创建订单失败：', error);
    return {
      success: false,
      msg: error.message || '创建订单失败'
    };
  }
};