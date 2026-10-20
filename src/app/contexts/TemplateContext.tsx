import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ChannelType = 'web' | 'miniprogram' | 'sms' | 'inapp';
export type InternalChannelType = 'sms' | 'email' | 'wecom';
export type ServiceType = 'energy_management' | 'smart_microgrid' | 'virtual_power_plant' | 'all';
export type TemplateStatus = 'draft' | 'published' | 'archived';
export type TargetType = 'enterprise' | 'user';
export type TargetMode = 'role' | 'tag' | 'manual' | 'enterprise_user';
export type MessageCategory = 'user' | 'internal';

export const INTERNAL_CHANNEL_LABELS: Record<InternalChannelType, string> = {
  sms:   '短信',
  email: '邮件',
  wecom: '企业微信',
};

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  web: '网页端',
  miniprogram: '小程序订阅消息',
  sms: '短信',
  inapp: '站内信',
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  energy_management: '能源管理',
  smart_microgrid: '智能微网',
  virtual_power_plant: '虚拟电厂',
  all: '平台通知',
};

export const SERVICE_EVENTS: Record<ServiceType, { value: string; label: string }[]> = {
  energy_management: [
    { value: 'monthly_report',      label: '月度碳排放报告' },
    { value: 'emission_exceeded',   label: '碳排放超标告警' },
    { value: 'device_fault',        label: '设备故障通知' },
    { value: 'device_maintenance',  label: '设备维护提醒' },
    { value: 'green_cert_issued',   label: '绿电证书签发' },
    { value: 'quota_warning',       label: '碳配额不足预警' },
  ],
  smart_microgrid: [
    { value: 'load_balance',        label: '负载均衡触发' },
    { value: 'storage_abnormal',    label: '储能系统异常' },
    { value: 'pv_output_abnormal',  label: '光伏出力异常' },
    { value: 'microgrid_switch',    label: '微网模式切换' },
    { value: 'load_peak',           label: '负荷高峰预警' },
  ],
  virtual_power_plant: [
    { value: 'grid_load_alert',     label: '电网负荷预警' },
    { value: 'peak_shaving_invite', label: '削峰响应邀请' },
    { value: 'dispatch_command',    label: '调度指令下发' },
    { value: 'response_result',     label: '响应结果通知' },
    { value: 'subsidy_settlement',  label: '补贴结算通知' },
  ],
  all: [
    { value: 'account_created',     label: '账号开通通知' },
    { value: 'verify_code',         label: '验证码发送' },
    { value: 'system_announcement', label: '系统公告' },
    { value: 'password_reset',      label: '密码重置' },
    { value: 'login_alert',         label: '异地登录提醒' },
  ],
};

export const ENTERPRISE_ROLES: { id: string; name: string; service: ServiceType | 'global'; version: string }[] = [
  // 平台通用
  { id: 'role-g1', name: '超级管理员',         service: 'global',              version: '平台通用' },
  { id: 'role-g2', name: '平台管理员',         service: 'global',              version: '平台通用' },
  { id: 'role-g3', name: '企业管理员',         service: 'global',              version: '平台通用' },
  { id: 'role-g4', name: '只读访客',           service: 'global',              version: '平台通用' },
  // 能源管理 — 基础版
  { id: 'role-e1', name: '能源管理员',         service: 'energy_management',   version: '能源管理·基础版' },
  { id: 'role-e2', name: '碳资产总监',         service: 'energy_management',   version: '能源管理·基础版' },
  { id: 'role-e3', name: '运维工程师',         service: 'energy_management',   version: '能源管理·基础版' },
  // 能源管理 — 专业版
  { id: 'role-e4', name: '能源分析师',         service: 'energy_management',   version: '能源管理·专业版' },
  { id: 'role-e5', name: '碳交易专员',         service: 'energy_management',   version: '能源管理·专业版' },
  { id: 'role-e6', name: '碳配额审核员',       service: 'energy_management',   version: '能源管理·专业版' },
  // 能源管理 — 旗舰版
  { id: 'role-e7', name: '战略碳规划师',       service: 'energy_management',   version: '能源管理·旗舰版' },
  { id: 'role-e8', name: '绿电交易经理',       service: 'energy_management',   version: '能源管理·旗舰版' },
  // 智能微网 — 标准版
  { id: 'role-m1', name: '微网调度员',         service: 'smart_microgrid',     version: '智能微网·标准版' },
  { id: 'role-m2', name: '储能系统工程师',     service: 'smart_microgrid',     version: '智能微网·标准版' },
  { id: 'role-m3', name: '光伏运维员',         service: 'smart_microgrid',     version: '智能微网·标准版' },
  // 智能微网 — 高级版
  { id: 'role-m4', name: '微网安全员',         service: 'smart_microgrid',     version: '智能微网·高级版' },
  { id: 'role-m5', name: '拓扑规划工程师',     service: 'smart_microgrid',     version: '智能微网·高级版' },
  { id: 'role-m6', name: '需求侧响应专员',     service: 'smart_microgrid',     version: '智能微网·高级版' },
  // 虚拟电厂 — 标准版
  { id: 'role-v1', name: '虚拟电厂运营经理',   service: 'virtual_power_plant', version: '虚拟电厂·标准版' },
  { id: 'role-v2', name: '电网调度员',         service: 'virtual_power_plant', version: '虚拟电厂·标准版' },
  // 虚拟电厂 — 旗舰版
  { id: 'role-v3', name: '需求响应专员',       service: 'virtual_power_plant', version: '虚拟电厂·旗舰版' },
  { id: 'role-v4', name: '负荷预测工程师',     service: 'virtual_power_plant', version: '虚拟电厂·旗舰版' },
  { id: 'role-v5', name: '辅助服务交易员',     service: 'virtual_power_plant', version: '虚拟电厂·旗舰版' },
];

export interface EnterpriseUser {
  id: string;
  name: string;
  enterpriseId: string;
  role: string;
  phone: string;
  code?: string;
  dept?: string;
}

export const ENTERPRISE_USERS: EnterpriseUser[] = [
  // 华能集团 (ent-001)
  { id: 'u-001', name: '张伟',   enterpriseId: 'ent-001', role: '碳资产总监',       phone: '13800011001', code: 'HN-01', dept: '碳资产管理部' },
  { id: 'u-002', name: '李建国', enterpriseId: 'ent-001', role: '能源运维工程师',   phone: '13900011002', code: 'HN-02', dept: '电力运行部' },
  { id: 'u-001b', name: '孙志远', enterpriseId: 'ent-001', role: '微网调度员',     phone: '13800011003', code: 'HN-03', dept: '调度中心' },
  // 国家电网 (ent-002)
  { id: 'u-003', name: '王芳',   enterpriseId: 'ent-002', role: '电网调度员',       phone: '13700022001', code: 'SG-01', dept: '调度控制中心' },
  { id: 'u-004', name: '陈志远', enterpriseId: 'ent-002', role: '虚拟电厂运营经理', phone: '13600022002', code: 'SG-02', dept: '综合能源服务部' },
  { id: 'u-003b', name: '程刚',   enterpriseId: 'ent-002', role: '负荷预测工程师',   phone: '13800022003', code: 'SG-03', dept: '营销负荷中心' },
  // 宁德时代 (ent-003)
  { id: 'u-005', name: '刘洋',   enterpriseId: 'ent-003', role: '储能系统工程师',   phone: '13500033001', code: 'CATL-01', dept: '储能事业部' },
  { id: 'u-006', name: '赵敏',   enterpriseId: 'ent-003', role: '微网调度员',       phone: '13400033002', code: 'CATL-02', dept: '动力能源处' },
  { id: 'u-005b', name: '钱鑫',   enterpriseId: 'ent-003', role: '电池安全总监',     phone: '13800033003', code: 'CATL-03', dept: '安全运维部' },
  // 比亚迪能源 (ent-004)
  { id: 'u-007', name: '孙磊',   enterpriseId: 'ent-004', role: '能源管理员',       phone: '13300044001', code: 'BYD-01', dept: '十四部动力处' },
  { id: 'u-008', name: '周静',   enterpriseId: 'ent-004', role: '光伏运维员',       phone: '13200044002', code: 'BYD-02', dept: '绿色园区办' },
  { id: 'u-007b', name: '王磊',   enterpriseId: 'ent-004', role: '碳配额交易员',     phone: '13600044003', code: 'BYD-03', dept: '低碳战略部' },
  // 中广核集团 (ent-005)
  { id: 'u-009', name: '吴强',   enterpriseId: 'ent-005', role: '需求响应专员',     phone: '13100055001', code: 'CGN-01', dept: '新能源运营部' },
  { id: 'u-010', name: '郑华',   enterpriseId: 'ent-005', role: '负荷预测工程师',   phone: '13000555002', code: 'CGN-02', dept: '风光储运维中心' },
  { id: 'u-009b', name: '李春华', enterpriseId: 'ent-005', role: '安全合规专员',     phone: '13500055003', code: 'CGN-03', dept: '安全质量部' },
  // 三峡能源 (ent-006)
  { id: 'u-011', name: '冯磊',   enterpriseId: 'ent-006', role: '能源分析师',       phone: '18900066001', code: 'CTG-01', dept: '生产技术部' },
  { id: 'u-011b', name: '秦丽',   enterpriseId: 'ent-006', role: '水电调度专员',     phone: '13800066002', code: 'CTG-02', dept: '集控中心' },
  { id: 'u-011c', name: '赵明',   enterpriseId: 'ent-006', role: '风电场站值长',     phone: '13400066003', code: 'CTG-03', dept: '陆上新能源部' },
  // 隆基绿能 (ent-007)
  { id: 'u-012', name: '褚燕',   enterpriseId: 'ent-007', role: '碳交易专员',       phone: '18800077001', code: 'LONG-01', dept: 'ESG可持续发展部' },
  { id: 'u-012b', name: '许峰',   enterpriseId: 'ent-007', role: '光伏组件专家',     phone: '13900077002', code: 'LONG-02', dept: '电站技术中心' },
  // 阳光电源 (ent-008)
  { id: 'u-013', name: '卫东',   enterpriseId: 'ent-008', role: '运维工程师',       phone: '18700088001', code: 'SG-01', dept: '逆变器售后运维' },
  { id: 'u-013b', name: '方圆',   enterpriseId: 'ent-008', role: '储能系统架构师',   phone: '13800088002', code: 'SG-02', dept: '储能事业群' },
  // 天合光能 (ent-009)
  { id: 'u-014', name: '蒋晓',   enterpriseId: 'ent-009', role: '电网调度员',       phone: '18600099001', code: 'TS-01', dept: '智慧能源方案部' },
  { id: 'u-014b', name: '肖敏',   enterpriseId: 'ent-009', role: '微网现场值守员',   phone: '13900099002', code: 'TS-02', dept: '分布式能源部' },
  // 通威股份 (ent-010)
  { id: 'u-015', name: '沈浩',   enterpriseId: 'ent-010', role: '微网安全员',       phone: '18500100001', code: 'TW-01', dept: '能源动力保障部' },
  { id: 'u-015b', name: '金铭',   enterpriseId: 'ent-010', role: '光伏巡检技术员',   phone: '13700100002', code: 'TW-02', dept: '新能源工程部' },
  // 协鑫能科 (ent-011)
  { id: 'u-016', name: '谢燕',   enterpriseId: 'ent-011', role: '综合能源专员',     phone: '13900110001', code: 'GCL-01', dept: '移动能源事业部' },
  { id: 'u-016b', name: '罗辉',   enterpriseId: 'ent-011', role: '储能运维工程师',   phone: '13600110002', code: 'GCL-02', dept: '算力能源中心' },
  // 大唐新能源 (ent-012)
  { id: 'u-017', name: '吴洁',   enterpriseId: 'ent-012', role: '风电运维主管',     phone: '13900120001', code: 'DT-01', dept: '生产运维部' },
  { id: 'u-017b', name: '杜强',   enterpriseId: 'ent-012', role: '碳资产管理员',     phone: '13800120002', code: 'DT-02', dept: '发展规划部' },
  // 华电新能源 (ent-013)
  { id: 'u-018', name: '郑浩',   enterpriseId: 'ent-013', role: '清洁能源专员',     phone: '13700130001', code: 'HD-01', dept: '集控运营中心' },
  { id: 'u-018b', name: '梁伟',   enterpriseId: 'ent-013', role: '电力调度主管',     phone: '13600130002', code: 'HD-02', dept: '调度运行处' },
  // 国电投黄河 (ent-014)
  { id: 'u-019', name: '韩冰',   enterpriseId: 'ent-014', role: '水电运行值班长',   phone: '13600140001', code: 'SPIC-01', dept: '水光互补运行处' },
  { id: 'u-019b', name: '薛飞',   enterpriseId: 'ent-014', role: '光伏基地经理',     phone: '13500140002', code: 'SPIC-02', dept: '光伏产业创新部' },
  // 远景能源 (ent-015)
  { id: 'u-020', name: '陆强',   enterpriseId: 'ent-015', role: '智慧风场工程师',   phone: '13700150001', code: 'ENV-01', dept: '智能物联产品线' },
  { id: 'u-020b', name: '白雪',   enterpriseId: 'ent-015', role: '动力储能专家',     phone: '13600150002', code: 'ENV-02', dept: '零碳技术系统部' },
  // 金风科技 (ent-016)
  { id: 'u-021', name: '杨光',   enterpriseId: 'ent-016', role: '风机健康监测师',   phone: '13500160001', code: 'GW-01', dept: '智慧服务软件所' },
  { id: 'u-021b', name: '尹莉',   enterpriseId: 'ent-016', role: '场站综合值长',     phone: '13700160002', code: 'GW-02', dept: '全球运维中心' },
  // 明阳智能 (ent-017)
  { id: 'u-022', name: '朱强',   enterpriseId: 'ent-017', role: '海上风电工程师',   phone: '13400170001', code: 'MY-01', dept: '海上运维保障处' },
  { id: 'u-022b', name: '毛俊',   enterpriseId: 'ent-017', role: '风能调度专员',     phone: '13500170002', code: 'MY-02', dept: '大数据监控中心' },
  // 晶科能源 (ent-018)
  { id: 'u-023', name: '何雨',   enterpriseId: 'ent-018', role: '组件效率工程师',   phone: '13700180001', code: 'JK-01', dept: '技术支持服务部' },
  { id: 'u-023b', name: '范磊',   enterpriseId: 'ent-018', role: '电站运维技术员',   phone: '13500180002', code: 'JK-02', dept: '系统解决方案部' },
  // 亿纬锂能 (ent-019)
  { id: 'u-024', name: '曹阳',   enterpriseId: 'ent-019', role: '锂电储能测试员',   phone: '13600190001', code: 'EVE-01', dept: '储能电池研究院' },
  { id: 'u-024b', name: '康健',   enterpriseId: 'ent-019', role: 'BMS电气工程师',    phone: '13800190002', code: 'EVE-02', dept: '系统控制开发部' },
  // 比亚迪储能 (ent-020)
  { id: 'u-025', name: '王鑫',   enterpriseId: 'ent-020', role: '储能集装箱站长',   phone: '13400200001', code: 'BESS-01', dept: '电网级储能项目部' },
  { id: 'u-025b', name: '孟轩',   enterpriseId: 'ent-020', role: 'PACK电气主管',     phone: '13900200002', code: 'BESS-02', dept: '储能制造二部' },
  // 南方电网 (ent-021)
  { id: 'u-026', name: '邓华',   enterpriseId: 'ent-021', role: '配网调度员',       phone: '13900210001', code: 'CSG-01', dept: '电力调度控制中心' },
  { id: 'u-026b', name: '崔鹏',   enterpriseId: 'ent-021', role: '需求响应调度专家', phone: '13900210002', code: 'CSG-02', dept: '负荷管理中心' },
  // 国家能源集团 (ent-022)
  { id: 'u-027', name: '褚磊',   enterpriseId: 'ent-022', role: '灵活性调峰主管',   phone: '13500220001', code: 'CE-01', dept: '火电机组运行部' },
  { id: 'u-027b', name: '易峰',   enterpriseId: 'ent-022', role: '综合能源总监',     phone: '13800220002', code: 'CE-02', dept: '低碳清洁技术院' },
  // 华润电力 (ent-023)
  { id: 'u-028', name: '石勇',   enterpriseId: 'ent-023', role: '火电机组协调员',   phone: '13500230001', code: 'CRP-01', dept: '生产协同调度部' },
  { id: 'u-028b', name: '谭亮',   enterpriseId: 'ent-023', role: '碳交易主管',       phone: '13700230002', code: 'CRP-02', dept: '碳资产运营部' },
  // 中节能集团 (ent-024)
  { id: 'u-029', name: '冯燕',   enterpriseId: 'ent-024', role: '节能服务经理',     phone: '13600240001', code: 'CECEP-01', dept: '绿色发展咨询部' },
  { id: 'u-029b', name: '洪波',   enterpriseId: 'ent-024', role: '碳中和规划师',     phone: '13800240002', code: 'CECEP-02', dept: '低碳城市服务部' },
  // 新奥能源 (ent-025)
  { id: 'u-030', name: '姜伟',   enterpriseId: 'ent-025', role: '泛能网运营经理',   phone: '13800250001', code: 'ENN-01', dept: '数智能源服务部' },
  { id: 'u-030b', name: '汪洋',   enterpriseId: 'ent-025', role: '分布式能源工程师', phone: '13900250002', code: 'ENN-02', dept: '技术运行保障处' },
];

export interface TagMember { id: string; name: string; dept: string; phone: string; email: string }
export interface TagGroup  { id: string; name: string; count: number; description: string; members: TagMember[] }

export const TAG_GROUPS: TagGroup[] = [
  { id: 'tag-001', name: '高层管理者', count: 128, description: '各企业 CEO、总经理、副总裁等决策层', members: [
    { id: 'tm-001-1', name: '刘建国', dept: '华能集团',   phone: '138****0001', email: 'liu@huaneng.com' },
    { id: 'tm-001-2', name: '张凯',   dept: '国家电网',   phone: '139****0002', email: 'zhang@sgcc.com' },
    { id: 'tm-001-3', name: '陈伟',   dept: '宁德时代',   phone: '137****0003', email: 'chen@catl.com' },
    { id: 'tm-001-4', name: '王磊',   dept: '比亚迪能源', phone: '136****0004', email: 'wang@byd.com' },
    { id: 'tm-001-5', name: '李春华', dept: '中广核集团', phone: '135****0005', email: 'li@cgnpc.com' },
    { id: 'tm-001-6', name: '赵明',   dept: '三峡能源',   phone: '134****0006', email: 'zhao@ctgne.com' },
  ]},
  { id: 'tag-002', name: '碳资产负责人', count: 84, description: '负责碳配额交易与碳资产管理的核心人员', members: [
    { id: 'tm-002-1', name: '孙志远', dept: '华能集团',   phone: '138****1001', email: 'sun@huaneng.com' },
    { id: 'tm-002-2', name: '吴洁',   dept: '大唐新能源', phone: '139****1002', email: 'wu@datang.com' },
    { id: 'tm-002-3', name: '郑浩',   dept: '华电新能源', phone: '137****1003', email: 'zheng@chd.com' },
    { id: 'tm-002-4', name: '冯燕',   dept: '中节能集团', phone: '136****1004', email: 'feng@cecep.cn' },
    { id: 'tm-002-5', name: '褚磊',   dept: '国家能源集团', phone: '135****1005', email: 'chu@chnenergy.com' },
  ]},
  { id: 'tag-003', name: '运维技术团队', count: 256, description: '设备运维工程师及现场技术人员', members: [
    { id: 'tm-003-1', name: '卫东',   dept: '阳光电源',   phone: '138****2001', email: 'wei@sungrow.cn' },
    { id: 'tm-003-2', name: '蒋晓',   dept: '天合光能',   phone: '139****2002', email: 'jiang@trinasolar.com' },
    { id: 'tm-003-3', name: '沈浩',   dept: '通威股份',   phone: '137****2003', email: 'shen@tongwei.com' },
    { id: 'tm-003-4', name: '韩冰',   dept: '远景能源',   phone: '136****2004', email: 'han@envision.cn' },
    { id: 'tm-003-5', name: '杨光',   dept: '金风科技',   phone: '135****2005', email: 'yang@goldwind.com' },
    { id: 'tm-003-6', name: '朱强',   dept: '明阳智能',   phone: '134****2006', email: 'zhu@myse.com.cn' },
  ]},
  { id: 'tag-004', name: '能源分析师群', count: 63, description: '从事能源数据建模与分析的专业人员', members: [
    { id: 'tm-004-1', name: '秦丽',   dept: '三峡能源',   phone: '138****3001', email: 'qin@ctgne.com' },
    { id: 'tm-004-2', name: '许峰',   dept: '隆基绿能',   phone: '139****3002', email: 'xu@longi.com' },
    { id: 'tm-004-3', name: '何雨',   dept: '晶科能源',   phone: '137****3003', email: 'he@jinkosolar.com' },
    { id: 'tm-004-4', name: '曹阳',   dept: '亿纬锂能',   phone: '136****3004', email: 'cao@evebattery.com' },
  ]},
  { id: 'tag-005', name: '电网调度员组', count: 45, description: '参与电网削峰填谷响应的调度人员', members: [
    { id: 'tm-005-1', name: '程刚',   dept: '国家电网',   phone: '138****4001', email: 'cheng@sgcc.com' },
    { id: 'tm-005-2', name: '邓华',   dept: '南方电网',   phone: '139****4002', email: 'deng@csg.cn' },
    { id: 'tm-005-3', name: '叶涛',   dept: '国家电网',   phone: '137****4003', email: 'ye@sgcc.com' },
    { id: 'tm-005-4', name: '方明',   dept: '中广核集团', phone: '136****4004', email: 'fang@cgnpc.com' },
    { id: 'tm-005-5', name: '石勇',   dept: '华润电力',   phone: '135****4005', email: 'shi@crpower.com' },
  ]},
  { id: 'tag-006', name: '储能系统团队', count: 37, description: '储能设备运营与健康监测团队', members: [
    { id: 'tm-006-1', name: '钱鑫',   dept: '宁德时代',   phone: '138****5001', email: 'qian@catl.com' },
    { id: 'tm-006-2', name: '孟轩',   dept: '比亚迪储能', phone: '139****5002', email: 'meng@byd.com' },
    { id: 'tm-006-3', name: '尹莉',   dept: '亿纬锂能',   phone: '137****5003', email: 'yin@evebattery.com' },
    { id: 'tm-006-4', name: '罗辉',   dept: '协鑫能科',   phone: '136****5004', email: 'luo@gcl.com' },
  ]},
  { id: 'tag-007', name: '新入驻企业用户', count: 312, description: '近 30 天内完成账号开通的企业用户', members: [
    { id: 'tm-007-1', name: '姜伟',   dept: '新奥能源',   phone: '138****6001', email: 'jiang@enn.cn' },
    { id: 'tm-007-2', name: '谢燕',   dept: '协鑫能科',   phone: '139****6002', email: 'xie@gcl.com' },
    { id: 'tm-007-3', name: '陆强',   dept: '华润电力',   phone: '137****6003', email: 'lu@crpower.com' },
    { id: 'tm-007-4', name: '白雪',   dept: '明阳智能',   phone: '136****6004', email: 'bai@myse.com.cn' },
    { id: 'tm-007-5', name: '范磊',   dept: '晶科能源',   phone: '135****6005', email: 'fan@jinkosolar.com' },
  ]},
  { id: 'tag-008', name: '响应积极企业', count: 89, description: '历史削峰响应完成率 ≥80% 的企业联系人', members: [
    { id: 'tm-008-1', name: '侯杰',   dept: '国家电网',   phone: '138****7001', email: 'hou@sgcc.com' },
    { id: 'tm-008-2', name: '崔鹏',   dept: '南方电网',   phone: '139****7002', email: 'cui@csg.cn' },
    { id: 'tm-008-3', name: '龚涛',   dept: '华能集团',   phone: '137****7003', email: 'gong@huaneng.com' },
    { id: 'tm-008-4', name: '廖静',   dept: '中广核集团', phone: '136****7004', email: 'liao@cgnpc.com' },
    { id: 'tm-008-5', name: '潘浩',   dept: '三峡能源',   phone: '135****7005', email: 'pan@ctgne.com' },
  ]},
];

export const ENTERPRISES = [
  { id: 'ent-001', name: '华能集团' },
  { id: 'ent-002', name: '国家电网' },
  { id: 'ent-003', name: '宁德时代' },
  { id: 'ent-004', name: '比亚迪能源' },
  { id: 'ent-005', name: '中广核集团' },
  { id: 'ent-006', name: '三峡能源' },
  { id: 'ent-007', name: '隆基绿能' },
  { id: 'ent-008', name: '阳光电源' },
  { id: 'ent-009', name: '天合光能' },
  { id: 'ent-010', name: '通威股份' },
  { id: 'ent-011', name: '协鑫能科' },
  { id: 'ent-012', name: '大唐新能源' },
  { id: 'ent-013', name: '华电新能源' },
  { id: 'ent-014', name: '国电投黄河' },
  { id: 'ent-015', name: '远景能源' },
  { id: 'ent-016', name: '金风科技' },
  { id: 'ent-017', name: '明阳智能' },
  { id: 'ent-018', name: '晶科能源' },
  { id: 'ent-019', name: '亿纬锂能' },
  { id: 'ent-020', name: '比亚迪储能' },
  { id: 'ent-021', name: '南方电网' },
  { id: 'ent-022', name: '国家能源集团' },
  { id: 'ent-023', name: '华润电力' },
  { id: 'ent-024', name: '中节能集团' },
  { id: 'ent-025', name: '新奥能源' },
];

export interface ManualUser {
  id: string;
  name: string;
  phone: string;
  code: string;     // user code e.g. USR-0042
  enterprise: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  enabled: boolean;
  messageCategory: MessageCategory;    // 'user' | 'internal'
  // ── user push fields ──
  channels: ChannelType[];
  targetEnterprises: string[];         // enterprise ids, empty = all
  targetMode: TargetMode;
  targetRoles: string[];
  selectedEnterpriseUserId?: string;   // for targetMode='enterprise_user'
  selectedEnterpriseUserIds?: string[]; // for targetMode='enterprise_user' (跨企业多选)
  mpTemplateId?: string;               // 微信小程序订阅消息模板ID (e.g. WX_SUB_xxx)
  mpPagePath?: string;                 // 小程序跳转页面路径 (e.g. pages/index/index)
  // ── internal push fields ──
  internalChannel: InternalChannelType; // single-select: sms | email
  targetTagMembers: Record<string, string[]>; // tagId → memberIds (empty = all)
  // ── shared ──
  targetTags: string[];
  manualUsers: ManualUser[];     // for targetMode='manual'
  serviceType: ServiceType;
  status: TemplateStatus;
  title: string;
  content: string;
  smsCode: string;
  webhookUrl?: string;
  eventType: string;
  pushTimeStart: string;
  pushTimeEnd: string;
  dailyLimit: number;
  variables: string[];
  operator: string;
  createdAt: Date;
  updatedAt: Date;
  sendCount: number;
}

interface TemplateContextType {
  templates: MessageTemplate[];
  addTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'sendCount'>) => void;
  updateTemplate: (id: string, template: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => MessageTemplate | undefined;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

const mockTemplates: MessageTemplate[] = [
  {
    id: 'TPL-001',
    name: '电网异常预警通知',
    enabled: true,
    messageCategory: 'user',
    channels: ['inapp'],
    internalChannel: 'sms',
    targetTagMembers: {},
    serviceType: 'virtual_power_plant',
    targetEnterprises: ['ent-002', 'ent-021'],
    targetMode: 'role',
    targetRoles: ['role-v2', 'role-v1'],
    targetTags: [],
    manualUsers: [],
    status: 'published',
    title: '电网负荷异常预警',
    content: '【零碳平台】{{enterpriseName}} 虚拟电厂检测到电网负荷异常。当前负荷：{{currentLoad}} MW，超出阈值 {{threshold}} MW。请立即处理。时间：{{alertTime}}。',
    smsCode: '',
    eventType: 'grid_load_alert', pushTimeStart: '08:00', pushTimeEnd: '22:00', dailyLimit: 0,
    variables: ['enterpriseName', 'currentLoad', 'threshold', 'alertTime'],
    operator: '张磊',
    createdAt: new Date('2026-05-10'),
    updatedAt: new Date('2026-06-28'),
    sendCount: 1284,
  },
  {
    id: 'TPL-002',
    name: '月度碳排放报告',
    enabled: true,
    messageCategory: 'user',
    channels: ['inapp'],
    internalChannel: 'sms',
    targetTagMembers: {},
    serviceType: 'energy_management',
    targetEnterprises: [],
    targetMode: 'role',
    targetRoles: ['role-e2', 'role-e1'],
    targetTags: [],
    manualUsers: [],
    status: 'published',
    title: '{{month}} 月度碳排放分析报告',
    content: '尊敬的 {{contactName}}：\n\n{{enterpriseName}} {{month}} 月度碳排放分析报告已生成。\n\n- 本月总碳排放：{{totalEmission}} 吨 CO₂\n- 较上月变化：{{emissionChange}}\n- 碳减排完成率：{{reductionRate}}%\n- 绿电使用占比：{{greenEnergyRatio}}%\n\n请登录零碳平台查看完整报告。',
    smsCode: '',
    eventType: 'monthly_report', pushTimeStart: '08:00', pushTimeEnd: '18:00', dailyLimit: 5,
    variables: ['contactName', 'enterpriseName', 'month', 'totalEmission', 'emissionChange', 'reductionRate', 'greenEnergyRatio'],
    operator: '陈静',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-06-01'),
    sendCount: 542,
  },
  {
    id: 'TPL-003',
    name: '微网负载均衡提醒',
    enabled: true,
    messageCategory: 'user',
    channels: ['sms'],
    internalChannel: 'sms',
    targetTagMembers: {},
    serviceType: 'smart_microgrid',
    targetEnterprises: ['ent-003', 'ent-019'],
    targetMode: 'tag',
    targetRoles: [],
    targetTags: ['tag-003', 'tag-006'],
    manualUsers: [],
    status: 'published',
    title: '智能微网负载均衡提醒',
    content: '【智能微网】{{gridName}} 微网当前负载率达 {{loadRate}}%，系统已自动启动负载均衡策略。储能状态：{{storageStatus}}，光伏出力：{{pvOutput}} kW，预计恢复：{{estimatedTime}}。',
    smsCode: 'SMS_MICROGRID_BALANCE',
    eventType: 'load_balance', pushTimeStart: '', pushTimeEnd: '', dailyLimit: 0,
    variables: ['gridName', 'loadRate', 'storageStatus', 'pvOutput', 'estimatedTime'],
    operator: '王浩',
    createdAt: new Date('2026-03-15'),
    updatedAt: new Date('2026-06-20'),
    sendCount: 876,
  },
  {
    id: 'TPL-004',
    name: '验证码短信',
    enabled: true,
    messageCategory: 'user',
    channels: ['sms'],
    internalChannel: 'sms',
    targetTagMembers: {},
    serviceType: 'all',
    targetEnterprises: [],
    targetMode: 'role',
    targetRoles: [],
    targetTags: [],
    manualUsers: [],
    status: 'published',
    title: '',
    content: '【零碳科技】您的验证码是 {{code}}，{{minutes}} 分钟内有效，请勿泄露给他人。',
    smsCode: 'SMS_VERIFY_CODE',
    eventType: 'verify_code', pushTimeStart: '', pushTimeEnd: '', dailyLimit: 0,
    variables: ['code', 'minutes'],
    operator: '系统',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-06-10'),
    sendCount: 9820,
  },
  {
    id: 'TPL-005',
    name: '设备维护通知',
    enabled: false,
    messageCategory: 'user',
    channels: ['sms'],
    internalChannel: 'sms',
    targetTagMembers: {},
    serviceType: 'energy_management',
    targetEnterprises: ['ent-004', 'ent-020'],
    targetMode: 'enterprise_user',
    targetRoles: [],
    selectedEnterpriseUserId: 'u-007',
    selectedEnterpriseUserIds: ['u-007', 'u-025'],
    targetTags: [],
    manualUsers: [],
    status: 'published',
    title: '',
    content: '【零碳平台】{{deviceName}}（编号 {{deviceId}}）将于 {{maintenanceTime}} 进行定期维护，预计 {{duration}} 小时，请提前做好准备。负责人：{{engineerName}}。',
    smsCode: 'SMS_DEVICE_MAINTENANCE',
    eventType: 'device_maintenance', pushTimeStart: '09:00', pushTimeEnd: '18:00', dailyLimit: 3,
    variables: ['deviceName', 'deviceId', 'maintenanceTime', 'duration', 'engineerName'],
    operator: '刘洋',
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-05-30'),
    sendCount: 198,
  },
  {
    id: 'TPL-006',
    name: '削峰响应邀请',
    enabled: true,
    messageCategory: 'user',
    channels: ['inapp'],
    internalChannel: 'sms',
    targetTagMembers: {},
    serviceType: 'virtual_power_plant',
    targetEnterprises: [],
    targetMode: 'tag',
    targetRoles: [],
    targetTags: ['tag-005', 'tag-008'],
    manualUsers: [],
    status: 'draft',
    title: '用电高峰削峰响应请求',
    content: '【虚拟电厂】系统预测 {{peakTime}} 将出现用电高峰。响应需求：{{responseRequest}} MW，时段：{{startTime}}—{{endTime}}，补贴：{{subsidy}} 元/kWh。请尽快确认参与。',
    smsCode: '',
    eventType: 'peak_shaving_invite', pushTimeStart: '', pushTimeEnd: '', dailyLimit: 0,
    variables: ['peakTime', 'responseRequest', 'startTime', 'endTime', 'subsidy'],
    operator: '赵磊',
    createdAt: new Date('2026-06-10'),
    updatedAt: new Date('2026-06-29'),
    sendCount: 0,
  },
  {
    id: 'TPL-007',
    name: '账号开通通知',
    enabled: true,
    messageCategory: 'user',
    channels: ['sms'],
    internalChannel: 'sms',
    targetTagMembers: {},
    serviceType: 'all',
    targetEnterprises: [],
    targetMode: 'role',
    targetRoles: [],
    targetTags: [],
    manualUsers: [],
    status: 'published',
    title: '',
    content: '【零碳科技】您的零碳管理平台账号已开通，企业：{{enterpriseName}}，初始密码：{{password}}，请及时登录修改密码。',
    smsCode: 'SMS_ACCOUNT_CREATED',
    eventType: 'account_created', pushTimeStart: '', pushTimeEnd: '', dailyLimit: 0,
    variables: ['enterpriseName', 'password'],
    operator: '系统',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-06-05'),
    sendCount: 312,
  },
  {
    id: 'TPL-008',
    name: '运维团队周报邮件',
    enabled: true,
    messageCategory: 'internal',
    channels: ['inapp'],
    internalChannel: 'email',
    targetTagMembers: { 'tag-003': ['tm-003-1', 'tm-003-2', 'tm-003-4'] },
    serviceType: 'energy_management',
    targetEnterprises: [],
    targetMode: 'tag',
    targetRoles: [],
    targetTags: ['tag-003'],
    manualUsers: [],
    status: 'published',
    title: '{{week}} 运维工作周报',
    content: '各位运维同事：\n\n本周（{{weekRange}}）运维工作摘要如下：\n\n- 处理设备告警：{{alertCount}} 次\n- 完成维护任务：{{maintenanceCount}} 项\n- 平均响应时长：{{avgResponseTime}} 分钟\n\n请查阅附件了解详情，如有问题请及时反馈。\n\n零碳运营中心',
    smsCode: '',
    eventType: 'device_maintenance',
    pushTimeStart: '09:00', pushTimeEnd: '18:00', dailyLimit: 1,
    variables: ['week', 'weekRange', 'alertCount', 'maintenanceCount', 'avgResponseTime'],
    operator: '陈静',
    createdAt: new Date('2026-06-15'),
    updatedAt: new Date('2026-07-10'),
    sendCount: 4,
  },
  {
    id: 'TPL-009',
    name: '能耗超标企微预警通知',
    enabled: true,
    messageCategory: 'internal',
    channels: [],
    internalChannel: 'wecom',
    targetTagMembers: {},
    serviceType: 'energy_management',
    targetEnterprises: [],
    targetMode: 'tag',
    targetRoles: [],
    targetTags: ['tag-001'],
    manualUsers: [],
    status: 'published',
    title: '',
    webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=9b823e41-6cd7-4bb9-8231-8971f112e431',
    content: '【能耗异动预警】监测对象：{{facilityName}}，当前实时用电负荷为 {{currentLoad}} kW（超出额定阈值 {{exceedLoad}} kW），告警时间：{{alertTime}}。请运维人员及值班班长及时进行负荷排查与调控！',
    smsCode: '',
    eventType: 'emission_exceeded',
    pushTimeStart: '08:00',
    pushTimeEnd: '22:00',
    dailyLimit: 20,
    variables: ['facilityName', 'currentLoad', 'exceedLoad', 'alertTime'],
    operator: '李敏',
    createdAt: new Date('2026-06-18'),
    updatedAt: new Date('2026-07-02'),
    sendCount: 382,
  },
  {
    id: 'TPL-010',
    name: '能耗超标微信小程序订阅提醒',
    enabled: true,
    messageCategory: 'user',
    channels: ['miniprogram'],
    internalChannel: 'sms',
    targetTagMembers: {},
    serviceType: 'energy_management',
    targetEnterprises: ['ent-001', 'ent-003'],
    targetMode: 'role',
    targetRoles: ['role-e1', 'role-e2'],
    targetTags: [],
    manualUsers: [],
    status: 'published',
    title: '',
    content: '【能耗告警订阅】\n告警企业：{{enterpriseName}}\n用能指标：{{metricName}}\n超标数值：{{currentValue}} kWh（超标 {{exceedRatio}}%）\n预警时间：{{alertTime}}\n请及时进入小程序核实并处理。',
    smsCode: '',
    mpTemplateId: 'WX_SUB_ENERGY_ALARM',
    mpPagePath: 'pages/energy/alert-detail?id={{alertId}}',
    eventType: 'emission_exceeded',
    pushTimeStart: '08:00',
    pushTimeEnd: '22:00',
    dailyLimit: 10,
    variables: ['enterpriseName', 'metricName', 'currentValue', 'exceedRatio', 'alertTime', 'alertId'],
    operator: '张伟',
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-07-01'),
    sendCount: 426,
  },
];

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(mockTemplates);

  const addTemplate = (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'sendCount'>) => {
    const newTemplate: MessageTemplate = {
      ...template,
      id: Date.now().toString(),
      sendCount: 0,
      operator: template.operator || '当前用户',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTemplates((prev) => [newTemplate, ...prev]);
  };

  const updateTemplate = (id: string, updatedData: Partial<MessageTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedData, updatedAt: new Date() } : t))
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const getTemplateById = (id: string) => templates.find((t) => t.id === id);

  return (
    <TemplateContext.Provider value={{ templates, addTemplate, updateTemplate, deleteTemplate, getTemplateById }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplateContext);
  if (!context) throw new Error('useTemplates must be used within a TemplateProvider');
  return context;
}

