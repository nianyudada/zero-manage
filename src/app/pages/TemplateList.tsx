import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
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
import { Plus, Search, Edit2, Trash2, Code2, Check, ChevronsUpDown, X, Tag, Users, Mail, MessageSquare, ChevronDown, BookOpen, Bell, UserPlus, Phone, Hash, MessageCircle, Webhook, Smartphone, UserCheck, Building2 } from 'lucide-react';
import {
  useTemplates,
  ChannelType,
  InternalChannelType,
  ServiceType,
  TemplateStatus,
  TargetMode,
  MessageCategory,
  CHANNEL_LABELS,
  INTERNAL_CHANNEL_LABELS,
  ManualUser,
  SERVICE_LABELS,
  SERVICE_EVENTS,
  ENTERPRISES,
  ENTERPRISE_ROLES,
  ENTERPRISE_USERS,
  EnterpriseUser,
  TAG_GROUPS,
  MessageTemplate,
} from '../contexts/TemplateContext';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';

// ── colour maps ──────────────────────────────────────────────
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

const SERVICE_STYLE: Record<ServiceType, { backgroundColor: string; color: string }> = {
  energy_management:   { backgroundColor: '#d1fae5', color: '#065f46' },
  smart_microgrid:     { backgroundColor: '#dbeafe', color: '#1e40af' },
  virtual_power_plant: { backgroundColor: '#fef3c7', color: '#92400e' },
  all:                 { backgroundColor: '#f1f5f9', color: '#475569' },
};

const STATUS_STYLE: Record<TemplateStatus, { backgroundColor: string; color: string; label: string }> = {
  published: { backgroundColor: '#d1fae5', color: '#065f46', label: '已发布' },
  draft:     { backgroundColor: '#fef3c7', color: '#92400e', label: '草稿'   },
  archived:  { backgroundColor: '#f1f5f9', color: '#475569', label: '已归档' },
};
// ── Service parameter definitions (read-only reference) ──────────────────
interface ServiceParam {
  key: string;
  type: 'enum' | 'number' | 'string' | 'boolean' | 'array';
  label: string;
  desc: string;
  example?: string;
  options?: string[];
  required?: boolean;
}
interface ServiceParamGroup {
  group: string;
  desc?: string;
  color: { backgroundColor: string; color: string };
  params: ServiceParam[];
}

const SERVICE_PARAMS: Partial<Record<ServiceType, ServiceParamGroup[]>> = {
  energy_management: [
    {
      group: '按电站组推送',
      desc: '将推送目标细化到具体电站组，同一企业下不同电站组的运营人员可收到差异化数据',
      color: { backgroundColor: '#d1fae5', color: '#065f46' },
      params: [
        { key: 'stationGroupIds',  type: 'array',   label: '电站组 ID 列表',   desc: '指定推送所针对的电站组，留空表示企业下全部电站', example: '["SG-001","SG-003"]', required: false },
        { key: 'stationGroupMode', type: 'enum',    label: '电站组匹配模式',   desc: '推送到各电站组各自的运营人员，或仅推送企业管理员', options: ['per_group（各组分别推送）', 'admin_only（仅企业管理员）'], example: 'per_group' },
        { key: 'includeSubGroups', type: 'boolean', label: '包含子电站组',     desc: '是否将匹配范围延伸至所选电站组的下级子组', example: 'true' },
      ],
    },
    {
      group: '碳排放告警',
      desc: '当企业碳排放指标触发阈值时携带的告警上下文参数',
      color: { backgroundColor: '#fce7f3', color: '#9d174d' },
      params: [
        { key: 'emissionThreshold', type: 'number', label: '碳排放告警阈值（吨）', desc: '超过该值时触发推送，单位吨 CO₂e；0 表示由平台全局阈值决定', example: '15000', required: false },
        { key: 'alertLevel',        type: 'enum',   label: '告警等级',            desc: '影响消息的紧急程度与展示样式', options: ['info（提示）', 'warning（预警）', 'critical（严重）'], example: 'warning', required: true },
        { key: 'comparisonBase',    type: 'enum',   label: '对比基准',            desc: '超标判断所参考的基线', options: ['monthly_plan（月度计划）', 'last_month（上月同期）', 'year_avg（年均）'], example: 'monthly_plan' },
      ],
    },
    {
      group: '报告推送',
      desc: '周期性报告生成后随推送携带的附件与格式信息',
      color: { backgroundColor: '#ede9fe', color: '#5b21b6' },
      params: [
        { key: 'reportPeriod',  type: 'enum',    label: '报告周期',     desc: '决定推送频率与内容口径', options: ['daily（日报）', 'weekly（周报）', 'monthly（月报）'], example: 'monthly', required: true },
        { key: 'attachPdf',     type: 'boolean', label: '附带 PDF 附件', desc: '是否在消息中附加可下载的 PDF 报告文件', example: 'true' },
        { key: 'highlightKpis', type: 'array',   label: '重点 KPI 字段', desc: '在消息摘要中优先展示的指标键名', example: '["totalEmission","reductionRate"]' },
      ],
    },
  ],
  smart_microgrid: [
    {
      group: '告警等级配置',
      desc: '微网系统事件的分级策略，不同等级对应不同推送渠道与响应 SLA',
      color: { backgroundColor: '#dbeafe', color: '#1e40af' },
      params: [
        { key: 'alertLevel',       type: 'enum',   label: '告警等级',        desc: '控制消息优先级与接收人范围', options: ['P0（紧急 — 立即响应，全员推送）', 'P1（高 — 15 min 内响应）', 'P2（中 — 1 h 内响应）', 'P3（低 — 24 h 内响应）'], example: 'P1', required: true },
        { key: 'escalationDelay',  type: 'number', label: '升级延迟（分钟）', desc: '若主责人在指定时间内未确认，自动升级告警等级并扩大推送范围', example: '15' },
        { key: 'autoResolve',      type: 'boolean', label: '自动消警',        desc: '当微网指标恢复正常后自动发送消警通知', example: 'true' },
      ],
    },
    {
      group: '设备与拓扑',
      desc: '将推送范围限定到具体微网区域或设备类型',
      color: { backgroundColor: '#e0f2fe', color: '#075985' },
      params: [
        { key: 'gridZone',       type: 'string', label: '微网区域标识',   desc: '对应平台中的微网拓扑节点 ID，如 NDE-A、NDE-B', example: 'NDE-A' },
        { key: 'deviceTypes',    type: 'array',  label: '设备类型过滤',   desc: '仅当指定类型设备触发事件时推送', example: '["inverter","storage","pv_string"]' },
        { key: 'minLoadRate',    type: 'number', label: '触发负载率下限（%）', desc: '低于此值的负载告警不推送，避免噪声', example: '80' },
      ],
    },
    {
      group: '值班联动',
      desc: '与排班系统集成，确保告警精准推送到当前值班人员',
      color: { backgroundColor: '#f0fdf4', color: '#166534' },
      params: [
        { key: 'dutyMode',       type: 'enum',    label: '值班模式',       desc: '推送至当前排班人员还是固定接收人', options: ['on_duty（仅当前值班人）', 'fixed（固定人员列表）', 'both（值班 + 固定）'], example: 'on_duty', required: true },
        { key: 'shiftCalendarId', type: 'string', label: '排班日历 ID',    desc: '关联平台排班模块中的日历配置，留空使用默认日历', example: 'CAL-MG-001' },
      ],
    },
  ],
  virtual_power_plant: [
    {
      group: '削峰填谷响应',
      desc: '虚拟电厂调度事件触发推送时携带的响应参数',
      color: { backgroundColor: '#fef3c7', color: '#92400e' },
      params: [
        { key: 'responseType',    type: 'enum',   label: '响应类型',           desc: '削峰或填谷场景，影响消息措辞与补贴计算', options: ['peak_shaving（削峰）', 'valley_filling（填谷）'], example: 'peak_shaving', required: true },
        { key: 'demandMw',        type: 'number', label: '响应需求（MW）',     desc: '本次调度所需的总响应量', example: '200', required: true },
        { key: 'subsidyRate',     type: 'number', label: '补贴标准（元/kWh）', desc: '参与本次调度可获得的补贴单价', example: '0.8' },
        { key: 'confirmDeadline', type: 'number', label: '确认截止时长（分钟）', desc: '企业需在收到通知后多少分钟内确认参与意愿', example: '30', required: true },
      ],
    },
    {
      group: '电网状态告警',
      desc: '电网运行指标超阈值告警的上下文参数',
      color: { backgroundColor: '#ffe4e6', color: '#9f1239' },
      params: [
        { key: 'gridMetric',    type: 'enum',   label: '监控指标',     desc: '触发本次推送的电网指标类型', options: ['load（负荷）', 'frequency（频率）', 'voltage（电压）', 'tie_line（联络线功率）'], example: 'load', required: true },
        { key: 'currentValue',  type: 'number', label: '当前值',       desc: '告警时刻的指标实测值，由系统自动填充，模板中可用 {{currentValue}} 引用', example: '1240' },
        { key: 'thresholdValue', type: 'number', label: '阈值',        desc: '对应告警配置中的触发上限或下限', example: '1200' },
        { key: 'alertSeverity', type: 'enum',   label: '严重程度',     desc: '影响推送优先级与是否唤醒值班人员', options: ['yellow（黄色预警）', 'orange（橙色预警）', 'red（红色预警）'], example: 'orange' },
      ],
    },
  ],
  all: [
    {
      group: '通用平台参数',
      desc: '适用于所有服务模块的平台级推送扩展参数',
      color: { backgroundColor: '#f1f5f9', color: '#475569' },
      params: [
        { key: 'priority',      type: 'enum',    label: '优先级',         desc: '影响消息进入推送队列的处理顺序', options: ['high（高 — 优先队列）', 'normal（普通）', 'low（低 — 可合并）'], example: 'normal' },
        { key: 'silent',        type: 'boolean', label: '静默推送',       desc: '仅在通知中心记录，不触发声音与振动', example: 'false' },
        { key: 'expiresInMin',  type: 'number',  label: '消息有效期（分钟）', desc: '超过有效期的消息不再推送，0 表示永不过期', example: '1440' },
        { key: 'bizTraceId',    type: 'string',  label: '业务追踪 ID',   desc: '关联业务系统的溯源标识，用于消息与业务事件的对账', example: 'BIZ-20260701-00812' },
      ],
    },
  ],
};

const PARAM_TYPE_STYLE: Record<ServiceParam['type'], { backgroundColor: string; color: string; label: string }> = {
  enum:    { backgroundColor: '#ede9fe', color: '#5b21b6', label: 'enum'    },
  number:  { backgroundColor: '#fef3c7', color: '#92400e', label: 'number'  },
  string:  { backgroundColor: '#dbeafe', color: '#1d4ed8', label: 'string'  },
  boolean: { backgroundColor: '#d1fae5', color: '#065f46', label: 'boolean' },
  array:   { backgroundColor: '#fce7f3', color: '#9d174d', label: 'array'   },
};
// ── SMS template options for user push ───────────────────────
interface SmsTemplateOption {
  code: string;
  label: string;
  content: string;
}
const SMS_TEMPLATE_OPTIONS: SmsTemplateOption[] = [
  { code: 'SMS_VERIFY_CODE',       label: '验证码短信',       content: '【零碳科技】您的验证码是 {{code}}，{{minutes}} 分钟内有效，请勿泄露给他人。' },
  { code: 'SMS_ACCOUNT_CREATED',   label: '账号开通通知',     content: '【零碳科技】您的零碳管理平台账号已开通，企业：{{enterpriseName}}，初始密码：{{password}}，请及时登录修改密码。' },
  { code: 'SMS_DEVICE_ALERT',      label: '设备告警通知',     content: '【零碳平台】{{enterpriseName}} 设备 {{deviceName}}（{{deviceId}}）发生告警，请及时处理。时间：{{alertTime}}。' },
  { code: 'SMS_MAINTENANCE',       label: '设备维护通知',     content: '【零碳平台】{{deviceName}}（{{deviceId}}）将于 {{maintenanceTime}} 进行定期维护，预计 {{duration}} 小时，负责人：{{engineerName}}。' },
  { code: 'SMS_PEAK_RESPONSE',     label: '削峰响应邀请',     content: '【虚拟电厂】系统预测高峰时段 {{peakTime}} 将出现用电高峰，响应需求：{{responseRequest}} MW，补贴：{{subsidy}} 元/kWh，请尽快确认参与。' },
  { code: 'SMS_EMISSION_ALERT',    label: '碳排放预警',       content: '【零碳平台】{{enterpriseName}} 本月碳排放已达 {{totalEmission}} 吨，变化 {{emissionChange}}，减排完成率 {{reductionRate}}%，请关注。' },
];



// ── Mock user pool for manual-add search ─────────────────────
const MOCK_USER_POOL: ManualUser[] = [
  { id: 'u001', name: '刘建国', phone: '13800000001', code: 'USR-0001', enterprise: '华能集团' },
  { id: 'u002', name: '张凯',   phone: '13900000002', code: 'USR-0002', enterprise: '国家电网' },
  { id: 'u003', name: '陈伟',   phone: '13700000003', code: 'USR-0003', enterprise: '宁德时代' },
  { id: 'u004', name: '王磊',   phone: '13600000004', code: 'USR-0004', enterprise: '比亚迪能源' },
  { id: 'u005', name: '李春华', phone: '13500000005', code: 'USR-0005', enterprise: '中广核集团' },
  { id: 'u006', name: '赵明',   phone: '13400000006', code: 'USR-0006', enterprise: '三峡能源' },
  { id: 'u007', name: '孙志远', phone: '13800001001', code: 'USR-0007', enterprise: '华能集团' },
  { id: 'u008', name: '吴洁',   phone: '13900001002', code: 'USR-0008', enterprise: '大唐新能源' },
  { id: 'u009', name: '周鹏',   phone: '13700001003', code: 'USR-0009', enterprise: '华电集团' },
  { id: 'u010', name: '郑婷',   phone: '13600001004', code: 'USR-0010', enterprise: '国投电力' },
  { id: 'u011', name: '冯建伟', phone: '13500001005', code: 'USR-0011', enterprise: '南方电网' },
  { id: 'u012', name: '陈琳',   phone: '13400001006', code: 'USR-0012', enterprise: '国家能源集团' },
  { id: 'u013', name: '杨光',   phone: '13800002001', code: 'USR-0013', enterprise: '华润电力' },
  { id: 'u014', name: '林洁',   phone: '13900002002', code: 'USR-0014', enterprise: '中节能集团' },
  { id: 'u015', name: '何强',   phone: '13700002003', code: 'USR-0015', enterprise: '新奥能源' },
  { id: 'u016', name: '张晨',   phone: '13600002004', code: 'USR-0016', enterprise: '华能集团' },
  { id: 'u017', name: '刘芳',   phone: '13500002005', code: 'USR-0017', enterprise: '宁德时代' },
  { id: 'u018', name: '王鑫',   phone: '13400002006', code: 'USR-0018', enterprise: '比亚迪能源' },
];

// ── Manual user selector component ───────────────────────────
function ManualUserSelector({
  value,
  onChange,
}: {
  value: ManualUser[];
  onChange: (users: ManualUser[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedIds = new Set(value.map(u => u.id));

  const results = query.trim().length > 0
    ? MOCK_USER_POOL.filter(u => {
        const q = query.toLowerCase();
        return (
          u.name.includes(query) ||
          u.phone.includes(query) ||
          u.code.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  const addUser = (u: ManualUser) => {
    if (!selectedIds.has(u.id)) onChange([...value, u]);
    setQuery('');
    setFocused(false);
  };

  const removeUser = (id: string) => onChange(value.filter(u => u.id !== id));

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); setFocused(true); }}
            onFocus={() => setFocused(true)}
            placeholder="搜索用户姓名、手机号或用户编号…"
            className="pl-9 h-9 text-sm"
          />
        </div>

        {focused && results.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border shadow-lg overflow-hidden"
            style={{ background: '#fff', borderColor: '#e2e8f0' }}
          >
            {results.map(u => {
              const already = selectedIds.has(u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ borderBottom: '1px solid #f8fafc', cursor: already ? 'default' : 'pointer', background: already ? '#f8fafc' : undefined }}
                  onMouseDown={e => { e.preventDefault(); if (!already) addUser(u); }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                    style={{ background: '#d1fae5', color: '#065f46' }}>
                    {u.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{u.name}</span>
                      <span className="text-xs text-gray-400">{u.enterprise}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Phone className="size-3" />{u.phone}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Hash className="size-3" />{u.code}
                      </span>
                    </div>
                  </div>
                  {already
                    ? <span className="text-xs text-gray-300 flex-shrink-0">已添加</span>
                    : <span className="text-xs text-blue-600 font-medium flex-shrink-0">+ 添加</span>}
                </div>
              );
            })}
          </div>
        )}

        {focused && query.trim().length > 0 && results.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border shadow-sm py-4 text-center text-xs text-gray-400"
            style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            未找到匹配用户
          </div>
        )}
      </div>

      {/* Selected user list */}
      {value.length > 0 ? (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: '#f8fafc', borderColor: '#f1f5f9' }}>
            <span className="text-xs font-medium text-gray-600">已添加 {value.length} 位用户</span>
            <button type="button" onClick={() => onChange([])}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors">清空全部</button>
          </div>
          <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
            {value.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                  style={{ background: '#d1fae5', color: '#065f46' }}>
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{u.name}</span>
                    <span className="text-xs text-gray-400">{u.enterprise}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <Phone className="size-3" />{u.phone}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <Hash className="size-3" />{u.code}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => removeUser(u.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-5 rounded-xl border border-dashed text-gray-300" style={{ borderColor: '#e2e8f0' }}>
          <UserPlus className="size-4" />
          <span className="text-xs">搜索并添加推送用户</span>
        </div>
      )}
    </div>
  );
}





function getEnterpriseName(id: string) {
  return ENTERPRISES.find((e) => e.id === id)?.name ?? id;
}

function extractVariables(content: string): string[] {
  const vars = new Set<string>();
  for (const m of content.matchAll(/\{\{(\w+)\}\}/g)) vars.add(m[1]);
  return Array.from(vars);
}

// ── Inline checkbox multi-select ─────────────────────────────
function CheckboxGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
}) {
  const toggle = (v: T) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex flex-wrap gap-2 pt-0.5">
        {options.map((opt) => {
          const active = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
              style={
                active
                  ? { background: '#2563eb', color: '#fff', borderColor: '#2563eb' }
                  : { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }
              }
            >
              {active && <Check className="size-3" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Searchable enterprise multi-select ───────────────────────
function EnterpriseMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = ENTERPRISES.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.id.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const removeOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((x) => x !== id));
  };

  const isAll = value.length === 0;

  return (
    <div className="space-y-1.5" ref={ref}>
      <Label className="text-sm">目标企业</Label>

      {/* Trigger */}
      <div
        className="min-h-9 w-full rounded-md border px-3 py-1.5 text-sm cursor-pointer flex items-center justify-between gap-2"
        style={{ borderColor: open ? '#2563eb' : '#e2e8f0', background: '#fff', boxShadow: open ? '0 0 0 2px #dbeafe' : undefined }}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {isAll ? (
            <span className="text-gray-400 text-xs">全部企业（不限定）</span>
          ) : (
            value.slice(0, 4).map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ background: '#d1fae5', color: '#065f46' }}
              >
                {getEnterpriseName(id)}
                <X className="size-2.5 cursor-pointer hover:text-red-500" onClick={(e) => removeOne(id, e)} />
              </span>
            ))
          )}
          {value.length > 4 && (
            <span className="text-xs text-gray-400 self-center">+{value.length - 4} 家</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value.length > 0 && (
            <X
              className="size-3.5 text-gray-400 hover:text-red-500"
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
            />
          )}
          <ChevronsUpDown className="size-3.5 text-gray-400" />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden"
          style={{ background: '#fff', borderColor: '#e2e8f0', minWidth: 280, maxWidth: 400 }}
        >
          {/* Search */}
          <div className="p-2 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <input
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md outline-none"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                placeholder="搜索企业名称..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">未找到匹配企业</div>
            ) : (
              filtered.map((ent) => {
                const checked = value.includes(ent.id);
                return (
                  <div
                    key={ent.id}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); toggle(ent.id); }}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all"
                      style={checked ? { background: '#2563eb', borderColor: '#2563eb' } : { borderColor: '#d1d5db' }}
                    >
                      {checked && <Check className="size-2.5 text-white" />}
                    </div>
                    <span className="text-sm text-gray-700">{ent.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{ent.id}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
            <span className="text-xs text-gray-400">已选 {value.length} 家，共 {ENTERPRISES.length} 家</span>
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              onClick={(e) => { e.stopPropagation(); onChange([]); setOpen(false); }}
            >
              清除全部
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── View Dialog ───────────────────────────────────────────────
function ViewDialog({
  template,
  onClose,
  onEdit,
}: {
  template: MessageTemplate;
  onClose: () => void;
  onEdit: () => void;
}) {
  const ss = STATUS_STYLE[template.status];
  const enterpriseLabel = template.targetEnterprises.length === 0
    ? '全部企业'
    : template.targetEnterprises.map(getEnterpriseName).join('、');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto transition-all duration-200 box-border p-4 sm:p-6" aria-describedby={undefined}>
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-base font-semibold">{template.name}</DialogTitle>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: ss.backgroundColor, color: ss.color }}>
              {ss.label}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-1">推送渠道</p>
              <div className="flex flex-wrap gap-1">
                {template.messageCategory === 'internal' ? (
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={INTERNAL_CHANNEL_STYLE[template.internalChannel] ?? { backgroundColor: '#f1f5f9', color: '#475569' }}
                  >
                    {INTERNAL_CHANNEL_LABELS[template.internalChannel] ?? template.internalChannel}
                  </span>
                ) : (
                  template.channels.map((c) => (
                    <span key={c} className="px-1.5 py-0.5 rounded text-xs font-medium" style={CHANNEL_STYLE[c]}>
                      {CHANNEL_LABELS[c]}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-0.5">服务模块</p>
              <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={SERVICE_STYLE[template.serviceType]}>
                {SERVICE_LABELS[template.serviceType]}
              </span>
            </div>
            {template.eventType && (
              <div className="px-3 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
                <p className="text-xs text-gray-400 mb-0.5">消息事件</p>
                <p className="text-sm font-medium text-gray-800">
                  {SERVICE_EVENTS[template.serviceType]?.find(e => e.value === template.eventType)?.label ?? template.eventType}
                </p>
              </div>
            )}
            {((template.messageCategory === 'internal' && template.internalChannel === 'sms') || template.channels.includes('sms')) && template.smsCode && (
              <div className="col-span-2 px-3 py-2 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <p className="text-xs text-gray-400 mb-0.5">短信代码</p>
                <code className="text-sm font-mono font-medium" style={{ color: '#2563eb' }}>{template.smsCode}</code>
              </div>
            )}
            {template.messageCategory === 'internal' && template.internalChannel === 'wecom' && template.webhookUrl && (
              <div className="col-span-2 px-3 py-2 rounded-lg" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <p className="text-xs text-sky-700 font-medium mb-0.5 flex items-center gap-1.5">
                  <Webhook className="size-3 text-sky-600" />
                  企业微信 Webhook 地址
                </p>
                <code className="text-xs font-mono text-gray-700 break-all select-all">{template.webhookUrl}</code>
              </div>
            )}
            {template.messageCategory === 'user' && template.channels.includes('miniprogram') && (
              <div className="col-span-2 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-700 font-medium mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="size-3.5 text-gray-500" />
                  小程序订阅消息配置
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 mr-1.5">模版 ID:</span>
                    <code className="font-mono font-medium text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">{template.mpTemplateId || '未配置'}</code>
                  </div>
                  <div>
                    <span className="text-gray-500 mr-1.5">跳转路径:</span>
                    <code className="font-mono text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">{template.mpPagePath || '未配置'}</code>
                  </div>
                </div>
              </div>
            )}
            <div className="px-3 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-0.5">目标企业</p>
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{enterpriseLabel}</p>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-0.5">累计推送</p>
              <p className="text-sm font-medium text-gray-800">{template.sendCount.toLocaleString()} 次</p>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-0.5">最近更新</p>
              <p className="text-sm font-medium text-gray-800">{template.updatedAt.toLocaleDateString('zh-CN')}</p>
            </div>
            {(template.pushTimeStart || template.dailyLimit > 0) && (
              <div className="col-span-2 px-3 py-2 rounded-lg" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                <p className="text-xs text-amber-600 mb-1">推送限制</p>
                <p className="text-sm text-amber-800">
                  {template.pushTimeStart && template.pushTimeEnd
                    ? `仅 ${template.pushTimeStart}–${template.pushTimeEnd} 推送`
                    : ''}
                  {template.pushTimeStart && template.dailyLimit > 0 ? '，' : ''}
                  {template.dailyLimit > 0 ? `单日上限 ${template.dailyLimit} 次` : ''}
                </p>
              </div>
            )}
            <div className="px-3 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-0.5">推送目标类型</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-800">
                {template.targetMode === 'tag' ? (
                  <><Tag className="size-3.5 text-purple-500" />标签人群</>
                ) : template.targetMode === 'enterprise_user' ? (
                  <><UserCheck className="size-3.5 text-blue-600" />企业用户</>
                ) : template.targetMode === 'manual' ? (
                  <><UserPlus className="size-3.5 text-blue-600" />手动添加</>
                ) : (
                  <><Users className="size-3.5 text-blue-600" />企业角色</>
                )}
              </span>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-0.5">模板状态</p>
              <span className={`text-sm font-medium ${template.enabled ? 'text-blue-600' : 'text-gray-400'}`}>
                {template.enabled ? '已启用' : '已停用'}
              </span>
            </div>
            {template.targetMode === 'enterprise_user' && (() => {
              const userIds = template.selectedEnterpriseUserIds && template.selectedEnterpriseUserIds.length > 0
                ? template.selectedEnterpriseUserIds
                : (template.selectedEnterpriseUserId ? [template.selectedEnterpriseUserId] : []);
              if (userIds.length === 0) return null;
              const pickedUsers = ENTERPRISE_USERS.filter(x => userIds.includes(x.id));
              return (
                <div className="col-span-2 px-3 py-2.5 rounded-lg border border-blue-200 bg-blue-50/60">
                  <p className="text-xs text-blue-700 font-semibold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UserCheck className="size-3.5" />已选目标企业员工（共 {userIds.length} 人）
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pickedUsers.map(u => {
                      const ent = ENTERPRISES.find(e => e.id === u.enterpriseId);
                      return (
                        <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-900 border border-blue-200">
                          <span className="font-semibold">{u.name}</span>
                          <span className="text-blue-400">·</span>
                          <span className="text-blue-700">{ent?.name}</span>
                          <span className="text-blue-400">·</span>
                          <span className="text-blue-600">{u.role}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {template.targetMode === 'role' && template.targetRoles.length > 0 && (
              <div className="col-span-2 px-3 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
                <p className="text-xs text-gray-400 mb-1">企业角色</p>
                <div className="flex flex-wrap gap-1">
                  {template.targetRoles.map(rid => {
                    const role = ENTERPRISE_ROLES.find(r => r.id === rid);
                    return role ? (
                      <span key={rid} className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                        {role.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {template.targetMode === 'tag' && template.targetTags.length > 0 && (
              <div className="col-span-2 px-3 py-2 rounded-lg" style={{ background: '#faf5ff' }}>
                <p className="text-xs text-gray-400 mb-1">标签人群</p>
                <div className="flex flex-wrap gap-1">
                  {template.targetTags.map(tid => {
                    const grp = TAG_GROUPS.find(g => g.id === tid);
                    return grp ? (
                      <span key={tid} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                        <Tag className="size-2.5" />{grp.name}
                        <span className="opacity-60">· {grp.count}人</span>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">消息内容</p>
            {template.title && (
              <p className="text-sm font-semibold text-gray-800 mb-1">{template.title}</p>
            )}
            <div className="px-4 py-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              {template.content}
            </div>
          </div>

          {/* Variables */}
          {template.variables.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">动态变量 ({template.variables.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {template.variables.map((v) => (
                  <code key={v} className="px-2.5 py-1 rounded-md text-xs font-mono" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>关闭</Button>
          <Button size="sm" onClick={onEdit} style={{ background: '#2563eb' }} className="text-white hover:opacity-90">
            <Edit2 className="size-3.5 mr-1.5" />编辑模板
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit / Create Dialog ──────────────────────────────────────
type FormData = {
  name: string;
  enabled: boolean;
  messageCategory: MessageCategory;
  channels: ChannelType[];
  internalChannel: InternalChannelType;
  targetTagMembers: Record<string, string[]>;
  serviceType: ServiceType;
  eventType: string;
  targetEnterprises: string[];
  targetMode: TargetMode;
  targetRoles: string[];
  targetTags: string[];
  status: TemplateStatus;
  title: string;
  content: string;
  smsCode: string;
  webhookUrl: string;
  mpTemplateId: string;
  mpPagePath: string;
  pushTimeStart: string;
  pushTimeEnd: string;
  dailyLimit: number;
  variables: string[];
  manualUsers: ManualUser[];
  selectedEnterpriseUserId: string;
  selectedEnterpriseUserIds: string[];
};

const BLANK_FORM: FormData = {
  name: '',
  enabled: true,
  messageCategory: 'user',
  channels: ['inapp'],
  internalChannel: 'sms',
  targetTagMembers: {},
  serviceType: 'energy_management',
  eventType: '',
  targetEnterprises: [],
  targetMode: 'role',
  targetRoles: [],
  targetTags: [],
  selectedEnterpriseUserId: '',
  selectedEnterpriseUserIds: [],
  status: 'draft',
  title: '',
  content: '',
  smsCode: '',
  webhookUrl: '',
  mpTemplateId: '',
  mpPagePath: '',
  pushTimeStart: '',
  pushTimeEnd: '',
  dailyLimit: 0,
  variables: [],
  manualUsers: [],
};

const CHANNEL_OPTIONS = Object.entries(CHANNEL_LABELS).map(([v, label]) => ({ value: v as ChannelType, label }));

// ── Shared tag group row + member panel ──────────────────────────
function TagGroupPanel({
  tag,
  tagActive,
  isExpanded,
  selectedMembers,
  onToggleTag,
  onToggleExpand,
  onToggleMember,
  onResetAll,
  contactField,
}: {
  tag: (typeof TAG_GROUPS)[number];
  tagActive: boolean;
  isExpanded: boolean;
  selectedMembers: string[];
  onToggleTag: () => void;
  onToggleExpand: () => void;
  onToggleMember: (mid: string) => void;
  onResetAll: () => void;
  contactField?: 'phone' | 'email';
}) {
  const allSelected = selectedMembers.length === 0;

  return (
    <div className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: tagActive ? '#2563eb' : '#e2e8f0' }}>
      {/* Row */}
      <div className="flex items-center gap-3 px-3 py-2.5 transition-colors"
        style={{ background: tagActive ? '#eff6ff' : '#f8fafc' }}>
        <div
          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all cursor-pointer"
          style={tagActive ? { background: '#2563eb', borderColor: '#2563eb' } : { borderColor: '#d1d5db' }}
          onClick={(e) => { e.stopPropagation(); onToggleTag(); }}
        >
          {tagActive && <Check className="size-2.5 text-white" />}
        </div>
        <div className="flex-1 flex items-center gap-2 cursor-pointer min-w-0" onClick={onToggleExpand}>
          <span className="text-sm font-medium truncate"
            style={{ color: tagActive ? '#2563eb' : '#374151' }}>
            {tag.name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ background: tagActive ? '#dbeafe' : '#f1f5f9', color: tagActive ? '#1e40af' : '#64748b' }}>
            {tagActive && !allSelected ? `已选 ${selectedMembers.length} 人` : `${tag.count.toLocaleString()} 人`}
          </span>
          <ChevronDown
            className="size-3.5 flex-shrink-0 transition-transform ml-auto"
            style={{ color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </div>

      {/* Member panel */}
      {isExpanded && (
        <div className="border-t px-3 py-2" style={{ borderColor: tagActive ? '#bfdbfe' : '#f1f5f9', background: '#f8faff' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              指定接收成员
              <span className="ml-1 font-normal text-gray-400">（不选则发送至全部 {tag.count} 人）</span>
            </span>
            {tagActive && !allSelected && (
              <button type="button" onClick={onResetAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                重置为全部
              </button>
            )}
          </div>
          <div className="space-y-1">
            {tag.members.map(member => {
              const mSelected = tagActive && (allSelected || selectedMembers.includes(member.id));
              const partialActive = tagActive && !allSelected && selectedMembers.includes(member.id);
              return (
                <div key={member.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: partialActive ? '#dbeafe' : 'transparent',
                    cursor: tagActive ? 'pointer' : 'default',
                  }}
                  onClick={() => tagActive && onToggleMember(member.id)}
                >
                  <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-all"
                    style={mSelected
                      ? { background: '#2563eb', borderColor: '#2563eb' }
                      : { borderColor: '#d1d5db', background: '#fff' }}>
                    {mSelected && <Check className="size-2 text-white" />}
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    {member.name.slice(0, 1)}
                  </div>
                  <span className="text-xs font-medium text-gray-800 flex-1 min-w-0 truncate">{member.name}</span>
                  {contactField && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {member[contactField]}
                    </span>
                  )}
                </div>
              );
            })}
            {tag.count > tag.members.length && (
              <p className="text-[10px] text-gray-400 px-2 pt-1">
                仅展示部分成员，完整 {tag.count} 人将在发送时自动匹配
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Internal-push tag selector ────────────────────────────────────
function InternalTagSelector({
  internalChannel,
  targetTags,
  targetTagMembers,
  onChange,
}: {
  internalChannel: InternalChannelType;
  targetTags: string[];
  targetTagMembers: Record<string, string[]>;
  onChange: (tags: string[], members: Record<string, string[]>) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) =>
    setExpanded(p => ({ ...p, [id]: !p[id] }));

  const toggleTag = (id: string) => {
    const active = targetTags.includes(id);
    const newTags = active ? targetTags.filter(x => x !== id) : [...targetTags, id];
    const newMembers = { ...targetTagMembers };
    if (active) delete newMembers[id];
    setExpanded(p => ({ ...p, [id]: !active }));
    onChange(newTags, newMembers);
  };

  const toggleMember = (tagId: string, mid: string) => {
    const cur = targetTagMembers[tagId] ?? [];
    const allIds = TAG_GROUPS.find(t => t.id === tagId)?.members.map(m => m.id) ?? [];
    const base = cur.length === 0 ? allIds : cur;
    const next = base.includes(mid) ? base.filter(x => x !== mid) : [...base, mid];
    onChange(targetTags, { ...targetTagMembers, [tagId]: next });
  };

  const resetAll = (tagId: string) =>
    onChange(targetTags, { ...targetTagMembers, [tagId]: [] });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">
        管理用户组
        <span className="ml-2 text-xs font-normal text-gray-400">不选则推送至全部人员</span>
      </label>
      <div className="space-y-2">
        {TAG_GROUPS.map(tag => (
          <TagGroupPanel
            key={tag.id}
            tag={tag}
            tagActive={targetTags.includes(tag.id)}
            isExpanded={expanded[tag.id] ?? false}
            selectedMembers={targetTagMembers[tag.id] ?? []}
            onToggleTag={() => toggleTag(tag.id)}
            onToggleExpand={() => toggleExpand(tag.id)}
            onToggleMember={(mid) => toggleMember(tag.id, mid)}
            onResetAll={() => resetAll(tag.id)}
            contactField={internalChannel === 'sms' ? 'phone' : 'email'}
          />
        ))}
      </div>
    </div>
  );
}

// ── User-push tag group selector ─────────────────────────────────
function UserTagSelector({
  targetTags,
  targetTagMembers,
  onChange,
}: {
  targetTags: string[];
  targetTagMembers: Record<string, string[]>;
  onChange: (tags: string[], members: Record<string, string[]>) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleTag = (id: string) => {
    const active = targetTags.includes(id);
    const newTags = active ? targetTags.filter(x => x !== id) : [...targetTags, id];
    const newMembers = { ...targetTagMembers };
    if (active) delete newMembers[id];
    setExpanded(p => ({ ...p, [id]: !active }));
    onChange(newTags, newMembers);
  };

  const toggleMember = (tagId: string, mid: string) => {
    const cur = targetTagMembers[tagId] ?? [];
    const allIds = TAG_GROUPS.find(t => t.id === tagId)?.members.map(m => m.id) ?? [];
    const base = cur.length === 0 ? allIds : cur;
    const next = base.includes(mid) ? base.filter(x => x !== mid) : [...base, mid];
    onChange(targetTags, { ...targetTagMembers, [tagId]: next });
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">
        标签人群
        <span className="ml-2 text-xs font-normal text-gray-400">不选则推送至全部人员</span>
      </label>
      <div className="space-y-2">
        {TAG_GROUPS.map(tag => (
          <TagGroupPanel
            key={tag.id}
            tag={tag}
            tagActive={targetTags.includes(tag.id)}
            isExpanded={expanded[tag.id] ?? false}
            selectedMembers={targetTagMembers[tag.id] ?? []}
            onToggleTag={() => toggleTag(tag.id)}
            onToggleExpand={() => setExpanded(p => ({ ...p, [tag.id]: !p[tag.id] }))}
            onToggleMember={(mid) => toggleMember(tag.id, mid)}
            onResetAll={() => onChange(targetTags, { ...targetTagMembers, [tag.id]: [] })}
          />
        ))}
      </div>
    </div>
  );
}

// ── Enterprise User Selector (Multi-selection across enterprises, Accordion style referencing TagGroupPanel) ───────
function EnterpriseUserSelector({
  selectedEnterpriseIds,
  selectedUserIds,
  onChange,
}: {
  selectedEnterpriseIds: string[];
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    selectedEnterpriseIds.forEach((id, idx) => {
      init[id] = idx === 0 || selectedEnterpriseIds.length <= 3;
    });
    return init;
  });

  const q = search.trim().toLowerCase();

  const toggleUser = (userId: string) => {
    const next = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onChange(next);
  };

  const toggleEnterpriseAll = (entId: string) => {
    const entUsers = ENTERPRISE_USERS.filter(u => u.enterpriseId === entId);
    const entUserIds = entUsers.map(u => u.id);
    const allSelected = entUserIds.length > 0 && entUserIds.every(id => selectedUserIds.includes(id));

    if (allSelected) {
      // Deselect all users of this enterprise
      onChange(selectedUserIds.filter(id => !entUserIds.includes(id)));
    } else {
      // Select all users of this enterprise
      const missing = entUserIds.filter(id => !selectedUserIds.includes(id));
      onChange([...selectedUserIds, ...missing]);
    }
  };

  const clearEnterprise = (entId: string) => {
    const entUserIds = ENTERPRISE_USERS.filter(u => u.enterpriseId === entId).map(u => u.id);
    onChange(selectedUserIds.filter(id => !entUserIds.includes(id)));
  };

  const toggleExpand = (entId: string) => {
    setExpanded(p => ({ ...p, [entId]: !p[entId] }));
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Search Input - Starts directly from search as requested */}
      <div className="relative">
        <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="搜索员工姓名..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8.5 pl-8 text-xs bg-white border-gray-200 focus-visible:ring-blue-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Cross-enterprise selection summary bar if any selected */}
      {selectedUserIds.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900">
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="size-3.5 text-blue-600" />
            已跨企业多选 <strong className="text-blue-700 font-bold">{selectedUserIds.length}</strong> 位员工
          </span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium"
          >
            清空所有已选
          </button>
        </div>
      )}

      {/* Enterprise Accordions (Referencing 标签人群 TagGroupPanel 样式) */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {selectedEnterpriseIds.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 border border-dashed rounded-xl bg-gray-50">
            暂未选择任何目标企业，请先在上方“目标企业”中勾选企业
          </div>
        ) : (
          selectedEnterpriseIds.map(entId => {
            const ent = ENTERPRISES.find(e => e.id === entId) ?? { id: entId, name: entId };
            const allUsers = ENTERPRISE_USERS.filter(u => u.enterpriseId === entId);
            const filteredUsers = q
              ? allUsers.filter(u =>
                  u.name.toLowerCase().includes(q) ||
                  u.role.toLowerCase().includes(q) ||
                  u.phone.includes(q) ||
                  (u.code && u.code.toLowerCase().includes(q)) ||
                  (u.dept && u.dept.toLowerCase().includes(q))
                )
              : allUsers;

            if (q && filteredUsers.length === 0) return null;

            const selectedInThisEnt = allUsers.filter(u => selectedUserIds.includes(u.id));
            const entActive = selectedInThisEnt.length > 0;
            const isAllEntSelected = allUsers.length > 0 && selectedInThisEnt.length === allUsers.length;
            const isExpanded = q ? true : (expanded[entId] ?? false);

            return (
              <div
                key={entId}
                className="rounded-xl border overflow-hidden transition-all"
                style={{ borderColor: entActive ? '#2563eb' : '#e2e8f0' }}
              >
                {/* Header Row (TagGroupPanel style) */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer select-none"
                  style={{ background: entActive ? '#eff6ff' : '#f8fafc' }}
                  onClick={() => toggleExpand(entId)}
                >
                  {/* Enterprise Checkbox (Select all / Deselect all for this enterprise) */}
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all cursor-pointer"
                    style={
                      entActive
                        ? { background: '#2563eb', borderColor: '#2563eb' }
                        : { borderColor: '#d1d5db', background: '#fff' }
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEnterpriseAll(entId);
                    }}
                    title={isAllEntSelected ? "取消全选本企业" : "全选本企业员工"}
                  >
                    {isAllEntSelected ? (
                      <Check className="size-2.5 text-white" />
                    ) : entActive ? (
                      <div className="w-2 h-0.5 bg-white rounded-full" />
                    ) : null}
                  </div>

                  {/* Enterprise Name & Badge */}
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <Building2
                      className="size-3.5 flex-shrink-0"
                      style={{ color: entActive ? '#2563eb' : '#64748b' }}
                    />
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: entActive ? '#2563eb' : '#374151' }}
                    >
                      {ent.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{
                        background: entActive ? '#dbeafe' : '#f1f5f9',
                        color: entActive ? '#1e40af' : '#64748b',
                      }}
                    >
                      {entActive
                        ? `已选 ${selectedInThisEnt.length} / ${allUsers.length} 人`
                        : `共 ${allUsers.length} 人`}
                    </span>
                    <ChevronDown
                      className="size-3.5 flex-shrink-0 transition-transform ml-auto"
                      style={{
                        color: '#94a3b8',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </div>
                </div>

                {/* Collapsible Employee Panel (TagGroupPanel style) */}
                {isExpanded && (
                  <div
                    className="border-t px-3 py-2 space-y-1.5"
                    style={{
                      borderColor: entActive ? '#bfdbfe' : '#f1f5f9',
                      background: '#f8faff',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-500">
                        指定接收员工
                        <span className="ml-1 font-normal text-gray-400">
                          （共 {allUsers.length} 位员工，支持跨企业多选）
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        {entActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearEnterprise(entId);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            清空本企业
                          </button>
                        )}
                        {!isAllEntSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEnterpriseAll(entId);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            全选本企业
                          </button>
                        )}
                      </div>
                    </div>

                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-3 text-xs text-gray-400 bg-white rounded-lg border border-gray-100">
                        {q ? '该企业没有匹配关键词的员工' : '暂无员工数据'}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredUsers.map(user => {
                          const isSelected = selectedUserIds.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              onClick={() => toggleUser(user.id)}
                              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer select-none border"
                              style={{
                                background: isSelected ? '#dbeafe' : '#fff',
                                borderColor: isSelected ? '#93c5fd' : '#e2e8f0',
                              }}
                            >
                              {/* Checkbox */}
                              <div
                                className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-all"
                                style={
                                  isSelected
                                    ? { background: '#2563eb', borderColor: '#2563eb' }
                                    : { borderColor: '#d1d5db', background: '#fff' }
                                }
                              >
                                {isSelected && <Check className="size-2 text-white" />}
                              </div>

                              {/* Avatar */}
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                style={{
                                  background: isSelected ? '#2563eb' : '#e0f2fe',
                                  color: isSelected ? '#fff' : '#0369a1',
                                }}
                              >
                                {user.name.slice(0, 1)}
                              </div>

                              {/* Name */}
                              <span className="text-xs font-medium text-gray-800">
                                {user.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function EditDialog({
  template,
  defaultCategory = 'user',
  onClose,
  onSave,
}: {
  template?: MessageTemplate;
  defaultCategory?: MessageCategory;
  onClose: () => void;
  onSave: (data: FormData) => void;
}) {
  const [form, setForm] = useState<FormData>(
    template
      ? {
          name: template.name,
          enabled: template.enabled,
          messageCategory: template.messageCategory ?? 'user',
          channels: template.channels,
          internalChannel: template.internalChannel ?? 'sms',
          targetTagMembers: template.targetTagMembers ?? {},
          serviceType: template.serviceType,
          eventType: template.eventType,
          targetEnterprises: template.targetEnterprises,
          targetMode: template.targetMode,
          targetRoles: template.targetRoles,
          targetTags: template.targetTags,
          status: template.status,
          title: template.title,
          content: template.content,
          smsCode: template.smsCode,
          webhookUrl: template.webhookUrl ?? '',
          mpTemplateId: template.mpTemplateId ?? '',
          mpPagePath: template.mpPagePath ?? '',
          pushTimeStart: template.pushTimeStart,
          pushTimeEnd: template.pushTimeEnd,
          dailyLimit: template.dailyLimit,
          variables: template.variables,
          manualUsers: template.manualUsers ?? [],
          selectedEnterpriseUserId: template.selectedEnterpriseUserId ?? '',
          selectedEnterpriseUserIds: template.selectedEnterpriseUserIds && template.selectedEnterpriseUserIds.length > 0
            ? template.selectedEnterpriseUserIds
            : (template.selectedEnterpriseUserId ? [template.selectedEnterpriseUserId] : []),
        }
      : { ...BLANK_FORM, messageCategory: defaultCategory, targetMode: defaultCategory === 'internal' ? 'tag' : 'role' }
  );
  const [activeTab, setActiveTab] = useState('content');

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleContent = (cnt: string) =>
    setForm((p) => ({ ...p, content: cnt, variables: extractVariables(cnt) }));

  const isInternal = form.messageCategory === 'internal';
  const userChannel = !isInternal ? (form.channels[0] ?? 'inapp') : 'inapp';
  const hasSms     = isInternal ? form.internalChannel === 'sms' : userChannel === 'sms';
  const hasWecom   = isInternal && form.internalChannel === 'wecom';
  const hasMiniprogram = !isInternal && userChannel === 'miniprogram';
  const showTitle  = isInternal ? form.internalChannel === 'email' : (userChannel !== 'sms' && userChannel !== 'miniprogram');

  const toggleRole = (id: string) =>
    set('targetRoles', form.targetRoles.includes(id) ? form.targetRoles.filter(x => x !== id) : [...form.targetRoles, id]);

  // all roles grouped by version for the role picker
  const allRolesByVersion = ENTERPRISE_ROLES.reduce<Record<string, typeof ENTERPRISE_ROLES>>((acc, r) => {
    (acc[r.version] ??= []).push(r);
    return acc;
  }, {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('请填写模板名称'); return; }
    if (!isInternal && !form.channels[0]) { toast.error('请选择推送渠道'); return; }
    if (hasSms && !form.smsCode.trim()) { toast.error('选择短信渠道时必须填写短信代码'); return; }
    if (hasWecom && !form.webhookUrl.trim()) { toast.error('选择企业微信渠道时必须配置 Webhook 地址'); return; }
    if (hasWecom && !/^https?:\/\//i.test(form.webhookUrl.trim())) { toast.error('企业微信 Webhook 地址必须以 http:// 或 https:// 开头'); return; }
    if (hasMiniprogram && !form.mpTemplateId.trim()) { toast.error('选择小程序订阅消息渠道时必须填写小程序模板ID'); return; }
    if (!isInternal && form.targetMode === 'enterprise_user') {
      const uids = form.selectedEnterpriseUserIds && form.selectedEnterpriseUserIds.length > 0
        ? form.selectedEnterpriseUserIds
        : (form.selectedEnterpriseUserId ? [form.selectedEnterpriseUserId] : []);
      if (uids.length === 0) {
        toast.error('请在目标企业中至少选择一位员工');
        return;
      }
    }
    if (!form.content.trim()) { toast.error('请填写消息正文'); return; }
    onSave(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[92vh] overflow-y-auto transition-all duration-200 box-border p-4 sm:p-6" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            {template ? '编辑模板' : '新建模板'}
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={isInternal
                ? { background: '#dbeafe', color: '#1d4ed8' }
                : { background: '#d1fae5', color: '#065f46' }}
            >
              {isInternal ? <MessageSquare className="size-3" /> : <Users className="size-3" />}
              {isInternal ? '内部推送' : '用户推送'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form id="tpl-form" onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-2">
              {[{ value: 'content', label: '消息内容' }, { value: 'target', label: '推送设置' }, { value: 'service_params', label: '服务参数' }].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── 消息内容 ─────────────────────────────────── */}
            <TabsContent value="content" className="space-y-4 mt-0">
              {/* 模板名称 */}
              <div className="space-y-1.5">
                <Label className="text-sm">模板名称 <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="例如：电网异常预警通知"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* 服务模块 + 消息事件 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">服务模块 *</Label>
                  <Select value={form.serviceType} onValueChange={(v) => {
                    set('serviceType', v as ServiceType);
                    set('eventType', '');
                    set('targetRoles', form.targetRoles.filter(rid => {
                      const r = ENTERPRISE_ROLES.find(x => x.id === rid);
                      return r && r.service === v;
                    }));
                  }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="energy_management">能源管理</SelectItem>
                      <SelectItem value="smart_microgrid">智能微网</SelectItem>
                      <SelectItem value="virtual_power_plant">虚拟电厂</SelectItem>
                      <SelectItem value="all">平台通知</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">消息事件</Label>
                  <Select value={form.eventType} onValueChange={(v) => set('eventType', v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="选择事件类型" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_EVENTS[form.serviceType].map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>



              {/* 推送渠道单选 */}
              <div className="space-y-2">
                <Label className="text-sm">推送渠道 <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  {isInternal ? (
                    <>
                      {([
                        { value: 'sms'   as InternalChannelType, label: '短信',     icon: MessageSquare },
                        { value: 'email' as InternalChannelType, label: '邮件',     icon: Mail },
                        { value: 'wecom' as InternalChannelType, label: '企业微信', icon: MessageCircle },
                      ]).map(({ value, label, icon: Icon }) => {
                        const active = form.internalChannel === value;
                        return (
                          <button key={value} type="button"
                            onClick={() => {
                              set('internalChannel', value);
                              if (value !== 'sms') set('smsCode', '');
                            }}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg border text-sm font-medium transition-all"
                            style={active
                              ? { background: '#eff6ff', color: '#2563eb', borderColor: '#2563eb', boxShadow: '0 0 0 1px #2563eb' }
                              : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                            <Icon className="size-4" />{label}
                            {active && <Check className="size-3.5 ml-1" />}
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {([
                        { value: 'inapp'       as ChannelType, label: '站内信',           icon: Bell },
                        { value: 'sms'         as ChannelType, label: '短信',             icon: MessageSquare },
                        { value: 'miniprogram' as ChannelType, label: '小程序订阅消息',   icon: Smartphone },
                      ]).map(({ value, label, icon: Icon }) => {
                        const active = userChannel === value;
                        return (
                          <button key={value} type="button"
                            onClick={() => { set('channels', [value]); if (value !== 'sms') set('smsCode', ''); }}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg border text-sm font-medium transition-all"
                            style={active
                              ? { background: '#eff6ff', color: '#2563eb', borderColor: '#2563eb', boxShadow: '0 0 0 1px #2563eb' }
                              : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                            <Icon className="size-4" />{label}
                            {active && <Check className="size-3.5 ml-1" />}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* 企业微信 Webhook 配置 */}
              {hasWecom && (
                <div className="space-y-2 p-3.5 rounded-lg border border-sky-100 bg-sky-50/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <Webhook className="size-3.5 text-sky-600" />
                      企业微信 Webhook 地址 <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded font-medium">
                      群机器人 Webhook
                    </span>
                  </div>
                  <Input
                    placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={form.webhookUrl}
                    onChange={(e) => set('webhookUrl', e.target.value)}
                    className="h-9 text-xs font-mono bg-white border-sky-200 focus-visible:ring-sky-400"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                    <span>配置企业微信群机器人的 Webhook 地址，用于向企微群或内部成员推送此消息正文</span>
                    <button
                      type="button"
                      onClick={() => {
                        set('webhookUrl', 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=9b823e41-6cd7-4bb9-8231-8971f112e431');
                        toast.success('已填入示例 Webhook 地址');
                      }}
                      className="text-sky-600 hover:text-sky-700 hover:underline shrink-0 ml-2 font-medium"
                    >
                      填入示例地址
                    </button>
                  </div>
                </div>
              )}

              {/* 小程序订阅消息配置 */}
              {hasMiniprogram && (
                <div className="space-y-3 p-3.5 rounded-lg border border-gray-200 bg-gray-50/70">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <Smartphone className="size-3.5 text-gray-500" />
                      小程序订阅消息配置 <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded font-medium">
                      订阅消息参数
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700">
                        小程序模版 ID (Template ID) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="例如：WX_SUB_ENERGY_ALARM 或 7v_B9q1..."
                        value={form.mpTemplateId}
                        onChange={(e) => set('mpTemplateId', e.target.value.trim())}
                        className="h-9 text-xs font-mono bg-white border-gray-200 focus-visible:ring-blue-500"
                      />
                      <p className="text-[11px] text-gray-400">微信公众平台订阅消息对应的模板 ID</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-700">小程序跳转页面路径</Label>
                        <button
                          type="button"
                          onClick={() => set('mpPagePath', 'pages/index/index')}
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          设为首页路径
                        </button>
                      </div>
                      <Input
                        placeholder="例如：pages/energy/alert-detail?id={{alertId}}"
                        value={form.mpPagePath}
                        onChange={(e) => set('mpPagePath', e.target.value.trim())}
                        className="h-9 text-xs font-mono bg-white border-gray-200 focus-visible:ring-blue-500"
                      />
                      <p className="text-[11px] text-gray-400">用户点击订阅消息卡片直接跳转的小程序页面</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 短信模板代码 — 内部短信：文本输入；用户短信：下拉选择 */}
              {hasSms && (
                <div className="space-y-1.5">
                  <Label className="text-sm">短信模板代码 <span className="text-red-500">*</span></Label>
                  {isInternal ? (
                    <Input
                      placeholder="SMS_VERIFY_CODE"
                      value={form.smsCode}
                      onChange={(e) => set('smsCode', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                      className="h-9 text-sm font-mono"
                    />
                  ) : (
                    <Select
                      value={form.smsCode}
                      onValueChange={(v) => {
                        const tpl = SMS_TEMPLATE_OPTIONS.find(t => t.code === v);
                        if (tpl) setForm(p => ({ ...p, smsCode: v, content: tpl.content, variables: extractVariables(tpl.content) }));
                        else set('smsCode', v);
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm font-mono"><SelectValue placeholder="选择短信模板代码" /></SelectTrigger>
                      <SelectContent>
                        {SMS_TEMPLATE_OPTIONS.map((t) => (
                          <SelectItem key={t.code} value={t.code}>
                            <span className="font-mono text-xs text-blue-700 mr-2">{t.code}</span>
                            <span className="text-gray-500">{t.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {showTitle && (
                <div className="space-y-1.5">
                  <Label className="text-sm">消息标题</Label>
                  <Input placeholder="输入消息标题" value={form.title} onChange={(e) => set('title', e.target.value)} className="h-9 text-sm" />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">
                    消息正文 <span className="text-red-500">*</span>
                    {!isInternal && userChannel === 'sms' && (
                      <span className="ml-2 text-xs font-normal text-gray-400">由短信模板自动填充，不可编辑</span>
                    )}
                  </Label>
                </div>
                {!isInternal && userChannel === 'sms' ? (
                  <div className="rounded-md border px-3 py-2 text-sm text-gray-500 bg-gray-50 min-h-[120px] whitespace-pre-wrap leading-relaxed" style={{ borderColor: '#e2e8f0' }}>
                    {form.content || <span className="text-gray-300 italic">请先选择短信模板代码</span>}
                  </div>
                ) : (
                  <Textarea
                    placeholder="输入消息正文内容，可使用 {{变量名}} 插入动态变量"
                    value={form.content}
                    onChange={(e) => handleContent(e.target.value)}
                    rows={6}
                    className="text-sm resize-none font-sans"
                  />
                )}
                {!((!isInternal) && userChannel === 'sms') && (
                  <p className="text-xs text-gray-400">用 {`{{变量名}}`} 格式插入动态内容</p>
                )}
              </div>

              {form.variables.length > 0 && (
                <div className="p-3 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Code2 className="size-3.5" style={{ color: '#2563eb' }} />
                    <span className="text-xs font-medium" style={{ color: '#1e40af' }}>已检测到 {form.variables.length} 个变量</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.variables.map((v) => (
                      <code key={v} className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: '#dbeafe', color: '#1e40af' }}>
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── 推送设置 ─────────────────────────────────── */}
            <TabsContent value="target" className="space-y-5 mt-0">

              {isInternal ? (
                <>
                  {/* 内部推送：推送目标类型 */}
                  <div className="space-y-2">
                    <Label className="text-sm">推送目标类型</Label>
                    <div className="flex gap-2">
                      {([
                        { value: 'tag'    as TargetMode, label: '管理用户组', icon: Tag      },
                        { value: 'manual' as TargetMode, label: '手动添加',   icon: UserPlus },
                      ]).map(({ value: modeVal, label: modeLabel, icon: ModeIcon }) => {
                        const active = form.targetMode === modeVal;
                        return (
                          <button key={modeVal} type="button"
                            onClick={() => set('targetMode', modeVal)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all flex-1 justify-center"
                            style={active
                              ? { background: '#eff6ff', color: '#2563eb', borderColor: '#2563eb', boxShadow: '0 0 0 1px #2563eb' }
                              : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                            <ModeIcon className="size-4" />
                            {modeLabel}
                            {active && <Check className="size-3.5 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 管理用户组 */}
                  {(form.targetMode === 'tag' || form.targetMode === 'role') && (
                    <InternalTagSelector
                      internalChannel={form.internalChannel}
                      targetTags={form.targetTags ?? []}
                      targetTagMembers={form.targetTagMembers ?? {}}
                      onChange={(tags, members) =>
                        setForm(p => ({ ...p, targetTags: tags, targetTagMembers: members }))
                      }
                    />
                  )}

                  {/* 手动添加 */}
                  {form.targetMode === 'manual' && (
                    <ManualUserSelector
                      value={form.manualUsers}
                      onChange={(users) => set('manualUsers', users)}
                    />
                  )}
                </>
              ) : (
                <>
                  {/* 目标企业 */}
                  <div className="relative">
                    <EnterpriseMultiSelect
                      value={form.targetEnterprises}
                      onChange={(v) => {
                        set('targetEnterprises', v);
                        if (v.length === 0 && form.targetMode === 'enterprise_user') {
                          set('targetMode', 'role');
                        }
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1">不选则对开通当前服务的全部企业生效</p>
                  </div>

                  {/* 推送目标类型 */}
                  <div className="space-y-2">
                    <Label className="text-sm">推送目标类型</Label>
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { value: 'role'   as TargetMode, label: '企业角色', icon: Users    },
                        { value: 'tag'    as TargetMode, label: '标签人群', icon: Tag      },
                        { value: 'manual' as TargetMode, label: '手动添加', icon: UserPlus },
                        ...(form.targetEnterprises.length > 0 ? [
                          { value: 'enterprise_user' as TargetMode, label: '企业用户', icon: UserCheck }
                        ] : []),
                      ]).map(({ value: modeVal, label: modeLabel, icon: ModeIcon }) => {
                        const active = form.targetMode === modeVal;
                        return (
                          <button key={modeVal} type="button"
                            onClick={() => set('targetMode', modeVal)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all flex-1 min-w-[100px] justify-center"
                            style={active
                              ? { background: '#eff6ff', color: '#2563eb', borderColor: '#2563eb', boxShadow: '0 0 0 1px #2563eb' }
                              : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                            <ModeIcon className="size-4 shrink-0" />
                            <span>{modeLabel}</span>
                            {active && <Check className="size-3.5 ml-auto hidden sm:inline-block" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 企业角色 */}
                  {form.targetMode === 'role' && (
                    <div className="space-y-3">
                      <Label className="text-sm">
                        企业角色
                        <span className="ml-2 text-xs font-normal text-gray-400">不选则不限制</span>
                      </Label>
                      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                        {Object.entries(allRolesByVersion).map(([version, roles], gi) => (
                          <div key={version} style={{ borderBottom: gi < Object.keys(allRolesByVersion).length - 1 ? '1px solid #f1f5f9' : undefined }}>
                            <div className="px-3 py-1.5" style={{ background: '#f8fafc' }}>
                              <span className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.04em' }}>{version}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
                              {roles.map(role => {
                                const active = (form.targetRoles ?? []).includes(role.id);
                                return (
                                  <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-all"
                                    style={active
                                      ? { background: '#2563eb', color: '#fff', borderColor: '#2563eb' }
                                      : { background: '#fff', color: '#475569', borderColor: '#e2e8f0' }}>
                                    {active && <Check className="size-3" />}
                                    {role.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {(form.targetRoles ?? []).length > 0 && (
                        <button type="button" onClick={() => set('targetRoles', [])}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                          清除已选角色
                        </button>
                      )}
                    </div>
                  )}

                  {/* 标签人群（用户推送） */}
                  {form.targetMode === 'tag' && (
                    <UserTagSelector
                      targetTags={form.targetTags ?? []}
                      targetTagMembers={form.targetTagMembers ?? {}}
                      onChange={(tags, members) =>
                        setForm(p => ({ ...p, targetTags: tags, targetTagMembers: members }))
                      }
                    />
                  )}

                  {/* 手动添加用户 */}
                  {form.targetMode === 'manual' && (
                    <ManualUserSelector
                      value={form.manualUsers}
                      onChange={(users) => set('manualUsers', users)}
                    />
                  )}

                  {/* 企业用户（跨企业多选） */}
                  {form.targetMode === 'enterprise_user' && (
                    <EnterpriseUserSelector
                      selectedEnterpriseIds={form.targetEnterprises}
                      selectedUserIds={
                        form.selectedEnterpriseUserIds && form.selectedEnterpriseUserIds.length > 0
                          ? form.selectedEnterpriseUserIds
                          : (form.selectedEnterpriseUserId ? [form.selectedEnterpriseUserId] : [])
                      }
                      onChange={(uids) => {
                        setForm(p => ({
                          ...p,
                          selectedEnterpriseUserIds: uids,
                          selectedEnterpriseUserId: uids[0] ?? '',
                        }));
                      }}
                    />
                  )}
                </>
              )}

              {/* 推送限制 */}
              <div className="space-y-2 pt-1 border-t" style={{ borderColor: '#f1f5f9' }}>
                <Label className="text-sm">推送限制</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">限制时段（开始）</Label>
                    <input
                      type="time"
                      value={form.pushTimeStart}
                      onChange={(e) => set('pushTimeStart', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">限制时段（结束）</Label>
                    <input
                      type="time"
                      value={form.pushTimeEnd}
                      onChange={(e) => set('pushTimeEnd', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">单渠道单日限制次数（0 表示不限制）</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.dailyLimit}
                    onChange={(e) => set('dailyLimit', Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-9 text-sm w-40"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-400">仅在设定时段内推送；单日次数限制按渠道独立计算，如设置 10 次，小程序端、短信各自最多推送 10 次，0 表示不限制</p>
              </div>
            </TabsContent>

            {/* ── 服务参数 ─────────────────────────────────── */}
            <TabsContent value="service_params" className="mt-0">
              {(() => {
                const groups = SERVICE_PARAMS[form.serviceType];
                const svcLabel = SERVICE_LABELS[form.serviceType];
                if (!groups || groups.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                      <div className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                        <BookOpen className="size-5 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400">当前服务模块无自定义参数</p>
                      <p className="text-xs text-gray-300">选择具体服务模块后可查看对应的扩展参数结构</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={SERVICE_STYLE[form.serviceType]}>
                        {svcLabel}
                      </span>
                      <p className="text-xs text-gray-400">以下为该服务模块支持的扩展推送参数，由对应服务接入方在触发推送时提供</p>
                    </div>
                    {groups.map((grp) => (
                      <div key={grp.group} className="rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                        {/* Group header */}
                        <div className="flex items-start gap-3 px-4 py-3 border-b" style={{ background: '#fafafa', borderColor: '#f1f5f9' }}>
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: grp.color.color }} />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{grp.group}</p>
                            {grp.desc && <p className="text-xs text-gray-400 mt-0.5">{grp.desc}</p>}
                          </div>
                        </div>
                        {/* Param rows */}
                        <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
                          {grp.params.map((p) => {
                            const ts = PARAM_TYPE_STYLE[p.type];
                            return (
                              <div key={p.key} className="px-4 py-3 flex gap-4 items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <code className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                                      {p.key}
                                    </code>
                                    <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: ts.backgroundColor, color: ts.color }}>
                                      {ts.label}
                                    </span>
                                    {p.required && (
                                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: '#fee2e2', color: '#b91c1c' }}>必填</span>
                                    )}
                                    <span className="text-xs text-gray-700 font-medium">{p.label}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>
                                  {p.options && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {p.options.map((opt) => (
                                        <span key={opt} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                          {opt}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {p.example && (
                                  <div className="flex-shrink-0 text-right">
                                    <p className="text-xs text-gray-400 mb-0.5">示例</p>
                                    <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded block">{p.example}</code>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-300 text-center pb-1">参数由对应服务接入方在调用推送 API 时传入，平台负责透传与渲染</p>
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>取消</Button>
            <Button size="sm" type="submit" style={{ background: '#2563eb' }} className="text-white hover:opacity-90">
              {template ? '保存修改' : '创建模板'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Tag list helper ───────────────────────────────────────────
function TagList({ items, style }: { items: string[]; style: { backgroundColor: string; color: string } }) {
  const show = items.slice(0, 2);
  const rest = items.length - 2;
  return (
    <div className="flex flex-wrap gap-1">
      {show.map((item) => (
        <span key={item} className="px-1.5 py-0.5 rounded text-xs font-medium" style={style}>
          {item}
        </span>
      ))}
      {rest > 0 && (
        <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: '#f1f5f9', color: '#64748b' }}>
          +{rest}
        </span>
      )}
    </div>
  );
}

// ── Enterprise cell: single/few inline, many as clickable count ──
function EnterpriseCell({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (ids.length === 0) return <span className="text-xs text-gray-400">全部</span>;
  if (ids.length <= 2) {
    return (
      <span className="text-xs text-gray-600">
        {ids.map(getEnterpriseName).join('、')}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors"
        style={{ background: open ? '#d1fae5' : '#f1f5f9', color: open ? '#065f46' : '#475569' }}
      >
        {ids.length} 家企业
      </button>
      {open && (
        <div
          className="absolute z-50 left-0 top-full mt-1.5 rounded-xl border shadow-lg py-1.5 min-w-[140px]"
          style={{ background: '#fff', borderColor: '#e2e8f0' }}
        >
          {ids.map(id => (
            <div key={id} className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 whitespace-nowrap">
              {getEnterpriseName(id)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function TemplateList() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplates();

  const [categoryTab, setCategoryTab] = useState<MessageCategory>('user');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceType | '_all'>('_all');

  const [editId, setEditId]     = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    return (t.messageCategory ?? 'user') === categoryTab
      && (t.name.toLowerCase().includes(q) || t.content.toLowerCase().includes(q))
      && (statusFilter === 'all' || t.status === statusFilter)
      && (serviceFilter === '_all' || t.serviceType === serviceFilter);
  });

  const editTemplate = editId ? templates.find((t) => t.id === editId) : undefined;

  const handleSave = (data: FormData) => {
    if (editId === '') {
      addTemplate(data as any);
      toast.success('模板已创建');
    } else if (editId) {
      updateTemplate(editId, data as any);
      toast.success('模板已更新');
    }
    setEditId(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTemplate(deleteId);
      toast.success('模板已删除');
      setDeleteId(null);
    }
  };

  // Column headers differ by category
  const userHeaders    = ['模板ID', '模板名称', '推送渠道', '服务模块', '目标企业', '推送目标', '预计人数', '累计推送', '更新时间', '最后操作人', '启用', '操作'];
  const internalHeaders = ['模板ID', '模板名称', '推送渠道', '服务模块', '推送目标', '预计人数', '累计推送', '更新时间', '最后操作人', '启用', '操作'];
  const tableHeaders = categoryTab === 'user' ? userHeaders : internalHeaders;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            消息模板
          </h1>
          <p className="text-sm text-gray-500">管理各企业和服务模块的消息推送模板</p>
        </div>
        <Button onClick={() => setEditId('')} style={{ background: '#2563eb' }} className="text-white hover:opacity-90">
          <Plus className="size-4 mr-2" />新建模板
        </Button>
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
              onClick={() => { setCategoryTab(value); setSearch(''); setStatusFilter('all'); setServiceFilter('_all'); }}
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

      {/* Filters */}
      <Card className="p-5 mb-5 rounded-md shadow-sm border-gray-200">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">模糊搜索:</span>
            <Input
              placeholder="搜索模板名称或内容..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm h-9 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">所属模块:</span>
            <Select value={serviceFilter} onValueChange={(v) => setServiceFilter(v as ServiceType | '_all')}>
              <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="全部模块" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">全部模块</SelectItem>
                <SelectItem value="energy_management">能源管理</SelectItem>
                <SelectItem value="smart_microgrid">智能微网</SelectItem>
                <SelectItem value="virtual_power_plant">虚拟电厂</SelectItem>
                <SelectItem value="all">平台通知</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">模板状态:</span>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TemplateStatus | 'all')}>
              <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="全部状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            {filtered.length !== templates.filter(t => (t.messageCategory ?? 'user') === categoryTab).length && (
              <span className="text-xs text-gray-400 mr-2">
                已过滤 {filtered.length} / {templates.filter(t => (t.messageCategory ?? 'user') === categoryTab).length}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-5"
              onClick={() => { setSearch(''); setServiceFilter('_all'); setStatusFilter('all'); }}
            >
              重置
            </Button>
            <Button
              size="sm"
              className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white"
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
                {tableHeaders.map((h) => (
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
                  <td colSpan={tableHeaders.length} className="py-16 text-center text-sm text-gray-400">
                    未找到匹配的模板
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => {

                  // For internal push: show badge based on internalChannel
                  const internalCh = t.internalChannel ?? 'sms';
                  const intChStyle = INTERNAL_CHANNEL_STYLE[internalCh] ?? { backgroundColor: '#f1f5f9', color: '#475569' };
                  const intChLabel = INTERNAL_CHANNEL_LABELS[internalCh] ?? internalCh;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : undefined }}
                    >
                      {/* 模板ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-mono text-gray-400">{t.id}</span>
                      </td>
                      {/* 名称 */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="font-medium text-gray-800 truncate">{t.name}</p>
                      </td>
                      {/* 渠道 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {categoryTab === 'internal' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: intChStyle.backgroundColor, color: intChStyle.color }}>
                            {intChLabel}
                          </span>
                        ) : (
                          <TagList
                            items={t.channels.map((c) => CHANNEL_LABELS[c])}
                            style={CHANNEL_STYLE[t.channels[0]] ?? { backgroundColor: '#f1f5f9', color: '#475569' }}
                          />
                        )}
                      </td>
                      {/* 服务模块 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={SERVICE_STYLE[t.serviceType]}>
                          {SERVICE_LABELS[t.serviceType]}
                        </span>
                      </td>
                      {/* 目标企业 — user push only */}
                      {categoryTab === 'user' && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <EnterpriseCell ids={t.targetEnterprises} />
                        </td>
                      )}
                      {/* 推送目标 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.targetMode === 'tag' ? (
                          t.targetTags.length === 0 ? (
                            <span className="flex items-center gap-1 text-xs text-gray-400"><Tag className="size-3" />全部人员</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Tag className="size-3 text-purple-500 flex-shrink-0" />
                              <TagList
                                items={t.targetTags.map(tid => TAG_GROUPS.find(g => g.id === tid)?.name ?? tid)}
                                style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}
                              />
                            </div>
                          )
                        ) : t.targetMode === 'enterprise_user' ? (
                          (() => {
                            const uids = t.selectedEnterpriseUserIds && t.selectedEnterpriseUserIds.length > 0
                              ? t.selectedEnterpriseUserIds
                              : (t.selectedEnterpriseUserId ? [t.selectedEnterpriseUserId] : []);
                            if (uids.length === 0) {
                              return (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <UserCheck className="size-3" />企业用户 (未选)
                                </span>
                              );
                            }
                            const users = ENTERPRISE_USERS.filter(x => uids.includes(x.id));
                            if (users.length === 1) {
                              const u = users[0];
                              const ent = ENTERPRISES.find(e => e.id === u.enterpriseId);
                              return (
                                <div className="flex items-center gap-1.5">
                                  <UserCheck className="size-3.5 text-blue-600 flex-shrink-0" />
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    {u.name} ({ent?.name ?? u.enterpriseId})
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="size-3.5 text-blue-600 flex-shrink-0" />
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  {users.map(u => u.name).slice(0, 2).join('、')}{users.length > 2 ? ` 等${users.length}人` : ''}
                                </span>
                              </div>
                            );
                          })()
                        ) : t.targetMode === 'manual' ? (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <UserPlus className="size-3 text-blue-500" />
                            手动添加 ({t.manualUsers?.length ?? 0}人)
                          </span>
                        ) : (
                          t.targetRoles.length === 0 ? (
                            <span className="flex items-center gap-1 text-xs text-gray-400"><Users className="size-3" />全部用户</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Users className="size-3 text-blue-600 flex-shrink-0" />
                              <TagList
                                items={t.targetRoles.map(rid => ENTERPRISE_ROLES.find(r => r.id === rid)?.name ?? rid)}
                                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                              />
                            </div>
                          )
                        )}
                      </td>
                      {/* 预计人数 */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs tabular-nums text-gray-700">
                        {(() => {
                          if (t.targetMode === 'enterprise_user') {
                            const count = (t.selectedEnterpriseUserIds && t.selectedEnterpriseUserIds.length > 0)
                              ? t.selectedEnterpriseUserIds.length
                              : (t.selectedEnterpriseUserId ? 1 : 0);
                            return <span className="text-blue-600 font-medium">{count} 人</span>;
                          }
                          if (t.targetMode === 'manual') return <span>{(t.manualUsers?.length ?? 0).toLocaleString()} 人</span>;
                          if (t.targetMode === 'role') return <span className="text-gray-400">—</span>;
                          if (t.targetTags.length === 0) {
                            const total = TAG_GROUPS.reduce((s, g) => s + g.count, 0);
                            return total.toLocaleString();
                          }
                          const count = t.targetTags.reduce((s, tid) => {
                            const grp = TAG_GROUPS.find(g => g.id === tid);
                            if (!grp) return s;
                            const picked = (t.targetTagMembers ?? {})[tid] ?? [];
                            return s + (picked.length > 0 ? picked.length : grp.count);
                          }, 0);
                          return count.toLocaleString();
                        })()}
                      </td>
                      {/* 累计推送 */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs tabular-nums text-gray-600">
                        {t.sendCount.toLocaleString()}
                      </td>
                      {/* 更新时间 */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs tabular-nums text-gray-400">
                        {t.updatedAt.toLocaleDateString('zh-CN')}
                      </td>
                      {/* 最后操作人 */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                        {t.operator ?? '—'}
                      </td>
                      {/* 启用开关 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Switch
                          checked={t.enabled}
                          onCheckedChange={(checked) => {
                            updateTemplate(t.id, { enabled: checked });
                            toast.success(checked ? `「${t.name}」已启用` : `「${t.name}」已停用`);
                          }}
                        />
                      </td>
                      {/* 操作 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900" onClick={() => setEditId(t.id)}>
                            <Edit2 className="size-3.5 mr-1" />编辑
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500" onClick={() => setDeleteId(t.id)}>
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
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">共 {filtered.length} 条记录</span>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      {editId !== null && (
        <EditDialog template={editTemplate} defaultCategory={categoryTab} onClose={() => setEditId(null)} onSave={handleSave} />
      )}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除模板</AlertDialogTitle>
            <AlertDialogDescription>此操作无法撤销，模板将被永久删除。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
