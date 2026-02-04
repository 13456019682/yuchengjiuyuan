// @ts-ignore;
import React from 'react';

export default function TestErrorComponent() {
  // 故意抛出错误：访问不存在的属性
  const nullObj = null;
  return <div>
      {/* 访问null对象的无效属性，触发渲染错误 */}
      {nullObj.invalidProperty}
    </div>;
}