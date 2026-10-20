import { Link } from 'react-router';
import { Card } from '../components/ui/card';
import { FileText, Send, CheckCircle, TrendingUp, ArrowRight, Zap, Building2 } from 'lucide-react';
import { useTemplates, CHANNEL_LABELS, INTERNAL_CHANNEL_LABELS, SERVICE_LABELS, ENTERPRISES } from '../contexts/TemplateContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const sendTrend = [
  { date: '6/24', count: 3240 },
  { date: '6/25', count: 4180 },
  { date: '6/26', count: 2950 },
  { date: '6/27', count: 5620 },
  { date: '6/28', count: 4870 },
  { date: '6/29', count: 6340 },
  { date: '6/30', count: 5890 },
];

const serviceBreakdown = [
  { name: '能源管理',   value: 42, color: '#2563eb' },
  { name: '智能微网',   value: 31, color: '#38bdf8' },
  { name: '虚拟电厂',   value: 27, color: '#f59e0b' },
];

export default function Dashboard() {
  const { templates } = useTemplates();

  const published   = templates.filter((t) => t.status === 'published').length;
  const draft       = templates.filter((t) => t.status === 'draft').length;
  const totalSends  = templates.reduce((s, t) => s + t.sendCount, 0);

  const getEnterpriseName = (id: string) =>
    id === 'all' ? '全部企业' : (ENTERPRISES.find((e) => e.id === id)?.name ?? id);

  const recentTemplates = [...templates]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            消息推送概览
          </h1>
          <p className="text-sm text-gray-500">零碳 SaaS 平台 · 实时消息推送管理中心</p>
        </div>
        <div className="flex items-center text-xs font-medium px-3 py-1.5 rounded-full border" style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse" />
          系统运行正常
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: '消息模板总数', value: templates.length,
            sub: `草稿 ${draft} 个`,
            icon: FileText, iconColor: '#2563eb', iconBg: '#dbeafe',
            trend: '+2 本月',
          },
          {
            label: '已发布模板', value: published,
            sub: `发布率 ${Math.round((published / Math.max(templates.length, 1)) * 100)}%`,
            icon: CheckCircle, iconColor: '#0284c7', iconBg: '#e0f2fe',
            trend: null,
          },
          {
            label: '累计推送量', value: totalSends.toLocaleString(),
            sub: '所有渠道合计',
            icon: Send, iconColor: '#f59e0b', iconBg: '#fef3c7',
            trend: '+12.4%',
          },
          {
            label: '覆盖企业数', value: ENTERPRISES.length,
            sub: '能源管理 / 微网 / 虚拟电厂',
            icon: Building2, iconColor: '#8b5cf6', iconBg: '#ede9fe',
            trend: null,
          },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl" style={{ background: s.iconBg }}>
                <s.icon className="size-5" style={{ color: s.iconColor }} />
              </div>
              {s.trend && (
                <div className="flex items-center text-xs font-medium text-blue-600">
                  <TrendingUp className="size-3 mr-1" />{s.trend}
                </div>
              )}
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {s.value}
            </div>
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">近 7 日推送量趋势</h2>
            <span className="text-xs text-gray-400">条/日</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={sendTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#cg)" dot={false} activeDot={{ r: 4, fill: '#2563eb' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">服务模块分布</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={serviceBreakdown} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={56} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, '占比']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {serviceBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent templates */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">最近更新模板</h2>
          <Link to="/templates" className="flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
            查看全部 <ArrowRight className="size-3 ml-1" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentTemplates.map((template) => (
            <div key={template.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-3 flex-shrink-0" style={{ background: '#dbeafe' }}>
                  <Zap className="size-3.5" style={{ color: '#2563eb' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{template.name}</p>
                  <p className="text-xs text-gray-400">
                    {template.targetEnterprises.length === 0 ? '全部企业' : getEnterpriseName(template.targetEnterprises[0])} · {SERVICE_LABELS[template.serviceType]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <span className="text-xs text-gray-400 hidden sm:block">
                  {template.updatedAt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  template.status === 'published' ? 'bg-blue-50 text-blue-700' :
                  template.status === 'draft'     ? 'bg-amber-50 text-amber-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {template.status === 'published' ? '已发布' : template.status === 'draft' ? '草稿' : '已归档'}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                  {template.messageCategory === 'internal'
                    ? (INTERNAL_CHANNEL_LABELS[template.internalChannel] || '内部推送')
                    : (template.channels.map((c) => CHANNEL_LABELS[c]).join('/') || '—')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
