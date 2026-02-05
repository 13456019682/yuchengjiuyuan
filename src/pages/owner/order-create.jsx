// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { useToast, Button, Card } from '@/components/ui';
// @ts-ignore;
import { MapPin, Phone, AlertCircle, Car, FileText } from 'lucide-react';

import AgreementModal from '@/components/AgreementModal';

// 救援业务类型映射
const RESCUE_TYPES = [{
  label: '补胎',
  value: '补胎'
}, {
  label: '换胎',
  value: '换胎'
}, {
  label: '搭电',
  value: '搭电'
}, {
  label: '拖车',
  value: '拖车'
}];
export default function OrderCreate(props) {
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    ownerPhone: '',
    ownerAddress: '',
    rescueType: '',
    carModel: '',
    faultDesc: '',
    distance: 0,
    isNight: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [priceInfo, setPriceInfo] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const handleInputChange = (key, value) => {
    const newFormData = {
      ...formData,
      [key]: value
    };
    setFormData(newFormData);

    // 当救援类型、距离或夜间服务变更时，自动计算价格
    if (['rescueType', 'distance', 'isNight'].includes(key)) {
      calculatePrice(newFormData);
    }
  };

  // 自动计价函数
  const calculatePrice = async formData => {
    if (!formData.rescueType) return;
    setCalculating(true);
    try {
      const result = await props.$w.cloud.callFunction({
        name: 'calculate_price',
        data: {
          businessTypes: [formData.rescueType],
          distance: formData.distance || 0,
          isNight: formData.isNight || false,
          serviceTime: new Date().toISOString()
        }
      });
      if (result.success) {
        setPriceInfo(result.data);
      } else {
        toast({
          title: '计价失败',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '计价异常',
        description: '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setCalculating(false);
    }
  };
  const validateForm = () => {
    if (!formData.ownerPhone || !/^1[3-9]\d{9}$/.test(formData.ownerPhone)) {
      toast({
        title: '请填写正确手机号',
        variant: 'destructive'
      });
      return false;
    }
    if (!formData.ownerAddress) {
      toast({
        title: '请填写救援地址',
        variant: 'destructive'
      });
      return false;
    }
    if (!formData.rescueType) {
      toast({
        title: '请选择救援类型',
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };
  const handleSubmitOrder = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      // 检查网络连接
      if (!navigator.onLine) {
        throw new Error('网络连接异常，请检查网络设置');
      }

      // 添加超时机制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请重试')), 15000);
      });
      const orderData = {
        orderId: `order_${Date.now()}`,
        ownerId: props.$w.auth.currentUser?.userId || '',
        ...formData,
        carModel: formData.carModel || '未填写',
        faultDesc: formData.faultDesc || '未填写',
        orderStatus: 'pending',
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      };

      // 使用数据库直接操作创建订单
      const tcb = await props.$w.cloud.getCloudInstance();
      const dbPromise = tcb.database().collection('order_info').add({
        data: {
          order_id: orderData.orderId,
          car_owner_id: orderData.ownerId,
          service_type: orderData.rescueType,
          order_status: orderData.orderStatus,
          create_time: new Date(),
          update_time: new Date(),
          owner_phone: orderData.ownerPhone,
          owner_address: orderData.ownerAddress,
          car_model: orderData.carModel,
          fault_desc: orderData.faultDesc
        }
      });

      // 竞速处理：超时或正常返回
      const result = await Promise.race([dbPromise, timeoutPromise]);
      if (result.id) {
        toast({
          title: '下单成功',
          description: '订单已提交，请等待师傅接单',
          variant: 'default'
        });
        setTimeout(() => {
          props.$w.utils.navigateTo({
            pageId: 'owner/order-list',
            params: {}
          });
        }, 2000);
      } else {
        toast({
          title: '下单失败',
          description: '请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      toast({
        title: '下单失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">创建救援订单</h1>
          <p className="text-slate-600">请填写订单信息并提交</p>
        </div>

        {/* 集成协议弹窗组件 */}
        <AgreementModal $w={props.$w} />

        {/* 订单表单 */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">订单信息</h2>
          
          <div className="space-y-4">
            {/* 联系电话 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                联系电话 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="tel" placeholder="请输入联系电话" value={formData.ownerPhone} onChange={e => handleInputChange('ownerPhone', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            {/* 救援地址 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                救援地址 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <textarea placeholder="请输入救援地址" value={formData.ownerAddress} onChange={e => handleInputChange('ownerAddress', e.target.value)} rows={3} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>
            </div>

            {/* 救援类型 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                救援类型 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select value={formData.rescueType} onChange={e => handleInputChange('rescueType', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                  <option value="">请选择救援类型</option>
                  {RESCUE_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
            </div>

            {/* 距离和夜间服务 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  救援距离(公里)
                </label>
                <input type="number" className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入距离" value={formData.distance} onChange={e => handleInputChange('distance', parseFloat(e.target.value) || 0)} min="0" step="0.1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  是否夜间服务
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" checked={formData.isNight} onChange={e => handleInputChange('isNight', e.target.checked)} />
                  <span className="text-sm text-slate-600">夜间服务(22:00-06:00)</span>
                </div>
              </div>
            </div>

            {/* 价格展示 */}
            {priceInfo && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">费用明细</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>基础费用:</span>
                    <span className="font-medium">¥{priceInfo.basePrice}</span>
                  </div>
                  {priceInfo.priceSnapshot.distanceCharge > 0 && <div className="flex justify-between">
                      <span>超里程费用:</span>
                      <span className="font-medium">¥{priceInfo.priceSnapshot.distanceCharge}</span>
                    </div>}
                  {priceInfo.priceSnapshot.nightSurcharge > 0 && <div className="flex justify-between">
                      <span>夜间加价:</span>
                      <span className="font-medium">¥{priceInfo.priceSnapshot.nightSurcharge}</span>
                    </div>}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-medium">总计:</span>
                    <span className="font-bold text-lg text-blue-600">¥{priceInfo.totalPrice}</span>
                  </div>
                </div>
              </div>}
            
            {calculating && <div className="text-center text-gray-500 py-2">
                正在计算费用...
              </div>}

            {/* 车辆型号 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                车辆型号
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="请输入车辆型号（选填）" value={formData.carModel} onChange={e => handleInputChange('carModel', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            {/* 故障描述 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                故障描述
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <textarea placeholder="请描述故障情况（选填）" value={formData.faultDesc} onChange={e => handleInputChange('faultDesc', e.target.value)} rows={4} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>
            </div>
          </div>
        </Card>

        {/* 提交按钮 */}
        <Button onClick={handleSubmitOrder} disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 py-6 text-lg">
          {submitting ? '提交中...' : '提交订单'}
        </Button>
      </div>
    </div>;
}