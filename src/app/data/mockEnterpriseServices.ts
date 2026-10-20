export interface ServiceUserItem {
  id: string;
  userCode: string;
  name: string;
  employeeCode: string;
  roles: string[]; // e.g. ['管理员'] or ['管理员', '调度专工']
  status: 'normal' | 'disabled';
  addedAt: string;
}

export interface ServiceRoleItem {
  id: string;
  name: string;
  code: string;
  userCount: number;
  description: string;
  permissions: string[];
  createdAt: string;
}

export interface ServiceItemConfig {
  id: string;
  name: string;
  subTitle?: string;
  serviceType: 'authorized' | 'trial'; // 授权服务 | 体验服务
  version: string; // e.g. "标准版", "专业版", "旗舰版"
  expireDate: string; // e.g. "长期" or "2027/12/31"
  userLimit: string; // e.g. "3/无限制", "10/20"
  tagMemberCount: number; // e.g. 6
  status: 'active' | 'disabled'; // "启用" | "停用"
  gradientClass?: string;
  users: ServiceUserItem[];
  roles: ServiceRoleItem[];
}

// 9 exact users from the user's uploaded screenshot for "零碳工作台"
export const SCREENSHOT_SERVICE_USERS: ServiceUserItem[] = [
  {
    id: 'su-1',
    userCode: 'UE00015622',
    name: '孙乾',
    employeeCode: '',
    roles: ['管理员'],
    status: 'normal',
    addedAt: '2026/06/26',
  },
  {
    id: 'su-2',
    userCode: 'UE00043914',
    name: '薛易立',
    employeeCode: '',
    roles: ['管理员'],
    status: 'normal',
    addedAt: '2026/06/26',
  },
  {
    id: 'su-3',
    userCode: 'UE00010877',
    name: '崔阳',
    employeeCode: '',
    roles: ['管理员'],
    status: 'normal',
    addedAt: '2026/06/26',
  },
  {
    id: 'su-4',
    userCode: 'UE00007441',
    name: '葛有功',
    employeeCode: '',
    roles: ['管理员'],
    status: 'normal',
    addedAt: '2026/06/26',
  },
  {
    id: 'su-5',
    userCode: 'UE00010974',
    name: '王晨',
    employeeCode: '',
    roles: ['管理员'],
    status: 'normal',
    addedAt: '2026/06/26',
  },
  {
    id: 'su-6',
    userCode: 'UE00150774',
    name: '贺文有',
    employeeCode: '',
    roles: ['管理员'],
    status: 'normal',
    addedAt: '2026/06/28',
  },
  {
    id: 'su-7',
    userCode: 'UE00150873',
    name: '蒋琛',
    employeeCode: '',
    roles: ['管理员'],
    status: 'normal',
    addedAt: '2026/06/29',
  },
  {
    id: 'su-8',
    userCode: 'UE00150905',
    name: '卞铁铮',
    employeeCode: '',
    roles: ['管理员'],
    status: 'normal',
    addedAt: '2026/06/29',
  },
  {
    id: 'su-9',
    userCode: 'UE00014058',
    name: '张思淇',
    employeeCode: '',
    roles: ['管理员', '研发专工'], // renders as "共2个" in blue link
    status: 'normal',
    addedAt: '2026/07/16',
  },
];

// Predefined roles for Zero-Carbon Services
export const DEFAULT_SERVICE_ROLES: ServiceRoleItem[] = [
  {
    id: 'role-admin',
    name: '管理员',
    code: 'SYS_ADMIN',
    userCount: 9,
    description: '拥有当前服务的最高管理权限，包括模块配置、用户分配及策略制定',
    permissions: ['查看全量数据', '配置服务参数', '调度控制下发', '管理服务用户', '报表导出'],
    createdAt: '2026/06/20',
  },
  {
    id: 'role-operator',
    name: '运行值守员',
    code: 'OPERATOR',
    userCount: 4,
    description: '负责实时监测微网运行负荷、储能充放电状态及告警事件确认',
    permissions: ['实时监测', '告警确认', '工单创建', '运行日志查看'],
    createdAt: '2026/06/20',
  },
  {
    id: 'role-analyst',
    name: '能耗分析员',
    code: 'ANALYST',
    userCount: 3,
    description: '负责碳排放统计、负荷预测曲线复核及绿电消纳分析',
    permissions: ['能耗统计', '碳核算分析', '报表导出'],
    createdAt: '2026/06/21',
  },
  {
    id: 'role-viewer',
    name: '业务查看员',
    code: 'VIEWER',
    userCount: 2,
    description: '仅具备只读查看微网大屏及综合态势驾驶舱看板权限',
    permissions: ['驾驶舱查看', '大屏展示'],
    createdAt: '2026/06/22',
  },
];

// Initial 9 Services matching the Left Sidebar in screenshot
export function getInitialEnterpriseServices(enterpriseId: string): ServiceItemConfig[] {
  return [
    {
      id: 'srv-zero-carbon',
      name: '零碳工作台',
      serviceType: 'authorized',
      version: '标准版',
      expireDate: '长期',
      userLimit: '3/无限制',
      tagMemberCount: 6,
      status: 'active',
      gradientClass: 'from-emerald-50/80 via-teal-50/50 to-slate-50 border-emerald-300',
      users: SCREENSHOT_SERVICE_USERS,
      roles: DEFAULT_SERVICE_ROLES,
    },
    {
      id: 'srv-smart-microgrid',
      name: '智能微网',
      serviceType: 'authorized',
      version: '专业版',
      expireDate: '长期',
      userLimit: '5/无限制',
      tagMemberCount: 4,
      status: 'active',
      gradientClass: 'from-cyan-50/70 via-blue-50/40 to-slate-50 border-cyan-200',
      users: SCREENSHOT_SERVICE_USERS.slice(0, 5),
      roles: DEFAULT_SERVICE_ROLES,
    },
    {
      id: 'srv-enterprise-management',
      name: '企业管理',
      serviceType: 'authorized',
      version: '标准版',
      expireDate: '长期',
      userLimit: '无限制',
      tagMemberCount: 8,
      status: 'active',
      gradientClass: 'from-slate-50 via-gray-50 to-white border-gray-200',
      users: SCREENSHOT_SERVICE_USERS.slice(0, 4),
      roles: DEFAULT_SERVICE_ROLES,
    },
    {
      id: 'srv-vpp-client',
      name: '虚拟电厂',
      subTitle: '企业用户端',
      serviceType: 'authorized',
      version: '旗舰版',
      expireDate: '2027/12/31',
      userLimit: '10/20',
      tagMemberCount: 5,
      status: 'active',
      gradientClass: 'from-amber-50/60 via-orange-50/30 to-slate-50 border-amber-200',
      users: SCREENSHOT_SERVICE_USERS.slice(0, 6),
      roles: DEFAULT_SERVICE_ROLES,
    },
    {
      id: 'srv-zero-carbon-factory',
      name: '零碳工厂',
      serviceType: 'authorized',
      version: '专业版',
      expireDate: '长期',
      userLimit: '无限制',
      tagMemberCount: 3,
      status: 'active',
      gradientClass: 'from-green-50/60 via-emerald-50/30 to-slate-50 border-green-200',
      users: SCREENSHOT_SERVICE_USERS.slice(0, 3),
      roles: DEFAULT_SERVICE_ROLES,
    },
    {
      id: 'srv-vpp-aggregator',
      name: '虚拟电厂',
      subTitle: '聚合商端',
      serviceType: 'trial',
      version: '体验版',
      expireDate: '2026/10/31',
      userLimit: '2/5',
      tagMemberCount: 2,
      status: 'active',
      gradientClass: 'from-indigo-50/60 via-purple-50/30 to-slate-50 border-indigo-200',
      users: SCREENSHOT_SERVICE_USERS.slice(0, 2),
      roles: DEFAULT_SERVICE_ROLES,
    },
    {
      id: 'srv-smart-energy',
      name: '智慧能管',
      serviceType: 'authorized',
      version: '标准版',
      expireDate: '长期',
      userLimit: '无限制',
      tagMemberCount: 6,
      status: 'active',
      gradientClass: 'from-blue-50/60 via-sky-50/30 to-slate-50 border-blue-200',
      users: SCREENSHOT_SERVICE_USERS.slice(0, 4),
      roles: DEFAULT_SERVICE_ROLES,
    },
    {
      id: 'srv-carbon-management',
      name: '慧碳管理',
      serviceType: 'authorized',
      version: '标准版',
      expireDate: '长期',
      userLimit: '无限制',
      tagMemberCount: 4,
      status: 'active',
      gradientClass: 'from-teal-50/60 via-emerald-50/30 to-slate-50 border-teal-200',
      users: SCREENSHOT_SERVICE_USERS.slice(0, 3),
      roles: DEFAULT_SERVICE_ROLES,
    },
    {
      id: 'srv-station-monitoring',
      name: '电站监控',
      serviceType: 'authorized',
      version: '旗舰版',
      expireDate: '长期',
      userLimit: '无限制',
      tagMemberCount: 5,
      status: 'active',
      gradientClass: 'from-slate-50 via-zinc-50 to-white border-slate-200',
      users: SCREENSHOT_SERVICE_USERS.slice(0, 5),
      roles: DEFAULT_SERVICE_ROLES,
    },
  ];
}
