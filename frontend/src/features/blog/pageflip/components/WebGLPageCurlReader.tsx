import React, { useState, useEffect, useRef } from 'react';
import { BookRenderer } from '../engine/BookRenderer';
import { TextureRenderer } from '../engine/TextureRenderer';

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

  // Normalize Unicode content to NFC canonical composition form.
  // This merges base vowels and combining diacritics into single precomposed characters,
  // preventing browsers from spacing them apart under text-justify (align: justify).
  const normalizedContent = content.normalize('NFC');

  const cardStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#FDFCF8',
    boxSizing: 'border-box',
    border: '1px solid rgba(120, 53, 4, 0.05)',
    borderRadius: isLeft ? '16px 0 0 16px' : isRight ? '0 16px 16px 0' : '16px',
    boxShadow: isLeft 
      ? '-8px 12px 30px rgba(0,0,0,0.1), inset -16px 0 24px rgba(0,0,0,0.03)' 
      : isRight 
        ? '8px 12px 30px rgba(0,0,0,0.1), inset 16px 0 24px rgba(0,0,0,0.03)' 
        : '0 8px 32px rgba(0,0,0,0.12), inset 0 0 15px rgba(0,0,0,0.04)',
    borderLeft: isRight ? '1px solid rgba(255,255,255,0.7)' : '1px solid rgba(120, 53, 4, 0.05)',
    borderRight: isLeft ? '1px solid rgba(255,255,255,0.7)' : '1px solid rgba(120, 53, 4, 0.05)',
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

  // Fixed column count to prevent wrapping and splitting words in half
  const bodyStyle: React.CSSProperties = {
    columnCount: half === 'full' ? 1 : 2,
    columnGap: '3rem',
    textAlign: 'justify',
    lineHeight: 1.8,
    fontFamily: '"Times New Roman", Times, serif',
    color: '#2C2621'
  };

  return (
    <div ref={ref} style={cardStyle} className="paper-sheet relative">
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.042]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Multi-layered paper stack skeuomorphic borders */}
      {isLeft && (
        <>
          <div className="absolute left-[-2px] top-[2px] bottom-[2px] right-[2px] bg-[#fcfbf7] border border-amber-900/5 rounded-[16px_0_0_16px] shadow-sm -z-10 pointer-events-none" />
          <div className="absolute left-[-4px] top-[4px] bottom-[4px] right-[4px] bg-[#faf8f0] border border-amber-900/5 rounded-[16px_0_0_16px] shadow-sm -z-20 pointer-events-none" />
        </>
      )}
      {isRight && (
        <>
          <div className="absolute right-[-2px] top-[2px] bottom-[2px] left-[2px] bg-[#fcfbf7] border border-amber-900/5 rounded-[0_16px_16px_0] shadow-sm -z-10 pointer-events-none" />
          <div className="absolute right-[-4px] top-[4px] bottom-[4px] left-[4px] bg-[#faf8f0] border border-amber-900/5 rounded-[0_16px_16px_0] shadow-sm -z-20 pointer-events-none" />
        </>
      )}

      {/* Styled content with book-grade typography */}
      <div style={contentStyle} className="p-8 sm:p-10 flex flex-col justify-between h-full z-10 select-text">
        {isLeft && <div className="book-spine-left" />}
        {isRight && <div className="book-spine-right" />}

        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-900/10 pb-4 mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 font-sans">
            {title}
          </span>
          <span className="text-[9px] font-black text-amber-900/60 uppercase tracking-[0.15em] font-sans">
            Trang {pageNumber} / {totalPages}
          </span>
        </div>

        {/* Book Body: warm ink text, justified columns, proper margins */}
        <div className="my-5 flex-grow text-stone-800 text-[14.5px] sm:text-[15.5px] overflow-hidden" style={bodyStyle}>
          {normalizedContent}
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
  const bookRendererRef = useRef<BookRenderer | null>(null);

  // Hidden references for offscreen DOM capture
  const fromDOMRef = useRef<HTMLDivElement>(null);
  const toDOMRef = useRef<HTMLDivElement>(null);

  const totalPages = pages.length;

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
      if (bookRendererRef.current) {
        bookRendererRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (bookRendererRef.current) {
        bookRendererRef.current.destroy();
      }
    };
  }, []);

  const startFlip = (dir: 'next' | 'prev', from: number, to: number) => {
    setDirection(dir);
    setFromPage(from);
    setToPage(to);
    setIsFlipping(true);
    setTouchdownAngle(0);

    // Capture textures first to prevent pop-in blank textures on the turning page mesh.
    // Since TextureRenderer is optimized, this completes in less than 8ms (0ms visual latency).
    setTimeout(async () => {
      if (!containerRef.current || !canvasRef.current || !fromDOMRef.current || !toDOMRef.current) {
        setIsFlipping(false);
        return;
      }

      // High definition resolution for pixel-perfect text capture
      const frontCanvas = document.createElement('canvas');
      frontCanvas.width = 1024;
      frontCanvas.height = 1366;

      const backCanvas = document.createElement('canvas');
      backCanvas.width = 1024;
      backCanvas.height = 1366;

      await Promise.all([
        TextureRenderer.capture(fromDOMRef.current, frontCanvas),
        TextureRenderer.capture(toDOMRef.current, backCanvas)
      ]);

      if (bookRendererRef.current) {
        bookRendererRef.current.destroy();
      }

      bookRendererRef.current = new BookRenderer(
        containerRef.current,
        canvasRef.current,
        dir,
        from,
        totalPages,
        () => {
          setIsFlipping(false);
          onPageChange(to);
          
          if (bookRendererRef.current) {
            bookRendererRef.current.destroy();
            bookRendererRef.current = null;
          }

          // Settle follow-through bounce (120ms)
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
      );

      // Upload textures to active book meshes
      bookRendererRef.current.bookScene.turningPage.updateTextures(frontCanvas, backCanvas);
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
      {/* Offscreen DOM capture containers */}
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
        className="relative w-full min-h-[500px] sm:min-h-[540px] md:min-h-[580px] book-viewport overflow-hidden"
        style={{
          boxShadow: '0 30px 70px rgba(44, 38, 33, 0.18), 0 12px 30px rgba(44, 38, 33, 0.12)',
          borderRadius: '16px'
        }}
      >
        {/* 1. WebGL Canvas overlay */}
        {isFlipping && (
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-30 pointer-events-none"
          />
        )}

        {/* 2. Central Spine Divider for spread depth */}
        {isDesktop && (
          <div 
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[30px] z-20 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.03) 20%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.03) 80%, rgba(0,0,0,0.12) 100%)',
            }}
          />
        )}

        {/* 3. Static Underneath Page */}
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

        {/* 4. Static Side Cover Page */}
        {isFlipping && isDesktop && (
          <div 
            className="absolute top-0 bottom-0 z-10"
            style={{
              left: direction === 'next' ? 0 : '50%',
              width: '50%',
              overflow: 'hidden'
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

        {/* 5. Interactive HTML DOM Content */}
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
          ◀ Trang trước
        </button>
        
        <span className="text-xs font-bold text-slate-500">
          Trang {currentPage} / {totalPages}
        </span>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || isFlipping}
          className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all font-bold"
        >
          Trang sau ▶
        </button>
      </div>
    </div>
  );
}
