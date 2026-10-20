import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { CheckCircle, XCircle, Clock, Search, Users, MessageSquare, FileText, Calendar as CalendarIcon, ChevronDown, X, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { cn } from '../components/ui/utils';
import { toast } from 'sonner';
import { CHANNEL_LABELS, SERVICE_LABELS } from '../contexts/TemplateContext';
import type { ChannelType, ServiceType, TargetType } from '../contexts/TemplateContext';

type MessageCategory = 'user' | 'internal';
type InternalChannelType = 'sms' | 'email' | 'wecom';

interface NotificationRecord {
  id: string;
  groupId: string;
  templateId: string;
  messageCategory: MessageCategory;
  templateName: string;
  enterprise: string;
  serviceType: ServiceType;
  channel: ChannelType;
  internalChannel?: InternalChannelType;
  targetType: TargetType;
  recipientCount: number;
  content: string;
  webhookUrl?: string;
  status: 'success' | 'pending' | 'failed';
  sentAt: Date;
}

const mockNotifications: NotificationRecord[] = [
  // ── 用户推送 ──────────────────────────────────────────────────
  { id: 'n1',  groupId: 'MG-20260630-0042', templateId: 'TPL-001', messageCategory: 'user', templateName: '电网异常预警通知',  enterprise: '国家电网',   serviceType: 'virtual_power_plant', channel: 'web',         targetType: 'user',       recipientCount: 4, content: '【零碳平台】国家电网虚拟电厂检测到电网负荷异常。当前负荷：1240 MW，超出阈值 40 MW。请立即处理。时间：2026-06-30 09:42。',          status: 'success', sentAt: new Date('2026-06-30T09:42:00') },
  { id: 'n2',  groupId: 'MG-20260630-0039', templateId: 'TPL-004', messageCategory: 'user', templateName: '验证码短信',         enterprise: '华能集团',   serviceType: 'all',                channel: 'sms',         targetType: 'user',       recipientCount: 1, content: '【零碳科技】您的验证码是 839201，5 分钟内有效，请勿泄露给他人。',                                                                    status: 'success', sentAt: new Date('2026-06-30T09:05:00') },
  { id: 'n3',  groupId: 'MG-20260630-0031', templateId: 'TPL-002', messageCategory: 'user', templateName: '月度碳排放报告',     enterprise: '全部企业',   serviceType: 'energy_management',  channel: 'web',         targetType: 'enterprise', recipientCount: 5, content: '尊敬的管理员：\n\n华能集团 2026 年 5 月度碳排放分析报告已生成。\n\n- 本月总碳排放：12,840 吨 CO₂\n- 较上月变化：-3.2%\n- 碳减排完成率：87%\n- 绿电使用占比：34%\n\n请登录零碳平台查看完整报告。', status: 'success', sentAt: new Date('2026-06-30T08:00:00') },
  { id: 'n4',  groupId: 'MG-20260629-0088', templateId: 'TPL-003', messageCategory: 'user', templateName: '微网负载均衡提醒',   enterprise: '宁德时代',   serviceType: 'smart_microgrid',    channel: 'miniprogram', targetType: 'user',       recipientCount: 1, content: '【智能微网】宁德时代 A 区微网当前负载率达 92%，系统已自动启动负载均衡策略。储能状态：充电中，光伏出力：320 kW，预计恢复：16:50。',  status: 'pending', sentAt: new Date('2026-06-29T16:30:00') },
  { id: 'n5',  groupId: 'MG-20260629-0071', templateId: 'TPL-005', messageCategory: 'user', templateName: '设备维护通知',       enterprise: '比亚迪能源', serviceType: 'energy_management',  channel: 'sms',         targetType: 'user',       recipientCount: 1, content: '【零碳平台】储能柜 BYD-E04（编号 E04-229）将于 2026-06-30 09:00 进行定期维护，预计 4 小时，请提前做好准备。负责人：张工。',          status: 'failed',  sentAt: new Date('2026-06-29T11:00:00') },
  { id: 'n6',  groupId: 'MG-20260629-0055', templateId: 'TPL-006', messageCategory: 'user', templateName: '削峰响应邀请',       enterprise: '全部企业',   serviceType: 'virtual_power_plant', channel: 'miniprogram', targetType: 'enterprise', recipientCount: 5, content: '【虚拟电厂】系统预测 2026-06-30 18:00 将出现用电高峰。响应需求：200 MW，时段：18:00—20:00，补贴：0.8 元/kWh。请尽快确认参与。',  status: 'success', sentAt: new Date('2026-06-29T08:30:00') },
  { id: 'n7',  groupId: 'MG-20260628-0103', templateId: 'TPL-007', messageCategory: 'user', templateName: '账号开通通知',       enterprise: '中广核集团', serviceType: 'all',                channel: 'sms',         targetType: 'user',       recipientCount: 1, content: '【零碳科技】您的零碳管理平台账号已开通，企业：中广核集团，初始密码：Cgn@2026，请及时登录修改密码。',                                   status: 'success', sentAt: new Date('2026-06-28T14:20:00') },
  { id: 'n8',  groupId: 'MG-20260628-0099', templateId: 'TPL-001', messageCategory: 'user', templateName: '电网异常预警通知',   enterprise: '国家电网',   serviceType: 'virtual_power_plant', channel: 'web',         targetType: 'user',       recipientCount: 3, content: '【零碳平台】国家电网虚拟电厂检测到电网负荷异常。当前负荷：1380 MW，超出阈值 180 MW。请立即处理。时间：2026-06-28 22:17。',         status: 'success', sentAt: new Date('2026-06-28T22:17:00') },
  // ── 内部推送 ──────────────────────────────────────────────────
  { id: 'i1',  groupId: 'MG-20260630-0028', templateId: 'TPL-008', messageCategory: 'internal', templateName: '运维团队周报邮件',  enterprise: '-', serviceType: 'energy_management',  channel: 'sms', internalChannel: 'email', targetType: 'user', recipientCount: 3, content: '各位运维同事：\n\n本周（2026-06-23 至 06-29）运维工作摘要如下：\n\n- 处理设备告警：14 次\n- 完成维护任务：8 项\n- 平均响应时长：12 分钟\n\n请查阅附件了解详情，如有问题请及时反馈。\n\n零碳运营中心', status: 'success', sentAt: new Date('2026-06-30T08:00:00') },
  { id: 'i2',  groupId: 'MG-20260629-0112', templateId: 'TPL-009', messageCategory: 'internal', templateName: '系统告警短信',      enterprise: '-', serviceType: 'all',                channel: 'sms', internalChannel: 'sms',   targetType: 'user', recipientCount: 1, content: '【系统告警】虚拟电厂调度服务响应超时，持续时间 3 分钟，请立即排查。时间：2026-06-29 23:43。',                                          status: 'success', sentAt: new Date('2026-06-29T23:45:00') },
  { id: 'i3',  groupId: 'MG-20260629-0094', templateId: 'TPL-010', messageCategory: 'internal', templateName: '值班人员提醒',      enterprise: '-', serviceType: 'smart_microgrid',    channel: 'sms', internalChannel: 'sms',   targetType: 'user', recipientCount: 1, content: '【值班提醒】您今晚（2026-06-29 20:00—次日08:00）为智能微网系统值班人员，请注意查收告警信息并保持手机畅通。',                       status: 'failed',  sentAt: new Date('2026-06-29T18:00:00') },
  { id: 'i4',  groupId: 'MG-20260629-0062', templateId: 'TPL-008', messageCategory: 'internal', templateName: '运维团队周报邮件',  enterprise: '-', serviceType: 'energy_management',  channel: 'sms', internalChannel: 'email', targetType: 'user', recipientCount: 6, content: '各位运维同事：\n\n本周（2026-06-16 至 06-22）运维工作摘要如下：\n\n- 处理设备告警：9 次\n- 完成维护任务：5 项\n- 平均响应时长：18 分钟\n\n请查阅附件了解详情，如有问题请及时反馈。\n\n零碳运营中心', status: 'pending', sentAt: new Date('2026-06-29T08:00:00') },
  { id: 'i5',  groupId: 'MG-20260628-0077', templateId: 'TPL-011', messageCategory: 'internal', templateName: '系统版本更新通知',  enterprise: '-', serviceType: 'all',                channel: 'sms', internalChannel: 'email', targetType: 'user', recipientCount: 8, content: '各位同事：\n\n零碳管理平台将于 2026-06-29 22:00 进行 v3.4.1 版本更新，预计停机 30 分钟。本次更新包含：\n\n- 修复虚拟电厂调度响应延迟问题\n- 优化碳排放报告导出速度\n- 新增微网拓扑可视化功能\n\n请提前做好准备。', status: 'success', sentAt: new Date('2026-06-28T17:30:00') },
  { id: 'i6',  groupId: 'MG-20260627-0011', templateId: 'TPL-012', messageCategory: 'internal', templateName: '故障应急短信',      enterprise: '-', serviceType: 'virtual_power_plant', channel: 'sms', internalChannel: 'sms',  targetType: 'user', recipientCount: 1, content: '【故障应急】虚拟电厂 VPP-03 发生通信中断，请立即到机房处理。联系：运维负责人 赵磊 139****4401。时间：2026-06-27 03:10。',            status: 'success', sentAt: new Date('2026-06-27T03:12:00') },
  { id: 'i7',  groupId: 'MG-20260630-0045', templateId: 'TPL-009', messageCategory: 'internal', templateName: '能耗超标企微预警通知', enterprise: '-', serviceType: 'energy_management',  channel: 'sms', internalChannel: 'wecom', webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=9b823e41-6cd7-4bb9-8231-8971f112e431', targetType: 'user', recipientCount: 2, content: '【能耗异动预警】监测对象：一号动力电池储能电站，当前实时用电负荷为 3,420 kW（超出额定阈值 420 kW），告警时间：2026-06-30 10:15。请运维人员及值班班长及时进行负荷排查与调控！', status: 'success', sentAt: new Date('2026-06-30T10:15:00') },
];

const STATUS_CONFIG = {
  success: { icon: CheckCircle, label: '发送成功', backgroundColor: '#d1fae5', color: '#065f46', iconColor: '#059669' },
  pending: { icon: Clock,        label: '发送中',   backgroundColor: '#fef3c7', color: '#92400e', iconColor: '#f59e0b' },
  failed:  { icon: XCircle,      label: '发送失败', backgroundColor: '#fee2e2', color: '#991b1b', iconColor: '#ef4444' },
};

const CHANNEL_STYLE: Record<ChannelType, { backgroundColor: string; color: string }> = {
  web:         { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  miniprogram: { backgroundColor: '#f0fdf4', color: '#15803d' },
  sms:         { backgroundColor: '#d1fae5', color: '#047857' },
  inapp:       { backgroundColor: '#ede9fe', color: '#5b21b6' },
};

const INTERNAL_CHANNEL_STYLE: Record<InternalChannelType, { backgroundColor: string; color: string }> = {
  sms:   { backgroundColor: '#d1fae5', color: '#047857' },
  email: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  wecom: { backgroundColor: '#e0f2fe', color: '#0284c7' },
};

export default function NotificationHistory() {
  const [categoryTab, setCategoryTab] = useState<MessageCategory>('user');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter]   = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelType | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceType | 'all'>('all');
  const [internalChFilter, setInternalChFilter] = useState<InternalChannelType | 'all'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<NotificationRecord | null>(null);

  const pool = mockNotifications.filter(n => n.messageCategory === categoryTab);

  const filtered = pool.filter((n) => {
    const q = search.toLowerCase();
    const from = dateFrom ? new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate(), 0, 0, 0, 0) : null;
    const to   = dateTo   ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999) : null;
    return (
      n.templateName.toLowerCase().includes(q) &&
      (statusFilter  === 'all' || n.status === statusFilter) &&
      (channelFilter === 'all' || categoryTab === 'internal' || n.channel === channelFilter) &&
      (internalChFilter === 'all' || categoryTab === 'user' || n.internalChannel === internalChFilter) &&
      (serviceFilter === 'all' || n.serviceType === serviceFilter) &&
      (!from || n.sentAt >= from) &&
      (!to   || n.sentAt <= to)
    );
  });


  return (
    <div className="p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          推送记录
        </h1>
        <p className="text-sm text-gray-500">查看各企业和服务模块的消息推送历史</p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: '#f1f5f9' }}>
        {([
          { value: 'user'     as MessageCategory, label: '用户推送', icon: Users },
          { value: 'internal' as MessageCategory, label: '内部推送', icon: MessageSquare },
        ]).map(({ value, label, icon: Icon }) => {
          const active = categoryTab === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setCategoryTab(value);
                setSearch('');
                setStatusFilter('all');
                setChannelFilter('all');
                setServiceFilter('all');
                setInternalChFilter('all');
                setDateFrom(undefined);
                setDateTo(undefined);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={active
                ? { background: '#fff', color: '#2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#64748b' }}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          );
        })}
      </div>



      {/* Filters (Traditional) */}
      <Card className="p-5 mb-5 rounded-md shadow-sm border-gray-200">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">模糊搜索:</span>
            <Input
              placeholder={categoryTab === 'user' ? '搜索模板或企业...' : '搜索模板或接收人...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm h-9 w-64"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">发送状态:</span>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="全部状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="success">发送成功</SelectItem>
                <SelectItem value="pending">发送中</SelectItem>
                <SelectItem value="failed">发送失败</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">推送渠道:</span>
            {categoryTab === 'user' ? (
              <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelType | 'all')}>
                <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="全部渠道" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部渠道</SelectItem>
                  <SelectItem value="inapp">站内信</SelectItem>
                  <SelectItem value="sms">短信</SelectItem>
                  <SelectItem value="miniprogram">小程序订阅消息</SelectItem>
                  <SelectItem value="web">网页端</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={internalChFilter} onValueChange={(v) => setInternalChFilter(v as InternalChannelType | 'all')}>
                <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="全部渠道" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部渠道</SelectItem>
                  <SelectItem value="sms">短信</SelectItem>
                  <SelectItem value="email">邮件</SelectItem>
                  <SelectItem value="wecom">企业微信</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">服务模块:</span>
            <Select value={serviceFilter} onValueChange={(v) => setServiceFilter(v as ServiceType | 'all')}>
              <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="全部模块" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模块</SelectItem>
                <SelectItem value="energy_management">能源管理</SelectItem>
                <SelectItem value="smart_microgrid">智能微网</SelectItem>
                <SelectItem value="virtual_power_plant">虚拟电厂</SelectItem>
                <SelectItem value="all_platform">平台通知</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">发送时间:</span>
            <div className="flex items-center gap-1.5">
              {/* 开始时间 */}
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-9 w-36 items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm transition-colors text-left outline-none hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs",
                      dateFrom ? "text-gray-800" : "text-gray-400"
                    )}
                  >
                    <span className="truncate">{dateFrom ? format(dateFrom, "yyyy-MM-dd", { locale: zhCN }) : "开始时间"}</span>
                    <CalendarIcon className="size-3.5 text-gray-400 shrink-0 ml-1" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                    <span className="text-xs font-medium text-gray-600">选择开始时间</span>
                    {dateFrom && (
                      <button
                        type="button"
                        onClick={() => { setDateFrom(undefined); setStartOpen(false); }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => {
                      setDateFrom(d);
                      setStartOpen(false);
                    }}
                    initialFocus
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-gray-400 text-sm select-none">至</span>

              {/* 结束时间 */}
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-9 w-36 items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm transition-colors text-left outline-none hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs",
                      dateTo ? "text-gray-800" : "text-gray-400"
                    )}
                  >
                    <span className="truncate">{dateTo ? format(dateTo, "yyyy-MM-dd", { locale: zhCN }) : "结束时间"}</span>
                    <CalendarIcon className="size-3.5 text-gray-400 shrink-0 ml-1" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                    <span className="text-xs font-medium text-gray-600">选择结束时间</span>
                    {dateTo && (
                      <button
                        type="button"
                        onClick={() => { setDateTo(undefined); setEndOpen(false); }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => {
                      setDateTo(d);
                      setEndOpen(false);
                    }}
                    initialFocus
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>

              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors ml-0.5"
                  title="清除全部时间"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {filtered.length !== pool.length && (
              <span className="text-xs text-gray-400 mr-2">已过滤 {filtered.length} / {pool.length}</span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-5 hover:bg-gray-50 text-gray-700"
              onClick={() => { 
                setSearch(''); 
                setStatusFilter('all'); 
                setChannelFilter('all'); 
                setInternalChFilter('all'); 
                setServiceFilter('all'); 
                setDateFrom(undefined); 
                setDateTo(undefined);
                toast.info('筛选条件已重置');
              }}
            >
              重置
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
              onClick={() => {
                toast.success(`查询完成，共找到 ${filtered.length} 条记录`);
              }}
            >
              <Search className="size-4 mr-1.5" /> 查询
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {(categoryTab === 'user'
                  ? ['消息组ID', '模板ID', '模板名称', '推送渠道', '服务模块', '目标企业', '接收对象', '消息内容', '发送状态', '发送时间']
                  : ['消息组ID', '模板ID', '模板名称', '推送渠道', '服务模块', '接收成员', '消息内容', '发送状态', '发送时间']
                ).map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap"
                    style={{ color: '#64748b', letterSpacing: '0.03em' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={categoryTab === 'user' ? 10 : 9} className="py-16 text-center text-sm text-gray-400">
                    暂无推送记录
                  </td>
                </tr>
              ) : (
                filtered.map((n, i) => {
                  const sc = STATUS_CONFIG[n.status];
                  const StatusIcon = sc.icon;
                  const cs = CHANNEL_STYLE[n.channel];
                  const intCh = n.internalChannel ?? 'sms';
                  const intChStyle = INTERNAL_CHANNEL_STYLE[intCh] ?? { backgroundColor: '#f1f5f9', color: '#475569' };
                  const intChLabel = intCh === 'email' ? '邮件' : intCh === 'wecom' ? '企业微信' : '短信';

                  return (
                    <tr
                      key={n.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : undefined }}
                    >
                      {/* 消息组ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-500">{n.groupId}</span>
                      </td>
                      {/* 模板ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-500">{n.templateId}</span>
                      </td>
                      {/* 模板名称 */}
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {n.templateName}
                      </td>
                      {/* 推送渠道 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {categoryTab === 'internal' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: intChStyle.backgroundColor, color: intChStyle.color }}>
                            {intChLabel}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: cs.backgroundColor, color: cs.color }}>
                            {CHANNEL_LABELS[n.channel]}
                          </span>
                        )}
                      </td>
                      {/* 服务模块 */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                        {SERVICE_LABELS[n.serviceType]}
                      </td>
                      {/* 目标企业 — user only */}
                      {categoryTab === 'user' && (
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {n.enterprise}
                        </td>
                      )}
                      {/* 接收对象 / 接收成员 */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs tabular-nums text-gray-700">
                        {n.recipientCount.toLocaleString()}
                      </td>
                      {/* 消息内容 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewRecord(n)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          <FileText className="size-3.5" />
                          查看
                        </button>
                      </td>
                      {/* 发送状态 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: sc.backgroundColor, color: sc.color }}>
                          <StatusIcon className="size-3" style={{ color: sc.iconColor }} />
                          {sc.label}
                        </span>
                      </td>
                      {/* 发送时间 */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs tabular-nums text-gray-400">
                        {n.sentAt.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">共 {filtered.length} 条记录</span>
          </div>
        )}
      </Card>

      {/* 消息内容预览弹窗 */}
      <Dialog open={!!previewRecord} onOpenChange={() => setPreviewRecord(null)}>
        <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-xl max-h-[88vh] overflow-y-auto transition-all duration-200" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FileText className="size-4 text-blue-600" />
              消息内容
            </DialogTitle>
          </DialogHeader>
          {previewRecord && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">{previewRecord.templateName}</span>
                  <span>·</span>
                  <span>{previewRecord.sentAt.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {previewRecord.channel === 'miniprogram' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <Smartphone className="size-3 text-emerald-600" />
                    小程序订阅消息
                  </span>
                )}
              </div>
              <div
                className="rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                {previewRecord.content}
              </div>
              {previewRecord.channel === 'miniprogram' && (
                <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                  <span>微信服务通知推送 · 授权用户直接在微信接收卡片</span>
                  <span className="font-medium text-gray-800">进入小程序查看 &gt;</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
