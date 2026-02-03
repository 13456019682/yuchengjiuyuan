// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { useToast, Dialog, DialogContent, DialogHeader, DialogTitle, Checkbox, Button } from '@/components/ui';

export default function AgreementModal({
  $w
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const {
    toast
  } = useToast();
  const handleConfirm = async () => {
    try {
      await $w.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userId: $w.auth.currentUser.userId,
          has_signed_owner_agreement: true
        }
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  return <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" disableClose>
        <DialogHeader>
          <DialogTitle>《车主服务协议》</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Checkbox id="agreement" checked={isChecked} onCheckedChange={() => setIsChecked(!isChecked)} />
          <label htmlFor="agreement" className="text-sm font-medium leading-none">
            我已仔细阅读并同意《车主服务协议》的所有条款，知晓相关风险
          </label>
        </div>
        <Button type="button" onClick={handleConfirm} disabled={!isChecked} className="w-full">
          确认同意
        </Button>
      </DialogContent>
    </Dialog>;
}