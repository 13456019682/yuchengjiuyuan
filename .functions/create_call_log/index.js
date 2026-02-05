const cloud = require('wx-server-sdk');
const crypto = require('crypto');

// 初始化云开发环境
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 生成全局唯一的 call_id
 * 格式: CALL_{timestamp}_{random}
 * @returns {string} 唯一的 call_id
 */
function generateCallId() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CALL_${timestamp}_${random}`;
}

/**
 * 校验手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 校验通话状态枚举
 * @param {string} status - 通话状态
 * @returns {boolean} 是否有效
 */
function validateCallStatus(status) {
  const validStatuses = ['success', 'failed', 'missed', 'busy'];
  return validStatuses.includes(status);
}

/**
 * 校验必填字段
 * @param {object} data - 输入数据
 * @returns {object} 校验结果 { valid: boolean, error?: string }
 */
function validateRequiredFields(data) {
  const requiredFields = ['order_id', 'virtual_phone', 'caller_id', 'callee_id', 'call_status'];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].trim() === '') {
      return {
        valid: false,
        error: `字段 ${field} 不能为空`
      };
    }
  }
  
  return { valid: true };
}

/**
 * 主函数：创建通话日志记录
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

    const { order_id, virtual_phone, caller_id, callee_id, call_status } = event;

    // 2. 校验必填字段
    const requiredValidation = validateRequiredFields(event);
    if (!requiredValidation.valid) {
      return {
        success: false,
        code: 400,
        msg: requiredValidation.error,
        error: requiredValidation.error
      };
    }

    // 3. 校验手机号格式
    if (!validatePhone(virtual_phone)) {
      return {
        success: false,
        code: 400,
        msg: '虚拟号码格式错误，必须为11位有效手机号',
        error: 'Invalid phone number format'
      };
    }

    // 4. 校验通话状态枚举
    if (!validateCallStatus(call_status)) {
      return {
        success: false,
        code: 400,
        msg: '通话状态无效，必须为 success/failed/missed/busy 之一',
        error: 'Invalid call_status value'
      };
    }

    // 5. 生成唯一 call_id
    const call_id = generateCallId();

    // 6. 组装通话日志数据
    const callLogData = {
      call_id,
      order_id,
      virtual_phone,
      call_start_time: Date.now(), // 使用服务器时间
      call_end_time: null,
      call_duration: 0,
      call_status,
      caller_id,
      callee_id,
      call_metadata: {}
    };

    // 7. 写入数据模型
    const result = await models.call_logs.create({
      data: callLogData
    });

    // 8. 返回成功结果
    return {
      success: true,
      code: 200,
      msg: '通话日志创建成功',
      data: {
        _id: result.data._id,
        call_id: result.data.call_id,
        order_id: result.data.order_id
      }
    };

  } catch (error) {
    // 错误处理
    console.error('创建通话日志失败:', error);
    
    // 判断是否为唯一索引冲突
    if (error.message && error.message.includes('duplicate')) {
      return {
        success: false,
        code: 500,
        msg: '创建失败，call_id 可能重复，请重试',
        error: 'Duplicate key error'
      };
    }

    // 判断是否为数据校验失败
    if (error.message && error.message.includes('校验')) {
      return {
        success: false,
        code: 500,
        msg: '数据校验失败：' + error.message,
        error: error.message
      };
    }

    // 通用错误处理
    return {
      isSuccess: false,
      code: 500,
      msg: '服务异常，请稍后重试',
      error: error.message || 'Unknown error'
    };
  }
};