import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Search,
  Upload,
  Building2,
  Trash2,
  Navigation,
  Check,
  Globe2,
  Users,
  Headset,
  QrCode,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { EnterpriseItem } from '../../data/mockEnterprises';
import { CHINA_REGIONS } from '../../data/regions';
import { getCoordinates } from '../../data/geoCoordinates';
import { toast } from 'sonner';

export interface EnterpriseFormData {
  id?: string;
  code?: string;
  fullName: string;
  shortName: string;
  enterpriseType: string;
  industry: string;
  unifiedSocialCreditCode: string;
  customerSource: string;
  createdBy?: string;
  province: string;
  city: string;
  district: string;
  address: string;
  lng: number;
  lat: number;
  contactName: string;
  contactPhone: string;
  logoUrl?: string;
  cloudButlerName?: string;
  cloudButlerPhone?: string;
  cloudButlerWeChatQr?: string;
}

interface EnterpriseEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enterprise: EnterpriseItem | null;
  onSave: (data: EnterpriseFormData) => void;
}

export function EnterpriseEditModal({
  open,
  onOpenChange,
  enterprise,
  onSave,
}: EnterpriseEditModalProps) {
  const isEdit = Boolean(enterprise);

  // Form State matching the fields from user's requirements
  const [formData, setFormData] = useState<EnterpriseFormData>({
    fullName: '',
    shortName: '',
    enterpriseType: '企业',
    industry: '制造业',
    unifiedSocialCreditCode: '',
    customerSource: '天合储能用户',
    createdBy: '张建军 (运营专员)',
    province: '河南省',
    city: '郑州市',
    district: '荥阳市',
    address: '河南省郑州市荥阳市郑州华晶金刚石股份有限公司',
    lng: 113.363171,
    lat: 34.81162,
    contactName: '',
    contactPhone: '',
    logoUrl: '',
    cloudButlerName: '',
    cloudButlerPhone: '',
    cloudButlerWeChatQr: '',
  });

  const [addressSearchKeyword, setAddressSearchKeyword] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wechatQrInputRef = useRef<HTMLInputElement | null>(null);

  // Mini Map references
  const miniMapContainerRef = useRef<HTMLDivElement | null>(null);
  const miniMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize or populate form when modal opens or enterprise changes
  useEffect(() => {
    if (!open) return;

    if (enterprise) {
      const defaultCoord = getCoordinates(
        enterprise.province || '河南省',
        enterprise.city || '郑州市',
        enterprise.district || '荥阳市'
      );
      setFormData({
        id: enterprise.id,
        code: enterprise.code,
        fullName: enterprise.fullName || '',
        shortName: enterprise.shortName || '',
        enterpriseType: enterprise.enterpriseType || '企业',
        industry: enterprise.industry || '制造业',
        unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode || '',
        customerSource: enterprise.customerSource || '天合储能用户',
        createdBy: enterprise.createdBy || '张建军 (运营专员)',
        province: enterprise.province || '河南省',
        city: enterprise.city || '郑州市',
        district: enterprise.district || '荥阳市',
        address:
          enterprise.address ||
          `${enterprise.province} ${enterprise.city} ${enterprise.district} ${enterprise.fullName}`,
        lng: enterprise.lng || defaultCoord.lng,
        lat: enterprise.lat || defaultCoord.lat,
        contactName: enterprise.contactName || '',
        contactPhone: enterprise.contactPhone || '',
        logoUrl: enterprise.logoUrl || '',
        cloudButlerName: enterprise.cloudButlerName || '',
        cloudButlerPhone: enterprise.cloudButlerPhone || '',
        cloudButlerWeChatQr: enterprise.cloudButlerWeChatQr || '',
      });
      setAddressSearchKeyword('');
    } else {
      // New Enterprise defaults
      const defaultCoord = getCoordinates('河南省', '郑州市', '荥阳市');
      setFormData({
        fullName: '',
        shortName: '',
        enterpriseType: '企业',
        industry: '制造业',
        unifiedSocialCreditCode: '',
        customerSource: '天合储能用户',
        createdBy: '当前管理员 (运营专员)',
        province: '河南省',
        city: '郑州市',
        district: '荥阳市',
        address: '河南省郑州市荥阳市工业园区',
        lng: 113.363171,
        lat: 34.81162,
        contactName: '',
        contactPhone: '',
        logoUrl: '',
        cloudButlerName: '',
        cloudButlerPhone: '',
        cloudButlerWeChatQr: '',
      });
      setAddressSearchKeyword('');
    }
  }, [open, enterprise]);

  // Province / City / District cascading nodes
  const currentProvinceNode = useMemo(() => {
    return CHINA_REGIONS.find((p) => p.name === formData.province) || CHINA_REGIONS[0];
  }, [formData.province]);

  const currentCityNode = useMemo(() => {
    return (
      currentProvinceNode?.cities.find((c) => c.name === formData.city) ||
      currentProvinceNode?.cities[0]
    );
  }, [currentProvinceNode, formData.city]);

  const availableDistricts = useMemo(() => {
    return currentCityNode?.districts || ['市辖区'];
  }, [currentCityNode]);

  // Handle Province change
  const handleProvinceChange = (provName: string) => {
    const prov = CHINA_REGIONS.find((p) => p.name === provName);
    if (!prov) return;
    const firstCity = prov.cities[0]?.name || '';
    const firstDistrict = prov.cities[0]?.districts[0] || '市辖区';
    const coords = getCoordinates(provName, firstCity, firstDistrict);

    setFormData((prev) => ({
      ...prev,
      province: provName,
      city: firstCity,
      district: firstDistrict,
      lng: Number(coords.lng.toFixed(6)),
      lat: Number(coords.lat.toFixed(6)),
      address: `${provName}${firstCity}${firstDistrict}${prev.shortName || prev.fullName || '厂区'}`,
    }));
  };

  // Handle City change
  const handleCityChange = (cityName: string) => {
    const city = currentProvinceNode?.cities.find((c) => c.name === cityName);
    const firstDistrict = city?.districts[0] || '市辖区';
    const coords = getCoordinates(formData.province, cityName, firstDistrict);

    setFormData((prev) => ({
      ...prev,
      city: cityName,
      district: firstDistrict,
      lng: Number(coords.lng.toFixed(6)),
      lat: Number(coords.lat.toFixed(6)),
      address: `${prev.province}${cityName}${firstDistrict}${prev.shortName || prev.fullName || '厂区'}`,
    }));
  };

  // Handle District change
  const handleDistrictChange = (distName: string) => {
    const coords = getCoordinates(formData.province, formData.city, distName);
    setFormData((prev) => ({
      ...prev,
      district: distName,
      lng: Number(coords.lng.toFixed(6)),
      lat: Number(coords.lat.toFixed(6)),
      address: `${prev.province}${prev.city}${distName}${prev.shortName || prev.fullName || '厂区'}`,
    }));
  };

  // Mini Map Initialization & Synchronization
  useEffect(() => {
    if (!open || !miniMapContainerRef.current) return;

    // Small timeout to allow Dialog transition
    const timer = setTimeout(() => {
      if (!miniMapContainerRef.current) return;

      if (!miniMapRef.current) {
        const map = L.map(miniMapContainerRef.current, {
          center: [formData.lat, formData.lng],
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          subdomains: ['a', 'b', 'c'],
        }).addTo(map);

        // Custom marker icon matching user's map screenshot
        const pinIcon = L.divIcon({
          className: 'custom-form-pin',
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer">
              <div class="w-7 h-7 bg-blue-600 rounded-full shadow-md flex items-center justify-center text-white ring-2 ring-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="absolute -bottom-1 w-2 h-2 bg-blue-600 rotate-45"></div>
            </div>
          `,
          iconSize: [28, 36],
          iconAnchor: [14, 36],
        });

        const marker = L.marker([formData.lat, formData.lng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          setFormData((p) => ({
            ...p,
            lat: Number(newPos.lat.toFixed(6)),
            lng: Number(newPos.lng.toFixed(6)),
          }));
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          setFormData((p) => ({
            ...p,
            lat: Number(e.latlng.lat.toFixed(6)),
            lng: Number(e.latlng.lng.toFixed(6)),
          }));
        });

        markerRef.current = marker;
        miniMapRef.current = map;
      } else {
        miniMapRef.current.invalidateSize();
        miniMapRef.current.setView([formData.lat, formData.lng], 12);
        if (markerRef.current) {
          markerRef.current.setLatLng([formData.lat, formData.lng]);
        }
      }
    }, 150);

    const timer2 = setTimeout(() => {
      if (miniMapRef.current) {
        miniMapRef.current.invalidateSize();
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [open]);

  // Sync marker position when lng/lat changes in formData
  useEffect(() => {
    if (miniMapRef.current && markerRef.current) {
      markerRef.current.setLatLng([formData.lat, formData.lng]);
      miniMapRef.current.panTo([formData.lat, formData.lng]);
    }
  }, [formData.lng, formData.lat]);

  // Clean up map when modal closes
  useEffect(() => {
    if (!open && miniMapRef.current) {
      miniMapRef.current.remove();
      miniMapRef.current = null;
      markerRef.current = null;
    }
  }, [open]);

  // Handle Address Search
  const handleAddressSearch = () => {
    if (!addressSearchKeyword.trim()) {
      toast.info('请输入企业地址关键词进行检索');
      return;
    }
    const q = addressSearchKeyword.trim();
    // Update detailed address
    setFormData((p) => ({
      ...p,
      address: q.includes(p.city) ? q : `${p.province}${p.city}${p.district}${q}`,
    }));
    toast.success(`已更新并定位至: ${q}`);
  };

  // Handle Logo Upload (PNG <= 1MB)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png')) {
      toast.error('仅支持 png 格式的图片文件');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('图片文件大小不能超过 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((p) => ({ ...p, logoUrl: dataUrl }));
      toast.success('企业 Logo 上传成功');
    };
    reader.readAsDataURL(file);
  };

  // Remove Logo
  const handleRemoveLogo = () => {
    setFormData((p) => ({ ...p, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('已清除企业 Logo');
  };

  // Upload WeCom QR Code
  const handleWechatQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('jpg')) {
      toast.error('仅支持 PNG、JPG 格式的企业微信二维码图片');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('企业微信二维码图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((p) => ({ ...p, cloudButlerWeChatQr: dataUrl }));
      toast.success('企业微信二维码上传成功');
    };
    reader.readAsDataURL(file);
  };

  // Remove WeCom QR Code
  const handleRemoveWechatQr = () => {
    setFormData((p) => ({ ...p, cloudButlerWeChatQr: '' }));
    if (wechatQrInputRef.current) {
      wechatQrInputRef.current.value = '';
    }
    toast.info('已清除企业微信二维码');
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('请输入企业全称');
      return;
    }
    if (!formData.unifiedSocialCreditCode.trim()) {
      toast.error('请输入统一社会信用代码');
      return;
    }
    if (!formData.industry.trim()) {
      toast.error('请选择所属行业');
      return;
    }
    if (!formData.contactName.trim()) {
      toast.error('请输入企业联系人姓名');
      return;
    }
    if (!formData.contactPhone.trim()) {
      toast.error('请输入企业联系手机号');
      return;
    }

    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-6xl sm:max-w-5xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl rounded-xl">
        {/* Header */}
        <DialogHeader className="px-6 py-3.5 border-b border-gray-100 flex flex-row items-center justify-between shrink-0 bg-white">
          <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="size-4.5 text-blue-600" />
            <span>{isEdit ? '编辑企业信息' : '新增企业信息'}</span>
            {enterprise?.code && (
              <span className="text-xs font-mono font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-1 border border-gray-200">
                {enterprise.code}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Form Body with 2-Column Split Layout */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-7 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">
            {/* ════════ 左栏：基础与工商信息、联络人员、企业Logo ════════ */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 text-xs font-bold text-gray-800">
                <Building2 className="size-3.5 text-blue-600" />
                <span>企业基础与工商信息</span>
              </div>

              {/* 1. 企业全称 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  <span className="text-red-500 mr-1">*</span>企业全称:
                </label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="请输入企业工商核准全称"
                  className="h-9 text-xs bg-white border-gray-200 focus-visible:ring-blue-500"
                  required
                />
              </div>

              {/* 2. 企业简称 & 统一社会信用代码 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">企业简称:</label>
                  <Input
                    value={formData.shortName}
                    onChange={(e) => setFormData((p) => ({ ...p, shortName: e.target.value }))}
                    placeholder="例如：华晶金刚石"
                    className="h-9 text-xs bg-white border-gray-200 focus-visible:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    <span className="text-red-500 mr-1">*</span>统一信用代码:
                  </label>
                  <Input
                    value={formData.unifiedSocialCreditCode}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, unifiedSocialCreditCode: e.target.value.toUpperCase() }))
                    }
                    placeholder="18位统一代码"
                    className="h-9 text-xs font-mono bg-white border-gray-200 uppercase"
                    required
                  />
                </div>
              </div>

              {/* 3. 企业类型 & 所属行业 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">企业类型:</label>
                  <Select
                    value={formData.enterpriseType}
                    onValueChange={(val) => setFormData((p) => ({ ...p, enterpriseType: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="企业">企业</SelectItem>
                      <SelectItem value="事业单位">事业单位</SelectItem>
                      <SelectItem value="科研院所">科研院所</SelectItem>
                      <SelectItem value="政府机构">政府机构</SelectItem>
                      <SelectItem value="其他社会组织">其他社会组织</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    <span className="text-red-500 mr-1">*</span>所属行业:
                  </label>
                  <Select
                    value={formData.industry}
                    onValueChange={(val) => setFormData((p) => ({ ...p, industry: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="制造业">制造业</SelectItem>
                      <SelectItem value="新能源与储能">新能源与储能</SelectItem>
                      <SelectItem value="电力、热力生产和供应业">电力、热力生产和供应业</SelectItem>
                      <SelectItem value="计算机、通信和其他电子设备制造业">
                        电子设备制造
                      </SelectItem>
                      <SelectItem value="化学原料和化学制品制造业">化学原料制品</SelectItem>
                      <SelectItem value="采矿与冶炼业">采矿与冶炼业</SelectItem>
                      <SelectItem value="交通运输、仓储和邮政业">交通运输仓储</SelectItem>
                      <SelectItem value="信息传输、软件和信息技术服务业">
                        信息技术服务
                      </SelectItem>
                      <SelectItem value="综合低碳示范园区">综合低碳示范园区</SelectItem>
                      <SelectItem value="其他行业">其他行业</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 4. 客户来源 与 企业添加人 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">客户来源:</label>
                  <Select
                    value={formData.customerSource}
                    onValueChange={(val) => setFormData((p) => ({ ...p, customerSource: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="天合储能用户">天合储能用户</SelectItem>
                      <SelectItem value="平台自主注册">平台自主注册</SelectItem>
                      <SelectItem value="商务拓展签约">商务拓展签约</SelectItem>
                      <SelectItem value="渠道代理推荐">渠道代理推荐</SelectItem>
                      <SelectItem value="生态战略合作">生态战略合作</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">企业添加人:</label>
                  <Input
                    value={formData.createdBy || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, createdBy: e.target.value }))}
                    placeholder="例如：张建军 (运营专员)"
                    className="h-9 text-xs bg-white border-gray-200"
                  />
                </div>
              </div>

              {/* 5. 联络人员 Section */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 text-xs font-bold text-gray-800">
                  <Users className="size-3.5 text-blue-600" />
                  <span>企业联络人员</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      <span className="text-red-500 mr-1">*</span>联系人姓名:
                    </label>
                    <Input
                      value={formData.contactName}
                      onChange={(e) => setFormData((p) => ({ ...p, contactName: e.target.value }))}
                      placeholder="例如：颜祥飞"
                      className="h-9 text-xs bg-white border-gray-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      <span className="text-red-500 mr-1">*</span>联系手机号:
                    </label>
                    <Input
                      value={formData.contactPhone}
                      onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                      placeholder="例如：15039181381"
                      className="h-9 text-xs font-mono bg-white border-gray-200"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 6. 专属云管家服务 Section */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 text-xs font-bold text-gray-800">
                  <Headset className="size-3.5 text-blue-600" />
                  <span>专属云管家服务</span>
                </div>

                <div className="mt-3 space-y-3">
                  {/* 云管家名称 & 联系方式 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        云管家名称:
                      </label>
                      <Input
                        value={formData.cloudButlerName || ''}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, cloudButlerName: e.target.value }))
                        }
                        placeholder="例如：天合专属云管家-李经理"
                        className="h-9 text-xs bg-white border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        联系方式:
                      </label>
                      <Input
                        value={formData.cloudButlerPhone || ''}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, cloudButlerPhone: e.target.value }))
                        }
                        placeholder="例如：18610886622 或 400-800-xxxx"
                        className="h-9 text-xs font-mono bg-white border-gray-200"
                      />
                    </div>
                  </div>

                  {/* 企业微信（图片上传表单） */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      企业微信:
                    </label>

                    <input
                      type="file"
                      ref={wechatQrInputRef}
                      onChange={handleWechatQrUpload}
                      accept="image/png,image/jpeg"
                      className="hidden"
                    />

                    <div className="flex items-start gap-3.5">
                      {formData.cloudButlerWeChatQr ? (
                        <div className="relative inline-block group shrink-0">
                          <div className="size-20 rounded-lg border border-gray-200 overflow-hidden bg-white p-1 shadow-2xs flex items-center justify-center">
                            <img
                              src={formData.cloudButlerWeChatQr}
                              alt="企业微信二维码"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveWechatQr}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                            title="移除企业微信二维码"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => wechatQrInputRef.current?.click()}
                          className="size-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50/70 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600 transition-all cursor-pointer shrink-0"
                        >
                          <QrCode className="size-4.5" />
                          <span className="text-[11px]">上传企微码</span>
                        </button>
                      )}

                      <div className="flex-1 text-[11px] text-gray-500 leading-relaxed pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => wechatQrInputRef.current?.click()}
                            className="h-7 text-xs px-2.5 bg-white border-gray-200 hover:bg-gray-50"
                          >
                            <Upload className="size-3 mr-1 text-gray-600" />
                            {formData.cloudButlerWeChatQr ? '重新上传' : '选择图片'}
                          </Button>
                          {formData.cloudButlerWeChatQr && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveWechatQr}
                              className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="size-3 mr-1" />
                              清除
                            </Button>
                          )}
                        </div>
                        <p className="text-gray-400">
                          支持上传专属管家或客服的企业微信二维码（PNG、JPG 格式，不超过 2MB）。客户端扫码可直接联系专属云管家。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. 企业Logo Section */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 text-xs font-bold text-gray-800">
                  <Upload className="size-3.5 text-blue-600" />
                  <span>企业标识 (Logo)</span>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png,image/jpeg"
                    className="hidden"
                  />

                  {formData.logoUrl ? (
                    <div className="relative inline-block group shrink-0">
                      <div className="size-20 rounded-lg border border-gray-200 overflow-hidden bg-white p-1 shadow-2xs flex items-center justify-center">
                        <img
                          src={formData.logoUrl}
                          alt="企业Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                        title="移除Logo"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="size-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50/70 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600 transition-all cursor-pointer shrink-0"
                    >
                      <Upload className="size-4.5" />
                      <span className="text-[11px]">上传Logo</span>
                    </button>
                  )}

                  <div className="text-[11px] text-gray-500 leading-relaxed">
                    <p className="font-medium text-gray-700 mb-0.5">支持正方形企业图标</p>
                    <p className="text-gray-400">仅支持 PNG 格式，图片大小不超过 1MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════ 右栏：企业地址与空间地图定位 ════════ */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 text-xs font-bold text-gray-800">
                <MapPin className="size-3.5 text-blue-600" />
                <span>企业地址与空间地图定位</span>
              </div>

              {/* 行政区划 (省 / 市 / 区 联动选择) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  <span className="text-red-500 mr-1">*</span>行政区划:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={formData.province} onValueChange={handleProvinceChange}>
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {CHINA_REGIONS.map((prov) => (
                        <SelectItem key={prov.name} value={prov.name}>
                          {prov.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={formData.city} onValueChange={handleCityChange}>
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {currentProvinceNode?.cities.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={formData.district} onValueChange={handleDistrictChange}>
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {availableDistricts.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 详细地址 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  <span className="text-red-500 mr-1">*</span>详细地址:
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  placeholder="请输入厂区、园区或门牌号"
                  className="h-9 text-xs bg-white border-gray-200"
                  required
                />
              </div>

              {/* 交互地图选点与搜索 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-slate-50">
                {/* 搜索条 */}
                <div className="p-2 bg-white border-b border-gray-100 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="size-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <Input
                      value={addressSearchKeyword}
                      onChange={(e) => setAddressSearchKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddressSearch();
                        }
                      }}
                      placeholder="搜索地址并在地图中聚焦定位..."
                      className="h-8 pl-8 text-xs bg-slate-50 border-gray-200 w-full"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddressSearch}
                    className="h-8 text-xs px-3 text-blue-600 hover:bg-blue-50 border-blue-200 cursor-pointer"
                  >
                    定位
                  </Button>
                </div>

                {/* Map Canvas */}
                <div className="relative h-[340px] w-full bg-slate-100">
                  <div ref={miniMapContainerRef} className="h-full w-full" />

                  {/* Address balloon preview */}
                  <div className="absolute left-2.5 top-2.5 z-1000 max-w-[85%] bg-white/95 backdrop-blur-xs rounded shadow-xs border border-gray-200 px-2.5 py-1 text-xs text-gray-800 flex items-center gap-1.5">
                    <MapPin className="size-3 text-blue-600 shrink-0" />
                    <span className="truncate font-medium text-[11px]">
                      {formData.address || formData.fullName || '未设置详细地址'}
                    </span>
                  </div>

                  {/* Bottom watermark hint */}
                  <div className="absolute right-2 bottom-2 z-1000 bg-white/90 px-1.5 py-0.5 rounded text-[10px] text-gray-500 flex items-center gap-1 shadow-2xs">
                    <Navigation className="size-2.5 text-blue-600" />
                    <span>点击地图或拖动标记可精确拾取坐标</span>
                  </div>
                </div>

                {/* 经纬度输入微调 */}
                <div className="p-2.5 bg-slate-50 border-t border-gray-100 grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">经度 (Lng):</label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={formData.lng}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, lng: parseFloat(e.target.value) || 0 }))
                      }
                      className="h-7.5 text-xs font-mono bg-white border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">纬度 (Lat):</label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={formData.lat}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, lat: parseFloat(e.target.value) || 0 }))
                      }
                      className="h-7.5 text-xs font-mono bg-white border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8.5 px-4"
          >
            取消
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="text-xs h-8.5 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            {isEdit ? '保存修改' : '确认新增'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
