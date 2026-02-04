const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 订单状态枚举（与前端保持一致）
const ORDER_STATUS = {
  PENDING: 'pending',
  RESCUEING: 'rescueing',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
};

// 合法状态流转映射
const VALID_STATUS_TRANSFER = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.RESCUEING, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.RESCUEING]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELED]: []
};

exports.main = async (event, context) => {
  try {
    const { orderId, targetStatus } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    // 1. 必传参数校验
    if (!orderId || !targetStatus) {
      return {
        success: false,
        msg: '订单ID和目标状态不能为空'
      };
    }

    // 2. 目标状态合法性校验
    const validStatus = Object.values(ORDER_STATUS);
    if (!validStatus.includes(targetStatus)) {
      return {
        success: false,
        msg: '目标状态不合法'
      };
    }

    // 3. 查询订单是否存在，获取当前状态和关联信息
    const orderRes = await db.collection('order_info').where({ order_id: orderId }).get();
    if (!orderRes.data || orderRes.data.length === 0) {
      return {
        success: false,
        msg: '订单不存在'
      };
    }
    const currentOrder = orderRes.data[0];
    const currentStatus = currentOrder.order_status;

    // 4. 状态流转合法性校验
    const validTargetStatus = VALID_STATUS_TRANSFER[currentStatus];
    if (!validTargetStatus || !validTargetStatus.includes(targetStatus)) {
      return {
        success: false,
        msg: `当前状态【${currentStatus}】无法切换为目标状态【${targetStatus}】`
      };
    }

    // 5. 用户身份校验（区分师傅/车主，控制操作权限）
    // 查询用户表（假设用户表为user_info，包含role字段：master/owner/admin）
    const userRes = await db.collection('user_info').where({ openid }).get();
    if (!userRes.data || userRes.data.length === 0) {
      return {
        success: false,
        msg: '用户未注册，无操作权限'
      };
    }
    const userRole = userRes.data[0].role;
    const orderOwnerId = currentOrder.car_owner_id; // 假设订单表存储了车主ID

    // 5.1 接单操作：仅师傅可执行
    if (targetStatus === ORDER_STATUS.RESCUEING && userRole !== 'master') {
      return {
        success: false,
        msg: '仅救援师傅可执行接单操作'
      };
    }

    // 5.2 取消订单：仅车主（订单创建者）可执行（待接单状态下）
    if (targetStatus === ORDER_STATUS.CANCELED && currentStatus === ORDER_STATUS.PENDING) {
      if (openid !== orderOwnerId && userRole !== 'admin') {
        return {
          success: false,
          msg: '仅订单创建者可取消待接单订单'
        };
      }
    }

    // 6. 更新订单状态（若为接单，同步存储师傅openid）
    const updateData = {
      order_status: targetStatus,
      update_time: db.serverDate()
    };
    // 接单时额外存储师傅信息
    if (targetStatus === ORDER_STATUS.RESCUEING) {
      updateData.mechanic_id = openid;
      updateData.receive_time = db.serverDate();
    }

    await db.collection('order_info').where({ order_id: orderId }).update({
      data: updateData
    });

    return {
      success: true,
      msg: '订单状态更新成功'
    };
  } catch (err) {
    console.error('订单状态更新失败：', err);
    return {
      success: false,
      msg: '订单状态更新失败',
      error: err.message
    };
  }
};