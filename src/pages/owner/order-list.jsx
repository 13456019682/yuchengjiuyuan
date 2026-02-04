// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button } from '@/components/ui';
// @ts-ignore;
import { MapPin, Phone, AlertCircle, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';

// 订单状态映射
const ORDER_STATUS_MAP = {
  '待接单': {
    text: '待接单',
    color: 'text-amber-600',
    bg: 'bg-amber-100'
  },
  '已接单': {
    text: '已接单',
    color: 'text-blue-600',
    bg: 'bg-blue-100'
  },
  '已完成': {
    text: '已完成',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100'
  },
  '已取消': {
    text: '已取消',
    color: 'text-red-600',
    bg: 'bg-red-100'
  }
};

// 服务类型映射（移除拖车）
const SERVICE_TYPE_MAP = {
  '搭电': {
    label: '搭电',
    icon: '⚡',
    color: 'text-yellow-600'
  },
  '换胎': {
    label: '换胎',
    icon: '🔧',
    color: 'text-blue-600'
  },
  '补胎': {
    label: '补胎',
    icon: '🛞',
    color: 'text-green-600'
  }
};
export default function OwnerOrderList(props) {
  const {
    toast
  } = useToast();
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchOwnerOrders();
  }, []);
  const fetchOwnerOrders = async () => {
    setLoading(true);
    try {
      const ownerId = props.$w.auth.currentUser?.userId;
      if (!ownerId) {
        toast({
          title: '请先登录',
          variant: 'destructive'
        });
        return;
      }
      const result = await props.$w.cloud.callFunction({
        name: 'get_owner_orders',
        data: {
          ownerId
        }
      });
      if (result.result?.success) {
        setOrderList(result.result.data || []);
      } else {
        toast({
          title: '查询失败',
          description: result.result?.msg || '请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('查询订单失败：', error);
      toast({
        title: '查询失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const formatTime = timestamp => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 页面头部 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">我的订单</h1>
          <p className="text-slate-600 text-sm sm:text-base">查看您的历史订单</p>
        </div>

        {/* 加载状态 */}
        {loading ? <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" color="primary" />
            <p className="mt-4 text-slate-600">加载中...</p>
          </div> : orderList.length === 0 ? <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-600 text-lg">暂无订单</p>
            <Button onClick={() => props.$w.utils.navigateTo({
          pageId: 'owner/order-create',
          params: {}
        })} className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40">
              <Plus className="w-4 h-4 mr-2" />
              创建救援订单
            </Button>
          </div> : <div className="space-y-4">
            {orderList.map(order => {
          const statusInfo = ORDER_STATUS_MAP[order.order_status] || ORDER_STATUS_MAP['待接单'];
          const serviceInfo = SERVICE_TYPE_MAP[order.service_type] || {
            label: order.service_type,
            icon: '🔧',
            color: 'text-slate-600'
          };
          return <div key={order.order_id} onClick={() => props.$w.utils.navigateTo({
            pageId: 'owner/order-detail',
            params: {
              orderId: order.order_id
            }
          })} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl ${serviceInfo.color}`}>{serviceInfo.icon}</span>
                      <div>
                        <div className={`text-sm font-medium px-2 py-1 rounded ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.text}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(order.create_time)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 text-slate-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-600 mb-1">救援类型</div>
                        <div className="text-sm font-medium text-slate-800">{serviceInfo.label}</div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-slate-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-600 mb-1">救援地址</div>
                        <div className="text-sm font-medium text-slate-800">{order.address || '未填写'}</div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Phone className="w-4 h-4 mr-2 text-slate-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-600 mb-1">联系电话</div>
                        <div className="text-sm font-medium text-slate-800">{order.phone || '未填写'}</div>
                      </div>
                    </div>
                  </div>
                </div>;
        })}
          </div>}

        {/* 创建订单按钮 */}
        {!loading && orderList.length > 0 && <div className="fixed bottom-6 right-6">
            <Button onClick={() => props.$w.utils.navigateTo({
          pageId: 'owner/order-create',
          params: {}
        })} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 rounded-full w-14 h-14 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </Button>
          </div>}
      </div>
    </div>;
}