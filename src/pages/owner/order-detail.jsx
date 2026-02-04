// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Phone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import PaginationControl from '@/components/Pagination';
export default function OwnerOrderDetail(props) {
  const {
    toast
  } = useToast();
  const [order, setOrder] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const orderId = props.$w?.page?.dataset?.params?.orderId;

  // 获取订单详情
  const fetchOrderDetail = async () => {
    if (!orderId) {
      toast({
        title: '参数错误',
        description: '缺少订单ID',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    try {
      const res = await props.$w.cloud.callFunction({
        name: 'get_order_detail',
        data: {
          orderId
        }
      });
      if (res.result?.success) {
        setOrder(res.result.result);
      } else {
        toast({
          title: '订单数据加载失败',
          description: res.result?.error || '未知错误',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '订单数据加载失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取通话记录（带分页）
  const fetchCallLogs = async page => {
    if (!orderId) return;
    setCallLogsLoading(true);
    const limit = 10;
    const offset = (page - 1) * limit;
    try {
      const res = await props.$w.cloud.callFunction({
        name: 'get_call_logs',
        data: {
          orderId,
          limit,
          offset
        }
      });
      if (res.result?.success) {
        setCallLogs(res.result.result || []);
        // 计算总页数：向上取整，避免出现半页数据
        setTotalPages(Math.ceil((res.result.total || 0) / limit));
      } else {
        toast({
          title: '通话记录加载失败',
          description: res.result?.error || '未知错误',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '通话记录加载失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCallLogsLoading(false);
    }
  };

  // 页码变化处理
  const handlePageChange = page => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    fetchCallLogs(page);
  };

  // 初始化加载
  useEffect(() => {
    fetchOrderDetail();
    if (orderId) {
      fetchCallLogs(1);
    }
  }, [orderId]);

  // 格式化时间
  const formatTime = timestamp => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 格式化通话时长
  const formatDuration = seconds => {
    if (!seconds || seconds === 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // 获取通话状态图标和颜色
  const getCallStatusInfo = status => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          text: '接通成功'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-500',
          text: '呼叫失败'
        };
      case 'missed':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          text: '无人接听'
        };
      case 'busy':
        return {
          icon: XCircle,
          color: 'text-yellow-500',
          text: '被叫占线'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          text: '未知状态'
        };
    }
  };

  // 加载中状态
  if (loading) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" color="primary" />
        <p className="mt-4 text-gray-600">加载订单详情中...</p>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 pb-8">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">订单详情</h1>
          <p className="text-sm text-gray-500 mt-1">订单编号：{orderId}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* 虚拟号码信息卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-blue-500" />
              虚拟号码信息
            </h2>
          </div>
          
          {order?.virtual_phone ? <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">虚拟号码</span>
                <span className="text-lg font-semibold text-blue-600">{order.virtual_phone}</span>
              </div>
              
              {order.virtual_phone_expire_time && <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    有效期至
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {formatTime(order.virtual_phone_expire_time)}
                  </span>
                </div>}
            </div> : <div className="text-center py-8 text-gray-500">
              <Phone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无虚拟号码信息</p>
            </div>}
        </div>

        {/* 通话记录卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              通话记录
            </h2>
            <span className="text-sm text-gray-500">
              共 {totalPages * 10} 条记录
            </span>
          </div>

          {callLogsLoading ? <LoadingSpinner size="md" color="primary" /> : callLogs.length > 0 ? <>
              {/* 通话记录列表 */}
              <div className="space-y-3">
                {callLogs.map(log => {
              const statusInfo = getCallStatusInfo(log.call_status);
              const StatusIcon = statusInfo.icon;
              return <div key={log.call_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                          <span className={`font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatTime(log.call_start_time)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">主叫方：</span>
                          <span className="text-gray-800 ml-1">{log.caller_id || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">被叫方：</span>
                          <span className="text-gray-800 ml-1">{log.callee_id || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">通话时长：</span>
                          <span className="text-gray-800 ml-1">{formatDuration(log.call_duration)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">虚拟号码：</span>
                          <span className="text-gray-800 ml-1">{log.virtual_phone || '-'}</span>
                        </div>
                      </div>
                      
                      {log.call_end_time && <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-400">
                            结束时间：{formatTime(log.call_end_time)}
                          </span>
                        </div>}
                    </div>;
            })}
              </div>

              {/* 分页组件 */}
              {totalPages > 1 && <div className="mt-6 flex justify-center">
                  <PaginationControl currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>}
            </> : <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无通话记录</p>
            </div>}
        </div>
      </div>
    </div>;
}