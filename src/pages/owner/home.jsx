// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button, Card, Badge, Skeleton } from '@/components/ui';
// @ts-ignore;
import { Plus, Phone, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Car } from 'lucide-react';

export default function OwnerHome(props) {
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [userOrders, setUserOrders] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    completed: 0,
    cancelled: 0
  });

  // 获取当前用户的订单数据
  const fetchUserOrders = async () => {
    try {
      setLoading(true);

      // 检查网络连接
      if (!navigator.onLine) {
        throw new Error('网络连接异常，请检查网络设置');
      }

      // 添加超时机制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请重试')), 10000);
      });
      const currentUserId = props.$w.auth.currentUser?.userId || '';
      if (!currentUserId) {
        throw new Error('用户信息获取失败，请重新登录');
      }

      // 使用数据库直接查询用户订单
      const tcb = await props.$w.cloud.getCloudInstance();
      const dbPromise = tcb.database().collection('order_info').where({
        car_owner_id: currentUserId
      }).orderBy('create_time', 'desc').limit(10).get();

      // 竞速处理：超时或正常返回
      const result = await Promise.race([dbPromise, timeoutPromise]);
      if (result.data) {
        setUserOrders(result.data);

        // 统计订单状态
        const statsData = {
          pending: result.data.filter(order => order.order_status === '待接单').length,
          active: result.data.filter(order => order.order_status === '已接单').length,
          completed: result.data.filter(order => order.order_status === '已完成').length,
          cancelled: result.data.filter(order => order.order_status === '已取消').length
        };
        setStats(statsData);
      }
    } catch (error) {
      console.error('获取用户订单失败：', error);

      // 统一错误处理
      let errorTitle = '数据加载失败';
      let errorMessage = '网络异常，请重试';
      if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请重试';
      } else if (error.message.includes('网络连接异常')) {
        errorMessage = '网络连接异常，请检查网络设置';
      } else if (error.message.includes('用户信息获取失败')) {
        errorMessage = '用户信息获取失败，请重新登录';
      }
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 快速下单
  const handleQuickOrder = serviceType => {
    props.$w.utils.navigateTo({
      pageId: 'order-create',
      params: {
        serviceType
      }
    });
  };

  // 查看订单详情
  const handleViewOrder = orderId => {
    props.$w.utils.navigateTo({
      pageId: 'order-detail',
      params: {
        orderId
      }
    });
  };

  // 查看所有订单
  const handleViewAllOrders = () => {
    props.$w.utils.navigateTo({
      pageId: 'order-list',
      params: {}
    });
  };
  useEffect(() => {
    fetchUserOrders();
  }, []);

  // 获取状态图标和颜色
  const getStatusInfo = status => {
    switch (status) {
      case '待接单':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100'
        };
      case '已接单':
        return {
          icon: AlertTriangle,
          color: 'text-blue-600',
          bg: 'bg-blue-100'
        };
      case '已完成':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100'
        };
      case '已取消':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-100'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-100'
        };
    }
  };
  return <div className="min-h-screen bg-gray-50 p-4">
      {/* 顶部欢迎区域 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          欢迎使用甬城应急救援
        </h1>
        <p className="text-gray-600 mt-2">
          24小时专业道路救援服务
        </p>
      </div>

      {/* 快速下单区域 */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          快速下单
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => handleQuickOrder('搭电')} className="h-16 bg-yellow-500 hover:bg-yellow-600 text-white">
            <Car className="w-5 h-5 mr-2" />
            搭电救援
          </Button>
          <Button onClick={() => handleQuickOrder('换胎')} className="h-16 bg-blue-500 hover:bg-blue-600 text-white">
            <Car className="w-5 h-5 mr-2" />
            换胎服务
          </Button>
          <Button onClick={() => handleQuickOrder('补胎')} className="h-16 bg-green-500 hover:bg-green-600 text-white">
            <Car className="w-5 h-5 mr-2" />
            补胎服务
          </Button>
          <Button onClick={() => handleQuickOrder('拖车')} className="h-16 bg-red-500 hover:bg-red-600 text-white">
            <Car className="w-5 h-5 mr-2" />
            拖车服务
          </Button>
        </div>
      </Card>

      {/* 订单统计 */}
      <Card className="p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">我的订单</h2>
          <Button variant="outline" size="sm" onClick={handleViewAllOrders}>
            查看全部
          </Button>
        </div>
        
        {loading ? <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div> : <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-yellow-700">待接单</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-blue-700">进行中</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-green-700">已完成</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-sm text-red-700">已取消</div>
            </div>
          </div>}
      </Card>

      {/* 最近订单 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">最近订单</h2>
        
        {loading ? <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div> : userOrders.length === 0 ? <div className="text-center py-8 text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无订单记录</p>
            <Button className="mt-3" onClick={() => handleQuickOrder('搭电')}>
              立即下单
            </Button>
          </div> : <div className="space-y-3">
            {userOrders.slice(0, 5).map(order => {
          const {
            icon: StatusIcon,
            color,
            bg
          } = getStatusInfo(order.order_status);
          return <div key={order.order_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => handleViewOrder(order.order_id)}>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${bg} mr-3`}>
                      <StatusIcon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <div className="font-medium">{order.service_type}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.create_time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={bg}>
                    <span className={color}>{order.order_status}</span>
                  </Badge>
                </div>;
        })}
          </div>}
      </Card>

      {/* 紧急联系 */}
      <div className="fixed bottom-4 right-4">
        <Button size="lg" className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600 shadow-lg" onClick={() => {
        // 紧急联系逻辑
        toast({
          title: '紧急联系',
          description: '正在为您联系最近的救援师傅',
          variant: 'default'
        });
      }}>
          <Phone className="w-6 h-6" />
        </Button>
      </div>
    </div>;
}