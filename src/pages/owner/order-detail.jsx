// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button } from '@/components/ui';
// @ts-ignore;
import { Phone, Clock, CheckCircle, XCircle, AlertCircle, Filter, Download, MapPin, Car, FileText } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import PaginationControl from '@/components/Pagination';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundary';

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
  fuel_supply: '柴油补给燃油补给',
  other: '其他故障'
};
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
  const [filterCondition, setFilterCondition] = useState({
    startTime: '',
    endTime: '',
    callStatus: ''
  });
  const [showFilter, setShowFilter] = useState(false);
  const orderId = props.$w?.page?.dataset?.params?.orderId;

  // 重置通话记录加载
  const resetCallLogs = () => {
    setCallLogs([]);
    setCurrentPage(1);
    setTotalPages(1);
    setFilterCondition({
      startTime: '',
      endTime: '',
      callStatus: ''
    });
    if (orderId) {
      fetchCallLogs(1);
    }
  };

  // 取消订单处理函数
  const handleCancelOrder = async () => {
    if (!orderId) {
      toast({
        title: '参数错误',
        description: '缺少订单ID',
        variant: 'destructive'
      });
      return;
    }
    try {
      // 检查网络连接
      if (!navigator.onLine) {
        throw new Error('网络连接异常，请检查网络设置');
      }

      // 添加超时机制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请重试')), 10000);
      });
      const cancelPromise = props.$w.cloud.callFunction({
        name: 'update_order_status',
        data: {
          orderId: orderId,
          newStatus: 'cancelled'
        }
      });

      // 竞速处理：超时或正常返回
      const res = await Promise.race([cancelPromise, timeoutPromise]);
      if (res.result && res.result.success) {
        // 取消成功
        toast({
          title: '取消成功',
          description: '订单已取消',
          variant: 'default'
        });

        // 刷新订单详情
        fetchOrderDetail();
      } else {
        // 云函数返回失败
        const errorMsg = res.result?.msg || '取消订单失败';

        // 特殊处理：订单已被接单的情况
        if (errorMsg.includes('已被接单') || errorMsg.includes('无法取消')) {
          toast({
            title: '取消失败',
            description: '该订单已被接单，无法取消',
            variant: 'destructive'
          });
        } else {
          toast({
            title: '取消失败',
            description: errorMsg,
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('取消订单失败：', error);

      // 统一网络异常处理
      let errorTitle = '取消失败';
      let errorMessage = '网络异常，请重试';

      // 根据错误类型提供具体提示
      if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请重试';
      } else if (error.message.includes('网络连接异常')) {
        errorMessage = '网络连接异常，请检查网络设置';
      } else if (error.message.includes('FUNCTION_NOT_FOUND')) {
        errorTitle = '服务异常';
        errorMessage = '服务暂不可用，请稍后重试';
      }
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

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
      // 使用数据库直接查询订单详情
      const tcb = await props.$w.cloud.getCloudInstance();
      const result = await tcb.database().collection('order_info').where({
        order_id: orderId,
        car_owner_id: ownerId
      }).get();
      if (result.data && result.data.length > 0) {
        const orderData = result.data[0];
        // 转换数据格式以匹配前端使用
        setOrder({
          orderId: orderData.order_id,
          ownerId: orderData.car_owner_id,
          rescueType: orderData.service_type,
          orderStatus: orderData.order_status,
          createTime: orderData.create_time ? new Date(orderData.create_time).toLocaleString() : '',
          ownerPhone: orderData.owner_phone || '',
          ownerAddress: orderData.owner_address || '',
          carModel: orderData.car_model || '',
          faultDesc: orderData.fault_desc || ''
        });
      } else {
        toast({
          title: '订单数据加载失败',
          description: '订单不存在或无权限查看',
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

  // 获取通话记录（带分页和筛选）
  const fetchCallLogs = async (page, filter = {}) => {
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
          offset,
          startTime: filter.startTime || null,
          endTime: filter.endTime || null,
          callStatus: filter.callStatus || null
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
    fetchCallLogs(page, filterCondition);
  };

  // 筛选提交函数
  const handleFilterSubmit = () => {
    // 重置分页为第1页，重新加载数据
    setCurrentPage(1);
    fetchCallLogs(1, filterCondition);
  };

  // 重置筛选条件
  const handleFilterReset = () => {
    setFilterCondition({
      startTime: '',
      endTime: '',
      callStatus: ''
    });
    setCurrentPage(1);
    fetchCallLogs(1, {});
  };

  // 导出Excel
  const handleExportExcel = async () => {
    if (callLogs.length === 0) {
      toast({
        title: '导出失败',
        description: '暂无通话记录可导出',
        variant: 'destructive'
      });
      return;
    }
    try {
      // 表头配置
      const excelHeader = [{
        key: 'call_id',
        title: '通话ID'
      }, {
        key: 'order_id',
        title: '订单ID'
      }, {
        key: 'caller_id',
        title: '主叫方'
      }, {
        key: 'callee_id',
        title: '被叫方'
      }, {
        key: 'virtual_phone',
        title: '虚拟号码'
      }, {
        key: 'call_status',
        title: '通话状态'
      }, {
        key: 'call_start_time',
        title: '通话开始时间'
      }, {
        key: 'call_end_time',
        title: '通话结束时间'
      }, {
        key: 'call_duration',
        title: '通话时长(秒)'
      }];

      // 调用云函数生成Excel
      const res = await props.$w.cloud.callFunction({
        name: 'export_call_log_excel',
        data: {
          data: callLogs,
          header: excelHeader,
          fileName: `通话记录_${orderId}`
        }
      });
      if (res.result && res.result.success) {
        const {
          downloadUrl,
          fileID
        } = res.result;

        // 显示成功提示和下载链接
        toast({
          title: '导出成功',
          description: 'Excel文件已生成，点击复制下载链接',
          variant: 'default'
        });

        // 显示下载链接对话框
        if (typeof window !== 'undefined' && window.confirm) {
          window.confirm(`Excel下载链接：\n${downloadUrl}\n\n点击确定复制链接到剪贴板`);

          // 复制链接到剪贴板
          if (navigator.clipboard) {
            navigator.clipboard.writeText(downloadUrl).then(() => {
              toast({
                title: '复制成功',
                description: '下载链接已复制到剪贴板',
                variant: 'default'
              });
            }).catch(() => {
              toast({
                title: '复制失败',
                description: '请手动复制下载链接',
                variant: 'destructive'
              });
            });
          }
        }
      } else {
        toast({
          title: '导出失败',
          description: res.result?.msg || '请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('导出Excel失败：', err);
      toast({
        title: '导出失败',
        description: err.message || '请稍后重试',
        variant: 'destructive'
      });
    }
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
        {/* 订单基本信息卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">订单信息</h2>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${order?.orderStatus === 'pending' ? 'bg-amber-100 text-amber-700' : order?.orderStatus === 'rescueing' ? 'bg-blue-100 text-blue-700' : order?.orderStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {ORDER_STATUS_MAP[order?.orderStatus] || '未知状态'}
              </div>
              
              {/* 取消订单按钮 - 仅显示在待接单状态 */}
              {order?.orderStatus === 'pending' && <Button onClick={handleCancelOrder} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <XCircle className="w-4 h-4 mr-2" />
                  取消订单
                </Button>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">救援地址</div>
                <div className="text-gray-800 font-medium">{order?.ownerAddress || '暂无地址信息'}</div>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">联系电话</div>
                <div className="text-gray-800 font-medium">{order?.ownerPhone || '暂无电话信息'}</div>
              </div>
            </div>

            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">救援类型</div>
                <div className="text-gray-800 font-medium">{RESCUE_TYPE_MAP[order?.rescueType] || '未知类型'}</div>
              </div>
            </div>

            <div className="flex items-start">
              <Car className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">车辆型号</div>
                <div className="text-gray-800 font-medium">{order?.carModel || '未填写'}</div>
              </div>
            </div>

            <div className="flex items-start">
              <FileText className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">故障描述</div>
                <div className="text-gray-800 font-medium">{order?.faultDesc || '未填写'}</div>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">下单时间</div>
                <div className="text-gray-800 font-medium">{formatTime(order?.createTime)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 虚拟号码信息卡片 - 使用 ErrorBoundary 包裹 */}
        <ErrorBoundaryWrapper onReset={resetCallLogs}>
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
        </ErrorBoundaryWrapper>

        {/* 通话记录卡片 - 使用 ErrorBoundary 包裹 */}
        <ErrorBoundaryWrapper onReset={resetCallLogs}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                通话记录
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  共 {totalPages * 10} 条记录
                </span>
                <Button onClick={handleExportExcel} variant="outline" size="sm" className="flex items-center space-x-1">
                  <Download className="w-4 h-4" />
                  <span>导出Excel</span>
                </Button>
                <button onClick={() => setShowFilter(!showFilter)} className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>筛选</span>
                </button>
              </div>
            </div>

            {/* 筛选组件 */}
            {showFilter && <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">筛选条件</h3>
                <div className="space-y-3">
                  {/* 通话状态筛选 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">通话状态</label>
                    <select value={filterCondition.callStatus} onChange={e => setFilterCondition({
                  ...filterCondition,
                  callStatus: e.target.value
                })} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">全部通话状态</option>
                      <option value="success">通话成功</option>
                      <option value="failed">通话失败</option>
                      <option value="missed">未接听</option>
                      <option value="busy">被叫占线</option>
                    </select>
                  </div>
                  
                  {/* 时间范围筛选 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">时间范围</label>
                    <div className="flex items-center space-x-2">
                      <input type="datetime-local" value={filterCondition.startTime} onChange={e => setFilterCondition({
                    ...filterCondition,
                    startTime: e.target.value
                  })} className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="text-gray-500">至</span>
                      <input type="datetime-local" value={filterCondition.endTime} onChange={e => setFilterCondition({
                    ...filterCondition,
                    endTime: e.target.value
                  })} className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex space-x-2">
                    <button onClick={handleFilterSubmit} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      筛选
                    </button>
                    <button onClick={handleFilterReset} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm hover:bg-gray-300 transition-colors">
                      重置
                    </button>
                  </div>
                </div>
              </div>}

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
        </ErrorBoundaryWrapper>
      </div>
    </div>;
}