// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';

export default function MasterQualificationModal({
  $w
}) {
  const [qualificationConfirmed, setQualificationConfirmed] = useState(false);
  const [healthConfirmed, setHealthConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    // 查询用户是否已签署协议
    const fetchUserInfo = async () => {
      try {
        const result = await $w.cloud.callFunction({
          name: 'getUserInfo',
          data: {
            userId: $w.auth.currentUser.userId
          }
        });
        if (result.data) {
          setQualificationConfirmed(result.data.qualification_confirmed || false);
          setHealthConfirmed(result.data.health_confirmed || false);
        }
      } catch (error) {
        console.error('查询用户信息失败:', error);
      }
    };
    fetchUserInfo();
  }, [$w]);
  const handleSignAgreement = async () => {
    setIsLoading(true);
    try {
      await $w.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userId: $w.auth.currentUser.userId,
          qualification_confirmed: true,
          health_confirmed: true
        }
      });
      // 跳转腾讯电子签（占位逻辑）
      console.log('跳转腾讯电子签');
    } catch (error) {
      console.error('更新失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="space-y-4">
      <sc-checkbox label="我具备合法道路救援维修资质，自愿承担相关服务风险" checked={qualificationConfirmed} onChange={() => setQualificationConfirmed(!qualificationConfirmed)} />
      <sc-checkbox label="我身体健康，无突发心脑血管等疾病，自愿承担接单相关风险" checked={healthConfirmed} onChange={() => setHealthConfirmed(!healthConfirmed)} />
      <sc-button type="primary" disabled={!qualificationConfirmed || !healthConfirmed || isLoading} onClick={handleSignAgreement}>
        签署入驻协议
      </sc-button>
    </div>;
}