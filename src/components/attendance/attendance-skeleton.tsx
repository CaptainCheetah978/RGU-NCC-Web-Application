import { Skeleton } from "@/components/ui/skeleton";

export function AttendanceSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700/60 flex justify-between">
           <div className="flex gap-4">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
           </div>
           <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center justify-between border-b pb-4 border-gray-50">
              <div className="flex items-center gap-3">
                 <Skeleton className="h-9 w-9 rounded-full" />
                 <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                 <Skeleton className="h-9 w-9 rounded-lg" />
                 <Skeleton className="h-9 w-9 rounded-lg" />
                 <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
