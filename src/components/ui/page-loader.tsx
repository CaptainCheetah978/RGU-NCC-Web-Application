"use client";

import { Loader2 } from "lucide-react";
import { getRandomLoadingContent } from "@/lib/loading-content";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PageLoader() {
  const [content, setContent] = useState<ReturnType<typeof getRandomLoadingContent> | null>(null);

  useEffect(() => {
    setContent(getRandomLoadingContent());
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center text-center max-w-lg w-full space-y-8"
      >
        <div className="relative">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        </div>
        
        <div className="h-40 flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
            {content && (
                <motion.div
                key={content.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4 w-full"
                >
                {content.type === 'quote' ? (
                    <>
                    <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 italic leading-snug">
                        "{content.text}"
                    </p>
                    <p className="text-sm md:text-base font-bold text-gray-600 dark:text-gray-400">
                        — {content.author} <span className="font-normal italic text-gray-500 dark:text-gray-500">({content.source})</span>
                    </p>
                    </>
                ) : (
                    <>
                    <div className="text-primary font-black uppercase tracking-widest text-xs mb-2 opacity-80">Did you know?</div>
                    <p className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                        {content.text}
                    </p>
                    <p className="text-sm font-normal italic text-gray-500 dark:text-gray-500">
                        ({content.source})
                    </p>
                    </>
                )}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
