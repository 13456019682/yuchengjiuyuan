// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { useToast, Button, Card } from '@/components/ui';
// @ts-ignore;
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database } from 'lucide-react';

export default function CloudFunctionTest(props) {
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 测试 get_pending_orders 云函数
  const testGetPendingOrders = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      console.log('开始调用 get_pending_orders 云函数...');
      console.log('参数:', {
        page: 1,
        pageSize: 10
      });
      const res = await props.$w.cloud.callFunction({
        name: 'get_pending_orders',
        data: {
          page: 1,
          pageSize: 10
        }
      });
      console.log('云函数返回结果:', res);
      if (res.result) {
        setResult(res.result);

        // 判断是否成功
        const isSuccess = res.result.isSuccess === true;
        const hasData = res.result.data && Array.isArray(res.result.data) && res.result.data.length > 0;
        if (isSuccess) {
          toast({
            title: '云函数调用成功',
            description: hasData ? `返回了 ${res.result.data.length} 条待接单订单` : '返回成功，但没有待接单订单数据',
            variant: 'default'
          });
        } else {
          setError({
            message: res.result.msg || '云函数返回失败',
            code: res.result.code || 'UNKNOWN_ERROR'
          });
          toast({
            title: '云函数调用失败',
            description: res.result.msg || '未知错误',
            variant: 'destructive'
          });
        }
      } else {
        setError({
          message: '云函数返回结果为空',
          code: 'EMPTY_RESPONSE'
        });
        toast({
          title: '云函数调用失败',
          description: '返回结果为空',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('云函数调用异常:', err);
      setError({
        message: err.message || '网络异常',
        code: err.code || 'NETWORK_ERROR'
      });
      toast({
        title: '云函数调用异常',
        description: err.message || '网络异常，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">云函数测试</h1>
          <p className="text-slate-600">测试 get_pending_orders 云函数的调用和返回结果</p>
        </div>

        {/* 测试控制卡片 */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Database className="w-6 h-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-800">get_pending_orders</h2>
                <p className="text-sm text-slate-600">查询待接单订单列表</p>
              </div>
            </div>
            <Button onClick={testGetPendingOrders} disabled={loading} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30">
              {loading ? <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  调用中...
                </> : <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  开始测试
                </>}
            </Button>
          </div>

          {/* 测试参数 */}
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">测试参数：</h3>
            <pre className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-200 overflow-x-auto">
            {JSON.stringify({
              page: 1,
              pageSize: 10
            }, null, 2)}
            </pre>
          </div>

          {/* 测试结果 */}
          {result && <div className="space-y-4">
              {/* 成功状态 */}
              <div className="flex items-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle className="w-6 h-6 mr-3 text-emerald-600" />
                <div>
                  <div className="font-semibold text-emerald-800">云函数调用成功</div>
                  <div className="text-sm text-emerald-700">
                    {result.isSuccess === true ? '返回 isSuccess: true' : '返回 isSuccess: false'}
                  </div>
                </div>
              </div>

              {/* 数据检查 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3">数据检查结果：</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    {result.isSuccess === true ? <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" /> : <XCircle className="w-5 h-5 mr-2 text-red-600" />}
                    <span className="text-sm text-slate-700">
                      云函数调用是否成功：<strong className={result.isSuccess === true ? 'text-emerald-600' : 'text-red-600'}>
                        {result.isSuccess === true ? '是' : '否'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center">
                    {result.data && Array.isArray(result.data) && result.data.length > 0 ? <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" /> : <XCircle className="w-5 h-5 mr-2 text-red-600" />}
                    <span className="text-sm text-slate-700">
                      返回结果是否包含待接单订单数据列表：<strong className={result.data && Array.isArray(result.data) && result.data.length > 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {result.data && Array.isArray(result.data) && result.data.length > 0 ? '是' : '否'}
                      </strong>
                    </span>
                  </div>
                  {result.data && Array.isArray(result.data) && <div className="text-sm text-slate-700">
                      订单数量：<strong className="text-blue-600">{result.data.length}</strong> 条
                    </div>}
                </div>
              </div>

              {/* 完整返回结果 */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">完整返回结果：</h3>
                <pre className="text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-200 overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>}

          {/* 错误信息 */}
          {error && <div className="space-y-4">
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-6 h-6 mr-3 text-red-600" />
                <div>
                  <div className="font-semibold text-red-800">云函数调用失败</div>
                  <div className="text-sm text-red-700">{error.message}</div>
                  {error.code && <div className="text-xs text-red-600 mt-1">错误代码：{error.code}</div>}
                </div>
              </div>

              {/* 错误代码说明 */}
              {error.code === 'FUNCTION_NOT_FOUND' && <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 mb-2">解决方案：</h4>
                      <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                        <li>打开微信开发者工具</li>
                        <li>进入云开发控制台</li>
                        <li>点击「云函数」进入云函数管理</li>
                        <li>右键 <code className="bg-amber-100 px-1 rounded">.functions/get_pending_orders</code> 文件夹</li>
                        <li>选择「上传并部署：云端安装依赖」</li>
                        <li>等待部署完成（约30秒）</li>
                        <li>重新运行测试</li>
                      </ol>
                    </div>
                  </div>
                </div>}
            </div>}

          {/* 初始提示 */}
          {!result && !error && !loading && <div className="text-center py-8">
              <Database className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">点击「开始测试」按钮调用云函数</p>
            </div>}
        </Card>

        {/* 返回按钮 */}
        <div className="text-center">
          <Button onClick={() => props.$w.utils.navigateTo({
          pageId: 'test/validation-report',
          params: {}
        })} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
            返回验证报告
          </Button>
        </div>
      </div>
    </div>;
}