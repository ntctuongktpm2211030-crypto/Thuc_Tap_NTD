import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Home, Compass, Map, Sparkles, Bookmark,
  Users, Utensils, Gem, Backpack, Mountain, Landmark, Camera,
  Plane, TrainFront, Bus, Car, Bike, Ship,
  Lightbulb, Hotel, Wallet, AlertTriangle, MapPin,
  Coffee, Sunrise, ShoppingBag, Theater, Waves, Palette,
  Heart, Smile, Leaf, Flame, Sparkle, ThumbsUp, Star,
  Sun, Cloud, CloudRain, Snowflake, CloudSun,
  FileText, Calendar, Eye, BookOpen, Route,
} from 'lucide-react';

export interface ModernIconPodProps {
  icon: LucideIcon;
  variant?: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
}

export const ModernIconPod: React.FC<ModernIconPodProps> = ({
  icon: Icon,
  variant = 'brand',
  size = 'md',
  active = false,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25';
      case 'amber':
        return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25';
      case 'rose':
        return 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/25';
      case 'violet':
        return 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/25';
      case 'sky':
        return 'bg-gradient-to-br from-sky-400 to-brand-600 text-white shadow-sky-500/25';
      case 'glass':
        return active
          ? 'bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-brand-500/30'
          : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-sm';
      case 'brand':
      default:
        return 'bg-gradient-to-br from-brand-600 via-brand-500 to-sky-500 text-white shadow-brand-500/30';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { container: 'p-1.5 rounded-xl shadow-md', iconSize: 14 };
      case 'lg':
        return { container: 'p-3.5 rounded-2xl shadow-xl', iconSize: 22 };
      case 'md':
      default:
        return { container: 'p-2.5 rounded-2xl shadow-lg', iconSize: 18 };
    }
  };

  const sz = getSizeStyles();

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-all duration-300 transform group-hover:scale-110 ${sz.container} ${getVariantStyles()} ${className}`}
    >
      <Icon size={sz.iconSize} className="stroke-[2.25px]" />
    </div>
  );
};

/** Nav & quick links */
export const NAV_ICONS = {
  feed: Home,
  explore: Compass,
  map: Map,
  trips: Sparkles,
  saved: Bookmark,
  createPost: FileText,
  createJourney: Route,
} as const;

/** Feed filters */
export const FILTER_ICONS: Record<string, LucideIcon> = {
  all: Sparkle,
  following: Users,
  adventure: Mountain,
  food: Utensils,
  luxury: Gem,
  budget: Backpack,
};

/** Journey / post categories */
export const JOURNEY_CATEGORIES: { id: string; label: string; icon: LucideIcon; accent: string }[] = [
  { id: 'adventure', label: 'Phiêu lưu', icon: Mountain, accent: 'violet' },
  { id: 'food', label: 'Ẩm thực', icon: Utensils, accent: 'amber' },
  { id: 'luxury', label: 'Sang trọng', icon: Gem, accent: 'rose' },
  { id: 'budget', label: 'Tiết kiệm', icon: Wallet, accent: 'teal' },
  { id: 'culture', label: 'Văn hóa', icon: Landmark, accent: 'sky' },
  { id: 'nature', label: 'Thiên nhiên', icon: Leaf, accent: 'emerald' },
];

export const POST_CATEGORIES: { id: string; label: string; icon: LucideIcon; chip: string }[] = [
  { id: 'travel', label: 'Du lịch', icon: Plane, chip: 'travel' },
  { id: 'food', label: 'Ẩm thực', icon: Utensils, chip: 'food' },
  { id: 'tips', label: 'Mẹo hay', icon: Lightbulb, chip: 'tips' },
  { id: 'review', label: 'Review', icon: Star, chip: 'review' },
  { id: 'photo', label: 'Nhiếp ảnh', icon: Camera, chip: 'photo' },
  { id: 'culture', label: 'Văn hóa', icon: Landmark, chip: 'culture' },
];

export const MOODS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'amazing', label: 'Tuyệt vời', icon: Sparkle },
  { id: 'happy', label: 'Vui vẻ', icon: Smile },
  { id: 'relaxed', label: 'Thư giãn', icon: Leaf },
  { id: 'adventurous', label: 'Phiêu lưu', icon: Flame },
  { id: 'romantic', label: 'Lãng mạn', icon: Heart },
  { id: 'inspired', label: 'Cảm hứng', icon: Lightbulb },
];

export const TRANSPORTS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'plane', label: 'Máy bay', icon: Plane },
  { id: 'train', label: 'Tàu hỏa', icon: TrainFront },
  { id: 'bus', label: 'Xe buýt', icon: Bus },
  { id: 'car', label: 'Ô tô', icon: Car },
  { id: 'motorbike', label: 'Xe máy', icon: Bike },
  { id: 'boat', label: 'Tàu thuyền', icon: Ship },
];

export const TIP_CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'general', label: 'Mẹo chung', icon: Lightbulb },
  { id: 'stay', label: 'Nơi ở', icon: Hotel },
  { id: 'food', label: 'Ẩm thực', icon: Utensils },
  { id: 'budget', label: 'Tiết kiệm', icon: Wallet },
  { id: 'warning', label: 'Lưu ý', icon: AlertTriangle },
  { id: 'photo', label: 'Chụp ảnh', icon: Camera },
];

export const ACTIVITY_TYPES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'place', label: 'Địa điểm', icon: MapPin },
  { id: 'hotel', label: 'Nghỉ dưỡng', icon: Hotel },
  { id: 'food', label: 'Ăn uống', icon: Utensils },
  { id: 'hike', label: 'Leo núi', icon: Mountain },
  { id: 'beach', label: 'Biển', icon: Waves },
  { id: 'transport', label: 'Di chuyển', icon: Car },
  { id: 'culture', label: 'Văn hóa', icon: Theater },
  { id: 'shop', label: 'Mua sắm', icon: ShoppingBag },
  { id: 'cafe', label: 'Cà phê', icon: Coffee },
  { id: 'sunrise', label: 'Bình minh', icon: Sunrise },
  { id: 'boat', label: 'Thuyền', icon: Ship },
  { id: 'art', label: 'Nghệ thuật', icon: Palette },
];

export const WEATHER_OPTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'sunny', label: 'Nắng đẹp', icon: Sun },
  { id: 'cloudy', label: 'Mây một phần', icon: Cloud },
  { id: 'rainy', label: 'Mưa', icon: CloudRain },
  { id: 'cold', label: 'Lạnh', icon: Snowflake },
  { id: 'mixed', label: 'Thay đổi', icon: CloudSun },
];

export const TRIP_ACTIVITY_ICONS: Record<string, LucideIcon> = {
  attraction: Landmark,
  restaurant: Utensils,
  hotel: Hotel,
  nature: Leaf,
  festival: Flame,
};

export const JOURNEY_STEPS: { id: number; label: string; icon: LucideIcon }[] = [
  { id: 1, label: 'Nội dung', icon: BookOpen },
  { id: 2, label: 'Media', icon: Camera },
  { id: 3, label: 'Vị trí', icon: MapPin },
  { id: 4, label: 'Lịch trình', icon: Calendar },
  { id: 5, label: 'Xem trước', icon: Eye },
];

export const CONTENT_INSERT_ICONS: { icon: LucideIcon; insert: string }[] = [
  { icon: MapPin, insert: '[Địa điểm] ' },
  { icon: Lightbulb, insert: '[Mẹo] ' },
  { icon: AlertTriangle, insert: '[Lưu ý] ' },
  { icon: Star, insert: '[Đánh giá] ' },
  { icon: Camera, insert: '[Ảnh] ' },
];

export const RATING_LABELS: Record<number, { text: string; icon: LucideIcon }> = {
  5: { text: 'Hoàn hảo', icon: Sparkle },
  4: { text: 'Rất tốt', icon: ThumbsUp },
  3: { text: 'Tốt', icon: Smile },
  2: { text: 'Bình thường', icon: Leaf },
  1: { text: 'Chưa tốt', icon: AlertTriangle },
};
