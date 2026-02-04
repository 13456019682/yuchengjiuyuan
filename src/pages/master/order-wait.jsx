// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button, Card } from '@/components/ui';
// @ts-ignore;
import { Clock, MapPin, Phone, AlertCircle } from 'lucide-react';

import RiskTip from '@/components/RiskTip';
export default function OrderWait(props) {
  const {
    toast
  } = useToast();
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(false);
  let timer = null;
  let prevOrderCount = 0;
  let pollInterval = 30000;

  // 查询待接单订单
  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const res = await props.$w.cloud.callFunction({
        name: 'get_pending_orders',
        data: {}
      });
      if (res.result && res.result.success) {
        const newOrderList = res.result.result || [];
        setOrderList(newOrderList);

        // 新订单提醒
        if (newOrderList.length > prevOrderCount && prevOrderCount > 0) {
          toast({
            title: '新订单提醒',
            description: '有新的救援订单，请注意查收！',
            variant: 'default'
          });
        }

        // 优化轮询间隔：无订单延长至60秒，有订单恢复30秒
        if (newOrderList.length === 0) {
          pollInterval = 60000;
        } else {
          pollInterval = 30000;
        }
        prevOrderCount = newOrderList.length;

        // 重启定时器
        if (timer) {
          clearInterval(timer);
        }
        startPolling();
      }
    } catch (err) {
      console.error('获取待接单订单失败：', err);
      toast({
        title: '获取订单失败',
        description: err.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 启动轮询
  const startPolling = () => {
    timer = setInterval(() => {
      fetchPendingOrders();
    }, pollInterval);
  };

  // 组件挂载/卸载生命周期
  useEffect(() => {
    // 初始化：立即查询一次，再启动轮询
    fetchPendingOrders();

    // 组件卸载：清除定时器
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  // 接单操作
  const handleReceiveOrder = async orderId => {
    try {
      const res = await props.$w.cloud.callFunction({
        name: 'update_order_status',
        data: {
          orderId,
          targetStatus: 'rescueing'
        }
      });
      if (res.result && res.result.success) {
        toast({
          title: '接单成功',
          description: '您已成功接单，请尽快前往救援地点',
          variant: 'default'
        });
        fetchPendingOrders(); // 刷新列表
      } else {
        toast({
          title: '接单失败',
          description: res.result?.msg || '请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('接单失败：', err);
      toast({
        title: '接单失败',
        description: err.message || '请稍后重试',
        variant: 'destructive'
      });
    }
  };

  // 格式化时间
  const formatTime = dateStr => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* 页面头部 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">师傅待接单</h1>
          <p className="text-slate-600">实时监控待接单订单，及时响应救援需求</p>
        </div>

        {/* 风险提示 */}
        <RiskTip />

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-3xl font-bold mb-1">{orderList.length}</div>
            <div className="text-sm opacity-90">待接单数量</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="text-3xl font-bold mb-1">{pollInterval / 1000}s</div>
            <div className="text-sm opacity-90">刷新间隔</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="text-3xl font-bold mb-1">{loading ? '...' : '✓'}</div>
            <div className="text-sm opacity-90">系统状态</div>
          </Card>
        </div>

        {/* 订单列表 */}
        <div className="space-y-4">
          {orderList.length === 0 ? <Card className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无待接单订单</h3>
              <p className="text-slate-500">系统会自动刷新，请耐心等待新订单</p>
            </Card> : orderList.map(order => <Card key={order._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      订单 #{order._id.slice(-6)}
                    </h3>
                    <div className="flex items-center text-slate-600 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTime(order.create_time)}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                    待接单
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-600 mb-1">救援地点</div>
                      <div className="text-slate-800 font-medium">{order.address || '暂无地址信息'}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-600 mb-1">联系电话</div>
                      <div className="text-slate-800 font-medium">{order.phone || '暂无电话信息'}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-600 mb-1">救援类型</div>
                      <div className="text-slate-800 font-medium">{order.rescue_type || '通用救援'}</div>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleReceiveOrder(order._id)} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" size="lg">
                  立即接单
                </Button>
              </Card>)}
        </div>
      </div>
    </div>;
}