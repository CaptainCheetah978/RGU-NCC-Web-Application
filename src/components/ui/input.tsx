import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        const inputId = props.id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-primary/80 ml-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        "flex h-11 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-2 text-primary dark:text-slate-100 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:focus-visible:border-primary/60 transition-all duration-200",
                        error && "border-red-500 focus-visible:ring-red-500/20",
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";
