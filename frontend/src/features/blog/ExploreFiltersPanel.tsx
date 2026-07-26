import { useState } from 'react';
import {
  MapPin, Navigation, Loader2, Filter, RotateCcw, Bookmark,
  ChevronDown, ChevronUp, LocateFixed,
} from 'lucide-react';
import {
  EXPLORE_CATEGORIES,
  EXPLORE_CULTURE,
  EXPLORE_DESTINATIONS,
  EXPLORE_DISHES,
  EXPLORE_REGIONS,
  EXPLORE_SORT_OPTIONS,
  type ExploreSortId,
} from './exploreBlogData';

export interface ExploreFilterState {
  userAddress: string;
  userLat: number | null;
  userLng: number | null;
  maxDistanceKm: number | null;
  activeCategory: string;
  activeRegion: string;
  selectedDestinations: string[];
  selectedDishes: string[];
  selectedCulture: string[];
  sortBy: ExploreSortId;
  onlyBookmarked: boolean;
  filtersExpanded: boolean;
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilterState = {
  userAddress: '',
  userLat: null,
  userLng: null,
  maxDistanceKm: null,
  activeCategory: 'Tất cả',
  activeRegion: 'Tất cả miền',
  selectedDestinations: [],
  selectedDishes: [],
  selectedCulture: [],
  sortBy: 'newest',
  onlyBookmarked: false,
  filtersExpanded: true,
};

interface Props {
  filters: ExploreFilterState;
  onChange: (patch: Partial<ExploreFilterState>) => void;
  onReset: () => void;
  locating: boolean;
  onUseMyLocation: () => void;
  resultCount: number;
  totalCount: number;
}

function toggleInList(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter(x => x !== item) : [...list, item];
}

export default function ExploreFiltersPanel({
  filters,
  onChange,
  onReset,
  locating,
  onUseMyLocation,
  resultCount,
  totalCount,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getVisibleItems = (items: string[], selected: string[], sectionKey: string, limit = 4) => {
    if (expandedSections[sectionKey]) return items;
    const initialSet = new Set(items.slice(0, limit));
    selected.forEach(s => {
      if (s && s !== 'Tất cả') initialSet.add(s);
    });
    return items.filter(i => initialSet.has(i));
  };

  const activeFilterCount =
    (filters.userAddress ? 1 : 0) +
    (filters.maxDistanceKm ? 1 : 0) +
    (filters.activeCategory !== 'Tất cả' ? 1 : 0) +
    (filters.activeRegion !== 'Tất cả miền' ? 1 : 0) +
    filters.selectedDestinations.length +
    filters.selectedDishes.length +
    filters.selectedCulture.length +
    (filters.onlyBookmarked ? 1 : 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <Filter size={14} className="text-amber-500" />
          Bộ lọc du lịch
          {activeFilterCount > 0 && (
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onReset} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors" title="Xóa bộ lọc">
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={() => onChange({ filtersExpanded: !filters.filtersExpanded })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            {filters.filtersExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Hiển thị <strong className="text-slate-800 dark:text-slate-200">{resultCount}</strong> / {totalCount} bài
      </p>

      {filters.filtersExpanded && (
        <div className="space-y-4">
          {/* Vị trí hiện tại */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <MapPin size={12} className="text-rose-500" /> Địa chỉ / vị trí của bạn
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filters.userAddress}
                onChange={e => onChange({ userAddress: e.target.value })}
                placeholder="VD: Quận 1, TP.HCM..."
                className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
              />
              <button
                type="button"
                onClick={onUseMyLocation}
                disabled={locating}
                className="flex-shrink-0 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:border-amber-400/50 transition-colors disabled:opacity-50 cursor-pointer"
                title="Lấy vị trí GPS"
              >
                {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              </button>
            </div>
            {filters.userLat != null && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Navigation size={10} /> Đã xác định vị trí — lọc theo khoảng cách được bật
              </p>
            )}
          </div>

          {/* Khoảng cách */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Khoảng cách tối đa</label>
            <select
              value={filters.maxDistanceKm ?? ''}
              onChange={e => onChange({ maxDistanceKm: e.target.value ? Number(e.target.value) : null })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:border-amber-400 focus:outline-none cursor-pointer"
              disabled={filters.userLat == null}
            >
              <option value="">Không giới hạn</option>
              <option value="50">Trong 50 km</option>
              <option value="150">Trong 150 km</option>
              <option value="300">Trong 300 km</option>
              <option value="500">Trong 500 km</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Sắp xếp</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPLORE_SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ sortBy: opt.id })}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    filters.sortBy === opt.id
                      ? 'bg-blue-600 border-transparent text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:border-blue-500/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Miền */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Miền</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPLORE_REGIONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onChange({ activeRegion: r })}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    filters.activeRegion === r
                      ? 'bg-blue-600 border-transparent text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:border-blue-500/30'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Danh mục */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Danh mục</label>
              {EXPLORE_CATEGORIES.length > 4 && (
                <button
                  type="button"
                  onClick={() => toggleSection('categories')}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  {expandedSections['categories'] ? (
                    <>Thu gọn <ChevronUp size={11} /></>
                  ) : (
                    <>+ Xem thêm ({EXPLORE_CATEGORIES.length - 4}) <ChevronDown size={11} /></>
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getVisibleItems(EXPLORE_CATEGORIES, [filters.activeCategory], 'categories', 4).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onChange({ activeCategory: cat })}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    filters.activeCategory === cat
                      ? 'bg-blue-600 border-transparent text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:border-blue-500/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Địa điểm du lịch */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Địa điểm du lịch</label>
              {EXPLORE_DESTINATIONS.length > 4 && (
                <button
                  type="button"
                  onClick={() => toggleSection('destinations')}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  {expandedSections['destinations'] ? (
                    <>Thu gọn <ChevronUp size={11} /></>
                  ) : (
                    <>+ Xem thêm ({EXPLORE_DESTINATIONS.length - 4}) <ChevronDown size={11} /></>
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getVisibleItems(EXPLORE_DESTINATIONS, filters.selectedDestinations, 'destinations', 4).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    onChange({
                      selectedDestinations: toggleInList(filters.selectedDestinations, d),
                    })
                  }
                  className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all cursor-pointer ${
                    filters.selectedDestinations.includes(d)
                      ? 'bg-blue-600 border-transparent text-white font-bold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:border-blue-500/30'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Món ẩm thực */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Món ẩm thực</label>
              {EXPLORE_DISHES.length > 4 && (
                <button
                  type="button"
                  onClick={() => toggleSection('dishes')}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  {expandedSections['dishes'] ? (
                    <>Thu gọn <ChevronUp size={11} /></>
                  ) : (
                    <>+ Xem thêm ({EXPLORE_DISHES.length - 4}) <ChevronDown size={11} /></>
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getVisibleItems(EXPLORE_DISHES, filters.selectedDishes, 'dishes', 4).map(dish => (
                <button
                  key={dish}
                  type="button"
                  onClick={() =>
                    onChange({ selectedDishes: toggleInList(filters.selectedDishes, dish) })
                  }
                  className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all cursor-pointer ${
                    filters.selectedDishes.includes(dish)
                      ? 'bg-blue-600 border-transparent text-white font-bold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:border-blue-500/30'
                  }`}
                >
                  {dish}
                </button>
              ))}
            </div>
          </div>

          {/* Văn hóa */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Văn hóa & trải nghiệm</label>
              {EXPLORE_CULTURE.length > 4 && (
                <button
                  type="button"
                  onClick={() => toggleSection('culture')}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  {expandedSections['culture'] ? (
                    <>Thu gọn <ChevronUp size={11} /></>
                  ) : (
                    <>+ Xem thêm ({EXPLORE_CULTURE.length - 4}) <ChevronDown size={11} /></>
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getVisibleItems(EXPLORE_CULTURE, filters.selectedCulture, 'culture', 4).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    onChange({ selectedCulture: toggleInList(filters.selectedCulture, c) })
                  }
                  className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all cursor-pointer ${
                    filters.selectedCulture.includes(c)
                      ? 'bg-blue-600 border-transparent text-white font-bold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:border-blue-500/30'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tiện ích */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tiện ích</label>
            <button
              type="button"
              onClick={() => onChange({ onlyBookmarked: !filters.onlyBookmarked })}
              className={`w-full flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                filters.onlyBookmarked
                  ? 'bg-blue-600 border-transparent text-white font-bold shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark size={14} className={filters.onlyBookmarked ? 'fill-current' : ''} />
              Chỉ bài đã lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
