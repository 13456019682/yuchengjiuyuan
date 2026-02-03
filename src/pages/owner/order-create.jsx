// @ts-ignore;
import React from 'react';

import AgreementModal from '@/components/AgreementModal';
export default function OrderCreate(props) {
  return <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">车主下单页</h1>
      <p className="text-gray-600 mb-6">请填写订单信息并提交</p>
      
      {/* 集成协议弹窗组件 */}
      <AgreementModal $w={props.$w} />
      
      {/* 页面其他内容 */}
      <div className="bg-white p-4 rounded shadow">
        <p>订单表单区域（待开发）</p>
      </div>
    </div>;
}