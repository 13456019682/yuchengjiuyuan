// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button, Card, Badge, Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
// @ts-ignore;
import { User, Settings, Shield, Bell, HelpCircle, LogOut, Edit, Car, Clock, CheckCircle, XCircle, Star, CreditCard, MapPin, Phone, Plus } from 'lucide-react';

export default function OwnerProfile(props) {
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    active: 0,
    completed: 0,
    total: 0
  });

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const currentUserId = props.$w.auth.currentUser?.userId || '';
      if (!currentUserId) {
        throw new Error('用户信息获取失败');
      }

      // 获取用户基本信息
      const tcb = await props.$w.cloud.getCloudInstance();
      const userResult = await tcb.database().collection('user_info').where({
        user_id: currentUserId
      }).get();

      // 获取订单统计
      const orderResult = await tcb.database().collection('order_info').where({
        car_owner_id: currentUserId
      }).get();
      const orders = orderResult.data || [];
      const stats = {
        pending: orders.filter(order => order.order_status === '待接单').length,
        active: orders.filter(order => order.order_status === '已接单').length,
        completed: orders.filter(order => order.order_status === '已完成').length,
        total: orders.length
      };
      setUserInfo(userResult.data?.[0] || {});
      setOrderStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      toast({
        title: '获取失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  // 编辑个人信息
  const handleEditProfile = () => {
    toast({
      title: '功能开发中',
      description: '个人信息编辑功能即将上线',
      variant: 'default'
    });
  };

  // 退出登录
  const handleLogout = () => {
    toast({
      title: '退出登录',
      description: '您已成功退出账号',
      variant: 'default'
    });
    // 实际项目中这里应该调用退出登录接口
    setTimeout(() => {
      props.$w.utils.redirectTo({
        pageId: 'home',
        params: {}
      });
    }, 1500);
  };
  useEffect(() => {
    fetchUserInfo();
  }, []);
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>;
  }
  const currentUser = props.$w.auth.currentUser;
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 p-6 font-['Garamond']">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#2C3E50] font-['Georgia'] mb-2">个人中心</h1>
          <p className="text-[#2D3436] opacity-70 font-['Trebuchet_MS']">管理您的账户信息和救援服务记录</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧个人信息区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 个人信息卡片 */}
            <Card className="p-8 bg-gradient-to-br from-white to-slate-50 border-2 border-[#D4AF37]/20 shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20 border-4 border-[#D4AF37] shadow-lg">
                    <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name} />
                    <AvatarFallback className="bg-[#D4AF37] text-white text-2xl font-bold">
                      {currentUser?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-[#2C3E50] font-['Georgia']">
                      {currentUser?.name || '车主用户'}
                    </h2>
                    <p className="text-[#2D3436] opacity-70 flex items-center mt-1">
                      <User className="w-4 h-4 mr-2" />
                      车主账户
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="bg-[#D4AF37] text-white">
                        已验证
                      </Badge>
                      <span className="text-sm text-[#2D3436] opacity-60">
                        注册时间: 2026年2月
                      </span>
                    </div>
                  </div>
                </div>
                <Button onClick={handleEditProfile} className="bg-[#2C3E50] hover:bg-[#1A252F] text-white border-0">
                  <Edit className="w-4 h-4 mr-2" />
                  编辑资料
                </Button>
              </div>

              {/* 联系信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                  <Phone className="w-5 h-5 text-[#D4AF37] mr-3" />
                  <div>
                    <p className="text-sm text-[#2D3436] opacity-70">联系电话</p>
                    <p className="font-medium text-[#2C3E50]">138****8888</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#D4AF37] mr-3" />
                  <div>
                    <p className="text-sm text-[#2D3436] opacity-70">常用地址</p>
                    <p className="font-medium text-[#2C3E50]">北京市朝阳区</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 订单统计卡片 */}
            <Card className="p-6 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100 shadow-lg">
              <h3 className="text-xl font-bold text-[#2C3E50] font-['Georgia'] mb-4 flex items-center">
                <Car className="w-6 h-6 mr-2 text-[#D4AF37]" />
                救援服务统计
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                  <div className="text-3xl font-bold text-[#C44536] mb-1">{orderStats.pending}</div>
                  <div className="text-sm text-[#2D3436] opacity-70">待处理</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                  <div className="text-3xl font-bold text-[#D4AF37] mb-1">{orderStats.active}</div>
                  <div className="text-sm text-[#2D3436] opacity-70">进行中</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                  <div className="text-3xl font-bold text-[#2C3E50] mb-1">{orderStats.completed}</div>
                  <div className="text-sm text-[#2D3436] opacity-70">已完成</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                  <div className="text-3xl font-bold text-[#2D3436] mb-1">{orderStats.total}</div>
                  <div className="text-sm text-[#2D3436] opacity-70">总订单</div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <Button onClick={() => props.$w.utils.navigateTo({
                pageId: 'order-list',
                params: {}
              })} variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
                  查看全部订单
                </Button>
                <Button onClick={() => props.$w.utils.navigateTo({
                pageId: 'order-create',
                params: {}
              })} className="bg-[#C44536] hover:bg-[#A33224] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  发起救援
                </Button>
              </div>
            </Card>
          </div>

          {/* 右侧功能区域 */}
          <div className="space-y-6">
            {/* 快捷功能 */}
            <Card className="p-6 bg-gradient-to-br from-white to-amber-50 border-2 border-amber-100 shadow-lg">
              <h3 className="text-xl font-bold text-[#2C3E50] font-['Georgia'] mb-4">快捷功能</h3>
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-start h-12 text-[#2D3436] hover:bg-amber-100" onClick={() => props.$w.utils.navigateTo({
                pageId: 'order-create',
                params: {}
              })}>
                  <Plus className="w-5 h-5 mr-3 text-[#D4AF37]" />
                  发起救援服务
                </Button>
                <Button variant="ghost" className="w-full justify-start h-12 text-[#2D3436] hover:bg-amber-100" onClick={() => props.$w.utils.navigateTo({
                pageId: 'order-list',
                params: {}
              })}>
                  <Clock className="w-5 h-5 mr-3 text-[#D4AF37]" />
                  查看历史订单
                </Button>
                <Button variant="ghost" className="w-full justify-start h-12 text-[#2D3436] hover:bg-amber-100" onClick={() => toast({
                title: '功能开发中',
                description: '服务评价功能即将上线',
                variant: 'default'
              })}>
                  <Star className="w-5 h-5 mr-3 text-[#D4AF37]" />
                  服务评价记录
                </Button>
                <Button variant="ghost" className="w-full justify-start h-12 text-[#2D3436] hover:bg-amber-100" onClick={() => toast({
                title: '功能开发中',
                description: '支付记录功能即将上线',
                variant: 'default'
              })}>
                  <CreditCard className="w-5 h-5 mr-3 text-[#D4AF37]" />
                  支付记录查询
                </Button>
              </div>
            </Card>

            {/* 账户设置 */}
            <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border-2 border-slate-100 shadow-lg">
              <h3 className="text-xl font-bold text-[#2C3E50] font-['Georgia'] mb-4">账户设置</h3>
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-start h-12 text-[#2D3436] hover:bg-slate-100" onClick={() => toast({
                title: '功能开发中',
                description: '通知设置功能即将上线',
                variant: 'default'
              })}>
                  <Bell className="w-5 h-5 mr-3 text-[#2C3E50]" />
                  通知设置
                </Button>
                <Button variant="ghost" className="w-full justify-start h-12 text-[#2D3436] hover:bg-slate-100" onClick={() => toast({
                title: '功能开发中',
                description: '隐私设置功能即将上线',
                variant: 'default'
              })}>
                  <Shield className="w-5 h-5 mr-3 text-[#2C3E50]" />
                  隐私与安全
                </Button>
                <Button variant="ghost" className="w-full justify-start h-12 text-[#2D3436] hover:bg-slate-100" onClick={() => toast({
                title: '功能开发中',
                description: '帮助中心功能即将上线',
                variant: 'default'
              })}>
                  <HelpCircle className="w-5 h-5 mr-3 text-[#2C3E50]" />
                  帮助中心
                </Button>
                <Button variant="ghost" className="w-full justify-start h-12 text-[#2D3436] hover:bg-slate-100 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="w-5 h-5 mr-3" />
                  退出登录
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* 底部服务信息 */}
        <div className="mt-8 text-center text-[#2D3436] opacity-50 text-sm font-['Trebuchet_MS']">
          <p>24小时汽车救援服务 • 专业技师团队 • 快速响应机制</p>
          <p className="mt-1">客服热线: 400-123-4567</p>
        </div>
      </div>
    </div>;
}