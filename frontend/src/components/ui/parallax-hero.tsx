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
  { src: 'https://i.ibb.co/9mHk68Gj/background.png', alt: 'bg', speedX: 0.03, speedY: 0.038, speedZ: 0, rotation: 0, distance: -200, zIndex: 1, initialTop: '42%', initialLeft: '50%', width: '3200px' },
  { src: 'https://i.ibb.co/DHhNwG0X/fog-7.png', alt: 'fog7', speedX: 0.27, speedY: 0.32, speedZ: 0, rotation: 0, distance: 850, zIndex: 2, initialTop: 'calc(50% - 60px)', initialLeft: 'calc(50% + 100px)', width: '1200px' },
  { src: 'https://i.ibb.co/4gT3LR9K/mountain-10.png', alt: 'm10', speedX: 0.095, speedY: 0.005, speedZ: 0, rotation: 0, distance: 1110, zIndex: 3, initialTop: 'calc(50% + 70px)', initialLeft: 'calc(50% + 150px)', width: '750px' },
  { src: 'https://i.ibb.co/rW6cjXV/fog-6.png', alt: 'fog6', speedX: 0.25, speedY: 0.28, speedZ: 0, rotation: 0, distance: 1400, zIndex: 5, initialTop: 'calc(50% + 90px)', initialLeft: '50%', width: '1250px', className: 'opacity-30' },
  { src: 'https://i.ibb.co/zHWDdxRR/mountain-9.png', alt: 'm9', speedX: 0.125, speedY: 0.155, speedZ: 0.15, rotation: 0.02, distance: 1700, zIndex: 6, initialTop: 'calc(50% + 100px)', initialLeft: 'calc(50% - 300px)', width: '420px' },
  { src: 'https://i.ibb.co/jFSMJ2t/fog-5.png', alt: 'fog5', speedX: 0.16, speedY: 0.105, speedZ: 0, rotation: 0, distance: 1900, zIndex: 7, initialTop: 'calc(50% + 120px)', initialLeft: 'calc(50% + 20px)', width: '400px' },
  { src: 'https://i.ibb.co/Fq5CHqZ6/mountain-7.png', alt: 'm7', speedX: 0.1, speedY: 0.1, speedZ: 0, rotation: 0.09, distance: 2000, zIndex: 8, initialTop: 'calc(50% + 80px)', initialLeft: 'calc(50% + 240px)', width: '440px' },
  { src: 'https://i.ibb.co/N2TjCDLQ/mountain-6.png', alt: 'm6', speedX: 0.065, speedY: 0.05, speedZ: 0.05, rotation: 0.12, distance: 2300, zIndex: 9, initialTop: 'calc(50% + 40px)', initialLeft: 'calc(50% + 280px)', width: '280px' },
  { src: 'https://i.ibb.co/23Xc3QwX/fog-4.png', alt: 'fog4', speedX: 0.135, speedY: 0.1, speedZ: 0, rotation: 0, distance: 2400, zIndex: 10, initialTop: 'calc(50% + 80px)', initialLeft: 'calc(50% + 200px)', width: '380px', className: 'opacity-50' },
  { src: 'https://i.ibb.co/SSfDbsF/mountain-5.png', alt: 'm5', speedX: 0.08, speedY: 0.05, speedZ: 0.13, rotation: 0.1, distance: 2550, zIndex: 11, initialTop: 'calc(50% + 120px)', initialLeft: 'calc(50% + 120px)', width: '440px' },
  { src: 'https://i.ibb.co/chZkMKzX/fog-3.png', alt: 'fog3', speedX: 0.11, speedY: 0.018, speedZ: 0, rotation: 0, distance: 2800, zIndex: 12, initialTop: 'calc(50% + 70px)', initialLeft: '50%', width: '950px' },
  { src: 'https://i.ibb.co/39PKgGNS/mountain-4.png', alt: 'm4', speedX: 0.059, speedY: 0.024, speedZ: 0.35, rotation: 0.14, distance: 3200, zIndex: 13, initialTop: 'calc(50% + 10px)', initialLeft: 'calc(50% - 340px)', width: '780px' },
  { src: 'https://i.ibb.co/rKHGSD9S/mountain-3.png', alt: 'm3', speedX: 0.04, speedY: 0.018, speedZ: 0.32, rotation: 0.05, distance: 3400, zIndex: 14, initialTop: 'calc(50% - 30px)', initialLeft: 'calc(50% + 350px)', width: '420px' },
  { src: 'https://i.ibb.co/7tHMfwZH/mountain-2.png', alt: 'm2', speedX: 0.0235, speedY: 0.013, speedZ: 0.42, rotation: 0.15, distance: 3800, zIndex: 16, initialTop: 'calc(50% + 90px)', initialLeft: 'calc(50% + 320px)', width: '520px' },
  { src: 'https://i.ibb.co/Knh5tBS/mountain-1.png', alt: 'm1', speedX: 0.027, speedY: 0.018, speedZ: 0.53, rotation: 0.2, distance: 4000, zIndex: 17, initialTop: 'calc(50% + 10px)', initialLeft: 'calc(50% - 340px)', width: '780px' },
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

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [layers]);

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
        'relative h-full min-h-[480px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#5594a7] via-[#2d697d] to-[#1b4353]',
        className
      )}
    >
      {/* Full-Cover Base Sky & Forest Layer (Guarantees top rounded corners & border are touched seamlessly without gaps) */}
      <img
        src="https://i.ibb.co/9mHk68Gj/background.png"
        alt="full-cover-sky-forest"
        className="absolute inset-0 w-full h-full object-cover object-top scale-105 pointer-events-none z-0 opacity-95"
      />

      {/* Render các Layer Ảnh Parallax (Giữ nguyên mảng layers) */}
      {layers.map((layer, index) => (
        <img
          key={index}
          ref={(el) => {
            if (el) layerRefs.current[index] = el;
          }}
          src={layer.src}
          alt={layer.alt}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
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

      {/* Text Container Layout matching Image 2 Reference */}
      {/* Text Container Layout matching Image 2 Reference */}
      {/* 1. TOP CURSIVE TITLE: "Hành Trình Của Bạn / Đang Chờ" (Slightly Smaller, No Pin Icon) */}
      <div
        className="absolute z-[30] text-center pointer-events-none transition-transform duration-[300ms] ease-out w-full px-4 flex justify-center"
        style={{
          top: '22%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="flex flex-col items-center justify-center -space-y-1.5 sm:-space-y-2">
          {/* Line 1: Hành Trình Của Bạn */}
          <span 
            style={{ fontFamily: "'Dancing Script', 'Caveat', cursive" }} 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-100 via-cyan-200 to-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] -rotate-3"
          >
            Hành Trình Của Bạn
          </span>

          {/* Line 2: Đang Chờ */}
          <span 
            style={{ fontFamily: "'Dancing Script', 'Caveat', cursive" }} 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-100 to-teal-200 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] -rotate-1"
          >
            Đang Chờ
          </span>
        </div>
      </div>

      {/* 2. MAIN TITLE: "TERRAHOLIC" (Slightly Smaller Center Title) */}
      <div
        ref={textRef}
        className="absolute z-[14] text-center pointer-events-none transition-transform duration-[300ms] ease-out w-full px-2 flex flex-col items-center justify-center"
        style={{
          top: '39%',
          left: '47.5%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <h1 className="font-black text-3xl sm:text-5xl md:text-6xl lg:text-[4.6rem] leading-none tracking-[0.05em] text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-200 to-sky-500 uppercase drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] select-none">
          {title}
        </h1>
      </div>

      {/* 3. BOTTOM BADGE: "📍 Điền thông tin ở bên trái để AI tạo lịch trình ✨" (BELOW TERRAHOLIC) */}
      <div
        className="absolute z-[30] text-center pointer-events-auto transition-transform duration-[300ms] ease-out w-full px-4 flex justify-center"
        style={{
          top: '58%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="inline-flex items-center gap-2 bg-slate-950/70 backdrop-blur-2xl px-6 py-3 rounded-full border border-cyan-400/40 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.2)] text-white group hover:border-cyan-400/70 transition-all duration-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
          </span>
          <span className="text-xs md:text-sm font-semibold text-slate-100 tracking-normal">
            Điền thông tin ở bên trái để <strong className="text-sky-300 font-bold">AI</strong> tạo lịch trình
          </span>
        </div>
      </div>
    </div>
  );
};

export default ParallaxHero;
