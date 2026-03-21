import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "We encountered an unexpected error while loading your data.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center p-8 min-h-[300px] w-full max-w-lg mx-auto">
      <Card className="border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 backdrop-blur-sm shadow-xl">
        <CardContent className="pt-6 pb-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              className="mt-2 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
