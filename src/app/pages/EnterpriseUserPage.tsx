import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  UserPlus,
  Pencil,
  Trash2,
  Building2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  QrCode,
  Share2,
  Phone,
  Mail,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Tag,
  ChevronDown,
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
  EnterpriseUserRecord,
  getEnterpriseUsers,
} from '@/app/data/mockEnterpriseUsers';
import { toast } from 'sonner';

interface EnterpriseUserPageProps {
  enterprise: EnterpriseItem;
  returnMode?: 'list' | 'map';
  onBack?: () => void;
  onUserCountChange?: (count: number) => void;
  embedded?: boolean;
}

export default function EnterpriseUserPage({
  enterprise,
  returnMode = 'list',
  onBack,
  onUserCountChange,
  embedded = false,
}: EnterpriseUserPageProps) {
  // Enterprise Users State
  const [users, setUsers] = useState<EnterpriseUserRecord[]>(() =>
    getEnterpriseUsers(enterprise.id, enterprise.fullName)
  );

  // Search & Filter State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active user being edited or deleted
  const [activeUser, setActiveUser] = useState<EnterpriseUserRecord | null>(null);

  // Form State for Adding / Editing
  const [userFormData, setUserFormData] = useState({
    name: '',
    phone: '',
    tag: '微网管理组',
    customTag: '',
    employeeCode: '',
    email: '',
    status: 'normal' as 'normal' | 'disabled',
  });

  // Invite Form State
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteTag, setInviteTag] = useState('微网管理组');
  const [inviteTab, setInviteTab] = useState<'link' | 'sms' | 'qr'>('sms');
  const [copiedLink, setCopiedLink] = useState(false);

  // Predefined common user tags
  const PRESET_TAGS = ['微网管理组', '研发人员', '运维人员', '安全环保组', '能耗监测组'];

  // All distinct tags currently in user list
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.tag && u.tag.trim()) set.add(u.tag.trim());
    });
    return Array.from(set);
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchKeyword.trim()) {
        const q = searchKeyword.trim().toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchCode = u.userCode.toLowerCase().includes(q);
        const matchPhone = u.phone.includes(q);
        const matchEmpCode = u.employeeCode.toLowerCase().includes(q);
        const matchTag = u.tag.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPhone && !matchEmpCode && !matchTag) {
          return false;
        }
      }
      if (filterTag !== 'all' && u.tag !== filterTag) {
        return false;
      }
      if (filterStatus !== 'all' && u.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [users, searchKeyword, filterTag, filterStatus]);

  // Pagination calculation
  const totalRecords = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Sync user count upward if callback provided
  const notifyCountChange = (newCount: number) => {
    if (onUserCountChange) {
      onUserCountChange(newCount);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setUserFormData({
      name: '',
      phone: '',
      tag: '微网管理组',
      customTag: '',
      employeeCode: '',
      email: '',
      status: 'normal',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add User
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim()) {
      toast.error('请输入员工姓名');
      return;
    }
    if (!userFormData.phone.trim() || userFormData.phone.trim().length < 11) {
      toast.error('请输入正确的11位员工手机号码');
      return;
    }

    const finalTag =
      userFormData.tag === 'custom'
        ? userFormData.customTag.trim()
        : userFormData.tag === 'none'
        ? ''
        : userFormData.tag;

    // Generate consecutive or random user code matching "UE000xxxxx" format
    const randomCodeNum = Math.floor(10000 + Math.random() * 90000);
    const newUser: EnterpriseUserRecord = {
      id: `usr-${Date.now()}`,
      userCode: `UE000${randomCodeNum}`,
      name: userFormData.name.trim(),
      tag: finalTag,
      employeeCode: userFormData.employeeCode.trim(),
      phone: userFormData.phone.trim(),
      email: userFormData.email.trim(),
      status: userFormData.status,
      createdAt: new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      enterpriseId: enterprise.id,
    };

    const nextUsers = [newUser, ...users];
    setUsers(nextUsers);
    notifyCountChange(nextUsers.length);
    setIsAddModalOpen(false);
    toast.success(`成功添加企业用户【${newUser.name}】（编号: ${newUser.userCode}）`);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: EnterpriseUserRecord) => {
    setActiveUser(user);
    const isPreset = PRESET_TAGS.includes(user.tag);
    setUserFormData({
      name: user.name,
      phone: user.phone,
      tag: isPreset ? user.tag : user.tag ? 'custom' : 'none',
      customTag: isPreset ? '' : (user.tag || ''),
      employeeCode: user.employeeCode,
      email: user.email,
      status: user.status,
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit User
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!userFormData.name.trim()) {
      toast.error('请输入员工姓名');
      return;
    }
    if (!userFormData.phone.trim() || userFormData.phone.trim().length < 11) {
      toast.error('请输入正确的11位员工手机号码');
      return;
    }

    const finalTag =
      userFormData.tag === 'custom'
        ? userFormData.customTag.trim()
        : userFormData.tag === 'none'
        ? ''
        : userFormData.tag;

    const updatedUsers = users.map((u) => {
      if (u.id === activeUser.id) {
        return {
          ...u,
          name: userFormData.name.trim(),
          phone: userFormData.phone.trim(),
          tag: finalTag,
          employeeCode: userFormData.employeeCode.trim(),
          email: userFormData.email.trim(),
          status: userFormData.status,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    setIsEditModalOpen(false);
    setActiveUser(null);
    toast.success(`企业用户【${userFormData.name}】信息已成功更新`);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (user: EnterpriseUserRecord) => {
    setActiveUser(user);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete User
  const handleConfirmDelete = () => {
    if (!activeUser) return;
    const nextUsers = users.filter((u) => u.id !== activeUser.id);
    setUsers(nextUsers);
    notifyCountChange(nextUsers.length);
    setIsDeleteModalOpen(false);
    toast.success(`已删除企业用户【${activeUser.name}】`);
    setActiveUser(null);
  };

  // Handle Invite
  const handleSendInviteSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitePhone.trim() || invitePhone.trim().length < 11) {
      toast.error('请输入被邀请人员的有效手机号码');
      return;
    }

    const randomCodeNum = Math.floor(10000 + Math.random() * 90000);
    const invitedUser: EnterpriseUserRecord = {
      id: `usr-${Date.now()}`,
      userCode: `UE000${randomCodeNum}`,
      name: inviteName.trim() || `受邀成员_${invitePhone.slice(-4)}`,
      tag: inviteTag,
      employeeCode: '',
      phone: invitePhone.trim(),
      email: '',
      status: 'normal',
      createdAt: new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      enterpriseId: enterprise.id,
    };

    const nextUsers = [invitedUser, ...users];
    setUsers(nextUsers);
    notifyCountChange(nextUsers.length);
    setIsInviteModalOpen(false);
    setInvitePhone('');
    setInviteName('');
    toast.success(`邀请短信已发送至 ${invitePhone}，已预建用户账户！`);
  };

  const inviteLink = `https://energy-cloud.tianhe.com/join?ent=${enterprise.code}&token=auth_${Date.now()}`;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast.success('专属邀请链接已复制到剪贴板，有效期7天');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={embedded ? 'w-full flex-1 flex flex-col' : 'flex flex-col min-h-screen bg-gray-50/60 pb-12'}>
      {/* ── Top Header / Return Navigation Bar (Only in standalone page mode) ── */}
      {!embedded && (
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
                    <span>·</span>
                    <span>联系人: {enterprise.contactName} ({enterprise.contactPhone})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: User Count Summary Badge */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>在册用户: </span>
                <strong className="font-bold text-emerald-700 font-mono text-sm">
                  {users.length}
                </strong>
                <span>人</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className={embedded ? 'w-full flex-1 flex flex-col' : 'px-6 pt-5 max-w-[1600px] w-full mx-auto flex-1 flex flex-col'}>
        {/* ── Action Toolbar matching Screenshot ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          {/* Left Buttons: 添加用户 & 邀请用户 (Exact style from screenshot) */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              onClick={handleOpenAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4.5 rounded text-sm font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              添加用户
            </Button>

            <Button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4.5 rounded text-sm font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus className="size-4" />
              邀请用户
            </Button>
          </div>

          {/* Right Filters: Keyword Search + Tag Filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-64">
              <Search className="size-3.5 text-gray-400 absolute left-2.5 top-3 pointer-events-none" />
              <Input
                placeholder="搜索姓名、手机号、用户编号..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 pl-8 pr-2.5 text-xs bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 rounded placeholder:text-gray-400"
              />
            </div>

            {availableTags.length > 0 && (
              <Select
                value={filterTag}
                onValueChange={(val) => {
                  setFilterTag(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-gray-200 w-36">
                  <SelectValue placeholder="筛选用户标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部标签</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(searchKeyword || filterTag !== 'all' || filterStatus !== 'all') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchKeyword('');
                  setFilterTag('all');
                  setFilterStatus('all');
                  setCurrentPage(1);
                }}
                className="h-9 px-2 text-xs text-gray-500 hover:text-blue-600"
                title="清空筛选"
              >
                <RotateCcw className="size-3.5 mr-1" />
                重置
              </Button>
            )}
          </div>
        </div>

        {/* ── Enterprise Users Table (Faithful to Screenshot) ── */}
        <Card className="bg-white rounded border border-gray-200 shadow-2xs overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-700 text-xs font-medium select-none">
                  <th className="px-4 py-3 whitespace-nowrap">用户编号</th>
                  <th className="px-4 py-3 whitespace-nowrap">员工姓名</th>
                  <th className="px-4 py-3 whitespace-nowrap">用户标签</th>
                  <th className="px-4 py-3 whitespace-nowrap">企业员工编号</th>
                  <th className="px-4 py-3 whitespace-nowrap">员工手机号</th>
                  <th className="px-4 py-3 whitespace-nowrap">员工邮箱</th>
                  <th className="px-4 py-3 whitespace-nowrap">账户状态</th>
                  <th className="px-4 py-3 whitespace-nowrap">创建时间</th>
                  <th className="px-4 py-3 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2 className="size-8 text-gray-300" />
                        <p className="text-gray-500 font-medium">暂无匹配的企业用户记录</p>
                        <p className="text-xs text-gray-400">
                          请尝试调整筛选条件或点击上方「添加用户」按钮录入新员工
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* 1. 用户编号 */}
                      <td className="px-4 py-3.5 font-mono text-gray-800 whitespace-nowrap">
                        {item.userCode}
                      </td>

                      {/* 2. 员工姓名 */}
                      <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                        {item.name}
                      </td>

                      {/* 3. 用户标签 */}
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                        {item.tag || '-'}
                      </td>

                      {/* 4. 企业员工编号 */}
                      <td className="px-4 py-3.5 font-mono text-gray-600 whitespace-nowrap">
                        {item.employeeCode || ''}
                      </td>

                      {/* 5. 员工手机号 */}
                      <td className="px-4 py-3.5 font-mono text-gray-700 whitespace-nowrap">
                        {item.phone}
                      </td>

                      {/* 6. 员工邮箱 */}
                      <td className="px-4 py-3.5 font-mono text-gray-600 whitespace-nowrap">
                        {item.email || ''}
                      </td>

                      {/* 7. 账户状态 (绿点 正常) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {item.status === 'normal' ? (
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

                      {/* 8. 创建时间 */}
                      <td className="px-4 py-3.5 font-mono text-gray-600 whitespace-nowrap">
                        {item.createdAt}
                      </td>

                      {/* 9. 操作 (编辑, 删除 - 对应截图样式) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* 编辑按钮：蓝色边框与文字 */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="border border-blue-400 text-blue-600 hover:bg-blue-50 rounded px-2.5 py-0.5 text-xs transition-colors cursor-pointer"
                          >
                            编辑
                          </button>

                          {/* 删除按钮：红色边框与文字 */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(item)}
                            className="border border-red-400 text-red-500 hover:bg-red-50 rounded px-2.5 py-0.5 text-xs transition-colors cursor-pointer"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer & Pagination (Exact Match to Screenshot) ── */}
          <div className="p-3 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            {/* Left: 共10条记录 第1/1页 */}
            <div>
              共<span className="font-medium text-gray-700 mx-0.5">{totalRecords}</span>条记录 第
              <span className="font-semibold text-blue-600 mx-0.5">{currentPage}</span>/
              <span>{totalPages}</span>页
            </div>

            {/* Right: Page 1 box + 10 条/页 select */}
            <div className="flex items-center gap-2.5">
              {/* Page Number Boxes */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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

              {/* Page Size Dropdown: 10 条/页 ∨ */}
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
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════
          Modal 1: 添加用户弹窗
      ════════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Plus className="size-4 text-blue-600" />
              <span>添加企业用户</span>
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1">
              隶属企业：{enterprise.fullName} ({enterprise.code})
            </p>
          </DialogHeader>

          <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
            {/* 员工姓名 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                <span className="text-red-500 mr-1">*</span>员工姓名:
              </label>
              <Input
                value={userFormData.name}
                onChange={(e) => setUserFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="例如：李志强"
                className="h-9 text-xs bg-white border-gray-200"
                required
              />
            </div>

            {/* 员工手机号 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                <span className="text-red-500 mr-1">*</span>员工手机号 (登录账号):
              </label>
              <Input
                value={userFormData.phone}
                onChange={(e) => setUserFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="例如：13812345678"
                maxLength={11}
                className="h-9 text-xs font-mono bg-white border-gray-200"
                required
              />
            </div>

            {/* 用户标签 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                用户标签:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={userFormData.tag || 'none'}
                  onValueChange={(val) => setUserFormData((p) => ({ ...p, tag: val }))}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_TAGS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">+ 自定义标签</SelectItem>
                    <SelectItem value="none">无标签</SelectItem>
                  </SelectContent>
                </Select>

                {userFormData.tag === 'custom' && (
                  <Input
                    value={userFormData.customTag}
                    onChange={(e) =>
                      setUserFormData((p) => ({ ...p, customTag: e.target.value }))
                    }
                    placeholder="输入自定义标签"
                    className="h-9 text-xs bg-white border-gray-200"
                  />
                )}
              </div>
            </div>

            {/* 企业员工编号 & 邮箱 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  企业员工编号:
                </label>
                <Input
                  value={userFormData.employeeCode}
                  onChange={(e) =>
                    setUserFormData((p) => ({ ...p, employeeCode: e.target.value }))
                  }
                  placeholder="例如：EMP-012"
                  className="h-9 text-xs font-mono bg-white border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  员工邮箱:
                </label>
                <Input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="name@company.com"
                  className="h-9 text-xs bg-white border-gray-200"
                />
              </div>
            </div>

            {/* 账户状态 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                账户状态:
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={userFormData.status === 'normal'}
                    onChange={() => setUserFormData((p) => ({ ...p, status: 'normal' }))}
                    className="text-blue-600"
                  />
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                    正常 (允许登录)
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={userFormData.status === 'disabled'}
                    onChange={() => setUserFormData((p) => ({ ...p, status: 'disabled' }))}
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
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs h-8.5 px-4"
              >
                取消
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8.5 px-5"
              >
                确认添加
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════════
          Modal 2: 邀请用户弹窗
      ════════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="size-4 text-blue-600" />
              <span>邀请企业用户加入</span>
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1">
              受邀成员将加入【{enterprise.fullName}】能源数智化管理工作台
            </p>
          </DialogHeader>

          {/* Invitation Method Tabs */}
          <div className="px-6 pt-4">
            <div className="flex items-center p-0.5 rounded-lg bg-gray-100 border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setInviteTab('sms')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  inviteTab === 'sms'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                手机短信邀请
              </button>
              <button
                type="button"
                onClick={() => setInviteTab('link')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  inviteTab === 'link'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                专属链接邀请
              </button>
              <button
                type="button"
                onClick={() => setInviteTab('qr')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  inviteTab === 'qr'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                企业微信二维码
              </button>
            </div>
          </div>

          <div className="p-6 pt-4">
            {inviteTab === 'sms' && (
              <form onSubmit={handleSendInviteSms} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    <span className="text-red-500 mr-1">*</span>被邀请人手机号:
                  </label>
                  <Input
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="输入11位手机号"
                    maxLength={11}
                    className="h-9 text-xs font-mono bg-white border-gray-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    员工姓名 (选填):
                  </label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="例如：张工"
                    className="h-9 text-xs bg-white border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    预设标签:
                  </label>
                  <Select value={inviteTag} onValueChange={setInviteTag}>
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_TAGS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded p-2.5 text-[11px] text-blue-700">
                  系统将向该手机号发送开通短信，成员点击短信内的专属认证链接即可完成密码设置并登录。
                </div>

                <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-xs h-8.5 px-4"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8.5 px-5"
                  >
                    发送短信邀请
                  </Button>
                </DialogFooter>
              </form>
            )}

            {inviteTab === 'link' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    企业专属注册加入链接:
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={inviteLink}
                      className="h-9 text-xs font-mono bg-gray-50 border-gray-200 select-all"
                    />
                    <Button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="h-9 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="size-3.5 mr-1 text-emerald-300" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 mr-1" />
                          复制链接
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-gray-800">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <span>链接使用说明</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    • 链接有效期为 7 天，支持本企业内部员工通过手机短信验证码完成身份绑定；
                  </p>
                  <p className="text-[11px] text-gray-500">
                    • 注册成功后将自动分配至企业普通成员标签组。
                  </p>
                </div>

                <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-xs h-8.5 px-4"
                  >
                    关闭
                  </Button>
                </DialogFooter>
              </div>
            )}

            {inviteTab === 'qr' && (
              <div className="space-y-4 text-center">
                <p className="text-xs text-gray-600">
                  使用微信或企业微信扫描下方二维码，快速认证并加入企业：
                </p>

                <div className="inline-block p-3 rounded-lg border border-gray-200 bg-white shadow-2xs">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https%3A%2F%2Fenergy-cloud.tianhe.com%2Fjoin%3Fent%3DCO00057343"
                    alt="加入企业二维码"
                    className="size-44 mx-auto rounded"
                  />
                  <div className="mt-2 text-[11px] font-mono text-gray-500">
                    {enterprise.fullName}
                  </div>
                </div>

                <div className="text-[11px] text-gray-400">
                  支持企业管理员将二维码下载或转发至企业微信工作群
                </div>

                <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast.success('二维码已保存至下载目录');
                    }}
                    className="text-xs h-8.5 px-4"
                  >
                    保存二维码图片
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8.5 px-4"
                  >
                    完成
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════════
          Modal 3: 编辑用户弹窗
      ════════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Pencil className="size-4 text-blue-600" />
              <span>编辑企业用户</span>
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              用户编号：{activeUser?.userCode}
            </p>
          </DialogHeader>

          <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
            {/* 员工姓名 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                <span className="text-red-500 mr-1">*</span>员工姓名:
              </label>
              <Input
                value={userFormData.name}
                onChange={(e) => setUserFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="例如：孙乾"
                className="h-9 text-xs bg-white border-gray-200"
                required
              />
            </div>

            {/* 员工手机号 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                <span className="text-red-500 mr-1">*</span>员工手机号:
              </label>
              <Input
                value={userFormData.phone}
                onChange={(e) => setUserFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="例如：13259458633"
                maxLength={11}
                className="h-9 text-xs font-mono bg-white border-gray-200"
                required
              />
            </div>

            {/* 用户标签 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                用户标签:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={userFormData.tag || 'none'}
                  onValueChange={(val) => setUserFormData((p) => ({ ...p, tag: val }))}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_TAGS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">+ 自定义标签</SelectItem>
                    <SelectItem value="none">无标签</SelectItem>
                  </SelectContent>
                </Select>

                {userFormData.tag === 'custom' && (
                  <Input
                    value={userFormData.customTag}
                    onChange={(e) =>
                      setUserFormData((p) => ({ ...p, customTag: e.target.value }))
                    }
                    placeholder="输入标签名称"
                    className="h-9 text-xs bg-white border-gray-200"
                  />
                )}
              </div>
            </div>

            {/* 企业员工编号 & 邮箱 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  企业员工编号:
                </label>
                <Input
                  value={userFormData.employeeCode}
                  onChange={(e) =>
                    setUserFormData((p) => ({ ...p, employeeCode: e.target.value }))
                  }
                  placeholder="例如：EMP-001"
                  className="h-9 text-xs font-mono bg-white border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  员工邮箱:
                </label>
                <Input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="name@company.com"
                  className="h-9 text-xs bg-white border-gray-200"
                />
              </div>
            </div>

            {/* 账户状态 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                账户状态:
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="edit-status"
                    checked={userFormData.status === 'normal'}
                    onChange={() => setUserFormData((p) => ({ ...p, status: 'normal' }))}
                    className="text-blue-600"
                  />
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                    正常
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="edit-status"
                    checked={userFormData.status === 'disabled'}
                    onChange={() => setUserFormData((p) => ({ ...p, status: 'disabled' }))}
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
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs h-8.5 px-4"
              >
                取消
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8.5 px-5"
              >
                保存修改
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════════
          Modal 4: 删除用户确认弹窗
      ════════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              <span>删除企业用户确认</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-2 text-xs text-gray-600">
            <p>
              确定要删除企业员工{' '}
              <strong className="text-gray-900 font-semibold">
                【{activeUser?.name}】
              </strong>{' '}
              （用户编号：<span className="font-mono">{activeUser?.userCode}</span>）吗？
            </p>
            <p className="text-gray-400">
              删除后，该员工将无法再登录天合储能零碳综合操作系统，无法访问该企业的能源数据与调度策略。
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-xs h-8.5 px-4"
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="text-xs h-8.5 px-4 bg-red-600 hover:bg-red-700"
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
