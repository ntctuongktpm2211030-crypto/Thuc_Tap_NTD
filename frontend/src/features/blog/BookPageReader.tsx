import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookPageReaderProps {
  title: string;
  pages: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function BookPageReader({ title, pages, currentPage, onPageChange }: BookPageReaderProps) {
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isFlipping, setIsFlipping] = useState(false);

  const totalPages = pages.length;

  const handleNext = () => {
    if (currentPage < totalPages && !isFlipping) {
      setDirection('next');
      setIsFlipping(true);
      onPageChange(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1 && !isFlipping) {
      setDirection('prev');
      setIsFlipping(true);
      onPageChange(currentPage - 1);
    }
  };

  // Page texture overlay style
  const paperTextureStyle: React.CSSProperties = {
    backgroundImage: `radial-gradient(circle_at 50% 50%, rgba(250, 248, 240, 0.15) 0%, rgba(0, 0, 0, 0.02) 100%)`,
    backgroundColor: '#FDFCF8',
  };

  // Framer Motion Page variants for realistic paper flip
  const pageVariants = {
    enter: (dir: 'next' | 'prev') => ({
      rotateY: dir === 'next' ? 180 : -180,
      skewY: dir === 'next' ? 6 : -6,
      x: dir === 'next' ? 60 : -60,
      z: -30,
      opacity: 0,
      transition: { duration: 0 }
    }),
    center: {
      rotateY: 0,
      skewY: 0,
      x: 0,
      z: 0,
      opacity: 1,
      transition: {
        duration: 0.65,
        ease: [0.25, 1, 0.5, 1] as any
      }
    },
    exit: (dir: 'next' | 'prev') => ({
      rotateY: dir === 'next' ? -180 : 180,
      skewY: dir === 'next' ? -6 : 6,
      x: dir === 'next' ? -60 : 60,
      z: -30,
      opacity: 0,
      transition: {
        duration: 0.65,
        ease: [0.25, 1, 0.5, 1] as any
      }
    })
  };

  return (
    <div className="relative w-full flex flex-col">
      {/* ── 3D VIEWPORT CONTAINER ── */}
      <div 
        className="relative w-full min-h-[520px] sm:min-h-[460px] rounded-3xl"
        style={{ perspective: 1800, transformStyle: 'preserve-3d' }}
      >
        
        {/* Ground Shadow & Contact Shadow layer */}
        <motion.div 
          className="absolute inset-x-4 -bottom-6 h-12 bg-black/10 rounded-full blur-xl pointer-events-none z-0"
          animate={{
            scaleX: isFlipping ? 1.3 : 1.0,
            opacity: isFlipping ? 0.25 : 0.1,
            filter: isFlipping ? 'blur(28px)' : 'blur(14px)'
          }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        />

        <AnimatePresence 
          initial={false} 
          custom={direction}
          onExitComplete={() => setIsFlipping(false)}
        >
          <motion.div
            key={currentPage}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ 
              ...paperTextureStyle,
              transformOrigin: direction === 'next' ? 'left center' : 'right center',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d'
            }}
            className="absolute inset-0 rounded-3xl p-6 sm:p-8 border border-amber-900/10 shadow-2xl flex flex-col justify-between z-10 overflow-hidden dark:text-slate-900"
          >
            {/* Edge Shadow and Light Reflection Overlay */}
            {isFlipping && (
              <motion.div 
                className="absolute inset-0 pointer-events-none mix-blend-overlay z-20"
                animate={{
                  background: [
                    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 70%, rgba(255,255,255,0) 100%)',
                    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, rgba(255,255,255,0) 100%)',
                    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)'
                  ]
                }}
                transition={{ duration: 0.6 }}
              />
            )}

            {/* Book Inner Shadow for page binding spine */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />

            {/* Header section */}
            <div className="flex justify-between items-center border-b border-amber-900/10 pb-3 z-10">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 font-editorial">
                {title}
              </span>
              <span className="text-[10px] font-bold text-amber-900/60 uppercase tracking-widest">
                Trang {currentPage} / {totalPages}
              </span>
            </div>

            {/* 2-Column Responsive Body */}
            <div className="my-6 flex-grow columns-1 md:columns-2 gap-8 text-justify leading-relaxed text-slate-700 text-xs sm:text-sm tracking-wide z-10">
              {pages[currentPage - 1]}
            </div>

            {/* Footer Pagination Controls */}
            <div className="flex justify-between items-center border-t border-amber-900/10 pt-3 mt-auto z-10">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1 || isFlipping}
                className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                ◀ Previous Page
              </button>
              
              <span className="text-xs font-bold text-slate-450 font-editorial">
                Page {currentPage} / {totalPages}
              </span>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages || isFlipping}
                className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                Next Page ▶
              </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Side Arrow Navigation Controls */}
      {currentPage > 1 && (
        <button
          onClick={handlePrev}
          disabled={isFlipping}
          className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all z-30 cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {currentPage < totalPages && (
        <button
          onClick={handleNext}
          disabled={isFlipping}
          className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all z-30 cursor-pointer"
          title="Next Page"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
