import { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
  Megaphone,
  Plus,
  Search,
  RotateCcw,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Link2,
  X,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Upload,
  Check,
  Eye,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────
export type ServiceType =
  | '全部服务'
  | '能源管理'
  | '智能微网'
  | '虚拟电厂'
  | '碳资产管理'
  | '平台通用';

export type ServiceEdition =
  | '全版本通用'
  | '基础版'
  | '标准版'
  | '高级版'
  | '旗舰版';

export type FrequencyType =
  | 'every_login'   // 每次登录弹出
  | 'once_a_day'     // 每日仅弹出一次
  | 'once_a_week'    // 每周弹出一次
  | 'once_forever'   // 仅弹出一次（永久不再提示）
  | 'custom_hours';  // 自定义间隔（小时）

export type ValidityType = 'permanent' | 'custom';

export interface PopupAlertItem {
  id: string;
  service: ServiceType;
  serviceEdition?: ServiceEdition; // 服务版本 (全版本通用 / 基础版 / 标准版 / 高级版 / 旗舰版)
  title: string;                 // 弹窗主标题
  content: string;               // 描述文字/正文
  imageUrls: string[];           // 多配图链接列表（支持轮播展示）
  imageUrl?: string;             // 兼容旧单图
  imageFit?: 'cover' | 'contain'; // 图片排版适配
  linkText: string;              // 跳转链接/主按钮文案
  linkUrl: string;               // 跳转链接地址 (支持常规 http://, https:// 协议或系统路由)
  linkTarget?: '_blank' | '_self';
  status: 'published' | 'unpublished'; // 上下架状态
  validityType: ValidityType;    // 时效类型：永久 / 自定义时间段
  startTime?: string;            // 生效开始时间 YYYY-MM-DD HH:mm
  endTime?: string;              // 生效截止时间 YYYY-MM-DD HH:mm
  frequency: FrequencyType;      // 频次规则
  frequencyIntervalHours?: number; // 自定义间隔小时数
  priority: 'high' | 'medium' | 'low'; // 优先级
  showDoNotRemindToday?: boolean; // 弹窗是否展示“今日不再弹出”选项
  viewsCount: number;            // 累计曝光
  clicksCount: number;           // 累计点击
  updatedAt: string;             // 更新时间
}

// ── Service Color Mappings ──────────────────────────────────────────
export const SERVICE_THEME: Record<
  ServiceType,
  { bg: string; text: string; border: string; dot: string }
> = {
  全部服务: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  能源管理: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  智能微网: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  虚拟电厂: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  碳资产管理: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  平台通用: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
};

// ── Priority Mappings (高 中 低) ────────────────────────────────────
export const PRIORITY_CONFIG: Record<
  'high' | 'medium' | 'low',
  { label: string; badgeClass: string }
> = {
  high: { label: '高', badgeClass: 'bg-red-50 text-red-600 border-red-200' },
  medium: { label: '中', badgeClass: 'bg-amber-50 text-amber-600 border-amber-200' },
  low: { label: '低', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
};

// ── Initial Mock Data ───────────────────────────────────────────────
const INITIAL_POPUPS: PopupAlertItem[] = [
  {
    id: 'popup-001',
    service: '虚拟电厂',
    serviceEdition: '高级版',
    title: '明日尖峰电力负荷削峰响应邀约',
    content: '预计明日 14:00-16:00 区域电网存在尖峰缺口，请各聚合微电网电站及可调节工商业负荷及时确认备用申报容量，响应成功可享 1.2 元/kWh 专项补贴。',
    imageUrls: [
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    imageFit: 'cover',
    linkText: '前往响应申报',
    linkUrl: 'https://vpp.energy-cloud.com/demand-response',
    linkTarget: '_blank',
    status: 'published',
    validityType: 'custom',
    startTime: '2026-10-18 00:00',
    endTime: '2026-10-25 23:59',
    frequency: 'every_login',
    priority: 'high',
    showDoNotRemindToday: true,
    viewsCount: 1420,
    clicksCount: 388,
    updatedAt: '2026-10-19 14:30',
  },
  {
    id: 'popup-002',
    service: '智能微网',
    serviceEdition: '标准版',
    title: '储能充放电协同策略秋季调优上线',
    content: '根据省内最新执行的分时峰谷电价政策，智能微网已自动为您更新两充两放经济调度策略模型，预计综合度电成本可降低 8.4%。',
    imageUrls: [
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    imageFit: 'cover',
    linkText: '查看策略配置',
    linkUrl: 'http://microgrid.energy-cloud.com/strategy/autumn',
    linkTarget: '_blank',
    status: 'published',
    validityType: 'permanent',
    frequency: 'once_a_day',
    priority: 'medium',
    showDoNotRemindToday: true,
    viewsCount: 2315,
    clicksCount: 512,
    updatedAt: '2026-10-17 10:15',
  },
  {
    id: 'popup-003',
    service: '能源管理',
    serviceEdition: '基础版',
    title: '2026年9月企业能耗月度盘点报告已生成',
    content: '您的企业园区上月绿电消纳率已达 62.8%，同比提升 7.2 个百分点；已为您标记出3处潜在空压机与制冷系统需量待优化点。',
    imageUrls: [
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    imageFit: 'cover',
    linkText: '立即阅读月报',
    linkUrl: 'https://report.energy-system.com/monthly/202609',
    linkTarget: '_blank',
    status: 'published',
    validityType: 'custom',
    startTime: '2026-10-01 08:00',
    endTime: '2026-10-31 23:59',
    frequency: 'once_a_week',
    priority: 'medium',
    showDoNotRemindToday: false,
    viewsCount: 980,
    clicksCount: 345,
    updatedAt: '2026-10-15 09:00',
  },
  {
    id: 'popup-004',
    service: '平台通用',
    serviceEdition: '全版本通用',
    title: 'SaaS平台安全合规校验与短信网关升级通告',
    content: '为了保障工业物联网通讯与敏感企业数据安全，平台将于本周末凌晨 02:00-04:00 进行例行网关优化，期间消息推送可能存在短暂延迟。',
    imageUrls: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    imageFit: 'cover',
    linkText: '查看维护详情',
    linkUrl: 'http://notice.energy-cloud.com/maintenance/2026-10',
    linkTarget: '_blank',
    status: 'unpublished',
    validityType: 'custom',
    startTime: '2026-10-10 00:00',
    endTime: '2026-10-12 12:00',
    frequency: 'once_forever',
    priority: 'low',
    showDoNotRemindToday: false,
    viewsCount: 342,
    clicksCount: 46,
    updatedAt: '2026-10-12 14:00',
  },
  {
    id: 'popup-005',
    service: '碳资产管理',
    serviceEdition: '旗舰版',
    title: '全国碳市场履约清缴倒计时与核查指南',
    content: '重点排放单位温室气体排放报告补充核算指引已更新，请各履约企业及时核对配额清缴账户并完成碳资产盘点确认。',
    imageUrls: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    imageFit: 'cover',
    linkText: '查阅国家核查指引',
    linkUrl: 'https://carbon.gov.cn/compliance-guidelines',
    linkTarget: '_blank',
    status: 'published',
    validityType: 'custom',
    startTime: '2026-10-15 00:00',
    endTime: '2026-11-15 23:59',
    frequency: 'custom_hours',
    frequencyIntervalHours: 48,
    priority: 'high',
    showDoNotRemindToday: true,
    viewsCount: 1650,
    clicksCount: 420,
    updatedAt: '2026-10-18 11:20',
  },
];

// ── Frequency Label Helper ──────────────────────────────────────────
export function getFrequencyLabel(
  freq: FrequencyType,
  intervalHours?: number
): { label: string; desc: string } {
  switch (freq) {
    case 'every_login':
      return { label: '每次登录', desc: '用户每次登录工作台时触发' };
    case 'once_a_day':
      return { label: '每日一次', desc: '同账号24小时内仅首次弹出' };
    case 'once_a_week':
      return { label: '每周一次', desc: '自然周内仅首次弹出' };
    case 'once_forever':
      return { label: '仅弹一次', desc: '用户点击或关闭后永久不再提示' };
    case 'custom_hours':
      return {
        label: `每隔 ${intervalHours || 24} 小时`,
        desc: `两次弹出间隔不低于 ${intervalHours || 24} 小时`,
      };
    default:
      return { label: '默认频次', desc: '' };
  }
}

// ── Check Validity Status ───────────────────────────────────────────
export function getValidityStatus(item: PopupAlertItem): {
  status: 'ongoing' | 'upcoming' | 'expired';
  text: '生效中' | '待生效' | '已过期';
  badgeClass: string;
} {
  if (item.validityType === 'permanent') {
    return {
      status: 'ongoing',
      text: '生效中',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  const now = new Date();
  if (item.startTime && new Date(item.startTime) > now) {
    return {
      status: 'upcoming',
      text: '待生效',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }

  if (item.endTime && new Date(item.endTime) < now) {
    return {
      status: 'expired',
      text: '已过期',
      badgeClass: 'bg-gray-100 text-gray-500 border-gray-200',
    };
  }

  return {
    status: 'ongoing',
    text: '生效中',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

// ── Universal Popup Card Component (引导型弹窗 · 视觉图片区域大于文字说明) ──
export function PopupCard({
  service,
  serviceEdition,
  title,
  content,
  imageUrls = [],
  linkText,
  linkUrl,
  priority = 'medium',
  frequency = 'every_login',
  frequencyIntervalHours,
  showDoNotRemindToday = true,
  onClose,
  onActionClick,
}: {
  service: ServiceType;
  serviceEdition?: ServiceEdition;
  title: string;
  content: string;
  imageUrls: string[];
  linkText: string;
  linkUrl: string;
  priority?: 'high' | 'medium' | 'low';
  frequency?: FrequencyType;
  frequencyIntervalHours?: number;
  showDoNotRemindToday?: boolean;
  onClose?: () => void;
  onActionClick?: () => void;
}) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Auto carousel effect if multiple images
  useEffect(() => {
    if (imageUrls.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImgIndex((prev) => (prev + 1) % imageUrls.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [imageUrls.length]);

  const currentIdx = imageUrls.length > 0 ? activeImgIndex % imageUrls.length : 0;
  const currentImg = imageUrls[currentIdx];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % imageUrls.length);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100/80 transition-all w-full max-w-[400px] mx-auto animate-in fade-in zoom-in-95 duration-200">
      {/* ── 引导型大图主视觉区域 (高度占比约65%，显著大于文字区域) ── */}
      <div className="relative h-64 sm:h-72 w-full bg-slate-950 overflow-hidden select-none group">
        {imageUrls.length > 0 ? (
          <img
            src={currentImg}
            alt={`${title} - 引导配图 ${currentIdx + 1}`}
            className="size-full object-cover transition-all duration-500 scale-[1.01] group-hover:scale-105"
          />
        ) : (
          /* 无配图时的默认高质感系统引导视觉底图 */
          <div className="size-full bg-gradient-to-br from-blue-700 via-indigo-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="size-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-3 shadow-inner">
              <Sparkles className="size-8 text-blue-300 animate-pulse" />
            </div>
            <p className="text-white font-medium text-sm tracking-wide">
              {service} · 功能服务引导
            </p>
            <p className="text-white/60 text-xs mt-1">
              探索全新业务协同能力与智能化工具
            </p>
          </div>
        )}

        {/* 顶部与底部的微渐变遮罩，保障浮层文字与控件清晰 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/60 pointer-events-none" />

        {/* 顶部左侧：服务系统与版本引导标签 */}
        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/55 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="size-3 text-amber-300" />
            <span>{service}</span>
            {serviceEdition && serviceEdition !== '全版本通用' && (
              <span className="text-blue-200 border-l border-white/20 pl-1.5">
                {serviceEdition}
              </span>
            )}
          </span>
        </div>

        {/* 顶部右侧：优雅关闭按钮 */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 size-7 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 hover:scale-105"
            title="关闭引导"
          >
            <X className="size-4" />
          </button>
        )}

        {/* 多图轮播时左右切换指示箭头 */}
        {imageUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 size-7 rounded-full bg-black/45 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer opacity-85 hover:opacity-100 shadow-md border border-white/15"
              title="上一张"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 size-7 rounded-full bg-black/45 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer opacity-85 hover:opacity-100 shadow-md border border-white/15"
              title="下一张"
            >
              <ChevronRight className="size-4" />
            </button>

            {/* 引导步进序号标签 */}
            <div className="absolute bottom-3 right-3.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-black/60 backdrop-blur-md text-white/95 border border-white/15">
              引导 {currentIdx + 1} / {imageUrls.length}
            </div>

            {/* 底部轮播指示条/圆点 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIndex(i);
                  }}
                  className={`transition-all rounded-full ${
                    i === currentIdx
                      ? 'w-5 h-1.5 bg-white shadow-sm'
                      : 'w-1.5 h-1.5 bg-white/45 hover:bg-white/80'
                  }`}
                  title={`切换至第 ${i + 1} 张`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── 引导型文字与行为触发区域 (紧凑精致，高度约35%) ── */}
      <div className="p-4 sm:p-5 pt-3.5 space-y-3 bg-white">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-900 leading-snug tracking-tight">
            {title || '新服务特性上线引导'}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {content || '请在编辑表单中输入弹窗的引导文字说明要点...'}
          </p>
        </div>

        {/* 引导跳转主行动点 (Primary CTA Button) */}
        <div>
          <Button
            type="button"
            size="sm"
            onClick={onActionClick}
            className="h-9 w-full text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer rounded-lg"
          >
            {linkText || '立即前往体验'}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {/* 底部引导辅助栏：今日不再弹出 & 跳过/稍后再看 */}
        <div className="pt-0.5 flex items-center justify-between text-xs text-gray-400">
          {showDoNotRemindToday ? (
            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="popup-card-dont-remind"
                className="size-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="popup-card-dont-remind"
                className="cursor-pointer select-none text-xs text-gray-400 hover:text-gray-600 leading-none"
              >
                今日不再弹出
              </label>
            </div>
          ) : (
            <span />
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer select-none"
            >
              稍后查看
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────
export default function PopupAlertManagement() {
  const [popups, setPopups] = useState<PopupAlertItem[]>(INITIAL_POPUPS);

  // ── Traditional Multi-item Filter States ───────────────────────────
  const [searchKeyword, setSearchKeyword]   = useState('');
  const [filterService, setFilterService]   = useState<string>('all');
  const [filterStatus, setFilterStatus]     = useState<'all' | 'published' | 'unpublished'>('all');
  const [filterValidity, setFilterValidity] = useState<'all' | 'ongoing' | 'upcoming' | 'expired'>('all');
  const [filterFrequency, setFilterFrequency] = useState<string>('all');

  // ── Pagination ────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // ── Modals State ──────────────────────────────────────────────────
  const [previewItem, setPreviewItem] = useState<PopupAlertItem | null>(null);
  const [editItem, setEditItem]       = useState<PopupAlertItem | null>(null);
  const [isCreating, setIsCreating]   = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Filter Logic ──────────────────────────────────────────────────
  const filteredPopups = useMemo(() => {
    return popups.filter((item) => {
      // 1. Keyword search
      const q = searchKeyword.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.linkText.toLowerCase().includes(q) ||
        item.linkUrl.toLowerCase().includes(q);

      // 2. Service
      const matchService = filterService === 'all' || item.service === filterService;

      // 3. Status
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;

      // 4. Validity
      const validity = getValidityStatus(item).status;
      const matchValidity = filterValidity === 'all' || validity === filterValidity;

      // 5. Frequency
      const matchFrequency = filterFrequency === 'all' || item.frequency === filterFrequency;

      return matchSearch && matchService && matchStatus && matchValidity && matchFrequency;
    });
  }, [popups, searchKeyword, filterService, filterStatus, filterValidity, filterFrequency]);

  // Paginated List
  const totalPages = Math.max(1, Math.ceil(filteredPopups.length / pageSize));
  const paginatedPopups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPopups.slice(start, start + pageSize);
  }, [filteredPopups, currentPage, pageSize]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setSearchKeyword('');
    setFilterService('all');
    setFilterStatus('all');
    setFilterValidity('all');
    setFilterFrequency('all');
    setCurrentPage(1);
    toast.info('筛选条件已重置');
  };

  const handleQuery = () => {
    setCurrentPage(1);
    toast.info(`查询完成，共匹配到 ${filteredPopups.length} 条弹窗提醒规则`);
  };

  // Toggle single item shelf status (上下架)
  const handleToggleStatus = (id: string) => {
    setPopups((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'published' ? 'unpublished' : 'published';
          toast.success(
            `弹窗「${item.title.slice(0, 10)}...」已切换为【${
              nextStatus === 'published' ? '已上架（生效中）' : '已下架（停止弹出）'
            }】`
          );
          return {
            ...item,
            status: nextStatus,
            updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return item;
      })
    );
  };

  // Clone item
  const handleCloneItem = (item: PopupAlertItem) => {
    const cloned: PopupAlertItem = {
      ...item,
      id: `popup-${Date.now().toString().slice(-4)}`,
      title: `${item.title} (副本)`,
      imageUrls: [...(item.imageUrls || (item.imageUrl ? [item.imageUrl] : []))],
      serviceEdition: item.serviceEdition,
      status: 'unpublished', // Default unpublished after clone for safety
      viewsCount: 0,
      clicksCount: 0,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setPopups([cloned, ...popups]);
    toast.success(`已复制生成新弹窗「${cloned.title}」，默认处于下架待发布状态`);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
    toast.success('弹窗提醒配置已删除');
  };

  // Save (Create or Edit)
  const handleSaveItem = (itemData: Partial<PopupAlertItem>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    if (editItem) {
      // Update
      setPopups((prev) =>
        prev.map((p) =>
          p.id === editItem.id ? { ...p, ...itemData, updatedAt: nowStr } : p
        )
      );
      toast.success('弹窗提醒配置已保存');
      setEditItem(null);
    } else {
      // Create new
      const newItem: PopupAlertItem = {
        id: `popup-${Date.now().toString().slice(-4)}`,
        service: (itemData.service as ServiceType) || '能源管理',
        serviceEdition: itemData.serviceEdition || '全版本通用',
        title: itemData.title || '新服务弹窗提醒',
        content: itemData.content || '',
        imageUrls: itemData.imageUrls && itemData.imageUrls.length > 0
          ? itemData.imageUrls
          : (itemData.imageUrl ? [itemData.imageUrl] : []),
        imageUrl: itemData.imageUrls?.[0] || itemData.imageUrl || '',
        imageFit: itemData.imageFit || 'cover',
        linkText: itemData.linkText || '前往查看',
        linkUrl: itemData.linkUrl || 'https://vpp.energy-cloud.com',
        linkTarget: itemData.linkTarget || '_blank',
        status: itemData.status || 'published',
        validityType: itemData.validityType || 'permanent',
        startTime: itemData.startTime,
        endTime: itemData.endTime,
        frequency: itemData.frequency || 'every_login',
        frequencyIntervalHours: itemData.frequencyIntervalHours || 24,
        priority: itemData.priority || 'medium',
        showDoNotRemindToday: itemData.showDoNotRemindToday ?? true,
        viewsCount: 0,
        clicksCount: 0,
        updatedAt: nowStr,
      };
      setPopups([newItem, ...popups]);
      toast.success('新弹窗提醒配置创建成功，已生效');
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full min-h-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1
              className="text-2xl font-semibold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              弹窗提醒
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200 flex items-center gap-1">
              <Megaphone className="size-3 text-blue-600" />
              端内触达中心
            </span>
          </div>
          <p className="text-sm text-gray-500">
            集中维护管理平台内各业务系统（能源管理、智能微网、虚拟电厂、碳资产）的强提醒弹窗，支持配图多图轮播、时效、触达频次与行为链接精细化配置
          </p>
        </div>

        {/* Create Button */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => setIsCreating(true)}
            className="h-9 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="size-3.5" />
            新建弹窗提醒
          </Button>
        </div>
      </div>

      {/* ── Traditional Multi-item Filter Card (传统多项列表筛选，无需区分渠道) ── */}
      <Card className="p-5 mb-5 bg-white rounded-lg shadow-2xs border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-5 gap-y-4">
          {/* 筛选项 1: 模糊搜索 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-16 text-right">
              模糊搜索:
            </span>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <Input
                placeholder="搜索标题、内容..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 text-xs h-9 bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
              />
            </div>
          </div>

          {/* 筛选项 2: 所属服务 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-16 text-right">
              适用服务:
            </span>
            <Select
              value={filterService}
              onValueChange={(v) => {
                setFilterService(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部服务" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部服务模块</SelectItem>
                <SelectItem value="能源管理">能源管理</SelectItem>
                <SelectItem value="智能微网">智能微网</SelectItem>
                <SelectItem value="虚拟电厂">虚拟电厂</SelectItem>
                <SelectItem value="碳资产管理">碳资产管理</SelectItem>
                <SelectItem value="平台通用">平台通用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 筛选项 3: 上架状态 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-16 text-right">
              上架状态:
            </span>
            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v as 'all' | 'published' | 'unpublished');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="published">已上架 (生效)</SelectItem>
                <SelectItem value="unpublished">已下架 (暂停)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 筛选项 4: 时效状态 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-16 text-right">
              时效状态:
            </span>
            <Select
              value={filterValidity}
              onValueChange={(v) => {
                setFilterValidity(v as 'all' | 'ongoing' | 'upcoming' | 'expired');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部时效" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部时效</SelectItem>
                <SelectItem value="ongoing">生效中</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
                <SelectItem value="upcoming">待生效</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 筛选项 5: 弹出频次 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-16 text-right">
              弹出频次:
            </span>
            <Select
              value={filterFrequency}
              onValueChange={(v) => {
                setFilterFrequency(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs flex-1 bg-white border-gray-200 rounded text-gray-700">
                <SelectValue placeholder="全部频次" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部弹出频次</SelectItem>
                <SelectItem value="every_login">每次登录</SelectItem>
                <SelectItem value="once_a_day">每日一次</SelectItem>
                <SelectItem value="once_a_week">每周一次</SelectItem>
                <SelectItem value="once_forever">仅弹一次</SelectItem>
                <SelectItem value="custom_hours">自定义小时</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {searchKeyword ||
            filterService !== 'all' ||
            filterStatus !== 'all' ||
            filterValidity !== 'all' ||
            filterFrequency !== 'all' ? (
              <span className="text-blue-600 font-medium flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                已应用筛选，匹配到 {filteredPopups.length} 条弹窗配置
              </span>
            ) : (
              <span>显示全部 {popups.length} 条弹窗配置</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-3 text-xs text-gray-600 bg-white hover:bg-gray-50 border-gray-200 flex items-center gap-1 rounded"
            >
              <RotateCcw className="size-3" />
              重置
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleQuery}
              className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 rounded shadow-2xs"
            >
              <Search className="size-3" />
              查询
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Table Card ── */}
      <Card className="overflow-hidden bg-white border border-gray-200 shadow-2xs rounded-lg">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">平台弹窗提醒列表</h2>
            <span className="text-xs text-gray-400 font-mono">
              ({filteredPopups.length} / {popups.length})
            </span>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap min-w-[180px]">
                  弹窗标题
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">
                  适用服务
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">
                  优先级
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">
                  时效状态
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap min-w-[150px]">
                  时效范围
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">
                  弹出频次
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">
                  上下架状态
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">
                  曝光/点击
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPopups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-xs text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Megaphone className="size-8 text-gray-300 mb-2 stroke-1" />
                      <p>未找到匹配的弹窗提醒配置</p>
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
                paginatedPopups.map((item, idx) => {
                  const isPublished = item.status === 'published';
                  const theme = SERVICE_THEME[item.service] || SERVICE_THEME['平台通用'];
                  const validity = getValidityStatus(item);
                  const freqInfo = getFrequencyLabel(item.frequency, item.frequencyIntervalHours);
                  const images = item.imageUrls?.length > 0 ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/80 transition-colors"
                      style={{
                        borderBottom:
                          idx < paginatedPopups.length - 1 ? '1px solid #f8fafc' : undefined,
                      }}
                    >
                      {/* 1. 弹窗标题 (字号与其他列表文字一致 text-xs) */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => setEditItem(item)}
                          className="text-xs text-gray-900 hover:text-blue-600 transition-colors text-left leading-normal cursor-pointer group flex items-center gap-1.5"
                          title="点击编辑配置"
                        >
                          <span className="group-hover:underline">{item.title}</span>
                          {images.length > 1 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200 shrink-0 font-normal">
                              {images.length}图轮播
                            </span>
                          )}
                        </button>
                      </td>

                      {/* 2. 适用服务 */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium ${theme.bg} ${theme.text} border ${theme.border}`}
                          >
                            <span className={`size-1.5 rounded-full ${theme.dot}`} />
                            {item.service}
                          </span>
                          {item.serviceEdition && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-normal">
                              {item.serviceEdition}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. 优先级 (独立一列) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            PRIORITY_CONFIG[item.priority]?.badgeClass || 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {PRIORITY_CONFIG[item.priority]?.label || '中'}
                        </span>
                      </td>

                      {/* 4. 时效状态 (独立一列) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${validity.badgeClass}`}
                        >
                          {validity.text}
                        </span>
                      </td>

                      {/* 5. 时效范围 (独立一列) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {item.validityType === 'permanent' ? (
                          <span className="text-gray-600 text-xs">永久有效</span>
                        ) : (
                          <div className="text-[11px] text-gray-600 font-mono tabular-nums leading-tight space-y-0.5">
                            <div>{item.startTime}</div>
                            <div className="text-gray-400">至 {item.endTime}</div>
                          </div>
                        )}
                      </td>

                      {/* 6. 弹出频次 (常规文字显示) */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-700">
                        {freqInfo.label}
                      </td>

                      {/* 7. 上下架状态 (Switch) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isPublished}
                            onCheckedChange={() => handleToggleStatus(item.id)}
                            className="data-[state=checked]:bg-emerald-600 scale-90"
                          />
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
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

                      {/* 8. 曝光/点击 */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 font-mono tabular-nums">
                        <div>展：{item.viewsCount}</div>
                        <div className="text-gray-400 text-[11px]">点：{item.clicksCount}</div>
                      </td>

                      {/* 9. 操作栏 */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                            onClick={() => setEditItem(item)}
                            title="编辑配置"
                          >
                            <Edit2 className="size-3.5 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 text-xs text-gray-500 hover:text-gray-800"
                            onClick={() => handleCloneItem(item)}
                            title="复制并生成新规则"
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="删除配置"
                          >
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

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-gray-100 gap-3 bg-white text-xs text-gray-500">
          <div>
            共 <span className="font-semibold text-gray-700">{filteredPopups.length}</span> 条弹窗规则
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

      {/* ── High-Fidelity Popup Alert Preview Dialog (弹窗实时高保真渲染预览) ── */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-slate-950/90 border-slate-800 shadow-2xl">
          {previewItem && (
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between text-xs text-slate-300 pb-3 mb-2 border-b border-slate-800">
                <span className="font-medium text-white flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-blue-400" />
                  端内弹窗真实渲染效果
                </span>
                <span className="text-[11px] text-slate-400">
                  状态：{previewItem.status === 'published' ? '已上架' : '已下架'}
                </span>
              </div>

              <PopupCard
                service={previewItem.service}
                serviceEdition={previewItem.serviceEdition}
                title={previewItem.title}
                content={previewItem.content}
                imageUrls={
                  previewItem.imageUrls?.length > 0
                    ? previewItem.imageUrls
                    : previewItem.imageUrl
                    ? [previewItem.imageUrl]
                    : []
                }
                linkText={previewItem.linkText}
                linkUrl={previewItem.linkUrl}
                priority={previewItem.priority}
                frequency={previewItem.frequency}
                frequencyIntervalHours={previewItem.frequencyIntervalHours}
                showDoNotRemindToday={previewItem.showDoNotRemindToday}
                onClose={() => {
                  toast.info('已关闭弹窗');
                  setPreviewItem(null);
                }}
                onActionClick={() => {
                  if (
                    previewItem.linkUrl.startsWith('http://') ||
                    previewItem.linkUrl.startsWith('https://')
                  ) {
                    toast.success(`模拟点击常规链接跳转：${previewItem.linkUrl}`);
                  } else {
                    toast.success(`模拟点击跳转：${previewItem.linkText} -> ${previewItem.linkUrl}`);
                  }
                  setPreviewItem(null);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit Modal (弹窗完整配置表单) ── */}
      {(isCreating || editItem) && (
        <PopupFormModal
          initialData={editItem || undefined}
          onClose={() => {
            setIsCreating(false);
            setEditItem(null);
          }}
          onSave={handleSaveItem}
        />
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              确认删除弹窗配置？
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 py-2">
            删除后该弹窗提醒将不再在任何业务服务中触发，此操作不可撤销。
          </p>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="h-8 text-xs"
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => deleteConfirmId && handleDeleteItem(deleteConfirmId)}
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Popup Form Modal (Create & Edit) ────────────────────────────────
function PopupFormModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: PopupAlertItem;
  onClose: () => void;
  onSave: (data: Partial<PopupAlertItem>) => void;
}) {
  const isEditing = !!initialData;

  const [service, setService] = useState<ServiceType>(initialData?.service || '能源管理');
  const [serviceEdition, setServiceEdition] = useState<ServiceEdition>(initialData?.serviceEdition || '全版本通用');
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');

  // ── Multi-image Management State (支持多图片轮播) ──
  const initialImages = useMemo(() => {
    if (initialData?.imageUrls && initialData.imageUrls.length > 0) {
      return [...initialData.imageUrls];
    }
    if (initialData?.imageUrl) {
      return [initialData.imageUrl];
    }
    return [];
  }, [initialData]);

  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [isDragging, setIsDragging] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlAdd, setShowUrlAdd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── In-modal Preview State (在编辑内增加实时预览功能) ──
  const [showPreview, setShowPreview] = useState(false);

  const [linkText, setLinkText] = useState(initialData?.linkText || '立即前往');
  const [linkUrl, setLinkUrl] = useState(
    initialData?.linkUrl || 'https://vpp.energy-cloud.com'
  );
  const [status, setStatus] = useState<'published' | 'unpublished'>(
    initialData?.status || 'published'
  );
  const [validityType, setValidityType] = useState<ValidityType>(
    initialData?.validityType || 'permanent'
  );
  const [startTime, setStartTime] = useState(
    initialData?.startTime || new Date().toISOString().replace('T', ' ').slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    initialData?.endTime || '2026-11-30 23:59'
  );
  const [frequency, setFrequency] = useState<FrequencyType>(
    initialData?.frequency || 'every_login'
  );
  const [frequencyIntervalHours, setFrequencyIntervalHours] = useState(
    initialData?.frequencyIntervalHours || 24
  );
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(
    initialData?.priority || 'medium'
  );
  const [showDoNotRemindToday, setShowDoNotRemindToday] = useState(
    initialData?.showDoNotRemindToday ?? true
  );

  // Handle multi-file local upload
  const handleFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`文件「${file.name}」不是图片格式`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`文件「${file.name}」超过 5MB 限制`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    let loadedCount = 0;
    const newUrls: string[] = [];
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newUrls.push(reader.result);
          loadedCount++;
          if (loadedCount === validFiles.length) {
            setImageUrls((prev) => [...prev, ...newUrls]);
            toast.success(`成功上传 ${validFiles.length} 张图片，已加入轮播`);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= imageUrls.length) return;
    setImageUrls((prev) => {
      const copy = [...prev];
      const item = copy.splice(fromIdx, 1)[0];
      copy.splice(toIdx, 0, item);
      return copy;
    });
  };

  const handleRemoveImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
    toast.info('已移除该图片');
  };

  const handleAddCustomUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image')) {
      toast.error('请输入以 http:// 或 https:// 开头的有效图片链接');
      return;
    }
    setImageUrls((prev) => [...prev, trimmed]);
    setCustomUrlInput('');
    setShowUrlAdd(false);
    toast.success('已添加图片链接至轮播');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('请输入弹窗标题');
      return;
    }
    if (!content.trim()) {
      toast.error('请输入弹窗文字说明');
      return;
    }
    if (imageUrls.length === 0) {
      toast.error('请至少上传一张弹窗配图');
      return;
    }
    if (!linkText.trim()) {
      toast.error('请输入跳转链接/按钮文案');
      return;
    }
    if (!linkUrl.trim()) {
      toast.error('请输入跳转链接目标地址');
      return;
    }

    onSave({
      service,
      serviceEdition,
      title: title.trim(),
      content: content.trim(),
      imageUrls,
      imageUrl: imageUrls[0] || '',
      linkText: linkText.trim(),
      linkUrl: linkUrl.trim(),
      status,
      validityType,
      startTime: validityType === 'custom' ? startTime : undefined,
      endTime: validityType === 'custom' ? endTime : undefined,
      frequency,
      frequencyIntervalHours: frequency === 'custom_hours' ? Number(frequencyIntervalHours) : undefined,
      priority,
      showDoNotRemindToday,
    });
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl w-[94vw] sm:w-[680px] max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-6">
          <DialogHeader className="border-b pb-3 text-left">
            <DialogTitle className="text-base font-semibold text-gray-900">
              {isEditing ? '编辑弹窗提醒' : '新建弹窗提醒'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            {/* 适用服务系统, 服务版本, 提醒优先级 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  适用服务系统 <span className="text-red-500">*</span>
                </Label>
                <Select value={service} onValueChange={(v) => setService(v as ServiceType)}>
                  <SelectTrigger className="mt-1 h-9 text-xs bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="能源管理">能源管理</SelectItem>
                    <SelectItem value="智能微网">智能微网</SelectItem>
                    <SelectItem value="虚拟电厂">虚拟电厂</SelectItem>
                    <SelectItem value="碳资产管理">碳资产管理</SelectItem>
                    <SelectItem value="平台通用">平台通用</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700">服务版本</Label>
                <Select
                  value={serviceEdition}
                  onValueChange={(v) => setServiceEdition(v as ServiceEdition)}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全版本通用">全版本通用</SelectItem>
                    <SelectItem value="基础版">基础版</SelectItem>
                    <SelectItem value="标准版">标准版</SelectItem>
                    <SelectItem value="高级版">高级版</SelectItem>
                    <SelectItem value="旗舰版">旗舰版</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700">提醒优先级</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as 'high' | 'medium' | 'low')}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 弹窗标题 */}
            <div>
              <Label className="text-xs font-medium text-gray-700">
                弹窗标题 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入弹窗标题"
                className="mt-1 h-9 text-xs bg-white border-gray-300"
                required
              />
            </div>

            {/* 文字说明 */}
            <div>
              <Label className="text-xs font-medium text-gray-700">
                文字说明 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入弹窗说明正文..."
                rows={3}
                className="mt-1 text-xs resize-none bg-white border-gray-300"
                required
              />
            </div>

            {/* 弹窗配图配置 (平铺简洁结构) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-medium text-gray-700">
                  弹窗配图 <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">
                    (已添加 {imageUrls.length} 张，支持多图轮播)
                  </span>
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs px-2.5 text-blue-600 border-gray-200 hover:bg-blue-50"
                  >
                    <Upload className="size-3 mr-1" />
                    上传图片
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUrlAdd(!showUrlAdd)}
                    className="h-7 text-xs px-2 text-gray-600 hover:text-gray-900"
                  >
                    <Link2 className="size-3 mr-1" />
                    网络链接
                  </Button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Quick URL input */}
              {showUrlAdd && (
                <div className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center gap-2 mb-2">
                  <Input
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="输入图片网址 (http:// 或 https://)..."
                    className="h-8 text-xs font-mono bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomUrl();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomUrl}
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  >
                    添加
                  </Button>
                </div>
              )}

              {/* 图片列表 */}
              {imageUrls.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 border border-dashed rounded text-center cursor-pointer transition-colors bg-gray-50/60 ${
                    isDragging ? 'border-blue-500 bg-blue-50/30' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <UploadCloud className="size-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">点击或将图片拖拽至此上传</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {imageUrls.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative bg-white rounded border border-gray-200 overflow-hidden p-1 flex flex-col group"
                    >
                      <div className="relative aspect-video rounded overflow-hidden bg-gray-100">
                        <img src={img} alt={`配图 ${idx + 1}`} className="size-full object-cover" />
                        <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[10px] font-mono bg-black/60 text-white">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 px-0.5 text-gray-500">
                        <div className="flex items-center">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, idx - 1)}
                            className="size-5 rounded hover:bg-gray-100 flex items-center justify-center disabled:opacity-20 cursor-pointer"
                            title="前移"
                          >
                            <ChevronLeft className="size-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === imageUrls.length - 1}
                            onClick={() => handleMoveImage(idx, idx + 1)}
                            className="size-5 rounded hover:bg-gray-100 flex items-center justify-center disabled:opacity-20 cursor-pointer"
                            title="后移"
                          >
                            <ChevronRight className="size-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="size-5 rounded text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/20 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Plus className="size-4 mb-0.5" />
                    <span className="text-[11px]">添加配图</span>
                  </button>
                </div>
              )}
            </div>

            {/* 跳转链接配置 (按钮文案与目标地址，简洁两列) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  按钮文案 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="例如：立即前往"
                  className="mt-1 h-9 text-xs bg-white border-gray-300"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  跳转地址 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://... 或系统内部路由"
                  className="mt-1 h-9 text-xs font-mono bg-white border-gray-300"
                  required
                />
              </div>
            </div>

            {/* 时效配置与频次规则 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label className="text-xs font-medium text-gray-700 block mb-1">时效规则</Label>
                <Select
                  value={validityType}
                  onValueChange={(v) => setValidityType(v as ValidityType)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">永久有效</SelectItem>
                    <SelectItem value="custom">自定义时间区间</SelectItem>
                  </SelectContent>
                </Select>
                {validityType === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="开始时间"
                      className="h-8 text-xs font-mono bg-white"
                    />
                    <Input
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="结束时间"
                      className="h-8 text-xs font-mono bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 block mb-1">频次规则</Label>
                <Select
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as FrequencyType)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="every_login">每次登录触发</SelectItem>
                    <SelectItem value="once_a_day">每日仅弹出一次</SelectItem>
                    <SelectItem value="once_a_week">每周弹出一次</SelectItem>
                    <SelectItem value="once_forever">仅弹一次（永久不复弹）</SelectItem>
                    <SelectItem value="custom_hours">自定义时间间隔（小时）</SelectItem>
                  </SelectContent>
                </Select>
                {frequency === 'custom_hours' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">间隔:</span>
                    <Input
                      type="number"
                      min={1}
                      max={720}
                      value={frequencyIntervalHours}
                      onChange={(e) => setFrequencyIntervalHours(Number(e.target.value))}
                      className="h-8 text-xs bg-white w-24"
                    />
                    <span className="text-xs text-gray-500">小时</span>
                  </div>
                )}
              </div>
            </div>

            {/* 今日不再弹出 & 上架状态 (底栏轻量排布) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="form-dont-remind"
                  checked={showDoNotRemindToday}
                  onChange={(e) => setShowDoNotRemindToday(e.target.checked)}
                  className="size-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="form-dont-remind" className="cursor-pointer select-none text-xs text-gray-600 hover:text-gray-800">
                  允许用户勾选「今日不再弹出」
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">上架状态:</span>
                <Switch
                  checked={status === 'published'}
                  onCheckedChange={(checked) => setStatus(checked ? 'published' : 'unpublished')}
                  className="data-[state=checked]:bg-emerald-600 scale-90"
                />
                <span className={`text-xs font-medium ${status === 'published' ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {status === 'published' ? '已上架' : '已下架'}
                </span>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <DialogFooter className="pt-3 border-t flex flex-row items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="h-8 text-xs text-blue-600 border-gray-200 hover:bg-blue-50 flex items-center gap-1.5"
              >
                <Eye className="size-3.5" />
                预览效果
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-8 text-xs px-4 border-gray-200 text-gray-700"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4"
                >
                  保存
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Sub-Modal: In-Edit Live Preview (编辑内实时效果预览) ── */}
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={(open) => !open && setShowPreview(false)}>
          <DialogContent className="max-w-md p-0 overflow-hidden bg-slate-950/90 border-slate-800 shadow-2xl z-50">
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between text-xs text-slate-300 pb-3 mb-2 border-b border-slate-800">
                <span className="font-medium text-white flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-blue-400" />
                  实时效果预览 (轮播与交互演示)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="h-6 text-xs text-slate-400 hover:text-white px-2"
                >
                  返回继续编辑
                </Button>
              </div>

              <PopupCard
                service={service}
                serviceEdition={serviceEdition}
                title={title || '新服务弹窗提醒标题'}
                content={content || '请在表单中填写弹窗的具体文字要点说明...'}
                imageUrls={
                  imageUrls.length > 0
                    ? imageUrls
                    : ['https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80']
                }
                linkText={linkText || '立即前往'}
                linkUrl={linkUrl || 'https://vpp.energy-cloud.com'}
                priority={priority}
                frequency={frequency}
                frequencyIntervalHours={frequencyIntervalHours}
                showDoNotRemindToday={showDoNotRemindToday}
                onClose={() => setShowPreview(false)}
                onActionClick={() => {
                  if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
                    toast.success(`模拟点击常规链接跳转：${linkUrl}`);
                  } else {
                    toast.success(`模拟点击跳转：${linkText || '立即前往'} -> ${linkUrl}`);
                  }
                  setShowPreview(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
