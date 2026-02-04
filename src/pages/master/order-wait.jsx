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
        data: {
          page: 1,
          pageSize: 10
        }
      });
      if (res.result && res.result.success) {
        const newOrderList = res.result.data || [];
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
      } else {
        // 云函数调用失败
        console.error('获取待接单订单失败：', res.result);
        toast({
          title: '获取订单失败',
          description: res.result?.msg || '请稍后重试',
          variant: 'destructive'
        });
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

  // 开始轮询
  const startPolling = () => {
    timer = setInterval(() => {
      fetchPendingOrders();
    }, pollInterval);
  };

  // 接单操作
  const handleReceiveOrder = async orderId => {
    try {
      // 二次确认（避免误操作）
      if (!confirm('确定要接这个订单吗？')) {
        return;
      }
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
        // 跳转到订单详情页面
        props.$w.utils.navigateTo({
          pageId: 'master/order-detail',
          params: {
            orderId: orderId,
            toAccept: '1'
          }
        });
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

  // 页面加载时获取订单
  useEffect(() => {
    fetchPendingOrders();
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* 页面头部 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">待接单订单</h1>
          <p className="text-slate-600">实时监控救援订单，及时响应救援需求</p>
        </div>

        {/* 统计信息卡片 */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{orderList.length}</div>
              <div className="text-sm text-slate-600">待接单数量</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{pollInterval / 1000}s</div>
              <div className="text-sm text-slate-600">刷新间隔</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">正常</div>
              <div className="text-sm text-slate-600">系统状态</div>
            </div>
          </div>
        </Card>

        {/* 风险提示 */}
        <RiskTip />

        {/* 加载状态 */}
        {loading && <Card className="p-8 mb-6">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-600">正在加载订单...</p>
            </div>
          </Card>}

        {/* 无订单状态 */}
        {!loading && orderList.length === 0 && <Card className="p-8 mb-6">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 mb-2">暂无待接单订单</p>
              <p className="text-sm text-slate-500">系统将自动刷新，请耐心等待</p>
            </div>
          </Card>}

        {/* 订单列表 */}
        {!loading && orderList.length > 0 && <div className="space-y-4">
            {orderList.map((order, index) => <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-3 mb-4">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-600 mb-1">救援地点</div>
                      <div className="text-slate-800 font-medium">{order.address || order.owner_address || '暂无地址信息'}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-600 mb-1">联系电话</div>
                      <div className="text-slate-800 font-medium">{order.phone || order.owner_phone || '暂无电话信息'}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-600 mb-1">救援类型</div>
                      <div className="text-slate-800 font-medium">{order.rescue_type || order.service_type || '通用救援'}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => handleReceiveOrder(order.order_id || order.id)} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40">
                    立即接单
                  </Button>
                  <Button onClick={() => props.$w.utils.navigateTo({
              pageId: 'master/order-detail',
              params: {
                orderId: order.order_id || order.id
              }
            })} variant="outline" className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-all duration-200">
                    查看详情
                  </Button>
                </div>
              </Card>)}
          </div>}
      </div>
    </div>;
}