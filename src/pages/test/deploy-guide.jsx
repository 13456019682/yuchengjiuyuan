// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Button, Card, useToast } from '@/components/ui';
// @ts-ignore;
import { CheckCircle, XCircle, AlertCircle, ChevronRight, Copy, Check } from 'lucide-react';

export default function DeployGuide(props) {
  const {
    toast
  } = useToast();
  const [copiedItems, setCopiedItems] = useState({});
  const cloudFunctions = [{
    name: 'get_pending_orders',
    description: '获取待接单订单列表',
    dependencies: ['wx-server-sdk'],
    priority: 'high'
  }, {
    name: 'update_order_status',
    description: '更新订单状态（接单/完成/取消）',
    dependencies: ['wx-server-sdk'],
    priority: 'high'
  }, {
    name: 'get_call_logs',
    description: '获取通话记录列表',
    dependencies: ['wx-server-sdk'],
    priority: 'medium'
  }, {
    name: 'export_call_log_excel',
    description: '导出通话记录为Excel',
    dependencies: ['wx-server-sdk', 'xlsx'],
    priority: 'medium'
  }];
  const deploySteps = [{
    step: 1,
    title: '打开云开发控制台',
    description: '在微信开发者工具中，点击「云开发」按钮，进入云开发控制台',
    icon: '🌐'
  }, {
    step: 2,
    title: '进入云函数管理',
    description: '在左侧导航栏中，点击「云函数」进入云函数管理页面',
    icon: '⚙️'
  }, {
    step: 3,
    title: '部署云函数',
    description: '对每个云函数执行以下操作：\n1. 右键云函数目录\n2. 选择「上传并部署：云端安装依赖」\n3. 等待部署完成',
    icon: '📤'
  }, {
    step: 4,
    title: '验证部署',
    description: '部署完成后，在云函数列表中查看函数状态，确保状态为「正常」',
    icon: '✅'
  }, {
    step: 5,
    title: '测试云函数',
    description: '点击「测试」按钮，使用测试用例验证云函数是否正常工作',
    icon: '🧪'
  }];
  const testCases = [{
    functionName: 'get_pending_orders',
    name: '查询待接单订单',
    params: {
      page: 1,
      pageSize: 10
    },
    expected: '返回待接单订单列表'
  }, {
    functionName: 'update_order_status',
    name: '订单接单操作',
    params: {
      orderId: 'test_order_001',
      targetStatus: 'rescueing'
    },
    expected: '订单状态更新为已接单'
  }, {
    functionName: 'update_order_status',
    name: '订单完成操作',
    params: {
      orderId: 'test_order_002',
      targetStatus: 'completed'
    },
    expected: '订单状态更新为已完成'
  }, {
    functionName: 'get_call_logs',
    name: '查询通话记录',
    params: {
      limit: 10
    },
    expected: '返回通话记录列表'
  }, {
    functionName: 'export_call_log_excel',
    name: '导出Excel文件',
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
    expected: '返回Excel下载链接'
  }];
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItems({
        ...copiedItems,
        [id]: true
      });
      toast({
        title: '复制成功',
        description: '内容已复制到剪贴板',
        variant: 'default'
      });
      setTimeout(() => {
        setCopiedItems({
          ...copiedItems,
          [id]: false
        });
      }, 2000);
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">云函数部署指南</h1>
          <p className="text-slate-600">按照以下步骤部署所有云函数，确保核心功能正常工作</p>
        </div>

        {/* 错误提示卡片 */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 mr-3 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">当前问题：云函数未部署</h3>
              <p className="text-red-700 mb-2">所有测试用例都返回 <code className="bg-red-100 px-2 py-1 rounded">FUNCTION_NOT_FOUND</code> 错误，这是因为云函数还没有部署到云端。</p>
              <p className="text-red-700">请按照以下步骤部署所有云函数，然后重新运行验证测试。</p>
            </div>
          </div>
        </Card>

        {/* 云函数列表 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">需要部署的云函数</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cloudFunctions.map((func, index) => <Card key={index} className={`p-6 ${func.priority === 'high' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-slate-300'}`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-800">{func.name}</h3>
                  {func.priority === 'high' && <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">高优先级</span>}
                </div>
                <p className="text-slate-600 mb-4">{func.description}</p>
                <div className="flex flex-wrap gap-2">
                  {func.dependencies.map((dep, i) => <span key={i} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                      {dep}
                    </span>)}
                </div>
              </Card>)}
          </div>
        </div>

        {/* 部署步骤 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">部署步骤</h2>
          <div className="space-y-4">
            {deploySteps.map((step, index) => <Card key={index} className="p-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold mr-4 flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">步骤 {step.step}：{step.title}</h3>
                    <p className="text-slate-600 whitespace-pre-line">{step.description}</p>
                  </div>
                </div>
              </Card>)}
          </div>
        </div>

        {/* 测试用例 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">测试用例</h2>
          <div className="space-y-4">
            {testCases.map((testCase, index) => <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-800">{testCase.name}</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                    {testCase.functionName}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">测试参数：</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(testCase.params, null, 2), `params-${index}`)} className="h-8 px-2">
                      {copiedItems[`params-${index}`] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(testCase.params, null, 2)}
                  </pre>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                  <span>预期结果：{testCase.expected}</span>
                </div>
              </Card>)}
          </div>
        </div>

        {/* 注意事项 */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            注意事项
          </h3>
          <ul className="space-y-2 text-amber-900">
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              <span>部署云函数时，必须选择「上传并部署：云端安装依赖」，否则依赖包无法安装</span>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              <span>export_call_log_excel 云函数需要安装 xlsx 依赖，部署时间可能较长（约1-2分钟）</span>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              <span>部署完成后，建议先在控制台测试云函数，确保功能正常后再进行前端验证</span>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              <span>如果部署失败，请检查云函数代码语法和依赖配置，查看错误日志定位问题</span>
            </li>
          </ul>
        </Card>

        {/* 快速操作按钮 */}
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => {
          if (props.$w && props.$w.utils && props.$w.utils.navigateTo) {
            props.$w.utils.navigateTo({
              pageId: 'test/validation',
              params: {}
            });
          } else {
            toast({
              title: '导航失败',
              description: '页面跳转功能不可用',
              variant: 'destructive'
            });
          }
        }} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30">
            <CheckCircle className="w-4 h-4 mr-2" />
            返回验证测试
          </Button>
          <Button onClick={() => {
          if (props.$w && props.$w.utils && props.$w.utils.navigateTo) {
            props.$w.utils.navigateTo({
              pageId: 'test/validation-report',
              params: {}
            });
          } else {
            toast({
              title: '导航失败',
              description: '页面跳转功能不可用',
              variant: 'destructive'
            });
          }
        }} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
            查看验证报告
          </Button>
        </div>
      </div>
    </div>;
}