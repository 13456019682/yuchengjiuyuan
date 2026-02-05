const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 自动计价函数
 * @param {Object} params - 计价参数
 * @param {Array} params.businessTypes - 业务类型数组
 * @param {number} params.distance - 救援距离(公里)
 * @param {boolean} params.isNight - 是否夜间服务
 * @param {string} params.serviceTime - 服务时间
 */
exports.main = async (event) => {
  const { businessTypes, distance, isNight, serviceTime } = event;
  
  try {
    // 1. 获取业务配置
    const { data: businessConfigs } = await db.collection('rescue_business')
      .where({
        business_name: db.command.in(businessTypes),
        is_enabled: true
      })
      .get();
    
    if (businessConfigs.length === 0) {
      throw new Error('未找到有效的业务配置');
    }
    
    // 2. 计算基础价格
    let basePrice = 0;
    let extraCharges = 0;
    const priceSnapshot = {
      businessDetails: [],
      distanceCharge: 0,
      nightSurcharge: 0
    };
    
    // 计算各业务基础价格
    businessConfigs.forEach(business => {
      basePrice += business.base_price;
      priceSnapshot.businessDetails.push({
        businessName: business.business_name,
        basePrice: business.base_price
      });
    });
    
    // 3. 计算超里程费用
    const freeDistance = Math.max(...businessConfigs.map(b => b.free_distance));
    if (distance > freeDistance) {
      const distanceUnitPrice = Math.max(...businessConfigs.map(b => b.distance_unit_price));
      const distanceCharge = (distance - freeDistance) * distanceUnitPrice;
      extraCharges += distanceCharge;
      priceSnapshot.distanceCharge = distanceCharge;
    }
    
    // 4. 计算夜间加价
    if (isNight) {
      const nightSurcharge = Math.max(...businessConfigs.map(b => b.night_surcharge));
      extraCharges += nightSurcharge;
      priceSnapshot.nightSurcharge = nightSurcharge;
    }
    
    // 5. 计算总价格
    const totalPrice = basePrice + extraCharges;
    
    // 6. 计算平台抽成
    const commissionRate = Math.max(...businessConfigs.map(b => b.commission_rate));
    const platformCommission = totalPrice * commissionRate;
    const mechanicIncome = totalPrice - platformCommission;
    
    return {
      success: true,
      data: {
        basePrice,
        extraCharges,
        totalPrice,
        platformCommission,
        mechanicIncome,
        priceSnapshot,
        businessConfigs
      }
    };
    
  } catch (error) {
    console.error('计价计算失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};