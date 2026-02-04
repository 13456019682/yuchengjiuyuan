// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button } from '@/components/ui';
// @ts-ignore;
import { MapPin, Phone, AlertCircle, Car, FileText } from 'lucide-react';

import AgreementModal from '@/components/AgreementModal';

// 服务类型（移除拖车救援）
const RESCUE_TYPES = [{
  label: '搭电',
  value: '搭电',
  icon: '⚡'
}, {
  label: '换胎',
  value: '换胎',
  icon: '🔧'
}, {
  label: '补胎',
  value: '补胎',
  icon: '🛞'
}];
export default function OrderCreate(props) {
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    serviceType: '',
    carModel: '',
    faultDesc: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const validateForm = () => {
    if (!formData.phone || !/^1[3-9]\d{9}$/.test(formData.phone)) {
      toast({
        title: '请填写正确的手机号',
        variant: 'destructive'
      });
      return false;
    }
    if (!formData.address) {
      toast({
        title: '请填写救援地址',
        variant: 'destructive'
      });
      return false;
    }
    if (!formData.serviceType) {
      toast({
        title: '请选择救援类型',
        variant: 'destructive'
      });
      return false;
    }
    if (!agreed) {
      toast({
        title: '请先同意服务协议',
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
      const orderData = {
        order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        car_owner_id: props.$w.auth.currentUser?.userId || '',
        service_type: formData.serviceType,
        order_status: '待接单',
        phone: formData.phone,
        address: formData.address,
        car_model: formData.carModel || '未填写',
        fault_desc: formData.faultDesc || '未填写',
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString()
      };
      const result = await props.$w.cloud.callFunction({
        name: 'create_order',
        data: orderData
      });
      if (result.result?.success) {
        toast({
          title: '下单成功',
          description: '您的救援订单已提交，请等待师傅接单',
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
          description: result.result?.msg || '请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('下单失败：', error);
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
        {/* 页面头部 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">创建救援订单</h1>
          <p className="text-slate-600 text-sm sm:text-base">请填写订单信息并提交</p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* 联系电话 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              联系电话 <span className="text-red-500">*</span>
            </label>
            <input type="tel" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} placeholder="请输入您的手机号" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>

          {/* 救援地址 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              救援地址 <span className="text-red-500">*</span>
            </label>
            <textarea value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="请输入详细的救援地址" rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" />
          </div>

          {/* 救援类型 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              救援类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RESCUE_TYPES.map(type => <button key={type.value} onClick={() => handleInputChange('serviceType', type.value)} className={`p-4 rounded-lg border-2 transition-all ${formData.serviceType === type.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium text-slate-700">{type.label}</div>
                </button>)}
            </div>
          </div>

          {/* 车辆型号 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Car className="w-4 h-4 inline mr-1" />
              车辆型号
            </label>
            <input type="text" value={formData.carModel} onChange={e => handleInputChange('carModel', e.target.value)} placeholder="请输入您的车辆型号（选填）" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>

          {/* 故障描述 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              故障描述
            </label>
            <textarea value={formData.faultDesc} onChange={e => handleInputChange('faultDesc', e.target.value)} placeholder="请描述您的车辆故障情况（选填）" rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" />
          </div>

          {/* 服务协议 */}
          <div className="flex items-start space-x-3">
            <input type="checkbox" id="agreement" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
            <label htmlFor="agreement" className="text-sm text-slate-600">
              我已阅读并同意
              <button type="button" onClick={() => setAgreed(!agreed)} className="text-blue-600 hover:text-blue-700 ml-1">
                《甬城应急救援服务协议》
              </button>
            </label>
          </div>

          {/* 提交按钮 */}
          <Button onClick={handleSubmitOrder} disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 py-6 text-lg">
            {submitting ? '提交中...' : '提交订单'}
          </Button>
        </div>

        {/* 集成协议弹窗组件 */}
        <AgreementModal $w={props.$w} />
      </div>
    </div>;
}