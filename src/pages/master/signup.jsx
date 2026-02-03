// @ts-ignore;
import React from 'react';

import MasterQualificationModal from '@/components/MasterQualificationModal';
export default function Signup({
  $w
}) {
  return <div className="p-4">
      <h1 className="text-xl font-bold mb-4">师傅入驻页</h1>
      <p className="mb-4">请确认您的资质并签署入驻协议。</p>
      <MasterQualificationModal $w={$w} />
    </div>;
}