import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import {
  Bell, Zap, Globe, Smartphone, MessageSquare, BookOpen,
  Plus, Edit2, Trash2, Search, Copy, ShieldAlert, SlidersHorizontal,
  TrendingDown, BarChart3, FileText, MessageCircle, Link2, Code2, RotateCcw,
} from 'lucide-react';

// ── SMS Templates ────────────────────────────────────────────
type SmsScope = 'global' | 'energy_management' | 'smart_microgrid' | 'virtual_power_plant';

const SMS_SCOPE_LABELS: Record<SmsScope, string> = {
  global:              '全局通用',
  energy_management:   '能源管理',
  smart_microgrid:     '智能微网',
  virtual_power_plant: '虚拟电厂',
};

const SMS_SCOPE_STYLE: Record<SmsScope, { bg: string; text: string }> = {
  global:              { bg: '#f1f5f9', text: '#475569' },
  energy_management:   { bg: '#d1fae5', text: '#065f46' },
  smart_microgrid:     { bg: '#dbeafe', text: '#1e40af' },
  virtual_power_plant: { bg: '#fef3c7', text: '#92400e' },
};

interface SmsTemplate {
  id: string;
  code: string;
  eventDesc: string;
  content: string;
  scope: SmsScope;
  updatedAt: Date;
  updatedBy: string;
}

const INIT_SMS_TEMPLATES: SmsTemplate[] = [
  { id: 'sms-1', code: 'SMS_VERIFY_CODE',     eventDesc: '用户登录或操作时发送验证码',                 content: '【零碳科技】您的验证码是 {{code}}，{{minutes}} 分钟内有效，请勿泄露给他人。',                                                                                   scope: 'global',              updatedAt: new Date('2026-07-01'), updatedBy: '张磊' },
  { id: 'sms-2', code: 'SMS_ACCOUNT_CREATED', eventDesc: '新企业账号开通时通知联系人',                 content: '【零碳科技】您的零碳管理平台账号已开通，企业：{{enterpriseName}}，初始密码：{{password}}，请及时登录修改密码。',                                              scope: 'global',              updatedAt: new Date('2026-07-02'), updatedBy: '陈静' },
  { id: 'sms-3', code: 'SMS_DEVICE_ALERT',    eventDesc: '设备发生故障或异常告警时触发',               content: '【零碳平台】{{enterpriseName}} 设备 {{deviceName}}（{{deviceId}}）发生告警，请及时处理。时间：{{alertTime}}。',                                            scope: 'energy_management',   updatedAt: new Date('2026-07-03'), updatedBy: '王浩' },
  { id: 'sms-4', code: 'SMS_MAINTENANCE',     eventDesc: '设备计划性维护前提前通知相关人员',           content: '【零碳平台】{{deviceName}}（{{deviceId}}）将于 {{maintenanceTime}} 进行定期维护，预计 {{duration}} 小时，负责人：{{engineerName}}。',                      scope: 'energy_management',   updatedAt: new Date('2026-07-05'), updatedBy: '刘洋' },
  { id: 'sms-5', code: 'SMS_PEAK_RESPONSE',   eventDesc: '虚拟电厂削峰调度时邀请企业参与响应',         content: '【虚拟电厂】系统预测高峰时段 {{peakTime}} 将出现用电高峰，响应需求：{{responseRequest}} MW，补贴：{{subsidy}} 元/kWh，请尽快确认参与。',                  scope: 'virtual_power_plant', updatedAt: new Date('2026-07-06'), updatedBy: '赵磊' },
  { id: 'sms-6', code: 'SMS_EMISSION_ALERT',  eventDesc: '企业月度碳排放超出计划阈值时预警',           content: '【零碳平台】{{enterpriseName}} 本月碳排放已达 {{totalEmission}} 吨，变化 {{emissionChange}}，减排完成率 {{reductionRate}}%，请关注。',                   scope: 'energy_management',   updatedAt: new Date('2026-07-08'), updatedBy: '系统' },
  { id: 'sms-7', code: 'SMS_GRID_ALERT',      eventDesc: '电网调度服务异常时通知运维人员',             content: '【系统告警】虚拟电厂调度服务响应异常，持续时间 {{duration}} 分钟，当前负荷 {{currentLoad}} MW，请立即排查。时间：{{alertTime}}。',                         scope: 'virtual_power_plant', updatedAt: new Date('2026-07-09'), updatedBy: '陈静' },
  { id: 'sms-8', code: 'SMS_DUTY_REMINDER',   eventDesc: '值班人员上岗前发送值班提醒',                 content: '【值班提醒】您今晚（{{peakTime}}）为 {{gridName}} 系统值班人员，请注意查收告警信息并保持手机畅通。',                                                        scope: 'smart_microgrid',     updatedAt: new Date('2026-07-10'), updatedBy: '刘洋' },
];

const BLANK_SMS: Omit<SmsTemplate, 'id' | 'updatedAt' | 'updatedBy'> = {
  code: '', eventDesc: '', content: '', scope: 'global',
};

function SmsTemplateDialog({ initial, onClose, onSave }: {
  initial?: SmsTemplate;
  onClose: () => void;
  onSave: (data: Omit<SmsTemplate, 'id' | 'updatedAt' | 'updatedBy'>) => void;
}) {
  const [form, setForm] = useState(
    initial ? { code: initial.code, eventDesc: initial.eventDesc, content: initial.content, scope: initial.scope } : { ...BLANK_SMS }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { toast.error('请填写短信编码'); return; }
    if (!/^[A-Z0-9_]+$/.test(form.code)) { toast.error('短信编码只能包含大写字母、数字和下划线'); return; }
    if (!form.content.trim()) { toast.error('请填写短信内容'); return; }
    onSave(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{initial ? '编辑短信模版' : '新增短信模版'}</DialogTitle>
        </DialogHeader>
        <form id="sms-form" onSubmit={handleSubmit}>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-sm">短信编码 <span className="text-red-500">*</span></Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
                placeholder="SMS_VERIFY_CODE"
                className="h-9 text-sm font-mono"
                disabled={!!initial}
              />
              {!initial && <p className="text-xs text-gray-400">只能包含大写字母、数字和下划线，创建后不可修改</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">事件描述</Label>
              <Input
                value={form.eventDesc}
                onChange={(e) => setForm((p) => ({ ...p, eventDesc: e.target.value }))}
                placeholder="例如：用户登录时发送验证码"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">所属服务</Label>
              <Select value={form.scope} onValueChange={(v) => setForm((p) => ({ ...p, scope: v as SmsScope }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">全局通用</SelectItem>
                  <SelectItem value="energy_management">能源管理</SelectItem>
                  <SelectItem value="smart_microgrid">智能微网</SelectItem>
                  <SelectItem value="virtual_power_plant">虚拟电厂</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">短信内容 <span className="text-red-500">*</span></Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                placeholder="输入短信内容，使用 {{变量名}} 插入动态变量"
                rows={5}
                className="text-sm resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">用 {`{{变量名}}`} 格式插入动态内容</p>
                <p className="text-xs text-gray-400">{form.content.length} 字</p>
              </div>
            </div>
          </div>
        </form>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" form="sms-form" type="submit" style={{ background: '#2563eb' }} className="text-white hover:opacity-90">
            {initial ? '保存修改' : '新增模版'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Variable Dictionary ───────────────────────────────────────
type VarType = 'param' | 'path';
type VarScope = 'global' | 'energy_management' | 'smart_microgrid' | 'virtual_power_plant';

const VAR_TYPE_LABELS: Record<VarType, string> = {
  param: '参数变量',
  path:  '路径变量',
};

const VAR_TYPE_STYLE: Record<VarType, { bg: string; text: string; border: string }> = {
  param: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  path:  { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
};

const SCOPE_LABELS: Record<VarScope, string> = {
  global:              '全局通用',
  energy_management:   '能源管理',
  smart_microgrid:     '智能微网',
  virtual_power_plant: '虚拟电厂',
};

const SCOPE_STYLE: Record<VarScope, { bg: string; text: string }> = {
  global:              { bg: '#f1f5f9', text: '#475569' },
  energy_management:   { bg: '#d1fae5', text: '#065f46' },
  smart_microgrid:     { bg: '#dbeafe', text: '#1e40af' },
  virtual_power_plant: { bg: '#fef3c7', text: '#92400e' },
};

interface VarDef {
  id: string;
  name: string;
  type: VarType;
  description: string;
  example: string;
  scope: VarScope;
  webPath?: string;
  miniprogramPath?: string;
}

const INIT_VARS: VarDef[] = [
  // ── 全局通用 (2 参数变量 + 2 路径变量)
  { id: 'v1',  name: 'enterpriseName',      type: 'param', description: '企业名称',           example: '华能集团',                     scope: 'global' },
  { id: 'v2',  name: 'contactName',         type: 'param', description: '联系人姓名',         example: '张伟',                         scope: 'global' },
  { id: 'v3',  name: 'portalHomeUrl',       type: 'path',  description: '企业工作台首页路径',   example: '', scope: 'global',            webPath: '/dashboard/home',                    miniprogramPath: 'pages/home/index' },
  { id: 'v4',  name: 'carbonReportUrl',     type: 'path',  description: '碳盘查月度报告路径',   example: '', scope: 'global',            webPath: '/reports/carbon/monthly',             miniprogramPath: 'pages/report/monthly' },

  // ── 能源管理 (2 参数变量 + 2 路径变量)
  { id: 'v5',  name: 'totalEmission',       type: 'param', description: '总碳排放量（吨）',   example: '12,430',                       scope: 'energy_management' },
  { id: 'v6',  name: 'reductionRate',       type: 'param', description: '减排完成率（%）',    example: '76',                          scope: 'energy_management' },
  { id: 'v7',  name: 'alarmDetailUrl',      type: 'path',  description: '告警详情页面路径',   example: '', scope: 'energy_management',  webPath: '/energy/alerts/detail?id={alertId}',  miniprogramPath: 'pages/alert/detail?id={alertId}' },
  { id: 'v8',  name: 'deviceDetailUrl',     type: 'path',  description: '设备运维详情路径',   example: '', scope: 'energy_management',  webPath: '/devices/detail?id={deviceId}',       miniprogramPath: 'pages/device/detail?id={deviceId}' },

  // ── 智能微网 (2 参数变量 + 2 路径变量)
  { id: 'v9',  name: 'gridName',            type: 'param', description: '微网名称',           example: 'NDE-微网A区',                  scope: 'smart_microgrid' },
  { id: 'v10', name: 'loadRate',            type: 'param', description: '负载率（%）',        example: '94',                          scope: 'smart_microgrid' },
  { id: 'v11', name: 'microgridMonitorUrl', type: 'path',  description: '微网拓扑监控路径',   example: '', scope: 'smart_microgrid',   webPath: '/microgrid/monitor?id={gridId}',      miniprogramPath: 'pages/microgrid/monitor?id={gridId}' },
  { id: 'v12', name: 'storageControlUrl',   type: 'path',  description: '储能运行控制路径',   example: '', scope: 'smart_microgrid',   webPath: '/microgrid/storage/control',          miniprogramPath: 'pages/microgrid/storage' },

  // ── 虚拟电厂 (2 参数变量 + 2 路径变量)
  { id: 'v13', name: 'currentLoad',         type: 'param', description: '当前负荷（MW）',     example: '892',                          scope: 'virtual_power_plant' },
  { id: 'v14', name: 'subsidy',             type: 'param', description: '补贴标准（元/kWh）', example: '0.8',                          scope: 'virtual_power_plant' },
  { id: 'v15', name: 'vppDispatchUrl',      type: 'path',  description: '需求响应调度中心路径', example: '', scope: 'virtual_power_plant', webPath: '/vpp/dispatch/overview',            miniprogramPath: 'pages/vpp/dispatch/index' },
  { id: 'v16', name: 'settlementBillUrl',   type: 'path',  description: '辅助服务结算账单路径', example: '', scope: 'virtual_power_plant', webPath: '/vpp/settlement/bill?id={billId}', miniprogramPath: 'pages/vpp/bill/detail?id={billId}' },
];

const BLANK_VAR: Omit<VarDef, 'id'> = {
  name: '',
  type: 'param',
  description: '',
  example: '',
  scope: 'global',
  webPath: '',
  miniprogramPath: '',
};

function VarDialog({ initial, onClose, onSave }: {
  initial?: VarDef;
  onClose: () => void;
  onSave: (v: Omit<VarDef, 'id'>) => void;
}) {
  const [form, setForm] = useState<Omit<VarDef, 'id'>>(
    initial
      ? {
          name: initial.name,
          type: initial.type ?? 'param',
          description: initial.description,
          example: initial.example ?? '',
          scope: initial.scope,
          webPath: initial.webPath ?? '',
          miniprogramPath: initial.miniprogramPath ?? '',
        }
      : { ...BLANK_VAR }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('请填写变量名'); return; }
    if (!/^\w+$/.test(form.name)) { toast.error('变量名只能包含字母、数字和下划线'); return; }
    if (form.type === 'path') {
      if (!form.webPath?.trim()) { toast.error('请填写Web端路径'); return; }
      if (!form.miniprogramPath?.trim()) { toast.error('请填写小程序路径'); return; }
    }
    onSave(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{initial ? '编辑变量' : '新增变量'}</DialogTitle>
        </DialogHeader>
        <form id="var-form" onSubmit={handleSubmit}>
          <div className="space-y-4 py-1">
            {/* 变量类型选择 */}
            <div className="space-y-1.5">
              <Label className="text-sm">变量类型 <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: 'param' }))}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    form.type === 'param'
                      ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-md flex-shrink-0 mt-0.5 ${
                    form.type === 'param' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Code2 className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-medium ${form.type === 'param' ? 'text-blue-900' : 'text-gray-800'}`}>
                        参数变量
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      消息正文中的动态业务参数
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: 'path' }))}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    form.type === 'path'
                      ? 'border-purple-500 bg-purple-50/60 ring-1 ring-purple-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-md flex-shrink-0 mt-0.5 ${
                    form.type === 'path' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Link2 className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-medium ${form.type === 'path' ? 'text-purple-900' : 'text-gray-800'}`}>
                        路径变量
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      用于Web与小程序的跳转页面
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 变量名 */}
            <div className="space-y-1.5">
              <Label className="text-sm">变量名 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono select-none">{'{{'}</span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value.replace(/\s/g, '') }))}
                  placeholder={form.type === 'path' ? 'alertDetailUrl' : 'enterpriseName'}
                  className="h-9 text-sm font-mono pl-8 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono select-none">{'}}'}</span>
              </div>
              <p className="text-xs text-gray-400">仅支持英文字母、数字和下划线，在模版中以 {`{{${form.name || '变量名'}}}`} 引用</p>
            </div>

            {/* 变量说明 */}
            <div className="space-y-1.5">
              <Label className="text-sm">变量说明</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={form.type === 'path' ? '例如：告警详情页面跳转路径' : '例如：企业名称'}
                className="h-9 text-sm"
              />
            </div>

            {/* 参数变量专属字段：示例值 */}
            {form.type === 'param' && (
              <div className="space-y-1.5">
                <Label className="text-sm">示例值</Label>
                <Input
                  value={form.example}
                  onChange={(e) => setForm((p) => ({ ...p, example: e.target.value }))}
                  placeholder="例如：华能集团"
                  className="h-9 text-sm"
                />
              </div>
            )}

            {/* 路径变量专属字段：Web端路径 & 小程序路径（均为必填） */}
            {form.type === 'path' && (
              <div className="space-y-3.5 p-3 rounded-lg border border-purple-100 bg-purple-50/30">
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="size-3.5 text-blue-600" />
                      <span>Web端路径 <span className="text-red-500">*</span></span>
                    </span>
                    <span className="text-xs text-gray-400 font-normal">PC/浏览器访问URL</span>
                  </Label>
                  <Input
                    value={form.webPath || ''}
                    onChange={(e) => setForm((p) => ({ ...p, webPath: e.target.value }))}
                    placeholder="/energy/alerts/detail?id={alertId}"
                    className="h-9 text-sm font-mono bg-white"
                  />
                  <p className="text-[11px] text-gray-400">
                    Web端页面路由或完整URL，例如：/energy/alerts/detail?id=123
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="size-3.5 text-emerald-600" />
                      <span>小程序路径 <span className="text-red-500">*</span></span>
                    </span>
                    <span className="text-xs text-gray-400 font-normal">微信小程序Page Path</span>
                  </Label>
                  <Input
                    value={form.miniprogramPath || ''}
                    onChange={(e) => setForm((p) => ({ ...p, miniprogramPath: e.target.value }))}
                    placeholder="pages/alert/detail?id={alertId}"
                    className="h-9 text-sm font-mono bg-white"
                  />
                  <p className="text-[11px] text-gray-400">
                    小程序页面路径，例如：pages/alert/detail?id=123
                  </p>
                </div>
              </div>
            )}

            {/* 所属模块 */}
            <div className="space-y-1.5">
              <Label className="text-sm">所属模块</Label>
              <Select value={form.scope} onValueChange={(v) => setForm((p) => ({ ...p, scope: v as VarScope }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">全局通用</SelectItem>
                  <SelectItem value="energy_management">能源管理</SelectItem>
                  <SelectItem value="smart_microgrid">智能微网</SelectItem>
                  <SelectItem value="virtual_power_plant">虚拟电厂</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" form="var-form" type="submit" style={{ background: '#2563eb' }} className="text-white hover:opacity-90">
            {initial ? '保存修改' : '添加变量'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Channel config ────────────────────────────────────────────
const CHANNEL_CONFIGS = [
  {
    key: 'web', icon: Globe, label: '网页端推送', desc: '平台内 WebSocket 实时消息通知',
    todaySend: 3842, successRate: 99.6, color: '#1d4ed8', bg: '#dbeafe',
  },
  {
    key: 'miniprogram', icon: Smartphone, label: '小程序订阅消息', desc: '微信小程序订阅消息推送',
    todaySend: 2167, successRate: 98.2, color: '#15803d', bg: '#f0fdf4',
  },
  {
    key: 'sms', icon: MessageSquare, label: '短信通知', desc: '通过运营商网关发送短信',
    todaySend: 894, successRate: 97.8, color: '#0284c7', bg: '#e0f2fe',
  },
  {
    key: 'wecom', icon: MessageCircle, label: '企业微信推送', desc: '通过群机器人 Webhook 向企微群或成员推送消息',
    todaySend: 1530, successRate: 99.8, color: '#0369a1', bg: '#e0f2fe',
  },
];

// ── Section header component ──────────────────────────────────
function SectionHeader({ icon: Icon, title, desc }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4 pb-3 border-b" style={{ borderColor: '#f1f5f9' }}>
      <div className="p-2 rounded-lg flex-shrink-0" style={{ background: '#eff6ff' }}>
        <Icon className="size-4 text-blue-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState('sms_templates');

  // ── SMS template state
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>(INIT_SMS_TEMPLATES);
  const [editSms, setEditSms]           = useState<SmsTemplate | null | 'new'>(null);
  const [deleteSmsId, setDeleteSmsId]   = useState<string | null>(null);
  const [smsSearch, setSmsSearch]       = useState('');

  const filteredSms = smsTemplates.filter(s => {
    const q = smsSearch.toLowerCase();
    return s.code.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
  });

  const handleSaveSms = (data: Omit<SmsTemplate, 'id' | 'updatedAt' | 'updatedBy'>) => {
    if (editSms === 'new') {
      if (smsTemplates.some(s => s.code === data.code)) { toast.error(`编码 ${data.code} 已存在`); return; }
      setSmsTemplates(p => [{ ...data, id: `sms-${Date.now()}`, updatedAt: new Date(), updatedBy: '当前用户' }, ...p]);
      toast.success('短信模版已新增');
    } else if (editSms) {
      setSmsTemplates(p => p.map(s => s.id === editSms.id ? { ...s, ...data, updatedAt: new Date(), updatedBy: '当前用户' } : s));
      toast.success('短信模版已更新');
    }
    setEditSms(null);
  };

  const handleDeleteSms = () => {
    if (deleteSmsId) {
      setSmsTemplates(p => p.filter(s => s.id !== deleteSmsId));
      toast.success('短信模版已删除');
      setDeleteSmsId(null);
    }
  };

  // ── Variable dictionary state
  const [vars, setVars]               = useState<VarDef[]>(INIT_VARS);
  const [varSearch, setVarSearch]     = useState('');
  const [varTypeFilter, setVarTypeFilter] = useState<VarType | 'all'>('all');
  const [varScope, setVarScope]       = useState<VarScope | 'all'>('all');
  const [editVar, setEditVar]         = useState<VarDef | null | 'new'>(null);
  const [deleteVarId, setDeleteVarId] = useState<string | null>(null);

  const filteredVars = vars.filter((v) => {
    const q = varSearch.toLowerCase();
    const matchSearch =
      v.name.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      (v.webPath && v.webPath.toLowerCase().includes(q)) ||
      (v.miniprogramPath && v.miniprogramPath.toLowerCase().includes(q));
    const matchScope = varScope === 'all' || v.scope === varScope;
    const matchType = varTypeFilter === 'all' || (v.type ?? 'param') === varTypeFilter;
    return matchSearch && matchScope && matchType;
  });

  const handleResetVars = () => {
    setVarSearch('');
    setVarTypeFilter('all');
    setVarScope('all');
    toast.info('筛选条件已重置');
  };

  const handleQueryVars = () => {
    toast.info(`查询完成，共匹配 ${filteredVars.length} 个变量`);
  };

  const handleSaveVar = (data: Omit<VarDef, 'id'>) => {
    if (editVar === 'new') {
      if (vars.some((v) => v.name === data.name)) { toast.error(`变量 {{${data.name}}} 已存在`); return; }
      setVars((p) => [...p, { ...data, id: `v-${Date.now()}` }]);
      toast.success('变量已添加');
    } else if (editVar) {
      setVars((p) => p.map((v) => v.id === editVar.id ? { ...v, ...data } : v));
      toast.success('变量已更新');
    }
    setEditVar(null);
  };

  const handleDeleteVar = () => {
    if (deleteVarId) {
      setVars((p) => p.filter((v) => v.id !== deleteVarId));
      toast.success('变量已删除');
      setDeleteVarId(null);
    }
  };

  const copyVarName = (name: string) => {
    navigator.clipboard.writeText(`{{${name}}}`);
    toast.success(`已复制 {{${name}}}`);
  };

  // ── Push limit state
  const [channelStates, setChannelStates] = useState<Record<string, boolean>>(
    Object.fromEntries(CHANNEL_CONFIGS.map((c) => [c.key, true]))
  );

  // Notification policy
  const [retryCount, setRetryCount]     = useState('3');
  const [retryInterval, setRetryInterval] = useState('5');
  const [priorityMode, setPriorityMode]   = useState('queue');

  // Alert noise reduction
  const [dedupeEnabled, setDedupeEnabled]   = useState(true);
  const [dedupeWindow, setDedupeWindow]     = useState('60');
  const [mergeEnabled, setMergeEnabled]     = useState(false);
  const [mergeInterval, setMergeInterval]   = useState('10');

  // Failure alert
  const [failureAlertOn, setFailureAlertOn]   = useState(true);
  const [alertEmail, setAlertEmail]           = useState('ops@zeroc.tech');
  const [failThreshold, setFailThreshold]     = useState('5');
  const [failWindow, setFailWindow]           = useState('10');

  // Daily threshold
  const [dailyLimits, setDailyLimits] = useState({ web: '50000', miniprogram: '20000', sms: '5000' });
  const [overLimitAction, setOverLimitAction] = useState('drop');
  const [dailyAlertRatio, setDailyAlertRatio] = useState('80');

  const setDailyLimit = (key: keyof typeof dailyLimits, val: string) =>
    setDailyLimits((p) => ({ ...p, [key]: val }));

  return (
    <div className="p-6 md:p-8 w-full min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          消息设置
        </h1>
        <p className="text-sm text-gray-500">管理短信模版、变量字典、推送渠道与通知策略</p>
      </div>

      <div className="w-full">
        {/* Tab nav */}
        <div className="flex items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-3 w-full">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
            {[
              { value: 'sms_templates', label: '短信模版', icon: FileText, badge: `${smsTemplates.length}` },
              { value: 'variables',     label: '变量配置', icon: BookOpen, badge: `${vars.length}` },
              { value: 'limits',        label: '推送限制', icon: SlidersHorizontal },
            ].map(({ value, label, icon: Icon, badge }) => {
              const active = activeTab === value;
              return (
                <button key={value} type="button" onClick={() => setActiveTab(value)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={active
                    ? { background: '#fff', color: '#2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { color: '#64748b' }}>
                  <Icon className="size-3.5" />
                  <span>{label}</span>
                  {badge && (
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                      active ? 'bg-blue-50 text-blue-700' : 'bg-gray-200/80 text-gray-600'
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab 1: 短信模版 ──────────────────────────────────── */}
        {activeTab === 'sms_templates' && (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-800">短信模版</h2>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#dbeafe', color: '#1e40af' }}>
                  {smsTemplates.length} 个
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setEditSms('new')}
                style={{ background: '#2563eb' }}
                className="h-8 px-3 text-xs text-white hover:opacity-90"
              >
                <Plus className="size-3.5 mr-1" />新增模版
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 px-5 py-3 border-b" style={{ borderColor: '#f8fafc', background: '#fafafa' }}>
              <div className="relative flex-1 min-w-40">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                <Input
                  placeholder="搜索短信编码或内容..."
                  value={smsSearch}
                  onChange={(e) => setSmsSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              {filteredSms.length !== smsTemplates.length && (
                <span className="self-center text-xs text-gray-400">显示 {filteredSms.length} / {smsTemplates.length}</span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['短信编码', '事件描述', '短信内容', '所属服务', '更新时间', '最后更新人', '操作'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#64748b' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSms.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-xs text-gray-400">未找到匹配的短信模版</td></tr>
                  ) : filteredSms.map((s, i) => {
                    const ss = SMS_SCOPE_STYLE[s.scope];
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: i < filteredSms.length - 1 ? '1px solid #f8fafc' : undefined }}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                            {s.code}
                          </code>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{s.eventDesc || <span className="text-gray-300">—</span>}</p>
                        </td>
                        <td className="px-4 py-3 max-w-xl">
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{s.content}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: ss.bg, color: ss.text }}>
                            {SMS_SCOPE_LABELS[s.scope]}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 tabular-nums">
                          {s.updatedAt.toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {s.updatedBy}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900" onClick={() => setEditSms(s)}>
                              <Edit2 className="size-3.5 mr-1" />编辑
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-300 hover:text-red-500" onClick={() => setDeleteSmsId(s.id)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t" style={{ borderColor: '#f8fafc' }}>
              <p className="text-xs text-gray-400">
                短信模版编码与运营商网关短信模板 ID 对应，修改内容后需同步更新运营商侧模板
              </p>
            </div>
          </Card>
        )}

        {activeTab === 'variables' && (
          <div className="space-y-4 w-full">
            {/* ── 传统多项列表筛选卡片 ── */}
            <Card className="p-5 bg-white rounded-lg shadow-2xs border border-gray-200">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                {/* 筛选项 1: 模糊搜索 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">模糊搜索:</span>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                    <Input
                      placeholder="搜索变量名、说明或路径..."
                      value={varSearch}
                      onChange={(e) => setVarSearch(e.target.value)}
                      className="pl-8 text-sm h-9 w-64 bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                    />
                  </div>
                </div>

                {/* 筛选项 2: 变量类型 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">变量类型:</span>
                  <Select value={varTypeFilter} onValueChange={(v) => setVarTypeFilter(v as VarType | 'all')}>
                    <SelectTrigger className="h-9 text-sm w-44 bg-white border-gray-200 rounded text-gray-700">
                      <SelectValue placeholder="全部类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="param">参数变量</SelectItem>
                      <SelectItem value="path">路径变量</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 筛选项 3: 所属模块 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">所属模块:</span>
                  <Select value={varScope} onValueChange={(v) => setVarScope(v as VarScope | 'all')}>
                    <SelectTrigger className="h-9 text-sm w-44 bg-white border-gray-200 rounded text-gray-700">
                      <SelectValue placeholder="全部模块" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部模块</SelectItem>
                      <SelectItem value="global">全局通用</SelectItem>
                      <SelectItem value="energy_management">能源管理</SelectItem>
                      <SelectItem value="smart_microgrid">智能微网</SelectItem>
                      <SelectItem value="virtual_power_plant">虚拟电厂</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 筛选操作按钮 */}
                <div className="flex items-center gap-2.5 ml-auto">
                  {filteredVars.length !== vars.length && (
                    <span className="text-xs text-gray-400 mr-1 whitespace-nowrap">
                      已过滤 {filteredVars.length} / {vars.length} 项
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 text-gray-700 hover:bg-gray-50 border-gray-200 rounded flex items-center gap-1.5"
                    onClick={handleResetVars}
                  >
                    <RotateCcw className="size-3.5" />
                    重置
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1.5 shadow-2xs"
                    onClick={handleQueryVars}
                  >
                    <Search className="size-3.5" />
                    查询
                  </Button>
                </div>
              </div>
            </Card>

            {/* ── 列表表格卡片 ── */}
            <Card className="overflow-hidden bg-white border border-gray-200 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-800">统一变量字典</h2>
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#dbeafe', color: '#1e40af' }}>
                      全部 {vars.length}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      参数 {vars.filter(v => (v.type ?? 'param') === 'param').length}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                      路径 {vars.filter(v => v.type === 'path').length}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setEditVar('new')}
                  style={{ background: '#2563eb' }}
                  className="h-8 px-3 text-xs text-white hover:opacity-90 shadow-2xs"
                >
                  <Plus className="size-3.5 mr-1" />新增变量
                </Button>
              </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['变量名', '类型', '说明', '示例值 / 路径配置', '所属模块', '操作'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#64748b' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVars.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-xs text-gray-400">未找到匹配的变量</td></tr>
                  ) : (
                    filteredVars.map((v, i) => {
                      const ss = SCOPE_STYLE[v.scope];
                      const isPath = v.type === 'path';
                      return (
                        <tr key={v.id} className="hover:bg-gray-50 transition-colors"
                          style={{ borderBottom: i < filteredVars.length - 1 ? '1px solid #f8fafc' : undefined }}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                                {`{{${v.name}}}`}
                              </code>
                              <button onClick={() => copyVarName(v.name)} className="text-gray-300 hover:text-gray-500 transition-colors" title="复制">
                                <Copy className="size-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isPath ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium border" style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                                <Link2 className="size-3" />
                                路径变量
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium border" style={{ background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}>
                                <Code2 className="size-3" />
                                参数变量
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{v.description || '—'}</td>
                          <td className="px-4 py-3">
                            {isPath ? (
                              <div className="space-y-1.5 py-0.5 min-w-[320px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0 flex items-center gap-1">
                                    <Globe className="size-2.5" />Web
                                  </span>
                                  <code className="text-xs font-mono text-gray-700 truncate max-w-md" title={v.webPath}>
                                    {v.webPath || '—'}
                                  </code>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0 flex items-center gap-1">
                                    <Smartphone className="size-2.5" />小程序
                                  </span>
                                  <code className="text-xs font-mono text-gray-700 truncate max-w-md" title={v.miniprogramPath}>
                                    {v.miniprogramPath || '—'}
                                  </code>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                {v.example || '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: ss.bg, color: ss.text }}>
                              {SCOPE_LABELS[v.scope]}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900" onClick={() => setEditVar(v)}>
                                <Edit2 className="size-3.5 mr-1" />编辑
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-300 hover:text-red-500" onClick={() => setDeleteVarId(v.id)}>
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t" style={{ borderColor: '#f8fafc' }}>
              <p className="text-xs text-gray-400">
                变量字典包含“参数变量”（用于消息正文动态填充）与“路径变量”（用于Web端与小程序跨端跳转），可在创建模板时通过 {`{{变量名}}`} 引用
              </p>
            </div>
          </Card>
        </div>
      )}

        {/* ── Tab 2: 推送限制 ──────────────────────────────────── */}
        {activeTab === 'limits' && (
          <div className="space-y-5 w-full">

            {/* ① 渠道统计与开关 */}
            <Card className="p-6 border border-gray-200/90 shadow-sm rounded-xl">
              <SectionHeader icon={BarChart3} title="渠道统计与开关" desc="查看各渠道今日推送量及成功率，可按渠道独立启停" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {CHANNEL_CONFIGS.map((c) => (
                  <div
                    key={c.key}
                    className="flex flex-col justify-between p-4 rounded-xl border transition-all"
                    style={{ borderColor: channelStates[c.key] ? '#e2e8f0' : '#f1f5f9', background: channelStates[c.key] ? '#fff' : '#fafafa' }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg flex-shrink-0" style={{ background: c.bg }}>
                          <c.icon className="size-4" style={{ color: c.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-800">{c.label}</p>
                            {!channelStates[c.key] && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium" style={{ background: '#f1f5f9', color: '#94a3b8' }}>已停用</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={channelStates[c.key]}
                        onCheckedChange={(v) => {
                          setChannelStates((p) => ({ ...p, [c.key]: v }));
                          toast.success(`${c.label} 已${v ? '启用' : '停用'}`);
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 bg-gray-50/50 rounded-lg p-2.5">
                      <div>
                        <p className="text-[11px] text-gray-400">今日发送</p>
                        <p className="text-sm font-semibold tabular-nums mt-0.5" style={{ color: channelStates[c.key] ? '#1e293b' : '#94a3b8' }}>
                          {channelStates[c.key] ? c.todaySend.toLocaleString() : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400">成功率</p>
                        <p className="text-sm font-semibold tabular-nums mt-0.5" style={{ color: channelStates[c.key] ? '#2563eb' : '#94a3b8' }}>
                          {channelStates[c.key] ? `${c.successRate}%` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ② 通知策略控制 */}
            <Card className="p-6 border border-gray-200/90 shadow-sm rounded-xl">
              <SectionHeader icon={SlidersHorizontal} title="通知策略控制" desc="配置推送重试机制与优先级队列行为" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 font-medium">失败重试次数</Label>
                  <Select value={retryCount} onValueChange={setRetryCount}>
                    <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">不重试</SelectItem>
                      <SelectItem value="1">1 次</SelectItem>
                      <SelectItem value="3">3 次</SelectItem>
                      <SelectItem value="5">5 次</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-gray-400">网络异常或网关超时自动重试</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 font-medium">重试间隔（分钟）</Label>
                  <Input
                    type="number" min={1} max={60}
                    value={retryInterval}
                    onChange={(e) => setRetryInterval(e.target.value)}
                    className="h-9 text-sm bg-white"
                  />
                  <p className="text-[11px] text-gray-400">按指数退避递增，最大不超过 {retryInterval ? Number(retryInterval) * 4 : '—'} 分钟</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 font-medium">超出优先级处理</Label>
                  <Select value={priorityMode} onValueChange={setPriorityMode}>
                    <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="queue">排队等待</SelectItem>
                      <SelectItem value="drop">直接丢弃</SelectItem>
                      <SelectItem value="urgent">强制发送</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-gray-400">流量并发突发时的队列调配模式</p>
                </div>
              </div>
            </Card>

            {/* ③ 告警降噪 */}
            <Card className="p-6 border border-gray-200/90 shadow-sm rounded-xl">
              <SectionHeader icon={TrendingDown} title="告警降噪" desc="抑制短时间内重复推送，避免对同一接收方频繁打扰" />
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">去重推送窗口</p>
                    <p className="text-xs text-gray-400 mt-0.5">同一模板对同一企业在设定时间窗口内不重复推送</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch checked={dedupeEnabled} onCheckedChange={setDedupeEnabled} />
                  </div>
                </div>
                {dedupeEnabled && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="space-y-1 w-48">
                      <Label className="text-xs text-gray-600 font-medium">窗口时长（分钟）</Label>
                      <Input
                        type="number" min={1}
                        value={dedupeWindow}
                        onChange={(e) => setDedupeWindow(e.target.value)}
                        className="h-8.5 text-sm bg-white"
                      />
                    </div>
                    <p className="text-xs text-gray-400 pt-4">
                      相同模板 + 相同企业在 {dedupeWindow || '—'} 分钟内只推送一次
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">合并推送</p>
                      <p className="text-xs text-gray-400 mt-0.5">将同类告警在时间窗口内合并为一条推送发出</p>
                    </div>
                    <Switch checked={mergeEnabled} onCheckedChange={setMergeEnabled} />
                  </div>
                  {mergeEnabled && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 mt-3">
                      <div className="space-y-1 w-48">
                        <Label className="text-xs text-gray-600 font-medium">合并窗口（分钟）</Label>
                        <Input
                          type="number" min={1}
                          value={mergeInterval}
                          onChange={(e) => setMergeInterval(e.target.value)}
                          className="h-8.5 text-sm bg-white"
                        />
                      </div>
                      <p className="text-xs text-gray-400 pt-4">窗口内同类消息合并后统一发出，减少高频消息打扰</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* ④ 失败告警 */}
            <Card className="p-6 border border-gray-200/90 shadow-sm rounded-xl">
              <SectionHeader icon={ShieldAlert} title="失败告警" desc="当推送连续失败达到阈值时，向运维人员发送告警通知" />
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">启用失败告警</p>
                    <p className="text-xs text-gray-400 mt-0.5">推送失败连续达到设定次数时自动触发告警通知</p>
                  </div>
                  <Switch checked={failureAlertOn} onCheckedChange={setFailureAlertOn} />
                </div>
                {failureAlertOn && (
                  <div className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 font-medium">告警接收邮箱</Label>
                        <Input
                          type="email"
                          value={alertEmail}
                          onChange={(e) => setAlertEmail(e.target.value)}
                          placeholder="ops@example.com"
                          className="h-9 text-sm bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 font-medium">连续失败次数阈值</Label>
                        <Input
                          type="number" min={1}
                          value={failThreshold}
                          onChange={(e) => setFailThreshold(e.target.value)}
                          className="h-9 text-sm bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 font-medium">统计窗口（分钟）</Label>
                        <Input
                          type="number" min={1}
                          value={failWindow}
                          onChange={(e) => setFailWindow(e.target.value)}
                          className="h-9 text-sm bg-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      在 {failWindow} 分钟内连续失败 {failThreshold} 次，则向 {alertEmail || '—'} 发送运维告警邮件
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* ⑤ 单日阈值 */}
            <Card className="p-6 border border-gray-200/90 shadow-sm rounded-xl">
              <SectionHeader icon={Bell} title="单日配额与阈值预警" desc="设置各渠道每日推送总量上限，超出后按策略处理" />
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CHANNEL_CONFIGS.map((c) => (
                    <div key={c.key} className="space-y-1.5 p-3 rounded-lg border border-gray-100 bg-gray-50/60">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                        <Label className="text-xs text-gray-700 font-medium">{c.label}（条/天）</Label>
                      </div>
                      <Input
                        type="number" min={0}
                        value={dailyLimits[c.key as keyof typeof dailyLimits]}
                        onChange={(e) => setDailyLimit(c.key as keyof typeof dailyLimits, e.target.value)}
                        className="h-9 text-sm bg-white"
                        placeholder="0 = 不限制"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600 font-medium">超出阈值后的处理方式</Label>
                    <Select value={overLimitAction} onValueChange={setOverLimitAction}>
                      <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drop">直接丢弃</SelectItem>
                        <SelectItem value="queue">排队至次日</SelectItem>
                        <SelectItem value="alert">仅告警不发送</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600 font-medium">阈值预警比例（%）</Label>
                    <div className="relative">
                      <Input
                        type="number" min={50} max={100}
                        value={dailyAlertRatio}
                        onChange={(e) => setDailyAlertRatio(e.target.value)}
                        className="h-9 text-sm pr-8 bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  当某渠道当日已用量达到上限的 {dailyAlertRatio}% 时，系统将提前向管理员发出配额预警
                </p>
              </div>
            </Card>

            {/* Save bar */}
            <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between shadow-sm mt-6">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>所有渠道启停、重试策略及配额配置修改后，点击保存即可即时生效</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => toast.info('已重置为默认设置')}>重置默认</Button>
                <Button size="sm" onClick={() => toast.success('推送限制设置已保存')} style={{ background: '#2563eb' }} className="text-white hover:opacity-90 px-6 h-9">
                  保存设置
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SMS template dialogs */}
      {editSms !== null && (
        <SmsTemplateDialog
          initial={editSms === 'new' ? undefined : editSms}
          onClose={() => setEditSms(null)}
          onSave={handleSaveSms}
        />
      )}

      <AlertDialog open={deleteSmsId !== null} onOpenChange={() => setDeleteSmsId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除短信模版</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，引用此短信编码的消息模板将无法正确发送短信。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSms} className="bg-red-600 hover:bg-red-700 text-white">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Variable dialogs */}
      {editVar !== null && (
        <VarDialog
          initial={editVar === 'new' ? undefined : editVar}
          onClose={() => setEditVar(null)}
          onSave={handleSaveVar}
        />
      )}

      <AlertDialog open={deleteVarId !== null} onOpenChange={() => setDeleteVarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除变量</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，引用此变量的模板将无法正确渲染该字段。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVar} className="bg-red-600 hover:bg-red-700 text-white">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
