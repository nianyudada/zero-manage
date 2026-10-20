import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Settings,
  UserCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  Calendar,
  Users,
  ChevronRight,
  ShieldCheck,
  Check,
  Tag,
  KeyRound,
  RotateCcw,
  Sparkles,
  Zap,
  Cpu,
  BarChart3,
  Factory,
  Radio,
  Sliders,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Card } from '@/app/components/ui/card';
import { EnterpriseItem } from '@/app/data/mockEnterprises';
import {
  ServiceItemConfig,
  ServiceUserItem,
  ServiceRoleItem,
  DEFAULT_SERVICE_ROLES,
  getInitialEnterpriseServices,
} from '@/app/data/mockEnterpriseServices';
import { SCREENSHOT_USERS_DATA } from '@/app/data/mockEnterpriseUsers';
import { toast } from 'sonner';
import EnterpriseUserPage from './EnterpriseUserPage';

interface EnterpriseServicePageProps {
  enterprise: EnterpriseItem;
  returnMode: 'list' | 'map';
  onBack: () => void;
  onServicesUpdate?: (updatedServices: ServiceItemConfig[]) => void;
  onUserCountChange?: (newCount: number) => void;
  initialTab?: 'users' | 'services';
}

export default function EnterpriseServicePage({
  enterprise,
  returnMode,
  onBack,
  onServicesUpdate,
  onUserCountChange,
  initialTab = 'users',
}: EnterpriseServicePageProps) {
  // Master Tab: 第一个tab为"用户管理"，第二个tab为"服务管理"
  const [masterTab, setMasterTab] = useState<'users' | 'services'>(initialTab);
  // Services list for this enterprise
  const [services, setServices] = useState<ServiceItemConfig[]>(() =>
    getInitialEnterpriseServices(enterprise.id)
  );

  // Selected Service (default to "零碳工作台")
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv-zero-carbon');

  // Top sub-tabs: "授权服务" vs "体验服务"
  const [serviceTypeTab, setServiceTypeTab] = useState<'authorized' | 'trial'>('authorized');

  // Lower sub-tabs: "系统用户" vs "系统角色"
  const [lowerTab, setLowerTab] = useState<'users' | 'roles'>('users');

  // Pagination for service users table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search keyword for users
  const [userSearchKeyword, setUserSearchKeyword] = useState('');

  // Dialog states
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false);
  const [isUserRoleModalOpen, setIsUserRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<ServiceUserItem | null>(null);

  // Active selected service object
  const activeService = useMemo(() => {
    return (
      services.find((s) => s.id === selectedServiceId) ||
      services[0] ||
      INITIAL_SERVICES_TEMPLATES[0]
    );
  }, [services, selectedServiceId]);

  // Configuration Form State (for "配置" button)
  const [configFormData, setConfigFormData] = useState({
    version: activeService?.version || '标准版',
    expireMode: activeService?.expireDate === '长期' ? 'forever' : 'custom',
    customExpireDate: activeService?.expireDate === '长期' ? '2028-12-31' : activeService?.expireDate || '2028-12-31',
    userLimitMode: (activeService?.userLimit && activeService.userLimit.includes('无限制')) ? 'unlimited' : 'limit',
    customLimit: (activeService?.userLimit && activeService.userLimit.includes('/')) ? (activeService.userLimit.split('/')[1] || '20') : '20',
    tagMemberCount: activeService?.tagMemberCount || 0,
    status: activeService?.status || 'active',
  });

  // Services for Left Sidebar (show all 9 services matching screenshot)
  const displayedSidebarServices = services;

  // Filtered Users of Active Service
  const filteredServiceUsers = useMemo(() => {
    if (!activeService) return [];
    return activeService.users.filter((u) => {
      if (userSearchKeyword.trim()) {
        const q = userSearchKeyword.trim().toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchCode = u.userCode.toLowerCase().includes(q);
        const matchRole = u.roles.some((r) => r.toLowerCase().includes(q));
        if (!matchName && !matchCode && !matchRole) return false;
      }
      return true;
    });
  }, [activeService, userSearchKeyword]);

  // Paginated Users
  const totalUserRecords = filteredServiceUsers.length;
  const totalUserPages = Math.max(1, Math.ceil(totalUserRecords / pageSize));
  const paginatedServiceUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServiceUsers.slice(start, start + pageSize);
  }, [filteredServiceUsers, currentPage, pageSize]);

  // Open Service Configuration Modal
  const handleOpenConfigModal = () => {
    setConfigFormData({
      version: activeService?.version || '标准版',
      expireMode: activeService?.expireDate === '长期' ? 'forever' : 'custom',
      customExpireDate: activeService?.expireDate === '长期' ? '2028-12-31' : activeService?.expireDate || '2028-12-31',
      userLimitMode: (activeService?.userLimit && activeService.userLimit.includes('无限制')) ? 'unlimited' : 'limit',
      customLimit: (activeService?.userLimit && activeService.userLimit.includes('/')) ? (activeService.userLimit.split('/')[1] || '20') : '20',
      tagMemberCount: activeService?.tagMemberCount || 0,
      status: activeService?.status || 'active',
    });
    setIsConfigModalOpen(true);
  };

  // Save Service Configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const finalExpire =
      configFormData.expireMode === 'forever' ? '长期' : configFormData.customExpireDate;
    const finalUserLimit =
      configFormData.userLimitMode === 'unlimited'
        ? `${activeService.users.length}/无限制`
        : `${activeService.users.length}/${configFormData.customLimit}`;

    const updated = services.map((s) => {
      if (s.id === activeService.id) {
        return {
          ...s,
          version: configFormData.version,
          expireDate: finalExpire,
          userLimit: finalUserLimit,
          tagMemberCount: Number(configFormData.tagMemberCount) || 0,
          status: configFormData.status,
        };
      }
      return s;
    });

    setServices(updated);
    if (onServicesUpdate) onServicesUpdate(updated);
    setIsConfigModalOpen(false);
    toast.success(`【${activeService.name}】服务配置已成功保存！`);
  };

  // State for Managing Users in Service
  const [selectedUserCodes, setSelectedUserCodes] = useState<string[]>([]);
  const [userRoleSelections, setUserRoleSelections] = useState<Record<string, string>>({});

  const handleOpenManageUsersModal = () => {
    // Collect all enterprise users (from mock users)
    const currentCodes = (activeService?.users || []).map((u) => u.userCode);
    setSelectedUserCodes(currentCodes);

    const rolesMap: Record<string, string> = {};
    (activeService?.users || []).forEach((u) => {
      rolesMap[u.userCode] = u.roles?.[0] || '管理员';
    });
    setUserRoleSelections(rolesMap);

    setIsManageUsersModalOpen(true);
  };

  const handleSaveManagedUsers = () => {
    // Generate new users list for active service based on selected users
    const allUsers = SCREENSHOT_USERS_DATA;
    const newServiceUsers: ServiceUserItem[] = selectedUserCodes.map((code) => {
      const existing = activeService.users.find((u) => u.userCode === code);
      if (existing) {
        return {
          ...existing,
          roles: [userRoleSelections[code] || existing.roles[0] || '管理员'],
        };
      }
      const rawUser = allUsers.find((u) => u.userCode === code);
      return {
        id: `su-${Date.now()}-${code}`,
        userCode: code,
        name: rawUser?.name || '企业员工',
        employeeCode: rawUser?.employeeCode || '',
        roles: [userRoleSelections[code] || '管理员'],
        status: 'normal',
        addedAt: new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
      };
    });

    const updated = services.map((s) => {
      if (s.id === activeService.id) {
        return {
          ...s,
          users: newServiceUsers,
          userLimit: s.userLimit?.includes('无限制')
            ? `${newServiceUsers.length}/无限制`
            : `${newServiceUsers.length}/${(s.userLimit?.includes('/') ? s.userLimit.split('/')[1] : '20') || '20'}`,
        };
      }
      return s;
    });

    setServices(updated);
    if (onServicesUpdate) onServicesUpdate(updated);
    setIsManageUsersModalOpen(false);
    toast.success(`已更新【${activeService.name}】的服务用户授权名单（共 ${newServiceUsers.length} 人）`);
  };

  // Open Quick Role Assignment Modal
  const handleOpenUserRoleModal = (user: ServiceUserItem) => {
    setSelectedUserForRole(user);
    setIsUserRoleModalOpen(true);
  };

  const handleToggleUserRole = (roleName: string) => {
    if (!selectedUserForRole) return;
    const currentRoles = selectedUserForRole.roles;
    let nextRoles: string[];
    if (currentRoles.includes(roleName)) {
      if (currentRoles.length === 1) {
        toast.warning('每个用户在当前服务中至少需要保留一个角色');
        return;
      }
      nextRoles = currentRoles.filter((r) => r !== roleName);
    } else {
      nextRoles = [...currentRoles, roleName];
    }

    const updatedUsers = activeService.users.map((u) => {
      if (u.id === selectedUserForRole.id) {
        return { ...u, roles: nextRoles };
      }
      return u;
    });

    const updated = services.map((s) => {
      if (s.id === activeService.id) {
        return { ...s, users: updatedUsers };
      }
      return s;
    });

    setServices(updated);
    setSelectedUserForRole({ ...selectedUserForRole, roles: nextRoles });
    toast.success(`已更新用户【${selectedUserForRole.name}】的服务角色`);
  };

  // Helper for service icon
  const getServiceIcon = (name: string) => {
    if (name.includes('工作台')) return <Cpu className="size-4.5 text-emerald-600" />;
    if (name.includes('微网')) return <Zap className="size-4.5 text-blue-600" />;
    if (name.includes('企业')) return <Building2 className="size-4.5 text-slate-600" />;
    if (name.includes('虚拟电厂')) return <Radio className="size-4.5 text-amber-600" />;
    if (name.includes('工厂')) return <Factory className="size-4.5 text-teal-600" />;
    if (name.includes('能管')) return <BarChart3 className="size-4.5 text-indigo-600" />;
    if (name.includes('碳')) return <Sparkles className="size-4.5 text-cyan-600" />;
    return <Layers className="size-4.5 text-blue-600" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60 pb-12">
      {/* ── Top Header / Return Navigation Bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 sticky top-0 z-30 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Back button + Breadcrumb & Enterprise info */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-8.5 px-3 text-xs text-gray-700 bg-white hover:bg-gray-50 border-gray-200 flex items-center gap-1.5 shadow-2xs cursor-pointer font-medium shrink-0"
              title="返回"
            >
              <ArrowLeft className="size-3.5 text-gray-600" />
              <span>返回</span>
            </Button>

            <div className="h-4 w-px bg-gray-200 shrink-0" />

            {/* Enterprise Details */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {enterprise.logoUrl ? (
                  <img
                    src={enterprise.logoUrl}
                    alt={enterprise.fullName}
                    className="size-full object-contain p-0.5"
                  />
                ) : (
                  <Building2 className="size-4.5 text-blue-600" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-gray-900 truncate">
                    {enterprise.fullName}
                  </h1>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium shrink-0">
                    {enterprise.code}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 truncate flex items-center gap-2 mt-0.5">
                  <span>统一代码: {enterprise.unifiedSocialCreditCode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center/Right: Master 2 Tabs (第一个Tab: 用户管理, 第二个Tab: 服务管理) */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setMasterTab('users')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  masterTab === 'users'
                    ? 'bg-white text-emerald-600 shadow-xs ring-1 ring-black/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-slate-200/60'
                }`}
              >
                <Users className="size-3.5 text-emerald-600 shrink-0" />
                <span>用户管理</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    masterTab === 'users'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {enterprise.userCount || 9}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMasterTab('services')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  masterTab === 'services'
                    ? 'bg-white text-blue-600 shadow-xs ring-1 ring-black/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-slate-200/60'
                }`}
              >
                <Layers className="size-3.5 text-blue-600 shrink-0" />
                <span>服务管理</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    masterTab === 'services'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {services.filter((s) => s.status === 'active').length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {masterTab === 'services' ? (
        /* ── Main Workspace: Left Service Sidebar (Cards) + Right Detail Panel ── */
        <div className="px-6 pt-5 max-w-[1600px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-5">
        {/* ════════════════════════════════════════════════════════════════════════
            LEFT SIDEBAR: Service Selection Cards (Exact match to screenshot)
        ════════════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2.5">
          {displayedSidebarServices.map((srv) => {
            const isSelected = srv.id === activeService.id;

            return (
              <div
                key={srv.id}
                onClick={() => {
                  setSelectedServiceId(srv.id);
                  setServiceTypeTab(srv.serviceType);
                  setCurrentPage(1);
                }}
                className={`relative rounded-xl px-4 py-3.5 cursor-pointer transition-all duration-150 select-none overflow-hidden min-h-[72px] flex items-center justify-between border ${
                  isSelected
                    ? 'border-blue-500 bg-gradient-to-r from-[#d9f2e4] via-[#e5f7ed] to-[#eff9f3] shadow-xs'
                    : 'border-transparent bg-gradient-to-r from-gray-100/90 via-slate-100/60 to-gray-50/80 hover:bg-gray-100/90 hover:border-gray-200'
                }`}
              >
                {/* Decorative Subtle Diagonal Wave / Curve matching screenshot */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-24 opacity-25 pointer-events-none"
                  style={{
                    background: isSelected
                      ? 'radial-gradient(ellipse at 100% 50%, rgba(34,197,94,0.35) 0%, transparent 75%)'
                      : 'radial-gradient(ellipse at 100% 50%, rgba(148,163,184,0.3) 0%, transparent 75%)',
                  }}
                />

                <div className="relative z-10">
                  <h3
                    className={`text-[15px] font-bold tracking-tight ${
                      isSelected ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {srv.name}
                  </h3>
                  {srv.subTitle && (
                    <span className="block text-xs text-gray-400 font-normal mt-0.5">
                      {srv.subTitle}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            RIGHT MAIN PANEL: Service Details, Authorization Bar, Users & Roles
        ════════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* ── Top Tabs: 授权服务 vs 体验服务 (Exact match to screenshot) ── */}
          <div className="bg-white rounded-t border-b border-gray-200 px-6 pt-3 flex items-center gap-8">
            <button
              type="button"
              onClick={() => {
                setServiceTypeTab('authorized');
                // Auto select first authorized service
                const firstAuth = services.find((s) => s.serviceType === 'authorized');
                if (firstAuth) setSelectedServiceId(firstAuth.id);
              }}
              className={`pb-3 text-sm font-semibold transition-all relative ${
                serviceTypeTab === 'authorized'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              授权服务
              {serviceTypeTab === 'authorized' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setServiceTypeTab('trial');
                // Auto select first trial service
                const firstTrial = services.find((s) => s.serviceType === 'trial');
                if (firstTrial) setSelectedServiceId(firstTrial.id);
              }}
              className={`pb-3 text-sm font-semibold transition-all relative ${
                serviceTypeTab === 'trial'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              体验服务
              {serviceTypeTab === 'trial' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>

          {/* ── Service Authorization Information Bar (Exact match to screenshot) ── */}
          <Card className="bg-white rounded p-4.5 border border-gray-200 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Key Service Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-2 gap-x-6 text-xs text-gray-600">
                {/* 1. 服务版本 */}
                <div>
                  <span className="text-gray-400">服务版本：</span>
                  <span className="text-gray-900 font-medium ml-1">
                    {activeService.version}
                  </span>
                </div>

                {/* 2. 到期日期 */}
                <div>
                  <span className="text-gray-400">到期日期：</span>
                  <span className="text-gray-900 font-medium ml-1">
                    {activeService.expireDate}
                  </span>
                </div>

                {/* 3. 用户数量 */}
                <div>
                  <span className="text-gray-400">用户数量：</span>
                  <span className="text-gray-900 font-medium ml-1">
                    {activeService.userLimit}
                  </span>
                </div>

                {/* 4. 标签人员数量 */}
                <div>
                  <span className="text-gray-400">标签人员数量：</span>
                  <span className="text-gray-900 font-medium ml-1">
                    {activeService.tagMemberCount}
                  </span>
                </div>

                {/* 5. 服务状态 (绿色 启用) */}
                <div>
                  <span className="text-gray-400">服务状态：</span>
                  <span
                    className={`font-semibold ml-1 ${
                      activeService.status === 'active'
                        ? 'text-emerald-600'
                        : 'text-red-500'
                    }`}
                  >
                    {activeService.status === 'active' ? '启用' : '停用'}
                  </span>
                </div>
              </div>

              {/* Far Right Action Button: 配置 (Solid blue button from screenshot) */}
              <Button
                type="button"
                onClick={handleOpenConfigModal}
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 rounded text-xs font-medium shrink-0 shadow-2xs transition-colors cursor-pointer"
              >
                配置
              </Button>
            </div>
          </Card>

          {/* ── Lower Workspace Card: 系统用户 vs 系统角色 ── */}
          <Card className="bg-white rounded border border-gray-200 shadow-2xs flex-1 flex flex-col overflow-hidden">
            {/* Lower Sub-tabs (Exact match to screenshot) */}
            <div className="border-b border-gray-200 px-6 pt-3 flex items-center gap-8 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setLowerTab('users')}
                className={`pb-3 text-sm font-semibold transition-all relative ${
                  lowerTab === 'users'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                系统用户
                {lowerTab === 'users' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setLowerTab('roles')}
                className={`pb-3 text-sm font-semibold transition-all relative ${
                  lowerTab === 'roles'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                系统角色
                {lowerTab === 'roles' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                SUBTAB 1: 系统用户 Table (Exact columns and rows from screenshot)
            ══════════════════════════════════════════════════════════════════ */}
            {lowerTab === 'users' && (
              <div className="p-4 flex-1 flex flex-col">
                {/* Action Toolbar: 管理用户 按钮 */}
                <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
                  <Button
                    type="button"
                    onClick={handleOpenManageUsersModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3.5 rounded text-xs font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    管理用户
                  </Button>

                  {/* Filter Search */}
                  <div className="relative w-56">
                    <Search className="size-3 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <Input
                      placeholder="搜索用户编号、姓名或角色..."
                      value={userSearchKeyword}
                      onChange={(e) => {
                        setUserSearchKeyword(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-8 pl-8 pr-2 text-xs bg-gray-50/50 border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 rounded placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto flex-1 border border-gray-100 rounded">
                  <table className="w-full text-sm text-left border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-700 text-xs font-medium select-none">
                        <th className="px-4 py-3 whitespace-nowrap">用户编号</th>
                        <th className="px-4 py-3 whitespace-nowrap">员工姓名</th>
                        <th className="px-4 py-3 whitespace-nowrap">企业员工编号</th>
                        <th className="px-4 py-3 whitespace-nowrap">用户角色</th>
                        <th className="px-4 py-3 whitespace-nowrap">账户状态</th>
                        <th className="px-4 py-3 whitespace-nowrap">添加时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {paginatedServiceUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400">
                            <Users className="size-8 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500 font-medium">当前服务暂未分配任何系统用户</p>
                            <p className="text-xs text-gray-400 mt-1">
                              点击上方「管理用户」按钮分配在册员工
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedServiceUsers.map((u) => {
                          const displayRole =
                            u.roles.length > 1
                              ? `共${u.roles.length}个`
                              : u.roles[0] || '普通成员';

                          return (
                            <tr
                              key={u.id}
                              className="hover:bg-blue-50/20 transition-colors"
                            >
                              {/* 1. 用户编号 */}
                              <td className="px-4 py-3.5 font-mono text-gray-800 whitespace-nowrap">
                                {u.userCode}
                              </td>

                              {/* 2. 员工姓名 */}
                              <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                                {u.name}
                              </td>

                              {/* 3. 企业员工编号 */}
                              <td className="px-4 py-3.5 font-mono text-gray-500 whitespace-nowrap">
                                {u.employeeCode || ''}
                              </td>

                              {/* 4. 用户角色 (Blue link in screenshot) */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenUserRoleModal(u)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                                  title="点击调整该员工在此服务中的角色权限"
                                >
                                  {displayRole}
                                </button>
                              </td>

                              {/* 5. 账户状态 (● 正常) */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {u.status === 'normal' ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span>正常</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-gray-400">
                                    <span className="size-2 rounded-full bg-gray-400 shrink-0" />
                                    <span>停用</span>
                                  </div>
                                )}
                              </td>

                              {/* 6. 添加时间 */}
                              <td className="px-4 py-3.5 font-mono text-gray-600 whitespace-nowrap">
                                {u.addedAt}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer: 共9条记录 第1/1页 (Exact match to screenshot) */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                  <div>
                    共<span className="font-medium text-gray-700 mx-0.5">{totalUserRecords}</span>条记录 第
                    <span className="font-semibold text-blue-600 mx-0.5">{currentPage}</span>/
                    <span>{totalUserPages}</span>页
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Page Number Box */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-colors cursor-pointer ${
                            currentPage === p
                              ? 'border border-blue-500 text-blue-600 bg-white font-medium'
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    {/* Page Size Dropdown */}
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        setPageSize(Number(val));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-7.5 text-xs border-gray-200 bg-white w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 条/页</SelectItem>
                        <SelectItem value="20">20 条/页</SelectItem>
                        <SelectItem value="50">50 条/页</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                SUBTAB 2: 系统角色 Table & Permissions
            ══════════════════════════════════════════════════════════════════ */}
            {lowerTab === 'roles' && (
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="text-xs text-gray-500">
                    当前【{activeService.name}】已定义 {activeService.roles.length} 个系统授权角色
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      toast.info('支持根据企业业务需求新增自定义授权角色');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 rounded text-xs cursor-pointer"
                  >
                    <Plus className="size-3.5 mr-1" />
                    新建角色
                  </Button>
                </div>

                <div className="overflow-x-auto flex-1 border border-gray-100 rounded">
                  <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-700 text-xs font-medium">
                        <th className="px-4 py-3 whitespace-nowrap">角色名称</th>
                        <th className="px-4 py-3 whitespace-nowrap">角色标识</th>
                        <th className="px-4 py-3 whitespace-nowrap">关联用户数</th>
                        <th className="px-4 py-3 whitespace-nowrap">权限范围</th>
                        <th className="px-4 py-3 whitespace-nowrap">创建时间</th>
                        <th className="px-4 py-3 whitespace-nowrap">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {activeService.roles.map((r) => (
                        <tr key={r.id} className="hover:bg-blue-50/20">
                          <td className="px-4 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                            {r.name}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-gray-500 whitespace-nowrap">
                            {r.code}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-medium text-blue-600">
                            {r.userCount} 人
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {r.permissions.map((p) => (
                                <span
                                  key={p}
                                  className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px]"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-gray-500 whitespace-nowrap">
                            {r.createdAt}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                toast.info(`正在查看角色【${r.name}】的权限详情`);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer mr-3"
                            >
                              配置权限
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      ) : (
        /* ── Master Tab 2: 用户管理 (Embedded EnterpriseUserPage) ── */
        <div className="px-6 pt-5 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
          <EnterpriseUserPage
            enterprise={enterprise}
            returnMode={returnMode}
            onBack={onBack}
            onUserCountChange={onUserCountChange}
            embedded={true}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          Modal 1: 服务配置弹窗 (点击「配置」按钮唤起)
      ════════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="size-4 text-blue-600" />
              <span>服务授权配置 - {activeService.name}</span>
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1">
              企业：{enterprise.fullName} ({enterprise.code})
            </p>
          </DialogHeader>

          <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
            {/* 服务版本 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                服务版本:
              </label>
              <Select
                value={configFormData.version}
                onValueChange={(val) =>
                  setConfigFormData((p) => ({ ...p, version: val }))
                }
              >
                <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="标准版">标准版</SelectItem>
                  <SelectItem value="专业版">专业版</SelectItem>
                  <SelectItem value="旗舰版">旗舰版</SelectItem>
                  <SelectItem value="体验版">体验版</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 到期日期模式 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                授权到期模式:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={configFormData.expireMode}
                  onValueChange={(val) =>
                    setConfigFormData((p) => ({ ...p, expireMode: val }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forever">长期有效</SelectItem>
                    <SelectItem value="custom">指定到期日</SelectItem>
                  </SelectContent>
                </Select>

                {configFormData.expireMode === 'custom' && (
                  <Input
                    type="date"
                    value={configFormData.customExpireDate}
                    onChange={(e) =>
                      setConfigFormData((p) => ({
                        ...p,
                        customExpireDate: e.target.value,
                      }))
                    }
                    className="h-9 text-xs font-mono bg-white border-gray-200"
                  />
                )}
              </div>
            </div>

            {/* 用户数量配额 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                用户数量配额限制:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={configFormData.userLimitMode}
                  onValueChange={(val) =>
                    setConfigFormData((p) => ({ ...p, userLimitMode: val }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">无限制</SelectItem>
                    <SelectItem value="limit">限制人数上限</SelectItem>
                  </SelectContent>
                </Select>

                {configFormData.userLimitMode === 'limit' && (
                  <Input
                    type="number"
                    min={1}
                    value={configFormData.customLimit}
                    onChange={(e) =>
                      setConfigFormData((p) => ({
                        ...p,
                        customLimit: e.target.value,
                      }))
                    }
                    placeholder="上限人数"
                    className="h-9 text-xs font-mono bg-white border-gray-200"
                  />
                )}
              </div>
            </div>

            {/* 标签人员数量 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                标签人员数量:
              </label>
              <Input
                type="number"
                min={0}
                value={configFormData.tagMemberCount}
                onChange={(e) =>
                  setConfigFormData((p) => ({
                    ...p,
                    tagMemberCount: Number(e.target.value) || 0,
                  }))
                }
                className="h-9 text-xs font-mono bg-white border-gray-200"
              />
            </div>

            {/* 服务状态 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                服务状态:
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="srv-status"
                    checked={configFormData.status === 'active'}
                    onChange={() =>
                      setConfigFormData((p) => ({ ...p, status: 'active' }))
                    }
                    className="text-blue-600"
                  />
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                    启用 (服务正常在线)
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="srv-status"
                    checked={configFormData.status === 'disabled'}
                    onChange={() =>
                      setConfigFormData((p) => ({ ...p, status: 'disabled' }))
                    }
                    className="text-blue-600"
                  />
                  <span className="text-gray-500">停用</span>
                </label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-xs h-8.5 px-4"
              >
                取消
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8.5 px-5"
              >
                保存配置
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════════
          Modal 2: 管理用户弹窗 (点击「管理用户」按钮唤起)
      ════════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isManageUsersModalOpen} onOpenChange={setIsManageUsersModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="size-4 text-blue-600" />
              <span>分配服务系统用户 - {activeService.name}</span>
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1">
              勾选可访问当前服务模块的企业成员，并为其分配角色
            </p>
          </DialogHeader>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between text-xs text-gray-600 bg-blue-50/50 p-2.5 rounded border border-blue-100">
              <span>在册总人数: {SCREENSHOT_USERS_DATA.length} 人</span>
              <span className="font-semibold text-blue-700">
                已勾选授权: {selectedUserCodes.length} 人
              </span>
            </div>

            <div className="divide-y divide-gray-100 border border-gray-200 rounded">
              {SCREENSHOT_USERS_DATA.map((user) => {
                const isChecked = selectedUserCodes.includes(user.userCode);
                const currentRole = userRoleSelections[user.userCode] || '管理员';

                return (
                  <div
                    key={user.id}
                    className={`p-3 flex items-center justify-between transition-colors ${
                      isChecked ? 'bg-blue-50/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserCodes((p) => [...p, user.userCode]);
                          } else {
                            setSelectedUserCodes((p) =>
                              p.filter((c) => c !== user.userCode)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 size-4"
                      />
                      <div>
                        <div className="font-medium text-xs text-gray-900 flex items-center gap-2">
                          <span>{user.name}</span>
                          <span className="font-mono text-gray-400 text-[11px]">
                            ({user.userCode})
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          手机号: {user.phone} · 标签: {user.tag || '无'}
                        </div>
                      </div>
                    </label>

                    {isChecked && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">角色:</span>
                        <Select
                          value={currentRole}
                          onValueChange={(val) =>
                            setUserRoleSelections((p) => ({
                              ...p,
                              [user.userCode]: val,
                            }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs bg-white border-gray-200 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="管理员">管理员</SelectItem>
                            <SelectItem value="运行值守员">运行值守员</SelectItem>
                            <SelectItem value="能耗分析员">能耗分析员</SelectItem>
                            <SelectItem value="业务查看员">业务查看员</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManageUsersModalOpen(false)}
              className="text-xs h-8.5 px-4"
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveManagedUsers}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8.5 px-5"
            >
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════════
          Modal 3: 单个用户服务角色调整弹窗 (点击表格内的蓝色「管理员」或「共2个」链接唤起)
      ════════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isUserRoleModalOpen} onOpenChange={setIsUserRoleModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="size-4 text-blue-600" />
              <span>调整用户角色权限</span>
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1">
              用户：{selectedUserForRole?.name} ({selectedUserForRole?.userCode})
            </p>
          </DialogHeader>

          <div className="py-3 space-y-2.5">
            <p className="text-xs text-gray-600 mb-2">
              勾选该员工在【{activeService.name}】中的业务角色：
            </p>

            {DEFAULT_SERVICE_ROLES.map((role) => {
              const hasRole = selectedUserForRole?.roles.includes(role.name);

              return (
                <div
                  key={role.id}
                  onClick={() => handleToggleUserRole(role.name)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    hasRole
                      ? 'border-blue-500 bg-blue-50/40 text-blue-900'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div
                    className={`size-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      hasRole
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {hasRole && <Check className="size-3" />}
                  </div>
                  <div>
                    <div className="font-semibold">{role.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {role.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={() => setIsUserRoleModalOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8.5"
            >
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
