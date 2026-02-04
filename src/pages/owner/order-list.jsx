// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button, Card } from '@/components/ui';
// @ts-ignore;
import { MapPin, Phone, AlertCircle, Plus, Clock } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';

// 移除拖车救援映射
const ORDER_STATUS_MAP = {
  pending: '待接单',
  rescueing: '已接单',
  completed: '已完成',
  cancelled: '已取消'
};
const RESCUE_TYPE_MAP = {
  tyre_burst: '爆胎救援',
  battery_dead: '电瓶亏电',
  fuel_supply: '燃油补给',
  other: '其他故障'
};
export default function OwnerOrderList(props) {
  const {
    toast
  } = useToast();
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getOwnerOrders();
  }, []);
  const getOwnerOrders = async () => {
    setLoading(true);
    try {
      const ownerId = props.$w.auth.currentUser?.userId;
      if (!ownerId) {
        toast({
          title: '请登录',
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
    } catch (e) {
      toast({
        title: '查询失败',
        description: e.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const getStatusStyle = status => {
    switch (status) {
      case 'pending':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30';
      case 'rescueing':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30';
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">我的订单</h1>
          <p className="text-slate-600">查看您的历史订单</p>
        </div>

        {loading ? <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div> : orderList.length === 0 ? <Card className="p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600">暂无订单</p>
              <Button onClick={() => props.$w.utils.navigateTo({
            pageId: 'owner/order-create',
            params: {}
          })} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40">
                <Plus className="w-4 h-4 mr-2" />
                创建救援订单
              </Button>
            </div>
          </Card> : <div className="space-y-4">
            {orderList.map(order => <Card key={order.orderId} className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => props.$w.utils.navigateTo({
          pageId: 'owner/order-detail',
          params: {
            orderId: order.orderId
          }
        })}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(order.orderStatus)}`}>
                    {ORDER_STATUS_MAP[order.orderStatus]}
                  </div>
                  <div className="flex items-center text-slate-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {order.createTime}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-600 mb-1">救援类型</div>
                      <div className="text-slate-800 font-medium">{RESCUE_TYPE_MAP[order.rescueType]}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-600 mb-1">救援地址</div>
                      <div className="text-slate-800 font-medium">{order.ownerAddress || '未填写'}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-600 mb-1">联系电话</div>
                      <div className="text-slate-800 font-medium">{order.ownerPhone || '未填写'}</div>
                    </div>
                  </div>
                </div>
              </Card>)}
          </div>}

        {/* 创建订单按钮 */}
        <div className="fixed bottom-6 right-6">
          <Button onClick={() => props.$w.utils.navigateTo({
          pageId: 'owner/order-create',
          params: {}
        })} className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>;
}