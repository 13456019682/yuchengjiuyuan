interface CreateCallLogEvent {
  order_id: string;
  virtual_phone: string;
  caller_id: string;
  callee_id: string;
  call_status: 'success' | 'failed' | 'missed' | 'busy';
}

interface CreateCallLogResponse {
  success: boolean;
  code: number;
  msg: string;
  data?: {
    _id: string;
    call_id: string;
    order_id: string;
  };
  error?: string;
}

export declare function main(event: CreateCallLogEvent, context: any): Promise<CreateCallLogResponse>;