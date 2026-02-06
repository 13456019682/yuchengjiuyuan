// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button, Card } from '@/components/ui';
// @ts-ignore;
import { Download, Filter, Calendar, FileText, AlertCircle } from 'lucide-react';

export default function ExportCallLogs(props) {
  const {
    toast
  } = useToast();
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [filterCondition, setFilterCondition] = useState({
    startTime: '',
    endTime: '',
    orderId: ''
  });
  const fetchCallLogs = async () => {
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

      // 使用数据库直接操作替代云函数调用
      const tcb = await props.$w.cloud.getCloudInstance();
      const dbPromise = (async () => {
        // 构建查询条件
        const whereCondition = {};
        if (filterCondition.startTime) {
          whereCondition.call_start_time = tcb.database().command.gte(filterCondition.startTime);
        }
        if (filterCondition.endTime) {
          if (whereCondition.call_start_time) {
            whereCondition.call_start_time = tcb.database().command.and(whereCondition.call_start_time, tcb.database().command.lte(filterCondition.endTime));
          } else {
            whereCondition.call_start_time = tcb.database().command.lte(filterCondition.endTime);
          }
        }
        if (filterCondition.orderId) {
          whereCondition.order_id = filterCondition.orderId;
        }

        // 查询通话记录
        const result = await tcb.database().collection('call_logs').where(whereCondition).orderBy('call_start_time', 'desc').limit(1000).get();
        return {
          isSuccess: true,
          data: result.data || [],
          total: result.data.length
        };
      })();

      // 竞速处理：超时或正常返回
      const res = await Promise.race([dbPromise, timeoutPromise]);
      if (res.isSuccess) {
        setCallLogs(res.data || []);
      } else {
        toast({
          title: '获取失败',
          description: res.msg || '请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('获取通话记录失败：', err);

      // 统一错误处理
      let errorTitle = '获取失败';
      let errorMessage = '网络异常，请重试';
      if (err.message.includes('timeout')) {
        errorMessage = '请求超时，请重试';
      } else if (err.message.includes('网络连接异常')) {
        errorMessage = '网络连接异常，请检查网络设置';
      } else if (err.message.includes('COLLECTION_NOT_EXIST')) {
        errorTitle = '数据异常';
        errorMessage = '通话记录表不存在，请联系管理员';
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
      setExporting(true);
      const header = [{
        key: 'call_id',
        title: '通话ID'
      }, {
        key: 'order_id',
        title: '订单ID'
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

      // 前端Excel导出实现
      const exportToExcel = (data, headers, fileName) => {
        // 创建CSV格式的数据
        const csvHeaders = headers.map(h => h.title).join(',');
        const csvRows = data.map(item => {
          return headers.map(header => {
            let value = item[header.key] || '';
            // 处理特殊字符
            if (typeof value === 'string') {
              value = value.replace(/"/g, '""');
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value}"`;
              }
            }
            return value;
          }).join(',');
        });
        const csvContent = [csvHeaders, ...csvRows].join('\n');

        // 创建Blob并下载
        const blob = new Blob(['\uFEFF' + csvContent], {
          type: 'text/csv;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return {
          isSuccess: true,
          downloadUrl: url,
          fileID: `file_${Date.now()}`
        };
      };
      const result = exportToExcel(callLogs, header, `通话记录_${new Date().getTime()}`);
      if (result.isSuccess) {
        toast({
          title: '导出成功',
          description: 'CSV文件已生成并开始下载',
          variant: 'default'
        });
        const historyItem = {
          id: result.fileID,
          fileName: `通话记录_${new Date().getTime()}.csv`,
          downloadUrl: result.downloadUrl,
          exportTime: new Date().toISOString(),
          recordCount: callLogs.length
        };
        setExportHistory([historyItem, ...exportHistory]);
        if (typeof window !== 'undefined' && window.confirm) {
          const confirmed = window.confirm(`CSV文件下载链接：\n${result.downloadUrl}\n\n点击确定复制链接到剪贴板`);
          if (confirmed && navigator.clipboard) {
            navigator.clipboard.writeText(result.downloadUrl).then(() => {
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
        throw new Error('导出失败');
      }
    } catch (err) {
      console.error('导出Excel失败：', err);
      toast({
        title: '导出失败',
        description: err.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };
  const handleCopyLink = url => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
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
  };
  const handleOpenLink = url => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };
  const handleFilterReset = () => {
    setFilterCondition({
      startTime: '',
      endTime: '',
      orderId: ''
    });
  };
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
  const getCallStatusStyle = status => {
    switch (status) {
      case 'success':
        return 'bg-emerald-100 text-emerald-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'missed':
        return 'bg-amber-100 text-amber-700';
      case 'busy':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  const getCallStatusText = status => {
    switch (status) {
      case 'success':
        return '成功';
      case 'failed':
        return '失败';
      case 'missed':
        return '未接';
      case 'busy':
        return '忙线';
      default:
        return status || '未知';
    }
  };
  useEffect(() => {
    fetchCallLogs();
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">通话记录导出</h1>
          <p className="text-slate-600">筛选并导出通话记录为Excel文件</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              筛选条件
            </h2>
            <Button onClick={handleFilterReset} variant="outline" size="sm">
              重置筛选
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                开始时间
              </label>
              <input type="datetime-local" value={filterCondition.startTime} onChange={e => setFilterCondition({
              ...filterCondition,
              startTime: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                结束时间
              </label>
              <input type="datetime-local" value={filterCondition.endTime} onChange={e => setFilterCondition({
              ...filterCondition,
              endTime: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                订单ID
              </label>
              <input type="text" placeholder="输入订单ID" value={filterCondition.orderId} onChange={e => setFilterCondition({
              ...filterCondition,
              orderId: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={fetchCallLogs} disabled={loading} variant="outline" className="flex-1">
              {loading ? '查询中...' : '查询记录'}
            </Button>
            <Button onClick={handleExportExcel} disabled={exporting || callLogs.length === 0} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              {exporting ? '导出中...' : '导出Excel'}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-3xl font-bold mb-1">{callLogs.length}</div>
            <div className="text-sm opacity-90">通话记录数</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="text-3xl font-bold mb-1">{exportHistory.length}</div>
            <div className="text-sm opacity-90">导出历史</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="text-3xl font-bold mb-1">{loading ? '...' : '✓'}</div>
            <div className="text-sm opacity-90">系统状态</div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              通话记录
            </h2>
            <span className="text-sm text-slate-500">
              共 {callLogs.length} 条记录
            </span>
          </div>

          {callLogs.length === 0 ? <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无通话记录</h3>
              <p className="text-slate-500">请调整筛选条件或稍后再试</p>
            </div> : <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">通话ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">订单ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">虚拟号码</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">开始时间</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">时长(秒)</th>
                  </tr>
                </thead>
                <tbody>
                  {callLogs.map((log, index) => <tr key={log.call_id || index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-800">{log.call_id || '--'}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{log.order_id || '--'}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{log.virtual_phone || '--'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCallStatusStyle(log.call_status)}`}>
                          {getCallStatusText(log.call_status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800">{formatTime(log.call_start_time)}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{log.call_duration || 0}</td>
                    </tr>)}
                </tbody>
              </table>
            </div>}
        </Card>

        {exportHistory.length > 0 && <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                导出历史
              </h2>
            </div>

            <div className="space-y-3">
              {exportHistory.map((item, index) => <div key={item.id || index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800 mb-1">{item.fileName}</div>
                    <div className="text-xs text-slate-500">
                      导出时间: {formatTime(item.exportTime)} | 记录数: {item.recordCount}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleCopyLink(item.downloadUrl)} variant="outline" size="sm">
                      复制链接
                    </Button>
                    <Button onClick={() => handleOpenLink(item.downloadUrl)} size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                      <Download className="w-4 h-4 mr-1" />
                      下载
                    </Button>
                  </div>
                </div>)}
            </div>
          </Card>}
      </div>
    </div>;
}