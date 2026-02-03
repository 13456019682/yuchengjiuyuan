// @ts-ignore;
import React from 'react';

export default function OwnerOrderDetail(props) {
  return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-gray-800">车主 - 订单详情</h1>
      <p className="mt-4 text-gray-600">订单编号：{props.$w.page.dataset.params.orderId}</p>
    </div>;
}