const cloudbase = require('@cloudbase/node-sdk');

// 初始化云开发环境
const app = cloudbase.init({
  env: process.env.TCB_ENV || cloudbase.getCurrentEnv()
});

const models = app.models;

/**
 * 主函数：获取通话记录列表，支持分页和筛选
 */
exports.main = async (event, context) => {
  try {
    // 1. 参数校验
    if (!event || typeof event !== 'object') {
      return {
        success: false,
        code: 400,
        msg: '参数格式错误，event 必须为对象',
        error: 'Invalid event format'
      };
    }

    const { 
      orderId, 
      limit = 10, 
      offset = 0,
      startTime = null,
      endTime = null,
      callStatus = null
    } = event;

    // 2. 校验必填参数
    if (!orderId || orderId.trim() === '') {
      return {
        success: false,
        code: 400,
        msg: '订单ID(order_id)不能为空',
        error: 'Missing required parameter: order_id'
      };
    }

    // 3. 构建查询条件
    let whereCondition = { order_id: orderId };

    // 时间范围筛选（依托call_start_time_index索引，高效查询）
    if (startTime && endTime) {
      whereCondition.call_start_time = {
        $gte: new Date(startTime),
        $lte: new Date(endTime)
      };
    }

    // 通话状态筛选
    if (callStatus && callStatus.trim() !== '') {
      whereCondition.call_status = callStatus;
    }

    // 4. 分页查询当前页数据
    const listRes = await models.call_logs.query({
      filter: whereCondition,
      orderBy: [{ field: 'call_start_time', order: 'desc' }],
      limit: limit,
      offset: offset
    });

    // 5. 查询总记录数
    const countRes = await models.call_logs.query({
      filter: whereCondition,
      limit: 1,
      offset: 0
    });

    const total = countRes.data ? countRes.data.length : 0;

    // 6. 返回结果
    return {
      success: true,
      code: 200,
      msg: '查询成功',
      result: listRes.data || [],
      total: total,
      limit: limit,
      offset: offset
    };

  } catch (error) {
    // 错误处理
    console.error('获取通话记录失败:', error);
    
    return {
      success: false,
      code: 500,
      msg: '服务异常，请稍后重试',
      error: error.message || 'Unknown error'
    };
  }
};