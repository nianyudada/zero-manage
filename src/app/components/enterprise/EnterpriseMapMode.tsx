import { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  ChevronRight,
  Building2,
  Filter,
  Eye,
  Globe2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Navigation,
  Crosshair,
  Search,
  FileText,
  Layers,
  Users,
  Pencil,
} from 'lucide-react';
import { EnterpriseItem } from '../../data/mockEnterprises';
import {
  PROVINCE_COORDINATES,
  CITY_COORDINATES,
  DISTRICT_COORDINATES,
  getCoordinates,
} from '../../data/geoCoordinates';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { EnterpriseUserModal, getEnterpriseUserCount } from './EnterpriseUserModal';

interface EnterpriseMapModeProps {
  enterprises: EnterpriseItem[];
  onViewDetail?: (enterprise: EnterpriseItem) => void;
  onViewInfo?: (enterprise: EnterpriseItem) => void;
  onViewServices?: (enterprise: EnterpriseItem) => void;
  onViewUsers?: (enterprise: EnterpriseItem) => void;
}

// Generate consistent jitter for enterprise pins within the same district so they don't overlap completely
function getEnterprisePinCoord(ent: EnterpriseItem, localIndex: number): [number, number] {
  const base = getCoordinates(ent.province, ent.city, ent.district);
  // If first in district, place directly at base coordinate
  if (localIndex === 0) return [base.lat, base.lng];
  const angle = (localIndex * 60) * (Math.PI / 180);
  const distance = 0.005 * Math.ceil(localIndex / 6);
  return [
    base.lat + distance * Math.cos(angle),
    base.lng + distance * Math.sin(angle),
  ];
}

export default function EnterpriseMapMode({
  enterprises,
  onViewDetail,
  onViewInfo,
  onViewServices,
  onViewUsers,
}: EnterpriseMapModeProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Administrative Selection State:
  // Level 1: Province
  // Level 2: City
  // Level 3: Enterprise Pin (第三级直接显示企业)
  const [selectedProvince, setSelectedProvince] = useState<string | null>('河南省');
  const [selectedCity, setSelectedCity] = useState<string | null>('郑州市');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [highlightedEnterpriseId, setHighlightedEnterpriseId] = useState<string | null>(null);

  // Internal User Modal State (fallback if not handled by parent)
  const [internalUserModalOpen, setInternalUserModalOpen] = useState(false);
  const [internalUserEnterprise, setInternalUserEnterprise] = useState<EnterpriseItem | null>(null);

  const handleUserClick = (ent: EnterpriseItem) => {
    if (onViewUsers) {
      onViewUsers(ent);
    } else {
      setInternalUserEnterprise(ent);
      setInternalUserModalOpen(true);
    }
  };

  const handleInfoClick = (ent: EnterpriseItem) => {
    if (onViewInfo) {
      onViewInfo(ent);
    } else if (onViewDetail) {
      onViewDetail(ent);
    }
  };

  const handleServicesClick = (ent: EnterpriseItem) => {
    if (onViewServices) {
      onViewServices(ent);
    }
  };

  // Map Interactive State:
  const [currentZoom, setCurrentZoom] = useState<number>(11);

  // ── 右侧筛选栏状态：编号和名称合并为一个表单，与服务平行 ──
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterService, setFilterService] = useState('all');

  // Filter full enterprises list
  const matchingEnterprises = useMemo(() => {
    return enterprises.filter((ent) => {
      // 1. 编号 / 企业名称 合并检索
      if (filterKeyword.trim()) {
        const q = filterKeyword.trim().toLowerCase();
        const matchCode = ent.code.toLowerCase().includes(q);
        const matchName =
          ent.fullName.toLowerCase().includes(q) ||
          (ent.shortName ? ent.shortName.toLowerCase().includes(q) : false);
        if (!matchCode && !matchName) return false;
      }
      // 2. 开通服务 (Active Service)
      if (filterService !== 'all') {
        const hasService = ent.services.some(
          (s) => s.code === filterService || s.name === filterService || s.name.includes(filterService)
        );
        if (!hasService) return false;
      }
      return true;
    });
  }, [enterprises, filterKeyword, filterService]);

  // Keep refs up-to-date for Leaflet event handlers
  const matchingEnterprisesRef = useRef(matchingEnterprises);
  matchingEnterprisesRef.current = matchingEnterprises;

  const selectedProvinceRef = useRef(selectedProvince);
  selectedProvinceRef.current = selectedProvince;

  const selectedCityRef = useRef(selectedCity);
  selectedCityRef.current = selectedCity;

  const isFiltered = Boolean(filterKeyword.trim() || filterService !== 'all');

  const handleResetFilters = () => {
    setFilterKeyword('');
    setFilterService('all');
  };

  // 1. Aggregation Calculations based on matchingEnterprises:
  const provinceStats = useMemo(() => {
    const stats: Record<string, number> = {};
    matchingEnterprises.forEach((ent) => {
      const p = ent.province || '其他';
      stats[p] = (stats[p] || 0) + 1;
    });
    return stats;
  }, [matchingEnterprises]);

  const cityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    matchingEnterprises.forEach((ent) => {
      const c = ent.city || '其他';
      stats[c] = (stats[c] || 0) + 1;
    });
    return stats;
  }, [matchingEnterprises]);

  const districtStats = useMemo(() => {
    const stats: Record<string, number> = {};
    matchingEnterprises.forEach((ent) => {
      const key = `${ent.province || ''}_${ent.city || ''}_${ent.district || ''}`;
      stats[key] = (stats[key] || 0) + 1;
      // also direct district key
      if (ent.district) {
        stats[ent.district] = (stats[ent.district] || 0) + 1;
      }
    });
    return stats;
  }, [matchingEnterprises]);

  // Current administrative tier determined purely by zoom level
  const currentTier = useMemo(() => {
    if (currentZoom >= 10) {
      return { level: 3, label: '第三级（企业直显）' };
    }
    if (currentZoom >= 7) {
      return { level: 2, label: '第二级（地级市聚合）' };
    }
    return { level: 1, label: '第一级（省级聚合）' };
  }, [currentZoom]);

  // Filtered enterprises for right list
  const displayedEnterprises = useMemo(() => {
    let list = matchingEnterprises;

    if (selectedDistrict) {
      list = list.filter((e) => e.district === selectedDistrict);
    } else if (selectedCity) {
      list = list.filter((e) => e.city === selectedCity);
    } else if (selectedProvince) {
      list = list.filter((e) => e.province === selectedProvince);
    }

    return list;
  }, [matchingEnterprises, selectedProvince, selectedCity, selectedDistrict]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initial center: Zhengzhou / Central China
    const initialCenter: [number, number] = [34.8234, 113.5412];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 11,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false, // Use custom sleek controls
    });

    mapRef.current = map;

    // 高德矢量标准底图
    const autonaviUrl = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';
    L.tileLayer(autonaviUrl, {
      subdomains: ['1', '2', '3', '4'],
      attribution: '© 高德地图 AutoNavi',
      maxZoom: 18,
    }).addTo(map);

    // Create markers layer group
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;

    // Map Event Listeners - Dynamic tracking of zoom & viewport moves
    const handleMapMovement = () => {
      const z = map.getZoom();
      setCurrentZoom(z);

      // 1. If zoomed out to province/nation level (zoom <= 6), clear region restriction
      if (z <= 6) {
        setSelectedProvince(null);
        setSelectedCity(null);
        setSelectedDistrict(null);
        return;
      }

      // 2. If at city level (zoom 7 - 9), clear district
      if (z <= 9) {
        setSelectedDistrict(null);
      }

      // 3. Dynamic viewport inspection: check visible enterprises
      const bounds = map.getBounds();
      const currentList = matchingEnterprisesRef.current;
      const inView = currentList.filter((ent) => {
        const coords = getCoordinates(ent.province, ent.city, ent.district);
        return bounds.contains([coords.lat, coords.lng]);
      });

      if (inView.length > 0) {
        const curProv = selectedProvinceRef.current;
        const curCity = selectedCityRef.current;
        const hasCurrentProvince = curProv && inView.some((e) => e.province === curProv);

        if (!hasCurrentProvince) {
          // User panned to another province! Count which province is dominant in current view
          const provCounts: Record<string, number> = {};
          inView.forEach((e) => {
            provCounts[e.province] = (provCounts[e.province] || 0) + 1;
          });
          const topProv = Object.entries(provCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
          if (topProv) {
            setSelectedProvince(topProv);
            const topCity = inView.find((e) => e.province === topProv)?.city || null;
            setSelectedCity(topCity);
            setSelectedDistrict(null);
          }
        } else {
          // Province is still visible, check if city is in view
          const hasCurrentCity = curCity && inView.some((e) => e.city === curCity);
          if (!hasCurrentCity) {
            const topCity = inView.find((e) => e.province === curProv)?.city || null;
            if (topCity) {
              setSelectedCity(topCity);
              setSelectedDistrict(null);
            }
          }
        }
      }
    };

    map.on('zoomend', handleMapMovement);
    map.on('moveend', handleMapMovement);

    // Invalidate size on init and observe container resize
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 3. Render Markers based on Current Zoom Level & State
  useEffect(() => {
    const map = mapRef.current;
    const group = markersLayerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // ── LEVEL 1: ZOOM <= 6 (省级聚合) ──
    if (currentZoom <= 6) {
      Object.entries(provinceStats).forEach(([provinceName, count]) => {
        if (count === 0) return;
        const coords = PROVINCE_COORDINATES[provinceName];
        if (!coords) return;

        const isCurrentProv = selectedProvince === provinceName;

        const iconHtml = `
          <div class="cursor-pointer transition-transform hover:scale-110 flex items-center shadow-lg rounded-full border-2 border-white select-none ${
            isCurrentProv
              ? 'bg-blue-600 ring-4 ring-blue-400/40 text-white'
              : count > 3
              ? 'bg-blue-600 text-white'
              : 'bg-indigo-600 text-white'
          }">
            <div class="px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
              <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span>${provinceName.replace(/(省|市|维吾尔自治区|壮族自治区|回族自治区|自治区)/g, '')}</span>
              <span class="bg-white text-blue-700 px-1.5 py-0.2 rounded-full text-[11px] font-black">${count}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'cluster-province-icon',
          html: iconHtml,
          iconSize: [100, 32],
          iconAnchor: [50, 16],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon });

        marker.on('click', () => {
          setSelectedProvince(provinceName);
          // Find first city with enterprises in this province
          const firstCityWithEnt = matchingEnterprises.find((e) => e.province === provinceName)?.city || null;
          setSelectedCity(firstCityWithEnt);
          setSelectedDistrict(null);

          // Fly map smoothly into Level 2 (City level)
          map.flyTo([coords.lat, coords.lng], 8, {
            duration: 0.8,
            easeLinearity: 0.25,
          });
        });

        marker.bindTooltip(
          `<div class="p-1 font-sans text-xs">
            <div class="font-bold text-gray-900">${provinceName}</div>
            <div class="text-blue-600 font-medium">已开通企业: ${count} 家</div>
            <div class="text-[11px] text-gray-400">点击进入市级行政区划聚合</div>
          </div>`,
          { direction: 'top', offset: [0, -10] }
        );

        group.addLayer(marker);
      });
    }

    // ── LEVEL 2: ZOOM 7 - 9 (地市级聚合) ──
    else if (currentZoom >= 7 && currentZoom <= 9) {
      // Aggregate cities across all matching enterprises
      const currentCityMap: Record<string, { count: number; province: string }> = {};
      matchingEnterprises.forEach((ent) => {
        if (!ent.city) return;
        if (!currentCityMap[ent.city]) {
          currentCityMap[ent.city] = { count: 0, province: ent.province };
        }
        currentCityMap[ent.city].count += 1;
      });

      Object.entries(currentCityMap).forEach(([cityName, info]) => {
        const coords = CITY_COORDINATES[cityName] || getCoordinates(info.province, cityName);
        if (!coords) return;

        const isCurrentCity = selectedCity === cityName;
        const isCurrentProvince = selectedProvince === info.province;

        const iconHtml = `
          <div class="cursor-pointer transition-transform hover:scale-110 flex items-center shadow-md rounded-full border-2 border-white select-none ${
            isCurrentCity
              ? 'bg-blue-600 ring-4 ring-blue-300 text-white'
              : isCurrentProvince
              ? 'bg-blue-700 text-white'
              : 'bg-indigo-600 text-white'
          }">
            <div class="px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>${cityName}</span>
              <span class="bg-white text-indigo-700 px-1.5 py-0.2 rounded-full text-[11px] font-black">${info.count}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'cluster-city-icon',
          html: iconHtml,
          iconSize: [90, 30],
          iconAnchor: [45, 15],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon });

        marker.on('click', () => {
          setSelectedProvince(info.province);
          setSelectedCity(cityName);
          setSelectedDistrict(null);

          // Fly to Level 3 (Enterprise level)
          map.flyTo([coords.lat, coords.lng], 11, {
            duration: 0.8,
            easeLinearity: 0.25,
          });
        });

        marker.bindTooltip(
          `<div class="p-1 font-sans text-xs">
            <div class="font-bold text-gray-900">${info.province} · ${cityName}</div>
            <div class="text-blue-600 font-medium">已开通企业: ${info.count} 家</div>
            <div class="text-[11px] text-gray-400">点击进入直接查看企业点位</div>
          </div>`,
          { direction: 'top', offset: [0, -10] }
        );

        group.addLayer(marker);
      });
    }

    // ── LEVEL 3: ZOOM >= 10 (第三级 · 企业直接显示，不显示3级行政名称) ──
    else {
      const districtOccurrenceMap: Record<string, number> = {};

      matchingEnterprises.forEach((ent) => {
        const districtKey = `${ent.province}_${ent.city}_${ent.district}`;
        const localIndex = districtOccurrenceMap[districtKey] || 0;
        districtOccurrenceMap[districtKey] = localIndex + 1;

        const [lat, lng] = getEnterprisePinCoord(ent, localIndex);
        const isHighlighted = highlightedEnterpriseId === ent.id;

        const enterprisePinHtml = `
          <div class="cursor-pointer transition-all transform hover:scale-110 flex items-center gap-1.5 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-md shadow-md border ${
            isHighlighted
              ? 'border-blue-600 ring-2 ring-blue-500 scale-110 shadow-lg'
              : 'border-blue-400 hover:border-blue-600'
          }">
            <div class="size-1.5 rounded-full bg-blue-600 shrink-0"></div>
            <div class="text-[11px] font-bold text-gray-900 truncate max-w-[130px]">
              ${ent.shortName || ent.fullName}
            </div>
          </div>
        `;

        const pinIcon = L.divIcon({
          className: 'enterprise-pin-icon',
          html: enterprisePinHtml,
          iconSize: [140, 28],
          iconAnchor: [70, 14],
        });

        const enterpriseMarker = L.marker([lat, lng], {
          icon: pinIcon,
          zIndexOffset: isHighlighted ? 1000 : 100,
        });

        // Clicking enterprise on map: highlight and locate the card on the right-side panel without popping up card inside map
        enterpriseMarker.on('click', () => {
          setHighlightedEnterpriseId(ent.id);
          setSelectedProvince(ent.province);
          setSelectedCity(ent.city);
          setSelectedDistrict(ent.district);

          // Smoothly scroll the corresponding card into view in the right-side list
          setTimeout(() => {
            const cardEl = document.getElementById(`enterprise-card-${ent.id}`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 50);
        });

        group.addLayer(enterpriseMarker);
      });
    }
  }, [
    currentZoom,
    matchingEnterprises,
    provinceStats,
    selectedProvince,
    selectedCity,
    highlightedEnterpriseId,
  ]);

  // ── Breadcrumb & Fly Actions ──
  const flyToNation = () => {
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setHighlightedEnterpriseId(null);
    mapRef.current?.flyTo([34.3416, 108.9398], 5, { duration: 0.8 });
  };

  const flyToProvince = (provinceName: string) => {
    setSelectedProvince(provinceName);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setHighlightedEnterpriseId(null);
    const coords = PROVINCE_COORDINATES[provinceName] || { lat: 34.7580, lng: 113.6654 };
    mapRef.current?.flyTo([coords.lat, coords.lng], 8, { duration: 0.8 });
  };

  const flyToCity = (cityName: string) => {
    setSelectedCity(cityName);
    setSelectedDistrict(null);
    setHighlightedEnterpriseId(null);
    const coords = CITY_COORDINATES[cityName] || getCoordinates(selectedProvince, cityName);
    mapRef.current?.flyTo([coords.lat, coords.lng], 11, { duration: 0.8 });
  };

  const flyToDistrict = (districtName: string) => {
    setSelectedDistrict(districtName);
    setHighlightedEnterpriseId(null);
    const coords = DISTRICT_COORDINATES[districtName] || getCoordinates(selectedProvince, selectedCity, districtName);
    mapRef.current?.flyTo([coords.lat, coords.lng], 12, { duration: 0.8 });
  };

  const flyToEnterprise = (ent: EnterpriseItem) => {
    setHighlightedEnterpriseId(ent.id);
    setSelectedProvince(ent.province);
    setSelectedCity(ent.city);
    setSelectedDistrict(ent.district);
    const coords = getCoordinates(ent.province, ent.city, ent.district);
    mapRef.current?.flyTo([coords.lat, coords.lng], 14, { duration: 0.8 });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex-1 min-h-[460px] flex flex-col">
      {/* ── Top Navigation & Interactive Breadcrumbs Bar ── */}
      <div className="px-5 py-2.5 border-b border-gray-200 bg-gray-50/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Breadcrumb path */}
        <div className="flex items-center gap-1.5 text-sm">
          <button
            type="button"
            onClick={flyToNation}
            className={cn(
              'flex items-center gap-1 font-medium transition-colors hover:text-blue-600',
              !selectedProvince ? 'text-blue-600 font-semibold' : 'text-gray-600'
            )}
            title="点击返回全国聚合视图"
          >
            <Globe2 className="size-4" />
            <span>全国 ({matchingEnterprises.length})</span>
          </button>

          {selectedProvince && (
            <>
              <ChevronRight className="size-4 text-gray-400" />
              <button
                type="button"
                onClick={() => flyToProvince(selectedProvince)}
                className={cn(
                  'font-medium transition-colors hover:text-blue-600',
                  selectedProvince && !selectedCity ? 'text-blue-600 font-semibold' : 'text-gray-600'
                )}
                title="点击定位到该省级行政区"
              >
                {selectedProvince} ({provinceStats[selectedProvince] || 0})
              </button>
            </>
          )}

          {selectedCity && (
            <>
              <ChevronRight className="size-4 text-gray-400" />
              <button
                type="button"
                onClick={() => flyToCity(selectedCity)}
                className={cn(
                  'font-medium transition-colors hover:text-blue-600',
                  selectedCity && !selectedDistrict ? 'text-blue-600 font-semibold' : 'text-gray-600'
                )}
                title="点击定位到该市级行政区"
              >
                {selectedCity} ({cityStats[selectedCity] || 0})
              </button>
            </>
          )}

          {selectedDistrict && (
            <>
              <ChevronRight className="size-4 text-gray-400" />
              <span className="text-blue-700 font-bold bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                {selectedDistrict} ({districtStats[selectedDistrict] || 0})
              </span>
            </>
          )}
        </div>

        {/* Top Right Action: Reset */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={flyToNation}
            className="h-7 text-xs px-2.5 text-gray-600 hover:text-blue-600 hover:border-blue-300"
          >
            <RotateCcw className="size-3 mr-1" />
            复位
          </Button>
        </div>
      </div>

      {/* ── Main Workspace: Real Leaflet Map (Expands to fill) + Enterprise List (Fixed 420px width) ── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* ── LEFT AREA: Real Map Canvas (Flexibly fills remaining space) ── */}
        <div className="flex-1 min-w-0 h-full relative border-r border-gray-200 bg-slate-100 flex flex-col overflow-hidden">
          {/* Real Leaflet Map Mount Container */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[300px] z-0" />

          {/* ── Floating Controls on Map: Top-Left Zoom Controls ── */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 shadow-md rounded-lg overflow-hidden bg-white/95 backdrop-blur border border-gray-200">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              title="放大地图 (Zoom In)"
            >
              <ZoomIn className="size-4" />
            </button>
            <div className="border-t border-gray-100" />
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              title="缩小地图 (Zoom Out)"
            >
              <ZoomOut className="size-4" />
            </button>
            <div className="border-t border-gray-100" />
            <button
              type="button"
              onClick={() => {
                const zhengzhou = CITY_COORDINATES['郑州市'] || { lat: 34.7466, lng: 113.6253 };
                mapRef.current?.flyTo([zhengzhou.lat, zhengzhou.lng], 11);
                setSelectedProvince('河南省');
                setSelectedCity('郑州市');
                setSelectedDistrict(null);
              }}
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              title="定位至产业聚集核心区 (郑州)"
            >
              <Crosshair className="size-4" />
            </button>
          </div>
        </div>

        {/* ── RIGHT AREA: Enterprise List (Fixed width 420px, height stretches with window) ── */}
        <div className="w-full lg:w-[420px] shrink-0 p-4 bg-white flex flex-col h-full min-h-0 overflow-hidden border-t lg:border-t-0">
          {/* Header info: 仅保留地区与企业数量 */}
          <div className="shrink-0 flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5 truncate">
              <Building2 className="size-4 text-blue-600 shrink-0" />
              <span className="truncate">
                {selectedProvince || '全国'}
                {selectedCity && ` · ${selectedCity}`}
                {selectedDistrict && ` · ${selectedDistrict}`}
              </span>
            </h3>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold shrink-0">
              共 {displayedEnterprises.length} 家企业
            </span>
          </div>

          {/* ── 筛选栏：编号和名称合并为一个表单，与服务平行在一行 ── */}
          <div className="shrink-0 flex items-center gap-2 mb-3">
            <div className="flex-1 relative min-w-0">
              <Search className="size-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <Input
                placeholder="输入编号或企业名称..."
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                className="h-8 pl-8 pr-2 text-xs bg-slate-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg placeholder:text-gray-400 w-full"
              />
            </div>

            <div className="w-[140px] shrink-0">
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="h-8 text-xs bg-slate-50 border-gray-200 text-gray-700 w-full rounded-lg">
                  <SelectValue placeholder="全部开通服务" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部开通服务</SelectItem>
                  <SelectItem value="energy_management">能源管理系统</SelectItem>
                  <SelectItem value="smart_microgrid">智能微网协同控制</SelectItem>
                  <SelectItem value="virtual_power_plant">虚拟电厂聚合调度</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isFiltered && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2 text-xs text-gray-600 hover:text-blue-600 hover:border-blue-300 shrink-0"
                title="重置筛选"
              >
                <RotateCcw className="size-3 mr-1" />
                重置
              </Button>
            )}
          </div>

          {/* List Cards Container */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
            {displayedEnterprises.length === 0 ? (
              <div className="py-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 p-4">
                <Building2 className="size-8 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-medium text-gray-700">当前区域暂无匹配企业记录</p>
                {matchingEnterprises.length > 0 ? (
                  <div className="mt-2 text-xs text-gray-500">
                    <p>
                      在其他区域匹配到{' '}
                      <span className="font-semibold text-blue-600">
                        {matchingEnterprises.length}
                      </span>{' '}
                      家企业
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={flyToNation}
                      className="mt-2.5 h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      查看全国匹配结果
                    </Button>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">
                    请尝试放宽或重置右侧筛选条件
                  </p>
                )}
              </div>
            ) : (
              displayedEnterprises.map((ent) => {
                const isHighlighted = highlightedEnterpriseId === ent.id;
                const serviceCount = ent.activeServicesCount || ent.services.length;
                const userCount = getEnterpriseUserCount(ent);

                return (
                  <div
                    key={ent.id}
                    id={`enterprise-card-${ent.id}`}
                    onClick={() => {
                      setHighlightedEnterpriseId(ent.id);
                    }}
                    className={cn(
                      'p-3.5 rounded-lg border transition-all scroll-mt-2',
                      isHighlighted
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-blue-400 bg-white hover:shadow-2xs'
                    )}
                  >
                    {/* Top row: Square Logo + (Name & Code in two rows) + Independent Edit Button in Top-Right */}
                    <div className="flex items-start gap-2.5 mb-2.5">
                      {/* Square Logo */}
                      <div className="size-10 rounded-md bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                        {ent.logoUrl ? (
                          <img
                            src={ent.logoUrl}
                            alt={ent.fullName}
                            className="size-full object-contain p-0.5"
                          />
                        ) : (
                          <Building2 className="size-5 text-blue-500" />
                        )}
                      </div>

                      {/* Name & Code + Short Name */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div
                          className="font-bold text-xs text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-1 transition-colors leading-tight"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInfoClick(ent);
                          }}
                          title={`点击编辑企业信息：${ent.fullName}`}
                        >
                          {ent.fullName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
                          <span className="font-mono select-all shrink-0">{ent.code}</span>
                          {ent.shortName && (
                            <>
                              <span className="text-gray-300 shrink-0">·</span>
                              <span className="text-gray-600 truncate font-medium" title={`企业简称：${ent.shortName}`}>
                                {ent.shortName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Independent Edit Button in Top-Right */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInfoClick(ent);
                        }}
                        className="size-6 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0 cursor-pointer -mt-0.5 -mr-0.5"
                        title="编辑企业信息"
                        aria-label="编辑企业信息"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>

                    {/* Content order: 统一代码 -> 联系人 -> 创建时间 -> 企业定位 */}
                    <div className="text-[11px] text-gray-600 space-y-1.5 mb-2.5">
                      {/* 1. 统一代码 */}
                      <div className="flex items-center">
                        <span className="text-gray-400 shrink-0 w-16">统一代码：</span>
                        <span className="font-mono text-gray-700 truncate">
                          {ent.unifiedSocialCreditCode}
                        </span>
                      </div>

                      {/* 2. 联系人 */}
                      <div className="flex items-center truncate">
                        <span className="text-gray-400 shrink-0 w-16">联系人：</span>
                        <span className="font-medium text-gray-700">{ent.contactName}</span>
                        <span className="mx-1 text-gray-300">·</span>
                        <span className="font-mono text-gray-600">{ent.contactPhone}</span>
                      </div>

                      {/* 3. 创建时间 */}
                      <div className="flex items-center">
                        <span className="text-gray-400 shrink-0 w-16">创建时间：</span>
                        <span className="font-mono text-gray-600">{ent.createdAt}</span>
                      </div>

                      {/* 4. 企业定位 (蓝色可点击交互) */}
                      <div className="flex items-center truncate">
                        <span className="text-gray-400 shrink-0 w-16">企业定位：</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            flyToEnterprise(ent);
                          }}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline cursor-pointer truncate max-w-[calc(100%-4rem)] text-[11px] leading-normal"
                          title={`点击在地图中定位：${ent.address || `${ent.province} ${ent.city} ${ent.district}`}`}
                        >
                          <MapPin className="size-3 shrink-0 text-blue-600" />
                          <span className="truncate text-[11px]">
                            {ent.address || `${ent.province} ${ent.city} ${ent.district}`}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* ── 合并为一个按钮：服务管理 (包含服务与用户双Tab管理) ── */}
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServicesClick(ent);
                        }}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer group"
                        title={`进入企业服务与用户综合管理工作台`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Layers className="size-3.5 text-blue-100 group-hover:rotate-12 transition-transform shrink-0" />
                          <span>服务管理</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-blue-100 font-normal">
                          <span>{serviceCount} 服务</span>
                          <span>·</span>
                          <span>{userCount} 用户</span>
                          <span className="ml-1 text-blue-200 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Internal User Modal Fallback ── */}
      <EnterpriseUserModal
        open={internalUserModalOpen}
        onOpenChange={setInternalUserModalOpen}
        enterprise={internalUserEnterprise}
      />
    </div>
  );
}
