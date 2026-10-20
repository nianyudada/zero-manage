import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  ShieldCheck,
  UserCheck,
  UserX,
  Phone,
  Mail,
  RotateCcw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { EnterpriseItem } from '@/app/data/mockEnterprises';
import { toast } from 'sonner';

export interface EnterpriseUser {
  id: string;
  name: string;
  account: string;
  phone: string;
  email?: string;
  department: string;
  role: 'admin' | 'operator' | 'monitor' | 'viewer';
  roleName: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt: string;
}

interface EnterpriseUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enterprise: EnterpriseItem | null;
}

// Helper to get total user count for an enterprise
export function getEnterpriseUserCount(ent: EnterpriseItem): number {
  if (ent.userCount !== undefined) return ent.userCount;
  const seed = (ent.id.charCodeAt(ent.id.length - 1) || 0) + (ent.code.charCodeAt(ent.code.length - 1) || 0);
  return 3 + (seed % 4); // yields 3, 4, 5, or 6 users
}

// Generate realistic mock enterprise users for the specific enterprise
export function getInitialEnterpriseUsers(ent: EnterpriseItem | null): EnterpriseUser[] {
  if (!ent) return [];

  const baseContactName = ent.contactName || '企业管理员';
  const basePhone = ent.contactPhone || '13800000000';
  const numericId = ent.id.replace(/\D/g, '').padEnd(6, '8');
  const targetCount = getEnterpriseUserCount(ent);

  const pool: EnterpriseUser[] = [
    {
      id: `usr-${ent.id}-1`,
      name: baseContactName,
      account: `admin_${ent.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      phone: basePhone,
      email: ent.contactEmail || `admin@${ent.code.toLowerCase()}.com`,
      department: '企业高管 / 能源安全委员会',
      role: 'admin',
      roleName: '企业超级管理员',
      status: 'active',
      createdAt: '2025/10/12',
      lastLoginAt: '2026/09/22 10:45',
    },
    {
      id: `usr-${ent.id}-2`,
      name: '李工',
      account: `ops_${numericId.slice(0, 4)}`,
      phone: `139${numericId.slice(0, 8)}`,
      email: `ops@${ent.code.toLowerCase()}.com`,
      department: '工程技术部',
      role: 'operator',
      roleName: '系统运维主管',
      status: 'active',
      createdAt: '2025/11/03',
      lastLoginAt: '2026/09/21 16:30',
    },
    {
      id: `usr-${ent.id}-3`,
      name: '陈晓',
      account: `monitor_${numericId.slice(2, 6)}`,
      phone: `137${numericId.slice(1, 9)}`,
      email: `chenx@${ent.code.toLowerCase()}.com`,
      department: '电力运行调度科',
      role: 'monitor',
      roleName: '能耗监测分析员',
      status: 'active',
      createdAt: '2026/01/15',
      lastLoginAt: '2026/09/20 09:15',
    },
    {
      id: `usr-${ent.id}-4`,
      name: '王强',
      account: `elec_${numericId.slice(3, 7)}`,
      phone: `135${numericId.slice(2, 10)}`,
      email: `wangq@${ent.code.toLowerCase()}.com`,
      department: '电气自动化车间',
      role: 'operator',
      roleName: '变配电专工',
      status: 'active',
      createdAt: '2026/03/08',
      lastLoginAt: '2026/09/19 14:20',
    },
    {
      id: `usr-${ent.id}-5`,
      name: '赵丽',
      account: `stat_${numericId.slice(1, 5)}`,
      phone: `136${numericId.slice(3, 11)}`,
      email: `zhaol@${ent.code.toLowerCase()}.com`,
      department: '能源资产管理处',
      role: 'monitor',
      roleName: '能效统计员',
      status: 'active',
      createdAt: '2026/04/18',
      lastLoginAt: '2026/09/22 08:50',
    },
    {
      id: `usr-${ent.id}-6`,
      name: '孙明',
      account: `safe_${numericId.slice(0, 4)}`,
      phone: `158${numericId.slice(0, 8)}`,
      email: `sunm@${ent.code.toLowerCase()}.com`,
      department: '安全环保监察部',
      role: 'viewer',
      roleName: '安全监察专员',
      status: 'active',
      createdAt: '2026/05/22',
      lastLoginAt: '2026/09/18 11:10',
    },
  ];

  return pool.slice(0, targetCount);
}

export function EnterpriseUserModal({ open, onOpenChange, enterprise }: EnterpriseUserModalProps) {
  // Store users per enterprise
  const [usersMap, setUsersMap] = useState<Record<string, EnterpriseUser[]>>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    phone: '',
    email: '',
    department: '',
    role: 'operator' as EnterpriseUser['role'],
  });

  // Current enterprise users
  const currentEnterpriseUsers = useMemo(() => {
    if (!enterprise) return [];
    if (!usersMap[enterprise.id]) {
      return getInitialEnterpriseUsers(enterprise);
    }
    return usersMap[enterprise.id];
  }, [enterprise, usersMap]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return currentEnterpriseUsers.filter((u) => {
      if (selectedRole !== 'all' && u.role !== selectedRole) return false;
      if (!searchKeyword.trim()) return true;
      const kw = searchKeyword.toLowerCase();
      return (
        u.name.toLowerCase().includes(kw) ||
        u.phone.includes(kw) ||
        u.account.toLowerCase().includes(kw) ||
        u.department.toLowerCase().includes(kw)
      );
    });
  }, [currentEnterpriseUsers, selectedRole, searchKeyword]);

  // Handle Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enterprise) return;
    if (!newUserForm.name.trim()) {
      toast.error('请输入用户姓名');
      return;
    }
    if (!newUserForm.phone.trim()) {
      toast.error('请输入手机号');
      return;
    }

    const roleNameMap: Record<EnterpriseUser['role'], string> = {
      admin: '企业超级管理员',
      operator: '系统运维主管',
      monitor: '能耗监测分析员',
      viewer: '只读访客',
    };

    const newUser: EnterpriseUser = {
      id: `usr-${enterprise.id}-${Date.now()}`,
      name: newUserForm.name.trim(),
      account: `user_${newUserForm.phone.slice(-4)}`,
      phone: newUserForm.phone.trim(),
      email: newUserForm.email.trim() || undefined,
      department: newUserForm.department.trim() || '生产技术部',
      role: newUserForm.role,
      roleName: roleNameMap[newUserForm.role],
      status: 'active',
      createdAt: new Date().toLocaleDateString('zh-CN'),
      lastLoginAt: '从未登录',
    };

    const updated = [newUser, ...currentEnterpriseUsers];
    setUsersMap((prev) => ({ ...prev, [enterprise.id]: updated }));
    setIsAddUserOpen(false);
    setNewUserForm({
      name: '',
      phone: '',
      email: '',
      department: '',
      role: 'operator',
    });
    toast.success(`成功为企业添加用户【${newUser.name}】！初始密码已下发`);
  };

  // Toggle user status
  const handleToggleStatus = (userId: string) => {
    if (!enterprise) return;
    const updated = currentEnterpriseUsers.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'disabled' : 'active';
        toast.info(`用户【${u.name}】已${nextStatus === 'active' ? '启用' : '禁用'}`);
        return { ...u, status: nextStatus as 'active' | 'disabled' };
      }
      return u;
    });
    setUsersMap((prev) => ({ ...prev, [enterprise.id]: updated }));
  };

  // Reset password
  const handleResetPassword = (user: EnterpriseUser) => {
    toast.success(`已为【${user.name}】重置登录密码，随机密码已通过短信发送至 ${user.phone}`);
  };

  // Delete user
  const handleDeleteUser = (user: EnterpriseUser) => {
    if (!enterprise) return;
    if (user.role === 'admin') {
      toast.error('不可删除企业超级管理员账号');
      return;
    }
    const updated = currentEnterpriseUsers.filter((u) => u.id !== user.id);
    setUsersMap((prev) => ({ ...prev, [enterprise.id]: updated }));
    toast.success(`用户【${user.name}】已删除`);
  };

  if (!enterprise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base text-gray-900 font-bold">
              <Users className="size-5 text-emerald-600" />
              <span>企业用户列表</span>
              <span className="text-gray-400 font-normal">|</span>
              <span className="text-gray-700 font-medium text-sm truncate max-w-[340px]">
                {enterprise.fullName}
              </span>
            </DialogTitle>
          </div>

          {/* Quick info bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <div>
              <span className="text-gray-400">企业编号：</span>
              <span className="font-mono text-gray-700">{enterprise.code}</span>
            </div>
            <div>
              <span className="text-gray-400">负责人：</span>
              <span className="text-gray-700 font-medium">{enterprise.contactName}</span>
              <span className="font-mono ml-1 text-gray-500">({enterprise.contactPhone})</span>
            </div>
            <div>
              <span className="text-gray-400">已注册用户：</span>
              <span className="text-emerald-700 font-semibold">{currentEnterpriseUsers.length} 人</span>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="size-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <Input
                  placeholder="搜索用户姓名、手机号、账号..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-50 border-gray-200 w-full"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-8 text-xs w-[130px] bg-slate-50 border-gray-200">
                  <SelectValue placeholder="全部角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  <SelectItem value="admin">企业管理员</SelectItem>
                  <SelectItem value="operator">系统运维主管</SelectItem>
                  <SelectItem value="monitor">能耗监测分析员</SelectItem>
                  <SelectItem value="viewer">只读访客</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddUserOpen(!isAddUserOpen)}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>{isAddUserOpen ? '收起表单' : '新增用户'}</span>
            </Button>
          </div>

          {/* Inline Add User Form */}
          {isAddUserOpen && (
            <form
              onSubmit={handleAddUser}
              className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-lg space-y-3 animate-in fade-in-50"
            >
              <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
                <UserCheck className="size-3.5" />
                <span>为企业新增人员账号</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] text-gray-600 mb-1">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="如：张工"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, name: e.target.value }))}
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 mb-1">
                    手机号 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="11位手机号"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, phone: e.target.value }))}
                    className="h-8 text-xs bg-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 mb-1">部门 / 科室</label>
                  <Input
                    placeholder="如：动力运维科"
                    value={newUserForm.department}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, department: e.target.value }))}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 mb-1">权限角色</label>
                  <Select
                    value={newUserForm.role}
                    onValueChange={(val: EnterpriseUser['role']) =>
                      setNewUserForm((p) => ({ ...p, role: val }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">系统运维主管</SelectItem>
                      <SelectItem value="monitor">能耗监测分析员</SelectItem>
                      <SelectItem value="viewer">只读访客</SelectItem>
                      <SelectItem value="admin">企业超级管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddUserOpen(false)}
                  className="h-7 text-xs"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  确认添加
                </Button>
              </div>
            </form>
          )}

          {/* User Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <th className="py-2.5 px-3 whitespace-nowrap">用户</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">角色权限</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">手机号</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">部门</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">状态</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">最后登录</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      <Users className="size-8 mx-auto text-gray-300 mb-1.5" />
                      <p>未找到匹配的企业用户</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Account */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{u.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{u.account}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            u.role === 'admin'
                              ? 'text-amber-700 bg-amber-50 border-amber-200'
                              : u.role === 'operator'
                              ? 'text-blue-700 bg-blue-50 border-blue-200'
                              : 'text-gray-600 bg-gray-100 border-gray-200'
                          }`}
                        >
                          <ShieldCheck className="size-3" />
                          {u.roleName}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-2.5 px-3 font-mono text-gray-600 whitespace-nowrap">
                        {u.phone}
                      </td>

                      {/* Department */}
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap max-w-[140px] truncate">
                        {u.department}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            u.status === 'active' ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        >
                          {u.status === 'active' ? (
                            <>
                              <CheckCircle2 className="size-3" />
                              正常
                            </>
                          ) : (
                            <>
                              <XCircle className="size-3" />
                              已禁用
                            </>
                          )}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-2.5 px-3 text-gray-400 text-[11px] font-mono whitespace-nowrap">
                        {u.lastLoginAt}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u)}
                            className="text-gray-500 hover:text-blue-600 transition-colors"
                            title="重置登录密码"
                          >
                            <KeyRound className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u.id)}
                            className={`transition-colors ${
                              u.status === 'active'
                                ? 'text-gray-400 hover:text-amber-600'
                                : 'text-gray-400 hover:text-emerald-600'
                            }`}
                            title={u.status === 'active' ? '禁用账号' : '启用账号'}
                          >
                            {u.status === 'active' ? (
                              <UserX className="size-3.5" />
                            ) : (
                              <UserCheck className="size-3.5" />
                            )}
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="删除用户"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            提示：此处为基础交互演示，可点击右上角新增人员或管理企业账号。
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
