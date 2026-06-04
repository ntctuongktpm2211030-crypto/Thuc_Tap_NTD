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
    <div className="explore-sidebar-card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Filter size={14} className="text-teal-600" />
          Bộ lọc du lịch
          {activeFilterCount > 0 && (
            <span className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onReset} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Xóa bộ lọc">
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={() => onChange({ filtersExpanded: !filters.filtersExpanded })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            {filters.filtersExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Hiển thị <strong className="text-slate-800">{resultCount}</strong> / {totalCount} bài
      </p>

      {filters.filtersExpanded && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
          {/* Vị trí hiện tại */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <MapPin size={12} className="text-rose-500" /> Địa chỉ / vị trí của bạn
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filters.userAddress}
                onChange={e => onChange({ userAddress: e.target.value })}
                placeholder="VD: Quận 1, TP.HCM..."
                className="flex-1 text-xs rounded-lg border border-slate-200 px-3 py-2 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={onUseMyLocation}
                disabled={locating}
                className="flex-shrink-0 px-2.5 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 transition-colors"
                title="Lấy vị trí GPS"
              >
                {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              </button>
            </div>
            {filters.userLat != null && (
              <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                <Navigation size={10} /> Đã xác định vị trí — lọc theo khoảng cách được bật
              </p>
            )}
          </div>

          {/* Khoảng cách */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600">Khoảng cách tối đa</label>
            <select
              value={filters.maxDistanceKm ?? ''}
              onChange={e => onChange({ maxDistanceKm: e.target.value ? Number(e.target.value) : null })}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:border-teal-400 focus:outline-none"
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
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600">Sắp xếp</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPLORE_SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ sortBy: opt.id })}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    filters.sortBy === opt.id
                      ? 'bg-violet-100 border-violet-300 text-violet-800'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Miền */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600">Miền</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPLORE_REGIONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onChange({ activeRegion: r })}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${
                    filters.activeRegion === r
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Danh mục */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600">Danh mục</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPLORE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onChange({ activeCategory: cat })}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${
                    filters.activeCategory === cat
                      ? 'bg-orange-100 border-orange-300 text-orange-900'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Địa điểm du lịch */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600">Địa điểm du lịch</label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {EXPLORE_DESTINATIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    onChange({
                      selectedDestinations: toggleInList(filters.selectedDestinations, d),
                    })
                  }
                  className={`text-[10px] font-medium px-2 py-1 rounded-md border ${
                    filters.selectedDestinations.includes(d)
                      ? 'bg-teal-100 border-teal-300 text-teal-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Món ẩm thực */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600">Món ẩm thực</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPLORE_DISHES.map(dish => (
                <button
                  key={dish}
                  type="button"
                  onClick={() =>
                    onChange({ selectedDishes: toggleInList(filters.selectedDishes, dish) })
                  }
                  className={`text-[10px] font-medium px-2 py-1 rounded-md border ${
                    filters.selectedDishes.includes(dish)
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {dish}
                </button>
              ))}
            </div>
          </div>

          {/* Văn hóa */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600">Văn hóa & trải nghiệm</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPLORE_CULTURE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    onChange({ selectedCulture: toggleInList(filters.selectedCulture, c) })
                  }
                  className={`text-[10px] font-medium px-2 py-1 rounded-md border ${
                    filters.selectedCulture.includes(c)
                      ? 'bg-violet-100 border-violet-300 text-violet-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tiện ích */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="text-[11px] font-bold text-slate-600">Tiện ích</label>
            <button
              type="button"
              onClick={() => onChange({ onlyBookmarked: !filters.onlyBookmarked })}
              className={`w-full flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                filters.onlyBookmarked
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
