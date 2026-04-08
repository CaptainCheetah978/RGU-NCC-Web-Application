"use client";

import { useTrainingData } from "@/lib/training-context";
import { useCadetData } from "@/lib/cadet-context";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getRandomLoadingContent } from "@/lib/loading-content";

export function RegistrySkeleton() {
  const { isLoading: trainingLoading } = useTrainingData();
  const { isLoading: cadetLoading } = useCadetData();
  const isLoading = trainingLoading || cadetLoading;

  const [content] = useState(() => getRandomLoadingContent());
  const [showFact, setShowFact] = useState(false);

  // Companion Fact logic: Graceful fallback for high latency
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFact(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-10 w-64 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full md:w-48 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>

      <div className="flex items-center space-x-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed font-bold italic animate-in fade-in slide-in-from-bottom-2 duration-700">
            {content.type === 'quote' ? (
              <>
                &quot;{content.text}&quot;
                {content.author && <span className="ml-1">&mdash; {content.author}</span>}
              </>
            ) : (
              content.text
            )}
          </div>
          {showFact && (
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 font-black uppercase tracking-widest animate-in zoom-in duration-500">
              High Latency Detected: Optimizing Registry View...
            </p>
          )}
        </div>
      </div>

      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-gray-100 dark:border-slate-800">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <div className="h-6 w-32 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="relative w-64 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-8 w-24 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
