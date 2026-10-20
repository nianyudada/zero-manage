import { useState, useMemo } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
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
import { toast } from 'sonner';
import {
  ScrollText,
  Search,
  RotateCcw,
  Eye,
  ExternalLink,
  Building,
  Calendar,
  Globe2,
  Tag,
  FileText,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Download,
  FileDown,
  Copy,
  Globe,
  FileSpreadsheet,
} from 'lucide-react';

export interface PolicyAttachment {
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'xlsx';
}

export interface PolicyItem {
  id: string;
  title: string;              // 政策标题
  policyNumber?: string;      // 发文字号
  issuingAgency: string;      // 发文机构
  publishDate: string;        // 发布时间 (YYYY-MM-DD)
  source: string;             // 来源
  sourceUrl: string;          // 原始链接
  region: string;             // 所属地区
  category: string;           // 资讯分类
  status: 'published' | 'unpublished'; // 上架状态
  syncTime?: string;          // 同步时间 (可选历史字段)
  summary?: string;           // 核心摘要
  content?: string;           // 政策正文/要点
  applicableServices?: string[]; // 适配服务模块
  attachments: PolicyAttachment[]; // 政策文件/附件
}

// ── Mock Initial Policies ──────────────────────────────────────────
const INITIAL_POLICIES: PolicyItem[] = [
  {
    id: 'pol-001',
    title: '关于建立健全电力现货市场与虚拟电厂协同运营机制的通知',
    policyNumber: '发改体改〔2026〕142号',
    issuingAgency: '国家发展改革委、国家能源局',
    publishDate: '2026-09-12',
    source: '国家发展改革委官网',
    sourceUrl: 'https://www.ndrc.gov.cn/xxgk/zcfb/',
    region: '全国',
    category: '虚拟电厂',
    status: 'published',
    syncTime: '2026-10-18 09:30:15',
    summary: '明确虚拟电厂作为独立经营主体参与电力现货市场和辅助服务市场的技术准入标准、出清价格结算机制与收益分配原则。',
    content: '一、规范虚拟电厂并网聚合及可调节能力认定；二、允许具备响应条件的储能系统与工商业负荷联合竞价；三、建立月度偏差考核容差机制与现货分时峰谷返还指引。',
    applicableServices: ['虚拟电厂', '智能微网'],
    attachments: [
      { name: '关于建立健全电力现货市场与虚拟电厂协同运营机制的通知.pdf', size: '2.4 MB', type: 'pdf' },
      { name: '附件1：虚拟电厂技术准入与并网通信规范.docx', size: '890 KB', type: 'doc' },
      { name: '附件2：现货市场调频调峰出清结算示例表.xlsx', size: '420 KB', type: 'xlsx' },
    ],
  },
  {
    id: 'pol-002',
    title: '2026年新型储能协同微电网高质量发展实施方案',
    policyNumber: '国能发科技〔2026〕58号',
    issuingAgency: '国家能源局',
    publishDate: '2026-08-28',
    source: '国家能源局官方发布',
    sourceUrl: 'http://www.nea.gov.cn/news/',
    region: '全国',
    category: '储能与微电网',
    status: 'published',
    syncTime: '2026-10-17 14:12:00',
    summary: '提出到2026年底新增工商业用户侧储能装机容量达15GW以上，加速企业级微电网源网荷储一体化运行与调度技术突破。',
    content: '推动高耗能企业配置独立储能电站并与智能微电网无缝对接；对绿电自发自用比例超过60%的微网项目给予电网容量费阶段性减免优惠。',
    applicableServices: ['智能微网', '能源管理'],
    attachments: [
      { name: '2026年新型储能协同微电网高质量发展实施方案_国能发科技58号.pdf', size: '3.1 MB', type: 'pdf' },
      { name: '国家能源局用户侧储能安全标准指导意见.pdf', size: '1.2 MB', type: 'pdf' },
    ],
  },
  {
    id: 'pol-003',
    title: '广东省关于深化工业园区分布式光伏与智能微电网建设试点的通知',
    policyNumber: '粤能新能〔2026〕31号',
    issuingAgency: '广东省能源局',
    publishDate: '2026-09-25',
    source: '广东省人民政府门户网',
    sourceUrl: 'https://www.gd.gov.cn/zwgk/',
    region: '广东省',
    category: '储能与微电网',
    status: 'published',
    syncTime: '2026-10-18 16:45:20',
    summary: '在珠三角及粤东粤西建设首批50个省级近零碳示范工业微网园区，提供分布式能源自治管理与负荷柔性控制支持。',
    content: '鼓励工业园区企业通过微电网汇集屋顶光伏与梯次储能，支持企业内部直供电与点对点微网电力调度，配套省级财政专向资金补贴。',
    applicableServices: ['智能微网', '能源管理', '虚拟电厂'],
    attachments: [
      { name: '广东省深化工业园区分布式光伏与微电网建设试点通知.pdf', size: '1.8 MB', type: 'pdf' },
      { name: '广东省近零碳示范工业园区申报条件与指标评价表.docx', size: '750 KB', type: 'doc' },
    ],
  },
  {
    id: 'pol-004',
    title: '江苏省虚拟电厂负荷聚合商参与电力辅助服务市场运营细则（试行）',
    policyNumber: '苏发改规发〔2026〕8号',
    issuingAgency: '江苏省发改委、江苏能监办',
    publishDate: '2026-09-02',
    source: '江苏省发改委官网',
    sourceUrl: 'http://fzggw.jiangsu.gov.cn/',
    region: '江苏省',
    category: '虚拟电厂',
    status: 'published',
    syncTime: '2026-10-16 11:20:00',
    summary: '明确具备5MW/2小时可调节能力的负荷聚合商接入调度主站的通信协议和秒级调频、分钟级调峰响应补偿标准。',
    content: '顶峰调峰单次响应补贴最高达1.2元/千瓦时，填谷响应补贴0.45元/千瓦时；健全数字认证与日前备用申报闭环管理。',
    applicableServices: ['虚拟电厂'],
    attachments: [
      { name: '江苏省虚拟电厂负荷聚合商辅助服务市场运营细则（试行）.pdf', size: '2.9 MB', type: 'pdf' },
      { name: '负荷聚合商日前备用申报协议及格式模板.xlsx', size: '510 KB', type: 'xlsx' },
    ],
  },
  {
    id: 'pol-005',
    title: '工业重点领域能效标杆水平和基准水平最新指引（2026年版）',
    policyNumber: '工信部联节〔2026〕77号',
    issuingAgency: '工业和信息化部、国家发展改革委',
    publishDate: '2026-07-20',
    source: '工信部政务公开',
    sourceUrl: 'https://www.miit.gov.cn/jgsj/',
    region: '全国',
    category: '节能降碳',
    status: 'published',
    syncTime: '2026-10-15 08:50:33',
    summary: '发布钢铁、电解铝、数据中心、水泥等25个重点工业行业综合能耗标杆值，明确未达标企业的梯度电价加价与技术改造要求。',
    content: '推行数字化能源管理系统（EMS）企业级部署全覆盖；对达到能效标杆水平的企业在节能减排税收抵免及专项绿色信贷中予以重点支持。',
    applicableServices: ['能源管理'],
    attachments: [
      { name: '工业重点领域能效标杆水平和基准水平指引（2026年版）.pdf', size: '4.6 MB', type: 'pdf' },
    ],
  },
  {
    id: 'pol-006',
    title: '浙江省关于加快全省绿电绿证市场化交易与企业碳账户协同的指导意见',
    policyNumber: '浙发改能源〔2026〕45号',
    issuingAgency: '浙江省发展和改革委员会',
    publishDate: '2026-08-15',
    source: '浙江政务服务网',
    sourceUrl: 'https://www.zj.gov.cn/zwgk/',
    region: '浙江省',
    category: '绿电绿证',
    status: 'published',
    syncTime: '2026-10-14 15:30:10',
    summary: '打通浙江电力交易平台与企业碳排放核算账户系统，实现每张绿证对应电量数据直达企业碳效码，助力出口型制造企业无缝应对国际碳关税。',
    content: '企业采购绿电证书所抵消的范围二间接排放将在省级碳普惠及地方碳交易履约中获得全额认可，支持微电网用户批量代办绿电绿证凭证。',
    applicableServices: ['能源管理', '智能微网'],
    attachments: [
      { name: '浙江省绿电绿证市场化交易与企业碳账户协同指导意见.pdf', size: '2.1 MB', type: 'pdf' },
      { name: '企业碳效码数据直连接入接口说明文档.docx', size: '640 KB', type: 'doc' },
    ],
  },
  {
    id: 'pol-007',
    title: '北京市推进低碳建筑与可再生能源一体化应用补贴资金申报指南',
    policyNumber: '京建发〔2026〕210号',
    issuingAgency: '北京市住房和城乡建设委员会、北京市财政局',
    publishDate: '2026-06-30',
    source: '首都之窗门户网',
    sourceUrl: 'http://www.beijing.gov.cn/',
    region: '北京市',
    category: '财政补贴',
    status: 'unpublished',
    syncTime: '2026-10-12 17:05:40',
    summary: '对新建超低能耗建筑、建筑光伏一体化（BIPV）及光储直柔系统改造项目给予最高300万元的市级固定资产投资资金奖励。',
    content: '2026年度申报期为7月1日至8月31日，需经第三方碳排评估机构出具节能审核报告，现申报阶段已结束因此该资讯暂时下架归档。',
    applicableServices: ['能源管理'],
    attachments: [
      { name: '北京市低碳建筑补贴资金申报指南及申报表格.pdf', size: '1.5 MB', type: 'pdf' },
    ],
  },
  {
    id: 'pol-008',
    title: '关于完善工商业分时电价机制促进储能规模化应用的通知',
    policyNumber: '鲁发改价格〔2026〕623号',
    issuingAgency: '山东省发展和改革委员会',
    publishDate: '2026-09-10',
    source: '山东省发改委官网',
    sourceUrl: 'http://fgw.shandong.gov.cn/',
    region: '山东省',
    category: '电力现货',
    status: 'published',
    syncTime: '2026-10-18 10:15:22',
    summary: '调整峰谷时段划分，进一步拉大尖峰与深谷电价差至4.2:1，为用户侧储能和虚拟电厂充放电套利创造更广阔的市场空间。',
    content: '春季及秋季增设正午深谷时段（11:00-14:00），鼓励分布式储能和智能微网充分消纳过剩新能源光伏电力，降低全省电网弃光率。',
    applicableServices: ['智能微网', '虚拟电厂'],
    attachments: [
      { name: '山东省完善工商业分时电价机制通知_鲁发改价格623号.pdf', size: '1.9 MB', type: 'pdf' },
      { name: '2026年山东电网各月峰平谷时段划分对照表.xlsx', size: '380 KB', type: 'xlsx' },
    ],
  },
  {
    id: 'pol-009',
    title: '上海市浦东新区绿色电力消费核算与碳排放核查管理办法',
    policyNumber: '沪环规〔2026〕12号',
    issuingAgency: '上海市生态环境局、浦东新区人民政府',
    publishDate: '2026-05-18',
    source: '上海市生态环境局官网',
    sourceUrl: 'https://sthj.sh.gov.cn/',
    region: '上海市',
    category: '双碳战略',
    status: 'unpublished',
    syncTime: '2026-10-10 13:40:00',
    summary: '建立外向型重点企业碳足迹追踪体系，规范绿色电力使用比例认证与第三方机构核查准则。',
    content: '现由于国家标准委发布统一核算细则，该地方性管理办法已进入过渡期修订中，故执行下架维护。',
    applicableServices: ['能源管理'],
    attachments: [
      { name: '浦东新区绿色电力消费核算与核查管理办法全文.pdf', size: '1.4 MB', type: 'pdf' },
    ],
  },
  {
    id: 'pol-010',
    title: '全国碳排放权交易市场第三个履约周期配额分配方案',
    policyNumber: '环气候函〔2026〕99号',
    issuingAgency: '生态环境部',
    publishDate: '2026-08-01',
    source: '生态环境部官方公报',
    sourceUrl: 'https://www.mee.gov.cn/',
    region: '全国',
    category: '双碳战略',
    status: 'published',
    syncTime: '2026-10-17 18:22:15',
    summary: '正式将电解铝、水泥两大重点工业用能行业纳入全国碳市场配额管理，明确年度基准线收紧比例与CCER抵销比例要求。',
    content: '重点排放单位可通过自备微电网消纳绿电、实施节能技改或通过国家核证自愿减排量（CCER）进行年度碳排放抵销，抵销上限为应清缴配额的5%。',
    applicableServices: ['能源管理', '智能微网'],
    attachments: [
      { name: '全国碳排放权交易市场第三个履约周期配额分配方案_全文.pdf', size: '3.7 MB', type: 'pdf' },
      { name: '水泥及电解铝行业碳配额基准线折算系数对照表.xlsx', size: '620 KB', type: 'xlsx' },
    ],
  },
];

// Options for filters
const REGION_OPTIONS = ['全国', '广东省', '江苏省', '浙江省', '山东省', '北京市', '上海市'];
const CATEGORY_OPTIONS = ['双碳战略', '储能与微电网', '虚拟电厂', '电力现货', '绿电绿证', '节能降碳', '财政补贴'];
const AGENCY_OPTIONS = [
  '国家发展改革委、国家能源局',
  '国家能源局',
  '广东省能源局',
  '江苏省发改委、江苏能监办',
  '工业和信息化部、国家发展改革委',
  '浙江省发展和改革委员会',
  '北京市住房和城乡建设委员会、北京市财政局',
  '山东省发展和改革委员会',
  '生态环境部',
];

export default function PolicyManagement() {
  const [policies, setPolicies] = useState<PolicyItem[]>(INITIAL_POLICIES);

  // ── Traditional Multi-item Filter States ───────────────────────────
  const [filterKeyword, setFilterKeyword]   = useState('');
  const [filterAgency, setFilterAgency]     = useState<string>('all');
  const [filterRegion, setFilterRegion]     = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus]     = useState<'all' | 'published' | 'unpublished'>('all');

  // Dialogs
  const [viewPolicy, setViewPolicy] = useState<PolicyItem | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter logic
  const filteredPolicies = useMemo(() => {
    return policies.filter((item) => {
      const q = filterKeyword.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.issuingAgency.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        (item.policyNumber && item.policyNumber.toLowerCase().includes(q));

      const matchAgency = filterAgency === 'all' || item.issuingAgency === filterAgency;
      const matchRegion = filterRegion === 'all' || item.region === filterRegion;
      const matchCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchSearch && matchAgency && matchRegion && matchCategory && matchStatus;
    });
  }, [policies, filterKeyword, filterAgency, filterRegion, filterCategory, filterStatus]);

  // Paginated policies
  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPolicies.slice(start, start + pageSize);
  }, [filteredPolicies, currentPage, pageSize]);

  // Handlers
  const handleResetFilters = () => {
    setFilterKeyword('');
    setFilterAgency('all');
    setFilterRegion('all');
    setFilterCategory('all');
    setFilterStatus('all');
    setCurrentPage(1);
    toast.info('筛选条件已重置');
  };

  const handleQuery = () => {
    setCurrentPage(1);
    toast.info(`查询完成，共匹配到 ${filteredPolicies.length} 项政策`);
  };

  // Toggle single status
  const handleToggleStatus = (id: string) => {
    setPolicies((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'published' ? 'unpublished' : 'published';
          toast.success(`《${item.title.slice(0, 14)}...》已切换为「${nextStatus === 'published' ? '已上架' : '已下架'}」`);
          return {
            ...item,
            status: nextStatus,
          };
        }
        return item;
      })
    );
  };

  // Download policy file helper
  const handleDownloadFile = (policy: PolicyItem, attachmentName?: string) => {
    const filename = attachmentName || `${policy.title}.pdf`;
    const docContent = `【零碳SaaS 政策法规官方归档正本】
--------------------------------------------------------------------------------
政策标题：${policy.title}
发文字号：${policy.policyNumber || '暂无发文字号'}
发文机构：${policy.issuingAgency}
发布时间：${policy.publishDate}
所属地区：${policy.region}
资讯分类：${policy.category}
发布来源：${policy.source}
原始官方链接：${policy.sourceUrl}
--------------------------------------------------------------------------------

【政策核心摘要】
${policy.summary || '暂无摘要'}

【政策正文与执行要点】
${policy.content || '暂无正文要点'}

【关联适用业务模块】
${policy.applicableServices?.join('、') || '能源管理、智能微网、虚拟电厂'}

--------------------------------------------------------------------------------
文件说明：本文件由零碳SaaS智慧能源管理平台政务知识库自动导出生成
下载时间：${new Date().toLocaleString('zh-CN')}
`;

    const blob = new Blob(['\uFEFF' + docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename.replace('.pdf', '_正本.txt') : `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`政策文件《${filename}》已开始下载`);
  };

  // Copy link helper
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('官方原始链接已复制到剪贴板');
  };

  return (
    <div className="p-6 md:p-8 w-full min-h-full">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1
            className="text-2xl font-semibold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            政策管理
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
            权威资讯
          </span>
        </div>
        <p className="text-sm text-gray-500">
          汇聚国家部委及地方能源双碳、智能微电网、虚拟电厂相关政策法规，支持全渠道上架与资讯推送
        </p>
      </div>

      {/* ── Traditional Multi-item Filter Card (传统多项列表筛选) ── */}
      <Card className="p-5 mb-5 bg-white rounded-lg shadow-2xs border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4">
          {/* 筛选项 1: 模糊搜索 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-20 text-right">
              模糊搜索:
            </span>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <Input
                placeholder="搜索政策标题、发文机构、文号..."
                value={filterKeyword}
                onChange={(e) => {
                  setFilterKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 text-sm h-9 bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
              />
            </div>
          </div>

          {/* 筛选项 2: 资讯分类 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-20 text-right">
              资讯分类:
            </span>
            <Select
              value={filterCategory}
              onValueChange={(v) => {
                setFilterCategory(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-sm flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部资讯分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部资讯分类</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 筛选项 3: 所属地区 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-20 text-right">
              所属地区:
            </span>
            <Select
              value={filterRegion}
              onValueChange={(v) => {
                setFilterRegion(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-sm flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部地区" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部地区</SelectItem>
                {REGION_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 筛选项 4: 上架状态 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-20 text-right">
              上架状态:
            </span>
            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v as typeof filterStatus);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-sm flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="published">已上架</SelectItem>
                <SelectItem value="unpublished">已下架</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 筛选项 5: 发文机构 */}
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-20 text-right">
              发文机构:
            </span>
            <Select
              value={filterAgency}
              onValueChange={(v) => {
                setFilterAgency(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-sm flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部发文机构" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部发文机构</SelectItem>
                {AGENCY_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 筛选动作按钮 */}
          <div className="flex items-center gap-2.5 sm:col-span-2 lg:col-span-1 xl:col-span-2 justify-end">
            {filteredPolicies.length !== policies.length && (
              <span className="text-xs text-gray-400 mr-2 whitespace-nowrap">
                已过滤 {filteredPolicies.length} / {policies.length} 篇
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-4 text-gray-700 hover:bg-gray-50 border-gray-200 rounded flex items-center gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              重置
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleQuery}
              className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1.5 shadow-2xs"
            >
              <Search className="size-3.5" />
              查询
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Table Container Card ── */}
      <Card className="overflow-hidden bg-white border border-gray-200 shadow-2xs rounded-lg">
        {/* Table Top Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <ScrollText className="size-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">政策法规列表</h2>
            <div className="flex items-center gap-1.5 ml-1 text-xs">
              <span className="px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                总计 {policies.length} 篇
              </span>
              <span className="px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
                已上架 {policies.filter((p) => p.status === 'published').length} 篇
              </span>
              <span className="px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                已下架 {policies.filter((p) => p.status === 'unpublished').length} 篇
              </span>
            </div>
          </div>
        </div>

        {/* The Main Table with all required columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap min-w-[280px]">
                  政策标题
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  发文机构
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  发布时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  来源
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  所属地区
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  资讯分类
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  上架状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPolicies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-xs text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <ScrollText className="size-8 text-gray-300 mb-2 stroke-1" />
                      <p>未找到匹配的政策法规资讯</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleResetFilters}
                        className="text-xs text-blue-600 mt-1"
                      >
                        清空筛选条件
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPolicies.map((item, idx) => {
                  const isPublished = item.status === 'published';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/80 transition-colors"
                      style={{
                        borderBottom:
                          idx < paginatedPolicies.length - 1 ? '1px solid #f8fafc' : undefined,
                      }}
                    >
                      {/* 1. 政策标题 */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setViewPolicy(item)}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left line-clamp-2 leading-snug cursor-pointer group flex items-start gap-1.5"
                          >
                            <span className="group-hover:underline">{item.title}</span>
                          </button>
                          {item.policyNumber && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono text-gray-500 px-1.5 py-0.2 bg-gray-100 rounded border border-gray-200">
                                {item.policyNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2. 发文机构 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-700">
                        <div className="flex items-center gap-1.5 max-w-[200px] truncate" title={item.issuingAgency}>
                          <Building className="size-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.issuingAgency}</span>
                        </div>
                      </td>

                      {/* 3. 发布时间 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600 tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400" />
                          <span>{item.publishDate}</span>
                        </div>
                      </td>

                      {/* 4. 来源 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <span>{item.source}</span>
                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="访问原始链接"
                            >
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 5. 所属地区 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${
                            item.region === '全国'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <Globe2 className="size-3" />
                          {item.region}
                        </span>
                      </td>

                      {/* 6. 资讯分类 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Tag className="size-3" />
                          {item.category}
                        </span>
                      </td>

                      {/* 7. 上架状态 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isPublished}
                            onCheckedChange={() => handleToggleStatus(item.id)}
                            className="data-[state=checked]:bg-emerald-600 scale-90"
                          />
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              isPublished ? 'text-emerald-700' : 'text-gray-400'
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                isPublished ? 'bg-emerald-500' : 'bg-gray-300'
                              }`}
                            />
                            {isPublished ? '已上架' : '已下架'}
                          </span>
                        </div>
                      </td>

                      {/* 操作 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50 font-medium"
                            onClick={() => setViewPolicy(item)}
                            title="查看详情"
                          >
                            <Eye className="size-3.5 mr-1" />
                            详情
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

        {/* Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-gray-100 gap-3 bg-white text-xs text-gray-500">
          <div>
            共 <span className="font-semibold text-gray-700">{filteredPolicies.length}</span> 条政策记录
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              第 {currentPage} / {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Policy View Details Dialog ── */}
      <Dialog open={!!viewPolicy} onOpenChange={(open) => !open && setViewPolicy(null)}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          {viewPolicy && (
            <div>
              {/* Header */}
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                      viewPolicy.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {viewPolicy.status === 'published' ? '● 已上架' : '○ 已下架'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {viewPolicy.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    {viewPolicy.region}
                  </span>
                </div>
                <DialogTitle className="text-base font-semibold text-gray-900 leading-snug">
                  {viewPolicy.title}
                </DialogTitle>
                {viewPolicy.policyNumber && (
                  <p className="text-xs font-mono text-gray-500 mt-1">
                    发文字号：{viewPolicy.policyNumber}
                  </p>
                )}
              </DialogHeader>

              <div className="py-4 space-y-4 text-xs">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <span className="text-gray-400 block mb-0.5">发文机构</span>
                    <span className="font-medium text-gray-800">{viewPolicy.issuingAgency}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">发布时间</span>
                    <span className="font-medium text-gray-800 tabular-nums">{viewPolicy.publishDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">发布来源</span>
                    <span className="font-medium text-gray-800">{viewPolicy.source}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">所属地区</span>
                    <span className="font-medium text-gray-800">{viewPolicy.region}</span>
                  </div>
                </div>

                {/* ── 原始链接访问专区 (Original Link Access Box) ── */}
                <div className="p-3.5 rounded-lg bg-blue-50/40 border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900 flex items-center gap-1.5">
                      <Globe className="size-3.5 text-blue-600" />
                      官方发文原始链接
                    </span>
                    <span className="text-[11px] text-blue-600">权威发布源</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-blue-200/60">
                    <span className="text-xs font-mono text-gray-600 truncate flex-1 select-all" title={viewPolicy.sourceUrl}>
                      {viewPolicy.sourceUrl}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(viewPolicy.sourceUrl)}
                      className="h-7 px-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 shrink-0"
                      title="复制原始链接"
                    >
                      <Copy className="size-3 mr-1" />
                      复制
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => window.open(viewPolicy.sourceUrl, '_blank')}
                      className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 flex items-center gap-1"
                    >
                      <ExternalLink className="size-3" />
                      访问原始链接
                    </Button>
                  </div>
                </div>

                {/* ── 政策文件下载专区 (Policy Files Download Section) ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 flex items-center gap-1.5">
                      <FileDown className="size-4 text-emerald-600" />
                      政策文件与附件下载 ({viewPolicy.attachments?.length || 1} 份):
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {viewPolicy.attachments && viewPolicy.attachments.length > 0 ? (
                      viewPolicy.attachments.map((att, idx) => {
                        const isPdf = att.type === 'pdf';
                        const isXlsx = att.type === 'xlsx';
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {isPdf ? (
                                <div className="size-7 rounded bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                                  <FileText className="size-4" />
                                </div>
                              ) : isXlsx ? (
                                <div className="size-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                  <FileSpreadsheet className="size-4" />
                                </div>
                              ) : (
                                <div className="size-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                                  <FileText className="size-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate group-hover:text-emerald-700">
                                  {att.name}
                                </p>
                                <span className="text-[11px] text-gray-400 font-mono">
                                  文件大小：{att.size}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadFile(viewPolicy, att.name)}
                              className="h-7 text-xs px-2.5 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white shrink-0 flex items-center gap-1"
                            >
                              <Download className="size-3" />
                              下载文件
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <FileText className="size-4 text-red-500" />
                          <span>{viewPolicy.title}.pdf</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(viewPolicy)}
                          className="h-7 text-xs px-2.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        >
                          <Download className="size-3 mr-1" />
                          下载政策文件
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Applicable SaaS services */}
                {viewPolicy.applicableServices && viewPolicy.applicableServices.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-1.5 flex items-center gap-1.5">
                      <Layers className="size-3.5 text-blue-600" />
                      关联业务模块:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewPolicy.applicableServices.map((svc) => (
                        <span
                          key={svc}
                          className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {viewPolicy.summary && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-1 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-amber-500" />
                      政策核心摘要:
                    </span>
                    <p className="text-gray-600 leading-relaxed bg-amber-50/40 p-3 rounded border border-amber-100">
                      {viewPolicy.summary}
                    </p>
                  </div>
                )}

                {/* Content */}
                {viewPolicy.content && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-1 flex items-center gap-1.5">
                      <FileText className="size-3.5 text-blue-500" />
                      政策正文要点与执行指引:
                    </span>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/60 p-3 rounded border border-gray-100">
                      {viewPolicy.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Dialog Footer Actions */}
              <DialogFooter className="border-t pt-3 flex flex-row justify-end items-center w-full">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewPolicy(null)}
                  className="h-8 text-xs px-4"
                >
                  关闭
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

