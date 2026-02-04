import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * 调用云函数的通用工具函数
 * @param {string} name - 云函数名称
 * @param {object} data - 传递给云函数的数据
 * @returns {Promise<{success: boolean, result?: any, msg?: string}>}
 */
export async function callCloudFunction(name, data = {}) {
  try {
    const result = await wx.cloud.callFunction({
      name,
      data
    });
    
    return {
      success: true,
      result: result.result
    };
  } catch (error) {
    console.error(`云函数调用失败 [${name}]:`, error);
    return {
      success: false,
      msg: error.message || '云函数调用失败'
    };
  }
}

/**
 * 导出Excel文件（小程序版）
 * @param {Array} data - 要导出的数据数组
 * @param {Array} header - 表头配置 [{key: 'field', title: '列名'}]
 * @param {string} fileName - 文件名
 * @returns {Promise<{success: boolean, downloadUrl?: string, fileID?: string, msg?: string}>}
 */
export async function exportToExcel(data, header, fileName) {
  try {
    if (!data || !data.length || !header) {
      return {
        success: false,
        msg: '无有效导出数据'
      };
    }

    const res = await callCloudFunction('export_call_log_excel', {
      data,
      header,
      fileName
    });

    if (res.success && res.result) {
      return {
        success: true,
        downloadUrl: res.result.downloadUrl,
        fileID: res.result.fileID
      };
    } else {
      return {
        success: false,
        msg: res.msg || 'Excel导出失败'
      };
    }
  } catch (error) {
    console.error('Excel导出失败:', error);
    return {
      success: false,
      msg: error.message || 'Excel导出失败'
    };
  }
}

/**
 * 格式化日期时间
 * @param {Date|string} date - 日期对象或日期字符串
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string}
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化通话时长
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长，如 '1分30秒'
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0秒';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else if (wx && wx.setClipboardData) {
      // 小程序环境
      return new Promise((resolve) => {
        wx.setClipboardData({
          data: text,
          success: () => resolve(true),
          fail: () => resolve(false)
        });
      });
    }
    return false;
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    return false;
  }
}

/**
 * 显示Toast提示
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 * @param {string} type - 类型 'success' | 'error' | 'warning' | 'info'
 */
export function showToast(title, message = '', type = 'info') {
  if (wx && wx.showToast) {
    // 小程序环境
    wx.showToast({
      title: message || title,
      icon: type === 'success' ? 'success' : type === 'error' ? 'error' : 'none',
      duration: 2000
    });
  } else {
    // 网页环境，使用console输出
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  }
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间间隔（毫秒）
 * @returns {Function}
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 生成唯一ID
 * @returns {string}
 */
export function generateUniqueId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 获取订单状态文本
 * @param {string} status - 订单状态
 * @returns {string}
 */
export function getOrderStatusText(status) {
  const statusMap = {
    'pending': '待接单',
    'rescueing': '救援中',
    'completed': '已完成',
    'canceled': '已取消'
  };
  return statusMap[status] || '未知状态';
}

/**
 * 获取订单状态颜色
 * @param {string} status - 订单状态
 * @returns {string}
 */
export function getOrderStatusColor(status) {
  const colorMap = {
    'pending': 'text-yellow-600 bg-yellow-50',
    'rescueing': 'text-blue-600 bg-blue-50',
    'completed': 'text-green-600 bg-green-50',
    'canceled': 'text-gray-600 bg-gray-50'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-50';
}

/**
 * 获取通话状态文本
 * @param {string} status - 通话状态
 * @returns {string}
 */
export function getCallStatusText(status) {
  const statusMap = {
    'success': '通话成功',
    'failed': '通话失败',
    'missed': '未接听',
    'ongoing': '通话中'
  };
  return statusMap[status] || '未知状态';
}

/**
 * 获取通话状态颜色
 * @param {string} status - 通话状态
 * @returns {string}
 */
export function getCallStatusColor(status) {
  const colorMap = {
    'success': 'text-green-600 bg-green-50',
    'failed': 'text-red-600 bg-red-50',
    'missed': 'text-yellow-600 bg-yellow-50',
    'ongoing': 'text-blue-600 bg-blue-50'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-50';
}
