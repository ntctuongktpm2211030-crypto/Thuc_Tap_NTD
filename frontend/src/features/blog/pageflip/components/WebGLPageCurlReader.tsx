import React, { useState, useEffect, useRef } from 'react';
import { SpringSolver } from '../physics/SpringSolver';
import { DOMTextureSolver } from '../texture/DOMTextureSolver';
import { WebGLBookEngine } from '../engine/WebGLBookEngine';

interface WebGLPageCurlReaderProps {
  title: string;
  pages: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
}

// Reusable single page sheet component supporting desktop spreads (left/right halves)
const PageSheet = React.forwardRef<HTMLDivElement, { 
  title: string; 
  content: string; 
  pageNumber: number; 
  totalPages: number;
  half?: 'left' | 'right' | 'full';
  style?: React.CSSProperties;
}>(({ 
  title, 
  content, 
  pageNumber, 
  totalPages,
  half = 'full',
  style 
}, ref) => {
  const isLeft = half === 'left';
  const isRight = half === 'right';

  const cardStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#FDFCF8',
    boxSizing: 'border-box',
    border: '1px solid rgba(120, 53, 4, 0.06)',
    borderRadius: isLeft ? '24px 0 0 24px' : isRight ? '0 24px 24px 0' : '24px',
    boxShadow: isLeft 
      ? '-8px 8px 24px rgba(0,0,0,0.12)' 
      : isRight 
        ? '8px 8px 24px rgba(0,0,0,0.12)' 
        : '0 8px 32px rgba(0,0,0,0.15)',
    ...style
  };

  const contentStyle: React.CSSProperties = {
    position: 'absolute',
    left: isLeft ? 0 : isRight ? '-100%' : 0,
    top: 0,
    width: half === 'full' ? '100%' : '200%',
    height: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div ref={ref} style={cardStyle} className="paper-sheet">
      <div className="paper-grain" />
      <div style={contentStyle} className="p-6 sm:p-8 flex flex-col justify-between h-full">
        {isLeft && <div className="book-spine-left" />}
        {isRight && <div className="book-spine-right" />}

        {/* Header section */}
        <div className="flex justify-between items-center border-b border-amber-900/10 pb-3 z-10">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 font-editorial">
            {title}
          </span>
          <span className="text-[10px] font-bold text-amber-900/60 uppercase tracking-widest">
            Trang {pageNumber} / {totalPages}
          </span>
        </div>

        {/* Text Body */}
        <div className="my-4 flex-grow columns-1 md:columns-2 gap-8 text-justify leading-relaxed sm:leading-loose text-slate-800 dark:text-slate-900 text-xs sm:text-[13.5px] tracking-normal z-10 overflow-hidden font-medium">
          {content}
        </div>
      </div>
    </div>
  );
});

PageSheet.displayName = 'PageSheet';

export default function WebGLPageCurlReader({ title, pages, currentPage, onPageChange }: WebGLPageCurlReaderProps) {
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isFlipping, setIsFlipping] = useState(false);
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState(1);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [touchdownAngle, setTouchdownAngle] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webGLBookEngineRef = useRef<WebGLBookEngine | null>(null);

  // Hidden references for offscreen DOM capture
  const fromDOMRef = useRef<HTMLDivElement>(null);
  const toDOMRef = useRef<HTMLDivElement>(null);

  const totalPages = pages.length;

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (webGLBookEngineRef.current) {
        webGLBookEngineRef.current.destroy();
      }
    };
  }, []);

  const startFlip = (dir: 'next' | 'prev', from: number, to: number) => {
    setDirection(dir);
    setFromPage(from);
    setToPage(to);
    setIsFlipping(true);
    setTouchdownAngle(0);

    // Give React a tick to mount the offscreen hidden DOM containers
    setTimeout(async () => {
      if (!containerRef.current || !canvasRef.current || !fromDOMRef.current || !toDOMRef.current) {
        setIsFlipping(false);
        return;
      }

      // 1. Initialize WebGL Book Engine
      if (webGLBookEngineRef.current) {
        webGLBookEngineRef.current.destroy();
      }
      webGLBookEngineRef.current = new WebGLBookEngine(containerRef.current, canvasRef.current, dir);

      // 2. High-res canvas textures (1024 x 1366 px)
      const frontCanvas = document.createElement('canvas');
      frontCanvas.width = 1024;
      frontCanvas.height = 1366;

      const backCanvas = document.createElement('canvas');
      backCanvas.width = 1024;
      backCanvas.height = 1366;

      // 3. Rasterize DOM components to textures preserving native CSS, font & images
      await Promise.all([
        DOMTextureSolver.capture(fromDOMRef.current, frontCanvas),
        DOMTextureSolver.capture(toDOMRef.current, backCanvas)
      ]);

      if (webGLBookEngineRef.current) {
        webGLBookEngineRef.current.updateTextures(frontCanvas, backCanvas);
      }

      // 4. Run Physics Spring Solver Tick Loop
      const spring = new SpringSolver(1.0, 130.0, 18.0);
      spring.reset(0, 1.0);

      let lastTime = performance.now();

      const tick = (now: number) => {
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        spring.step(dt);

        if (webGLBookEngineRef.current) {
          webGLBookEngineRef.current.updateAnimation(spring.position, dir);
        }

        if (!spring.isSettled()) {
          requestAnimationFrame(tick);
        } else {
          // Flip complete, restore flat interactive HTML DOM
          setIsFlipping(false);
          onPageChange(to);
          
          if (webGLBookEngineRef.current) {
            webGLBookEngineRef.current.destroy();
            webGLBookEngineRef.current = null;
          }

          // Settling follow-through wobble animation (120ms)
          let wobbleStartTime = performance.now();
          const wobbleTick = (wobbleNow: number) => {
            const elapsed = wobbleNow - wobbleStartTime;
            if (elapsed < 120) {
              const angle = 0.42 * (1.0 - elapsed / 120);
              setTouchdownAngle(angle);
              requestAnimationFrame(wobbleTick);
            } else {
              setTouchdownAngle(0);
            }
          };
          requestAnimationFrame(wobbleTick);
        }
      };

      requestAnimationFrame(tick);
    }, 0);
  };

  const handleNext = () => {
    if (currentPage < totalPages && !isFlipping) {
      startFlip('next', currentPage, currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1 && !isFlipping) {
      startFlip('prev', currentPage, currentPage - 1);
    }
  };

  return (
    <div className="relative w-full flex flex-col select-none">
      {/* Offscreen DOM capture containers (fully rendered by React to apply stylesheet rules) */}
      {isFlipping && (
        <div style={{ position: 'absolute', top: -9999, left: -9999, width: 512, height: 683, overflow: 'hidden' }}>
          <div ref={fromDOMRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <PageSheet 
              title={title} 
              content={pages[fromPage - 1] || ''} 
              pageNumber={fromPage} 
              totalPages={totalPages} 
              half={isDesktop ? (direction === 'next' ? 'right' : 'left') : 'full'}
            />
          </div>
          <div ref={toDOMRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <PageSheet 
              title={title} 
              content={pages[toPage - 1] || ''} 
              pageNumber={toPage} 
              totalPages={totalPages} 
              half={isDesktop ? (direction === 'next' ? 'left' : 'right') : 'full'}
            />
          </div>
        </div>
      )}

      {/* ── BOOK VIEWPORT CONTAINER ── */}
      <div 
        ref={containerRef}
        className="relative w-full min-h-[420px] sm:min-h-[440px] book-viewport overflow-hidden"
      >
        {/* 1. WebGL Canvas overlay */}
        {isFlipping && (
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-30 pointer-events-none"
          />
        )}

        {/* 2. Static Underneath Page */}
        {isFlipping && (
          <div className="absolute inset-0 z-0">
            {isDesktop ? (
              <div className="absolute inset-0 flex">
                <div className="relative w-1/2 h-full">
                  <PageSheet 
                    title={title} 
                    content={pages[toPage - 1] || ''} 
                    pageNumber={toPage} 
                    totalPages={totalPages} 
                    half="left"
                  />
                </div>
                <div className="relative w-1/2 h-full">
                  <PageSheet 
                    title={title} 
                    content={pages[toPage - 1] || ''} 
                    pageNumber={toPage} 
                    totalPages={totalPages} 
                    half="right"
                  />
                </div>
              </div>
            ) : (
              <PageSheet 
                title={title} 
                content={pages[toPage - 1] || ''} 
                pageNumber={toPage} 
                totalPages={totalPages} 
                half="full"
              />
            )}
          </div>
        )}

        {/* 3. Static Side Cover Page */}
        {isFlipping && isDesktop && (
          <div 
            className="absolute top-0 bottom-0 z-10"
            style={{
              left: direction === 'next' ? 0 : '50%',
              width: '50%',
            }}
          >
            <PageSheet 
              title={title} 
              content={pages[fromPage - 1] || ''} 
              pageNumber={fromPage} 
              totalPages={totalPages} 
              half={direction === 'next' ? 'left' : 'right'}
            />
          </div>
        )}

        {/* 4. Interactive HTML DOM Content */}
        {!isFlipping && (
          <>
            {isDesktop ? (
              <div className="absolute inset-0 flex">
                <div className="relative w-1/2 h-full">
                  <PageSheet 
                    title={title} 
                    content={pages[currentPage - 1] || ''} 
                    pageNumber={currentPage} 
                    totalPages={totalPages} 
                    half="left"
                    style={direction === 'prev' && touchdownAngle ? {
                      transform: `rotateY(${touchdownAngle}deg)`,
                      transformOrigin: 'right center',
                      transition: 'none'
                    } : {}}
                  />
                </div>
                <div className="relative w-1/2 h-full">
                  <PageSheet 
                    title={title} 
                    content={pages[currentPage - 1] || ''} 
                    pageNumber={currentPage} 
                    totalPages={totalPages} 
                    half="right"
                    style={direction === 'next' && touchdownAngle ? {
                      transform: `rotateY(${-touchdownAngle}deg)`,
                      transformOrigin: 'left center',
                      transition: 'none'
                    } : {}}
                  />
                </div>
              </div>
            ) : (
              <PageSheet 
                title={title} 
                content={pages[currentPage - 1] || ''} 
                pageNumber={currentPage} 
                totalPages={totalPages} 
                half="full"
                style={touchdownAngle ? {
                  transform: `rotateY(${direction === 'next' ? -touchdownAngle : touchdownAngle}deg)`,
                  transformOrigin: direction === 'next' ? 'left center' : 'right center',
                  transition: 'none'
                } : {}}
              />
            )}
          </>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex justify-between items-center border-t border-amber-900/10 pt-4 mt-4 z-20">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1 || isFlipping}
          className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
        >
          ◀ PREVIOUS PAGE
        </button>
        
        <span className="text-xs font-bold text-slate-500 font-editorial">
          Page {currentPage} / {totalPages}
        </span>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || isFlipping}
          className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all font-bold"
        >
          NEXT PAGE ▶
        </button>
      </div>
    </div>
  );
}
