// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Button, Card, useToast } from '@/components/ui';
// @ts-ignore;
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function DeployVerification(props) {
  const {
    toast
  } = useToast();
  const [deploymentStatus, setDeploymentStatus] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);
  const cloudFunctions = [{
    name: 'get_pending_orders',
    description: '获取待接单订单列表',
    priority: 'high'
  }, {
    name: 'update_order_status',
    description: '更新订单状态',
    priority: 'high'
  }, {
    name: 'create_call_log',
    description: '创建通话记录',
    priority: 'high'
  }, {
    name: 'get_call_logs',
    description: '获取通话记录',
    priority: 'medium'
  }, {
    name: 'export_call_log_excel',
    description: '导出Excel报表',
    priority: 'medium'
  }, {
    name: 'calculate_price',
    description: '自动计价',
    priority: 'medium'
  }, {
    name: 'auto_dispatch',
    description: '阶梯派单',
    priority: 'medium'
  }];
  const verifyDeployment = async () => {
    setIsVerifying(true);
    const newStatus = {};
    for (const func of cloudFunctions) {
      try {
        const res = await props.$w.cloud.callFunction({
          name: func.name,
          data: {
            test: true
          }
        });
        if (res.result && typeof res.result.isSuccess !== 'undefined') {
          newStatus[func.name] = {
            status: 'success',
            message: '部署成功',
            data: res.result
          };
        } else {
          newStatus[func.name] = {
            status: 'error',
            message: '返回格式异常',
            data: res.result
          };
        }
      } catch (error) {
        if (error.message && error.message.includes('FUNCTION_NOT_FOUND')) {
          newStatus[func.name] = {
            status: 'not_deployed',
            message: '云函数未部署',
            error: error.message
          };
        } else {
          newStatus[func.name] = {
            status: 'error',
            message: '调用失败',
            error: error.message
          };
        }
      }
    }
    setDeploymentStatus(newStatus);
    setIsVerifying(false);

    // 显示总结
    const successCount = Object.values(newStatus).filter(s => s.status === 'success').length;
    const totalCount = cloudFunctions.length;
    toast({
      title: '部署验证完成',
      description: `${successCount}/${totalCount} 个云函数部署成功`,
      variant: successCount === totalCount ? 'default' : 'destructive'
    });
  };
  const getStatusIcon = status => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'not_deployed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };
  const getStatusColor = status => {
    switch (status) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50';
      case 'not_deployed':
        return 'border-red-200 bg-red-50';
      case 'error':
        return 'border-amber-200 bg-amber-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  return <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">云函数部署验证</h1>
        <p className="text-slate-600 mb-6">验证所有云函数是否已正确部署并可正常调用</p>
        
        <Button onClick={verifyDeployment} disabled={isVerifying} className="mb-6">
          {isVerifying ? <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              验证中...
            </> : '开始验证'}
        </Button>
      </div>

      <div className="grid gap-4">
        {cloudFunctions.map(func => {
        const status = deploymentStatus[func.name];
        return <Card key={func.name} className={`p-4 ${status ? getStatusColor(status.status) : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {status ? getStatusIcon(status.status) : <div className="w-5 h-5 rounded-full bg-gray-300" />}
                  <div>
                    <h3 className="font-semibold text-slate-800">{func.name}</h3>
                    <p className="text-sm text-slate-600">{func.description}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${func.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {func.priority === 'high' ? '高优先级' : '中优先级'}
                    </span>
                  </div>
                </div>
                
                {status && <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">{status.message}</p>
                    {status.error && <p className="text-xs text-red-600 mt-1">{status.error}</p>}
                  </div>}
              </div>
            </Card>;
      })}
      </div>

      {Object.keys(deploymentStatus).length > 0 && <Card className="p-6 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">部署状态总结</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {Object.values(deploymentStatus).filter(s => s.status === 'success').length}
              </div>
              <div className="text-sm text-slate-600">部署成功</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {Object.values(deploymentStatus).filter(s => s.status === 'not_deployed').length}
              </div>
              <div className="text-sm text-slate-600">未部署</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {Object.values(deploymentStatus).filter(s => s.status === 'error').length}
              </div>
              <div className="text-sm text-slate-600">调用异常</div>
            </div>
          </div>
        </Card>}
    </div>;
}