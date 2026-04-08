import { Skeleton } from "@/components/ui/skeleton";

export function ClassesSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
           <Skeleton className="h-10 w-64" />
           <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden h-[300px] flex flex-col">
            <div className="p-6 space-y-4 flex-1">
               <Skeleton className="h-5 w-24 rounded-full" />
               <Skeleton className="h-7 w-3/4" />
               <div className="space-y-2 pt-2">
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-8 w-full rounded-lg" />
               </div>
            </div>
            <div className="p-4 bg-gray-50/50 dark:bg-slate-900/20 border-t flex justify-between">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
