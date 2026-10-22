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
  Pencil,
  ExternalLink,
  Building,
  Calendar,
  Globe2,
  Tag,
  ChevronLeft,
  ChevronRight,
  Bookmark,
} from 'lucide-react';

export interface PolicyAttachment {
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'xlsx';
}

// 政策类型枚举: 政策法规, 标准规范, 规划指南
export const POLICY_TYPE_OPTIONS = ['政策法规', '标准规范', '规划指南'] as const;
export type PolicyType = (typeof POLICY_TYPE_OPTIONS)[number];

// 内容标签枚举: 电力市场、双碳减排、能源管理、园区工厂、光伏储能、虚拟电厂、新型场景
export const CONTENT_TAG_OPTIONS = [
  '电力市场',
  '双碳减排',
  '能源管理',
  '园区工厂',
  '光伏储能',
  '虚拟电厂',
  '新型场景',
] as const;
export type ContentTag = (typeof CONTENT_TAG_OPTIONS)[number];

export interface PolicyItem {
  id: string;
  title: string;              // 政策标题
  policyNumber?: string;      // 发文字号
  policyCategory: string;     // 政策分类 (不可编辑)
  issuingAuthority: string;   // 发文机关 (不可编辑)
  publishingAgency: string;   // 发布机构 (原发文机构，不可编辑)
  publishDate: string;        // 发布时间 (YYYY-MM-DD)
  source: string;             // 来源
  sourceUrl: string;          // 原始链接
  region: string;             // 所属地区 (支持编辑)
  policyType: PolicyType;     // 政策类型 (支持编辑)
  contentTags: string[];      // 内容标签 (支持编辑)
  status: 'published' | 'unpublished'; // 上架状态
  syncTime?: string;          // 同步时间
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
    policyCategory: '部门规范性文件',
    issuingAuthority: '国家发展改革委、国家能源局',
    publishingAgency: '国家发展改革委',
    publishDate: '2026-09-12',
    source: '国家发展改革委官网',
    sourceUrl: 'https://www.ndrc.gov.cn/xxgk/zcfb/',
    region: '全国',
    policyType: '政策法规',
    contentTags: ['电力市场', '虚拟电厂'],
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
    policyCategory: '行业规划指南',
    issuingAuthority: '国家能源局',
    publishingAgency: '国家能源局',
    publishDate: '2026-08-28',
    source: '国家能源局官方发布',
    sourceUrl: 'http://www.nea.gov.cn/news/',
    region: '全国',
    policyType: '规划指南',
    contentTags: ['光伏储能', '能源管理'],
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
    policyCategory: '地方试点文件',
    issuingAuthority: '广东省能源局',
    publishingAgency: '广东省能源局',
    publishDate: '2026-09-25',
    source: '广东省人民政府门户网',
    sourceUrl: 'https://www.gd.gov.cn/zwgk/',
    region: '广东省',
    policyType: '政策法规',
    contentTags: ['园区工厂', '光伏储能'],
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
    policyCategory: '地方监管细则',
    issuingAuthority: '江苏省发改委、江苏能监办',
    publishingAgency: '江苏省发改委',
    publishDate: '2026-09-02',
    source: '江苏省发改委官网',
    sourceUrl: 'http://fzggw.jiangsu.gov.cn/',
    region: '江苏省',
    policyType: '标准规范',
    contentTags: ['电力市场', '虚拟电厂'],
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
    policyCategory: '行业技术指引',
    issuingAuthority: '工业和信息化部、国家发展改革委',
    publishingAgency: '工业和信息化部',
    publishDate: '2026-07-20',
    source: '工信部政务公开',
    sourceUrl: 'https://www.miit.gov.cn/jgsj/',
    region: '全国',
    policyType: '标准规范',
    contentTags: ['双碳减排', '能源管理'],
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
    policyCategory: '地方指导意见',
    issuingAuthority: '浙江省发展和改革委员会',
    publishingAgency: '浙江省发展和改革委员会',
    publishDate: '2026-08-15',
    source: '浙江政务服务网',
    sourceUrl: 'https://www.zj.gov.cn/zwgk/',
    region: '浙江省',
    policyType: '规划指南',
    contentTags: ['电力市场', '双碳减排'],
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
    policyCategory: '财政申报指南',
    issuingAuthority: '北京市住房和城乡建设委员会、北京市财政局',
    publishingAgency: '北京市住房和城乡建设委员会',
    publishDate: '2026-06-30',
    source: '首都之窗门户网',
    sourceUrl: 'http://www.beijing.gov.cn/',
    region: '北京市',
    policyType: '规划指南',
    contentTags: ['双碳减排', '新型场景'],
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
    policyCategory: '价格改革政策',
    issuingAuthority: '山东省发展和改革委员会',
    publishingAgency: '山东省发展和改革委员会',
    publishDate: '2026-09-10',
    source: '山东省发改委官网',
    sourceUrl: 'http://fgw.shandong.gov.cn/',
    region: '山东省',
    policyType: '政策法规',
    contentTags: ['电力市场', '光伏储能'],
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
    policyCategory: '地方管理办法',
    issuingAuthority: '上海市生态环境局、浦东新区人民政府',
    publishingAgency: '上海市生态环境局',
    publishDate: '2026-05-18',
    source: '上海市生态环境局官网',
    sourceUrl: 'https://sthj.sh.gov.cn/',
    region: '上海市',
    policyType: '标准规范',
    contentTags: ['双碳减排', '园区工厂'],
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
    policyCategory: '国家专项方案',
    issuingAuthority: '生态环境部',
    publishingAgency: '生态环境部',
    publishDate: '2026-08-01',
    source: '生态环境部官方公报',
    sourceUrl: 'https://www.mee.gov.cn/',
    region: '全国',
    policyType: '政策法规',
    contentTags: ['双碳减排', '电力市场'],
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
export const REGION_OPTIONS = ['全国', '广东省', '江苏省', '浙江省', '山东省', '北京市', '上海市'];
export const PUBLISHING_AGENCY_OPTIONS = [
  '国家发展改革委',
  '国家能源局',
  '广东省能源局',
  '江苏省发改委',
  '工业和信息化部',
  '浙江省发展和改革委员会',
  '北京市住房和城乡建设委员会',
  '山东省发展和改革委员会',
  '生态环境部',
];

export default function PolicyManagement() {
  const [policies, setPolicies] = useState<PolicyItem[]>(INITIAL_POLICIES);

  // ── Multi-item Filter States ──
  const [filterTitle, setFilterTitle]           = useState('');
  const [filterPolicyType, setFilterPolicyType] = useState<string>('all');
  const [filterContentTag, setFilterContentTag] = useState<string>('all');
  const [filterRegion, setFilterRegion]         = useState<string>('all');
  const [filterStatus, setFilterStatus]         = useState<'all' | 'published' | 'unpublished'>('all');
  const [filterPublishingAgency, setFilterPublishingAgency] = useState<string>('all');

  // Dialogs: 编辑页
  const [editPolicy, setEditPolicy] = useState<PolicyItem | null>(null);
  const [detailTab, setDetailTab] = useState<'basic' | 'content'>('basic');
  const [formData, setFormData] = useState<{
    region: string;
    policyType: PolicyType;
    contentTags: string[];
  }>({
    region: '全国',
    policyType: '政策法规',
    contentTags: [],
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter logic: 仅针对政策标题的模糊搜索
  const filteredPolicies = useMemo(() => {
    return policies.filter((item) => {
      const q = filterTitle.trim().toLowerCase();
      const matchTitle = !q || item.title.toLowerCase().includes(q);
      const matchPolicyType = filterPolicyType === 'all' || item.policyType === filterPolicyType;
      const matchContentTag = filterContentTag === 'all' || item.contentTags.includes(filterContentTag);
      const matchRegion = filterRegion === 'all' || item.region === filterRegion;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchAgency = filterPublishingAgency === 'all' || item.publishingAgency === filterPublishingAgency;

      return matchTitle && matchPolicyType && matchContentTag && matchRegion && matchStatus && matchAgency;
    });
  }, [policies, filterTitle, filterPolicyType, filterContentTag, filterRegion, filterStatus, filterPublishingAgency]);

  // Paginated policies
  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPolicies.slice(start, start + pageSize);
  }, [filteredPolicies, currentPage, pageSize]);

  // Reset filters
  const handleResetFilters = () => {
    setFilterTitle('');
    setFilterPolicyType('all');
    setFilterContentTag('all');
    setFilterRegion('all');
    setFilterStatus('all');
    setFilterPublishingAgency('all');
    setCurrentPage(1);
    toast.info('筛选条件已重置');
  };

  const handleQuery = () => {
    setCurrentPage(1);
    toast.info(`查询完成，共匹配到 ${filteredPolicies.length} 篇政策`);
  };

  // Toggle status
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

  // Open Edit Dialog
  const handleOpenEdit = (policy: PolicyItem) => {
    setEditPolicy(policy);
    setFormData({
      region: policy.region,
      policyType: policy.policyType,
      contentTags: [...policy.contentTags],
    });
    setDetailTab('basic');
  };

  // Toggle a content tag in edit form
  const handleToggleTag = (tag: string) => {
    setFormData((prev) => {
      const exists = prev.contentTags.includes(tag);
      if (exists) {
        return {
          ...prev,
          contentTags: prev.contentTags.filter((t) => t !== tag),
        };
      } else {
        return {
          ...prev,
          contentTags: [...prev.contentTags, tag],
        };
      }
    });
  };

  // Save Edit: 仅所属地区、政策类型、内容标签可编辑保存
  const handleSaveEdit = () => {
    if (!editPolicy) return;

    if (formData.contentTags.length === 0) {
      toast.warning('请至少选择一个内容标签');
      return;
    }

    setPolicies((prev) =>
      prev.map((item) => {
        if (item.id === editPolicy.id) {
          return {
            ...item,
            region: formData.region,
            policyType: formData.policyType,
            contentTags: formData.contentTags,
          };
        }
        return item;
      })
    );

    toast.success(`政策《${editPolicy.title.slice(0, 14)}...》信息已保存`);
    setEditPolicy(null);
  };

  // Download policy file helper
  const handleDownloadFile = (policy: PolicyItem, attachmentName?: string) => {
    const filename = attachmentName || `${policy.title}.pdf`;
    const docContent = `【零碳SaaS 政策法规官方归档正本】
--------------------------------------------------------------------------------
政策标题：${policy.title}
发文字号：${policy.policyNumber || '暂无发文字号'}
政策分类：${policy.policyCategory}
发文机关：${policy.issuingAuthority}
发布机构：${policy.publishingAgency}
政策类型：${policy.policyType}
内容标签：${policy.contentTags.join('、')}
所属地区：${policy.region}
发布时间：${policy.publishDate}
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

      {/* ── Multi-item Filter Card ── */}
      <Card className="p-5 mb-5 bg-white rounded-lg shadow-2xs border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4">
          {/* 筛选项 1: 政策标题 (仅针对政策标题的模糊搜索) */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-20 text-right">
              政策标题:
            </span>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <Input
                placeholder="搜索政策标题关键字..."
                value={filterTitle}
                onChange={(e) => {
                  setFilterTitle(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 text-sm h-9 bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
              />
            </div>
          </div>

          {/* 筛选项 2: 政策类型 (政策法规，标准规范，规划指南) */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-20 text-right">
              政策类型:
            </span>
            <Select
              value={filterPolicyType}
              onValueChange={(v) => {
                setFilterPolicyType(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-sm flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部政策类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部政策类型</SelectItem>
                {POLICY_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 筛选项 3: 内容标签 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-20 text-right">
              内容标签:
            </span>
            <Select
              value={filterContentTag}
              onValueChange={(v) => {
                setFilterContentTag(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-sm flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部内容标签" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部内容标签</SelectItem>
                {CONTENT_TAG_OPTIONS.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 筛选项 4: 所属地区 */}
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

          {/* 筛选项 5: 上架状态 */}
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

          {/* 筛选项 6: 发布机构 (原发文机构) */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-20 text-right">
              发布机构:
            </span>
            <Select
              value={filterPublishingAgency}
              onValueChange={(v) => {
                setFilterPublishingAgency(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-sm flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部发布机构" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部发布机构</SelectItem>
                {PUBLISHING_AGENCY_OPTIONS.map((a) => (
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
            <h2 className="text-xs font-semibold text-gray-800">政策法规列表</h2>
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

        {/* The Main Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap min-w-[280px]">
                  政策标题
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  发布机构
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  政策类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  内容标签
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  所属地区
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  发布时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  来源
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
                  <td colSpan={9} className="py-16 text-center text-xs text-gray-400">
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
                      <td className="px-4 py-3.5 text-xs">
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors text-left line-clamp-2 leading-snug cursor-pointer group flex items-start gap-1.5"
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

                      {/* 2. 发布机构 (原发文机构) */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-700">
                        <div className="flex items-center gap-1.5 max-w-[180px] truncate" title={item.publishingAgency}>
                          <Building className="size-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.publishingAgency}</span>
                        </div>
                      </td>

                      {/* 3. 政策类型 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium border ${
                            item.policyType === '政策法规'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : item.policyType === '标准规范'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          <Bookmark className="size-3" />
                          {item.policyType}
                        </span>
                      </td>

                      {/* 4. 内容标签 */}
                      <td className="px-4 py-3.5 text-xs">
                        <div className="flex flex-wrap gap-1 max-w-[210px]">
                          {item.contentTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap font-medium"
                            >
                              <Tag className="size-2.5 mr-1 text-slate-400" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 5. 所属地区 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium border ${
                            item.region === '全国'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Globe2 className="size-3" />
                          {item.region}
                        </span>
                      </td>

                      {/* 6. 发布时间 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600 tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400" />
                          <span>{item.publishDate}</span>
                        </div>
                      </td>

                      {/* 7. 来源 */}
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

                      {/* 8. 上架状态 */}
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

                      {/* 9. 操作 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50 font-medium"
                            onClick={() => handleOpenEdit(item)}
                            title="编辑政策"
                          >
                            <Pencil className="size-3.5 mr-1" />
                            编辑
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

      {/* ── Policy Edit Dialog (简化页面，移除复杂嵌套样式与冗余描述) ── */}
      <Dialog open={!!editPolicy} onOpenChange={(open) => !open && setEditPolicy(null)}>
        <DialogContent className="sm:max-w-3xl w-[94vw] sm:w-[800px] max-h-[88vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-6">
          {editPolicy && (
            <div className="space-y-4">
              {/* Header: 简洁标题 */}
              <DialogHeader className="border-b pb-3 text-left">
                <DialogTitle className="text-base font-semibold text-gray-900">
                  编辑政策
                </DialogTitle>
              </DialogHeader>

              {/* 简洁 Tab 导航 */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setDetailTab('basic')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                    detailTab === 'basic'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  基础信息
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('content')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                    detailTab === 'content'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  正文信息
                </button>
              </div>

              {/* ── Tab 1: 基础信息 ── */}
              {detailTab === 'basic' && (
                <div className="space-y-3.5 text-xs">
                  {/* 政策标题 (不可编辑) */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">政策标题</label>
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-gray-900 font-medium leading-relaxed">
                      {editPolicy.title}
                    </div>
                  </div>

                  {/* 可编辑行: 所属地区、政策类型 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs text-gray-700 font-medium block mb-1">
                        所属地区
                      </label>
                      <Select
                        value={formData.region}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, region: v }))
                        }
                      >
                        <SelectTrigger className="h-9 text-xs bg-white border-gray-300 rounded text-gray-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REGION_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-700 font-medium block mb-1">
                        政策类型
                      </label>
                      <Select
                        value={formData.policyType}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            policyType: v as PolicyType,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 text-xs bg-white border-gray-300 rounded text-gray-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POLICY_TYPE_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 可编辑项: 内容标签 */}
                  <div>
                    <label className="text-xs text-gray-700 font-medium block mb-1.5">
                      内容标签
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CONTENT_TAG_OPTIONS.map((tag) => {
                        const isSelected = formData.contentTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={`px-3 py-1.5 rounded text-xs transition-colors border cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 font-medium'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 不可编辑字段区域 (政策分类、发文机关、发布机构等) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* 政策分类 (不可编辑) */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">政策分类</label>
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-800">
                        {editPolicy.policyCategory}
                      </div>
                    </div>

                    {/* 发文字号 (不可编辑) */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">发文字号</label>
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-800 font-mono">
                        {editPolicy.policyNumber || '暂无文号'}
                      </div>
                    </div>

                    {/* 发文机关 (不可编辑) */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">发文机关</label>
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-800">
                        {editPolicy.issuingAuthority}
                      </div>
                    </div>

                    {/* 发布机构 (不可编辑 - 原发文机构) */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">发布机构</label>
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-800">
                        {editPolicy.publishingAgency}
                      </div>
                    </div>

                    {/* 发布时间 (不可编辑) */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">发布时间</label>
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-800 tabular-nums">
                        {editPolicy.publishDate}
                      </div>
                    </div>

                    {/* 发布来源 (不可编辑) */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">发布来源</label>
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-800">
                        {editPolicy.source}
                      </div>
                    </div>

                    {/* 上架状态 (不可编辑) */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">上架状态</label>
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-800 flex items-center gap-1.5">
                        <span
                          className={`size-1.5 rounded-full ${
                            editPolicy.status === 'published' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        {editPolicy.status === 'published' ? '已上架' : '已下架'}
                      </div>
                    </div>

                    {/* 原始链接 (不可编辑) */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">原始链接</label>
                      <div className="p-1.5 bg-gray-50 border border-gray-200 rounded flex items-center gap-1.5">
                        <span className="text-gray-700 truncate flex-1 font-mono text-[11px]" title={editPolicy.sourceUrl}>
                          {editPolicy.sourceUrl}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(editPolicy.sourceUrl)}
                          className="h-6 px-2 text-[11px] text-gray-600 hover:text-blue-600"
                        >
                          复制
                        </Button>
                        <a
                          href={editPolicy.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline px-1"
                        >
                          访问
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 2: 正文信息 ── */}
              {detailTab === 'content' && (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-xs text-gray-700 font-medium block mb-1">政策摘要</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-700 leading-relaxed text-xs">
                      {editPolicy.summary || '暂无摘要'}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-700 font-medium block mb-1">政策正文</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-700 leading-relaxed whitespace-pre-line text-xs max-h-60 overflow-y-auto">
                      {editPolicy.content || '暂无正文说明'}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-700 font-medium block mb-1">
                      政策附件 ({editPolicy.attachments?.length || 0} 份)
                    </label>
                    <div className="space-y-1.5">
                      {editPolicy.attachments?.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded"
                        >
                          <span className="text-xs text-gray-800 truncate mr-2">
                            {att.name} <span className="text-gray-400 font-mono">({att.size})</span>
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(editPolicy, att.name)}
                            className="h-7 text-xs px-2.5 shrink-0 border-gray-300"
                          >
                            下载
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dialog Footer: 简洁保存与取消 */}
              <DialogFooter className="border-t pt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditPolicy(null)}
                  className="h-8 text-xs px-4 border-gray-200 text-gray-700"
                >
                  取消
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-8 text-xs px-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  保存
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
