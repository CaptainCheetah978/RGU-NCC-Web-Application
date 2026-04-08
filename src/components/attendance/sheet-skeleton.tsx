import { Skeleton } from "@/components/ui/skeleton";

export function SheetSkeleton() {
  return (
    <div className="space-y-6 max-w-full mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
           <Skeleton className="h-10 w-80" />
           <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden h-[600px] flex flex-col">
          <div className="h-14 bg-gray-50/50 dark:bg-slate-900/40 border-b flex items-center px-6">
             <Skeleton className="h-5 w-32" />
          </div>
          <div className="p-0 overflow-hidden">
             <table className="w-full">
                <thead>
                   <tr className="bg-gray-100">
                      <th className="px-6 py-4"><Skeleton className="h-4 w-24" /></th>
                      <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                      <th className="px-6 py-4"><Skeleton className="h-4 w-32" /></th>
                      <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                      <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                      <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                   </tr>
                </thead>
                <tbody>
                   {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                      <tr key={i} className="border-b border-gray-50">
                         <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                         <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                         <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                         <td className="px-6 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
                         <td className="px-6 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
                         <td className="px-6 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
      </div>
    </div>
  );
}
