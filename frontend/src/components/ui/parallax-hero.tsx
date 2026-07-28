import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxLayer {
  src: string;
  alt: string;
  speedX: number;
  speedY: number;
  speedZ: number;
  rotation: number;
  distance: number;
  className?: string;
  zIndex: number;
  initialTop: string;
  initialLeft: string;
  width: string;
}

interface ParallaxHeroProps {
  layers?: ParallaxLayer[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const defaultLayers: ParallaxLayer[] = [
  { src: 'https://i.ibb.co/9mHk68Gj/background.png', alt: 'bg', speedX: 0.03, speedY: 0.038, speedZ: 0, rotation: 0, distance: -200, zIndex: 1, initialTop: '50%', initialLeft: '50%', width: '1800px' },
  { src: 'https://i.ibb.co/DHhNwG0X/fog-7.png', alt: 'fog7', speedX: 0.27, speedY: 0.32, speedZ: 0, rotation: 0, distance: 850, zIndex: 2, initialTop: 'calc(50% - 40px)', initialLeft: 'calc(50% + 100px)', width: '1100px' },
  { src: 'https://i.ibb.co/4gT3LR9K/mountain-10.png', alt: 'm10', speedX: 0.095, speedY: 0.005, speedZ: 0, rotation: 0, distance: 1110, zIndex: 3, initialTop: 'calc(50% + 90px)', initialLeft: 'calc(50% + 150px)', width: '700px' },
  { src: 'https://i.ibb.co/rW6cjXV/fog-6.png', alt: 'fog6', speedX: 0.25, speedY: 0.28, speedZ: 0, rotation: 0, distance: 1400, zIndex: 5, initialTop: 'calc(50% + 110px)', initialLeft: '50%', width: '1200px', className: 'opacity-30' },
  { src: 'https://i.ibb.co/zHWDdxRR/mountain-9.png', alt: 'm9', speedX: 0.125, speedY: 0.155, speedZ: 0.15, rotation: 0.02, distance: 1700, zIndex: 6, initialTop: 'calc(50% + 130px)', initialLeft: 'calc(50% - 300px)', width: '400px' },
  { src: 'https://i.ibb.co/jFSMJ2t/fog-5.png', alt: 'fog5', speedX: 0.16, speedY: 0.105, speedZ: 0, rotation: 0, distance: 1900, zIndex: 7, initialTop: 'calc(50% + 150px)', initialLeft: 'calc(50% + 20px)', width: '380px' },
  { src: 'https://i.ibb.co/Fq5CHqZ6/mountain-7.png', alt: 'm7', speedX: 0.1, speedY: 0.1, speedZ: 0, rotation: 0.09, distance: 2000, zIndex: 8, initialTop: 'calc(50% + 100px)', initialLeft: 'calc(50% + 240px)', width: '420px' },
  { src: 'https://i.ibb.co/N2TjCDLQ/mountain-6.png', alt: 'm6', speedX: 0.065, speedY: 0.05, speedZ: 0.05, rotation: 0.12, distance: 2300, zIndex: 9, initialTop: 'calc(50% + 60px)', initialLeft: 'calc(50% + 280px)', width: '250px' },
  { src: 'https://i.ibb.co/23Xc3QwX/fog-4.png', alt: 'fog4', speedX: 0.135, speedY: 0.1, speedZ: 0, rotation: 0, distance: 2400, zIndex: 10, initialTop: 'calc(50% + 100px)', initialLeft: 'calc(50% + 200px)', width: '350px', className: 'opacity-50' },
  { src: 'https://i.ibb.co/SSfDbsF/mountain-5.png', alt: 'm5', speedX: 0.08, speedY: 0.05, speedZ: 0.13, rotation: 0.1, distance: 2550, zIndex: 11, initialTop: 'calc(50% + 140px)', initialLeft: 'calc(50% + 120px)', width: '420px' },
  { src: 'https://i.ibb.co/chZkMKzX/fog-3.png', alt: 'fog3', speedX: 0.11, speedY: 0.018, speedZ: 0, rotation: 0, distance: 2800, zIndex: 12, initialTop: 'calc(50% + 90px)', initialLeft: '50%', width: '900px' },
  { src: 'https://i.ibb.co/39PKgGNS/mountain-4.png', alt: 'm4', speedX: 0.059, speedY: 0.024, speedZ: 0.35, rotation: 0.14, distance: 3200, zIndex: 13, initialTop: 'calc(50% + 90px)', initialLeft: 'calc(50% - 320px)', width: '650px' },
  { src: 'https://i.ibb.co/rKHGSD9S/mountain-3.png', alt: 'm3', speedX: 0.04, speedY: 0.018, speedZ: 0.32, rotation: 0.05, distance: 3400, zIndex: 14, initialTop: 'calc(50% - 10px)', initialLeft: 'calc(50% + 350px)', width: '380px' },
  { src: 'https://i.ibb.co/bj0s7gRP/fog-2.png', alt: 'fog2', speedX: 0.15, speedY: 0.0115, speedZ: 0, rotation: 0, distance: 3600, zIndex: 15, initialTop: 'calc(50% - 10px)', initialLeft: 'calc(50% + 320px)', width: '650px' },
  { src: 'https://i.ibb.co/7tHMfwZH/mountain-2.png', alt: 'm2', speedX: 0.0235, speedY: 0.013, speedZ: 0.42, rotation: 0.15, distance: 3800, zIndex: 16, initialTop: 'calc(50% + 110px)', initialLeft: 'calc(50% + 320px)', width: '480px' },
  { src: 'https://i.ibb.co/Knh5tBS/mountain-1.png', alt: 'm1', speedX: 0.027, speedY: 0.018, speedZ: 0.53, rotation: 0.2, distance: 4000, zIndex: 17, initialTop: 'calc(50% + 90px)', initialLeft: 'calc(50% - 320px)', width: '650px' },
  { src: 'https://i.ibb.co/Y41vTxSN/fog-1.png', alt: 'fog1', speedX: 0.12, speedY: 0.01, speedZ: 0, rotation: 0, distance: 4200, zIndex: 18, initialTop: 'calc(100% - 120px)', initialLeft: 'calc(50% + 40px)', width: '1100px', className: 'opacity-50' },
];

export const ParallaxHero: React.FC<ParallaxHeroProps> = ({
  layers = defaultLayers,
  title = 'TERRAHOLIC',
  subtitle = 'Hành trình của bạn đang chờ • Điền thông tin ở bên trái để AI lập kế hoạch',
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newXValue = e.clientX - (rect.left + rect.width / 2);
      const newYValue = e.clientY - (rect.top + rect.height / 2);
      const newRotateDegree = (newXValue / (rect.width / 2)) * 15;

      updateLayers(e.clientX, newXValue, newYValue, newRotateDegree);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const updateLayers = (cursorPosition: number, xVal: number, yVal: number, rotateDeg: number) => {
    layerRefs.current.forEach((el, index) => {
      if (!el) return;
      const layer = layers[index];
      const { speedX, speedY, speedZ, rotation } = layer;
      const computedLeft = parseFloat(getComputedStyle(el).left.replace('px', ''));
      const isInLeft = computedLeft < window.innerWidth / 2 ? 1 : -1;
      const zValue = (cursorPosition - computedLeft) * isInLeft * 0.1;

      el.style.transform = `perspective(2300px) translateZ(${zValue * speedZ}px) rotateY(${rotateDeg * rotation}deg) translateX(calc(-50% + ${-xVal * speedX}px)) translateY(calc(-50% + ${yVal * speedY}px))`;
    });

    if (textRef.current) {
      textRef.current.style.transform = `perspective(2300px) translateX(calc(-50% + ${-xVal * 0.05}px)) translateY(calc(-50% + ${yVal * 0.03}px))`;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-[480px] w-full overflow-hidden rounded-3xl bg-[#0b1726] shadow-2xl border border-sky-900/30',
        className
      )}
    >
      {/* Gradient phủ mờ nhẹ dịu góc */}
      <div className="absolute inset-0 z-[100] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_35%,rgba(11,23,38,0.75))]" />

      {/* Render các Layer Ảnh Parallax (Giữ nguyên mảng layers) */}
      {layers.map((layer, index) => (
        <img
          key={index}
          ref={(el) => {
            if (el) layerRefs.current[index] = el;
          }}
          src={layer.src}
          alt={layer.alt}
          className={cn(
            'absolute pointer-events-none transition-transform duration-[300ms] ease-out select-none',
            layer.className
          )}
          style={{
            width: layer.width,
            top: layer.initialTop,
            left: layer.initialLeft,
            zIndex: layer.zIndex,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Chữ TERRAHOLIC Đẩy Đẩy Lên Cao (top: 30%, left: 47.5%, zIndex: 14) */}
      <div
        ref={textRef}
        className="absolute z-[14] text-center pointer-events-none transition-transform duration-[300ms] ease-out w-full px-2 flex flex-col items-center justify-center"
        style={{
          top: '30%',
          left: '47.5%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <h1 className="font-black text-4xl sm:text-5xl md:text-6xl lg:text-[5.75rem] leading-none tracking-[0.03em] text-white/95 uppercase drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)] select-none">
          {title}
        </h1>
      </div>

      {/* Subtitle Badge Kính Mờ Đêm Cao Cấp Terraholic AI (zIndex: 30) */}
      <div
        className="absolute z-[30] text-center pointer-events-auto transition-transform duration-[300ms] ease-out w-full px-4 flex justify-center"
        style={{
          top: '54%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="inline-flex items-center gap-3 bg-slate-950/65 backdrop-blur-2xl px-6 py-3 rounded-full border border-sky-400/25 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.15)] text-white group hover:border-sky-400/50 transition-all duration-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-sky-400 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
          </span>
          <span className="text-xs md:text-sm font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-white drop-shadow-[0_2px_8px_rgba(56,189,248,0.3)]">
            Hành Trình Của Bạn Đang Chờ
          </span>
          <span className="text-sky-400/50 font-light">•</span>
          <span className="text-xs md:text-sm font-medium text-slate-200/90 tracking-normal">
            Điền thông tin ở bên trái để AI tạo lịch trình
          </span>
        </div>
      </div>
    </div>
  );
};

export default ParallaxHero;
