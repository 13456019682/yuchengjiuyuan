// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast } from '@/components/ui';

export default function PriceTest(props) {
  const {
    toast
  } = useToast();
  const [testData, setTestData] = useState({
    businessTypes: ['补胎'],
    distance: 8,
    isNight: false,
    serviceTime: new Date().toISOString()
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const testCalculatePrice = async () => {
    setLoading(true);
    try {
      const res = await props.$w.cloud.callFunction({
        name: 'calculate_price',
        data: testData
      });
      if (res.result) {
        setResult(res.result);
        toast({
          title: '测试成功',
          description: '计价云函数调用成功',
          variant: 'default'
        });
      } else {
        toast({
          title: '测试失败',
          description: res.errMsg || '未知错误',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '测试异常',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>计价功能测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">救援类型</label>
              <select className="w-full p-2 border rounded" value={testData.businessTypes[0]} onChange={e => setTestData({
              ...testData,
              businessTypes: [e.target.value]
            })}>
                <option value="补胎">补胎</option>
                <option value="换胎">换胎</option>
                <option value="搭电">搭电</option>
                <option value="拖车">拖车</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">距离(公里)</label>
              <input type="number" className="w-full p-2 border rounded" value={testData.distance} onChange={e => setTestData({
              ...testData,
              distance: parseFloat(e.target.value)
            })} />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={testData.isNight} onChange={e => setTestData({
            ...testData,
            isNight: e.target.checked
          })} />
            <span className="text-sm">夜间服务</span>
          </div>

          <Button onClick={testCalculatePrice} disabled={loading}>
            {loading ? '测试中...' : '测试计价功能'}
          </Button>

          {result && <div className="bg-green-50 border border-green-200 rounded p-4">
              <h4 className="font-medium text-green-900 mb-2">测试结果</h4>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>}
        </CardContent>
      </Card>
    </div>;
}