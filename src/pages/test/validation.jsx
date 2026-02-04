// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { useToast, Button, Card } from '@/components/ui';
// @ts-ignore;
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function Validation(props) {
  const {
    toast
  } = useToast();
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  // 测试用例配置
  const testCases = [{
    name: '师傅端待接单页面',
    description: '测试 get_pending_orders 云函数',
    functionName: 'get_pending_orders',
    params: {},
    expectedSuccess: true
  }, {
    name: '订单状态更新（接单）',
    description: '测试 update_order_status 云函数 - 接单操作',
    functionName: 'update_order_status',
    params: {
      orderId: 'order_001',
      targetStatus: 'rescueing'
    },
    expectedSuccess: true
  }, {
    name: '订单状态更新（完成）',
    description: '测试 update_order_status 云函数 - 完成操作',
    functionName: 'update_order_status',
    params: {
      orderId: 'order_002',
      targetStatus: 'completed'
    },
    expectedSuccess: true
  }, {
    name: '通话记录查询',
    description: '测试 get_call_logs 云函数',
    functionName: 'get_call_logs',
    params: {
      limit: 10
    },
    expectedSuccess: true
  }, {
    name: 'Excel导出功能',
    description: '测试 export_call_log_excel 云函数',
    functionName: 'export_call_log_excel',
    params: {
      data: [{
        call_id: 'test_001',
        order_id: 'order_001',
        virtual_phone: '13800138000',
        call_status: 'success',
        call_start_time: '2025-09-01 10:00:00',
        call_end_time: '2025-09-01 10:05:00',
        call_duration: 300
      }],
      header: [{
        key: 'call_id',
        title: '通话ID'
      }, {
        key: 'order_id',
        title: '订单ID'
      }],
      fileName: '测试导出'
    },
    expectedSuccess: true
  }];

  // 执行单个测试
  const runTest = async testCase => {
    try {
      const res = await props.$w.cloud.callFunction({
        name: testCase.functionName,
        data: testCase.params
      });
      const success = res.result && res.result.success;
      const message = success ? '测试通过' : res.result?.msg || '测试失败';
      return {
        ...testCase,
        status: success ? 'success' : 'failed',
        message,
        response: res.result
      };
    } catch (err) {
      return {
        ...testCase,
        status: 'error',
        message: err.message || '网络异常',
        response: null
      };
    }
  };

  // 执行所有测试
  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);
    const results = [];
    for (const testCase of testCases) {
      const result = await runTest(testCase);
      results.push(result);
      setTestResults([...results]);

      // 延迟1秒，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setTesting(false);

    // 显示测试结果汇总
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status !== 'success').length;
    toast({
      title: '测试完成',
      description: `成功：${successCount}，失败：${failedCount}`,
      variant: failedCount === 0 ? 'default' : 'destructive'
    });
  };

  // 清空测试结果
  const clearResults = () => {
    setTestResults([]);
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            功能验证测试
          </h1>
          <p className="text-slate-600">
            验证师傅端和管理端的核心功能是否正常工作
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 mb-8">
          <Button onClick={runAllTests} disabled={testing} className="bg-blue-600 hover:bg-blue-700">
            {testing ? <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                测试中...
              </> : <>
                <CheckCircle className="w-4 h-4 mr-2" />
                开始测试
              </>}
          </Button>
          <Button onClick={clearResults} variant="outline" disabled={testing}>
            清空结果
          </Button>
        </div>

        {/* 测试结果列表 */}
        {testResults.length > 0 && <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              测试结果
            </h2>
            {testResults.map((result, index) => <Card key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {result.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                      {result.status === 'error' && <AlertCircle className="w-5 h-5 text-orange-600" />}
                      <h3 className="text-lg font-semibold text-slate-800">
                        {result.name}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      {result.description}
                    </p>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        测试结果：
                      </p>
                      <p className={`text-sm ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>)}
          </div>}

        {/* 测试说明 */}
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            测试说明
          </h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>• 师傅端待接单页面：测试 get_pending_orders 云函数是否正常返回待接单订单</p>
            <p>• 订单状态更新（接单）：测试 update_order_status 云函数的接单操作</p>
            <p>• 订单状态更新（完成）：测试 update_order_status 云函数的完成操作</p>
            <p>• 通话记录查询：测试 get_call_logs 云函数是否正常返回通话记录</p>
            <p>• Excel导出功能：测试 export_call_log_excel 云函数是否正常生成Excel文件</p>
          </div>
        </Card>
      </div>
    </div>;
}