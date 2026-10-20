export interface EnterpriseUserRecord {
  id: string;
  userCode: string; // e.g. "UE00015622"
  name: string; // e.g. "孙乾"
  tag: string; // e.g. "微网管理组", "研发人员", or ""
  employeeCode: string; // e.g. "EMP001" or ""
  phone: string; // e.g. "13259458633"
  email: string; // e.g. "sunqian@huajing.com" or ""
  status: 'normal' | 'disabled'; // "正常" | "停用"
  createdAt: string; // e.g. "2026/06/26"
  enterpriseId: string;
}

// 10 exact users from the user's uploaded screenshot
export const SCREENSHOT_USERS_DATA: EnterpriseUserRecord[] = [
  {
    id: 'usr-1',
    userCode: 'UE00015622',
    name: '孙乾',
    tag: '微网管理组',
    employeeCode: '',
    phone: '13259458633',
    email: '',
    status: 'normal',
    createdAt: '2026/06/26',
    enterpriseId: 'ent-1',
  },
  {
    id: 'usr-2',
    userCode: 'UE00043914',
    name: '薛易立',
    tag: '微网管理组',
    employeeCode: '',
    phone: '15006118608',
    email: '',
    status: 'normal',
    createdAt: '2026/06/26',
    enterpriseId: 'ent-1',
  },
  {
    id: 'usr-3',
    userCode: 'UE00010877',
    name: '崔阳',
    tag: '微网管理组',
    employeeCode: '',
    phone: '15151989936',
    email: '',
    status: 'normal',
    createdAt: '2026/06/26',
    enterpriseId: 'ent-1',
  },
  {
    id: 'usr-4',
    userCode: 'UE00007441',
    name: '葛有功',
    tag: '微网管理组',
    employeeCode: '',
    phone: '18601701471',
    email: '',
    status: 'normal',
    createdAt: '2026/06/26',
    enterpriseId: 'ent-1',
  },
  {
    id: 'usr-5',
    userCode: 'UE00010974',
    name: '王晨',
    tag: '微网管理组',
    employeeCode: '',
    phone: '18762651122',
    email: '',
    status: 'normal',
    createdAt: '2026/06/26',
    enterpriseId: 'ent-1',
  },
  {
    id: 'usr-6',
    userCode: 'UE00144116',
    name: '余祚标',
    tag: '微网管理组',
    employeeCode: '',
    phone: '16651114005',
    email: '',
    status: 'normal',
    createdAt: '2026/06/26',
    enterpriseId: 'ent-1',
  },
  {
    id: 'usr-7',
    userCode: 'UE00150774',
    name: '贺文有',
    tag: '',
    employeeCode: '',
    phone: '13338707018',
    email: '',
    status: 'normal',
    createdAt: '2026/06/28',
    enterpriseId: 'ent-1',
  },
  {
    id: 'usr-8',
    userCode: 'UE00150873',
    name: '蒋琛',
    tag: '',
    employeeCode: '',
    phone: '18717869673',
    email: '',
    status: 'normal',
    createdAt: '2026/06/29',
    enterpriseId: 'ent-1',
  },
  {
    id: 'usr-9',
    userCode: 'UE00150905',
    name: '卞铁铮',
    tag: '',
    employeeCode: '',
    phone: '13775630372',
    email: '',
    status: 'normal',
    createdAt: '2026/06/29',
    enterpriseId: 'ent-1',
  },
  {
    id: 'usr-10',
    userCode: 'UE00014058',
    name: '张思淇',
    tag: '研发人员',
    employeeCode: '',
    phone: '18217447032',
    email: '',
    status: 'normal',
    createdAt: '2026/07/16',
    enterpriseId: 'ent-1',
  },
];

// Helper to get or generate realistic users for an enterprise
export function getEnterpriseUsers(enterpriseId: string, enterpriseName?: string): EnterpriseUserRecord[] {
  if (enterpriseId === 'ent-1') {
    return SCREENSHOT_USERS_DATA;
  }

  // Generate realistic users for other enterprises
  const defaultNames = ['李建国', '张立峰', '刘海霞', '赵强', '陈伟', '周宏', '吴敏', '徐超'];
  const defaultTags = ['微网管理组', '运行值守组', '设备维护组', '调度分析员', '研发人员', ''];
  const baseNum = Math.abs(enterpriseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000));

  return defaultNames.slice(0, 6).map((name, idx) => {
    const codeNum = (baseNum + idx * 137) % 90000 + 10000;
    const phoneMid = (baseNum + idx * 79) % 9000 + 1000;
    const phoneTail = (baseNum + idx * 113) % 9000 + 1000;

    return {
      id: `usr-${enterpriseId}-${idx + 1}`,
      userCode: `UE000${codeNum}`,
      name,
      tag: defaultTags[idx % defaultTags.length],
      employeeCode: idx % 2 === 0 ? `EMP-${100 + idx}` : '',
      phone: `138${phoneMid}${phoneTail.toString().slice(0, 4)}`,
      email: idx % 3 === 0 ? `user${idx + 1}@${enterpriseId}.com` : '',
      status: 'normal',
      createdAt: `2026/06/${20 + idx}`,
      enterpriseId,
    };
  });
}
