// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button, Card } from '@/components/ui';
// @ts-ignore;
import { Clock, MapPin, Phone, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function OrderDetail(props) {
  const {
    toast
  } = useToast();
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 从URL参数获取订单ID
  const orderId = props.$w.page.dataset.params.orderId || '';
  const toAccept = props.$w.page.dataset.params.toAccept === '1';

  // 获取订单详情
  const fetchOrderDetail = async () => {
    if (!orderId) {
      toast({
        title: '参数错误',
        description: '缺少订单ID',
        variant: 'destructive'
      });
      return;
    }
    try {
      setLoading(true);
      const tcb = await props.$w.cloud.getCloudInstance();
      const res = await tcb.database().collection('order_info').doc(orderId).get();
      if (res.data && res.data.length > 0) {
        setOrderInfo(res.data[0]);
      } else {
        toast({
          title: '订单不存在',
          description: '未找到该订单信息',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('获取订单详情失败：', err);
      toast({
        title: '获取订单失败',
        description: err.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 接单操作
  const handleAcceptOrder = async () => {
    if (!orderInfo || orderInfo.order_status !== '待接单') {
      toast({
        title: '无法接单',
        description: '当前订单状态不允许接单',
        variant: 'destructive'
      });
      return;
    }
    try {
      setActionLoading(true);
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
        // 更新订单状态
        setOrderInfo({
          ...orderInfo,
          order_status: '已接单',
          mechanic_id: props.$w.auth.currentUser?.userId || ''
        });
        // 2秒后返回列表页
        setTimeout(() => {
          props.$w.utils.navigateTo({
            pageId: 'master/order-wait',
            params: {}
          });
        }, 2000);
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
    } finally {
      setActionLoading(false);
    }
  };

  // 完成订单操作
  const handleCompleteOrder = async () => {
    if (!orderInfo || orderInfo.order_status !== '已接单') {
      toast({
        title: '无法完成',
        description: '当前订单状态不允许完成',
        variant: 'destructive'
      });
      return;
    }
    try {
      setActionLoading(true);
      const res = await props.$w.cloud.callFunction({
        name: 'update_order_status',
        data: {
          orderId,
          targetStatus: 'completed'
        }
      });
      if (res.result && res.result.success) {
        toast({
          title: '订单完成',
          description: '恭喜您完成救援任务！',
          variant: 'default'
        });
        // 更新订单状态
        setOrderInfo({
          ...orderInfo,
          order_status: '已完成'
        });
        // 2秒后返回列表页
        setTimeout(() => {
          props.$w.utils.navigateTo({
            pageId: 'master/order-wait',
            params: {}
          });
        }, 2000);
      } else {
        toast({
          title: '完成失败',
          description: res.result?.msg || '请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('完成订单失败：', err);
      toast({
        title: '完成失败',
        description: err.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 取消订单操作
  const handleCancelOrder = async () => {
    if (!orderInfo || orderInfo.order_status !== '待接单') {
      toast({
        title: '无法取消',
        description: '当前订单状态不允许取消',
        variant: 'destructive'
      });
      return;
    }
    try {
      setActionLoading(true);
      const res = await props.$w.cloud.callFunction({
        name: 'update_order_status',
        data: {
          orderId,
          targetStatus: 'canceled'
        }
      });
      if (res.result && res.result.success) {
        toast({
          title: '订单已取消',
          description: '订单已成功取消',
          variant: 'default'
        });
        // 更新订单状态
        setOrderInfo({
          ...orderInfo,
          order_status: '已取消'
        });
        // 2秒后返回列表页
        setTimeout(() => {
          props.$w.utils.navigateTo({
            pageId: 'master/order-wait',
            params: {}
          });
        }, 2000);
      } else {
        toast({
          title: '取消失败',
          description: res.result?.msg || '请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('取消订单失败：', err);
      toast({
        title: '取消失败',
        description: err.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 格式化时间
  const formatTime = dateStr => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取订单状态样式
  const getStatusStyle = status => {
    switch (status) {
      case '待接单':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30';
      case '已接单':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30';
      case '已完成':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30';
      case '已取消':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  // 获取订单状态背景样式
  const getStatusBgStyle = status => {
    switch (status) {
      case '待接单':
        return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200';
      case '已接单':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200';
      case '已完成':
        return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200';
      case '已取消':
        return 'bg-gradient-to-br from-red-50 to-red-100 border-red-200';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
    }
  };

  // 获取订单状态图标
  const getStatusIcon = status => {
    switch (status) {
      case '待接单':
        return <AlertCircle className="w-5 h-5" />;
      case '已接单':
        return <Clock className="w-5 h-5" />;
      case '已完成':
        return <CheckCircle className="w-5 h-5" />;
      case '已取消':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  // 组件挂载时获取订单详情
  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  // 如果携带 toAccept 参数，自动弹出接单确认
  useEffect(() => {
    if (toAccept && orderInfo && orderInfo.order_status === '待接单') {
      handleAcceptOrder();
    }
  }, [toAccept, orderInfo]);
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-base sm:text-lg">加载中...</p>
        </div>
      </div>;
  }
  if (!orderInfo) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">订单不存在</h3>
          <Button onClick={() => props.$w.utils.navigateTo({
          pageId: 'master/order-wait',
          params: {}
        })} variant="outline" className="mt-4">
            返回列表
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 页面头部 */}
        <div className="mb-6 sm:mb-8">
          <Button onClick={() => props.$w.utils.navigateTo({
          pageId: 'master/order-wait',
          params: {}
        })} variant="ghost" className="mb-4 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">订单详情</h1>
          <p className="text-slate-600 text-sm sm:text-base">订单ID: {orderInfo.order_id || orderId}</p>
        </div>

        {/* 订单状态卡片 */}
        <Card className={`p-6 mb-6 border-2 ${getStatusBgStyle(orderInfo.order_status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(orderInfo.order_status)}
              <div>
                <div className="text-sm text-slate-600 mb-1">订单状态</div>
                <div className="text-lg font-semibold text-slate-800">{orderInfo.order_status}</div>
              </div>
            </div>
            <span className={`px-6 py-3 rounded-full text-sm font-bold shadow-lg ${getStatusStyle(orderInfo.order_status)}`}>
              {orderInfo.order_status}
            </span>
          </div>
        </Card>

        {/* 订单信息卡片 */}
        <Card className="p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">订单信息</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 mr-3 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-600 mb-1">救援地点</div>
                <div className="text-slate-800 font-medium break-words">{orderInfo.address || '暂无地址信息'}</div>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="w-5 h-5 mr-3 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-600 mb-1">联系电话</div>
                <div className="text-slate-800 font-medium break-words">{orderInfo.phone || '暂无电话信息'}</div>
              </div>
            </div>

            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-600 mb-1">服务类型</div>
                <div className="text-slate-800 font-medium break-words">{orderInfo.service_type || '通用救援'}</div>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="w-5 h-5 mr-3 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-600 mb-1">创建时间</div>
                <div className="text-slate-800 font-medium break-words">{formatTime(orderInfo.create_time)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 时间记录卡片 */}
        <Card className="p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">时间记录</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-5">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">接单时间</span>
              </div>
              <div className="text-base sm:text-lg font-semibold text-blue-800">
                {formatTime(orderInfo.receive_time) || '--'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 sm:p-5">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">完成时间</span>
              </div>
              <div className="text-base sm:text-lg font-semibold text-emerald-800">
                {formatTime(orderInfo.complete_time) || '--'}
              </div>
            </div>
          </div>
        </Card>

        {/* 操作按钮 */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">订单操作</h2>
          <div className="space-y-3">
            {orderInfo.order_status === '待接单' && <>
                <Button onClick={handleAcceptOrder} disabled={actionLoading} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 text-base sm:text-lg py-3 sm:py-4" size="lg">
                  {actionLoading ? '处理中...' : '立即接单'}
                </Button>
                <Button onClick={handleCancelOrder} disabled={actionLoading} variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-all duration-200 text-base sm:text-lg py-3 sm:py-4" size="lg">
                  {actionLoading ? '处理中...' : '取消订单'}
                </Button>
              </>}

            {orderInfo.order_status === '已接单' && <Button onClick={handleCompleteOrder} disabled={actionLoading} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 text-base sm:text-lg py-3 sm:py-4" size="lg">
                {actionLoading ? '处理中...' : '完成订单'}
              </Button>}

            {orderInfo.order_status === '已完成' && <div className="text-center py-6 sm:py-8">
                <CheckCircle className="w-16 h-16 mx-auto mb-3 text-emerald-500" />
                <p className="text-lg sm:text-xl font-medium text-slate-700">订单已完成</p>
                <p className="text-sm sm:text-base text-slate-500 mt-1">感谢您的辛勤工作</p>
              </div>}

            {orderInfo.order_status === '已取消' && <div className="text-center py-6 sm:py-8">
                <XCircle className="w-16 h-16 mx-auto mb-3 text-red-500" />
                <p className="text-lg sm:text-xl font-medium text-slate-700">订单已取消</p>
                <p className="text-sm sm:text-base text-slate-500 mt-1">该订单已被取消</p>
              </div>}
          </div>
        </Card>
      </div>
    </div>;
}