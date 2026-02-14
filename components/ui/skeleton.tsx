import { cn } from "@/lib/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "text" | "circular" | "rectangular" | "rounded";
}

export function Skeleton({ className, variant = "rounded", ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-slate-200 dark:bg-slate-700",
                {
                    "rounded-full": variant === "circular",
                    "rounded-md": variant === "rounded",
                    "rounded-none": variant === "rectangular",
                    "h-4 w-full": variant === "text",
                },
                className
            )}
            {...props}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center space-x-4">
                <Skeleton variant="circular" className="h-12 w-12" />
                <div className="space-y-2 flex-1">
                    <Skeleton variant="text" className="h-4 w-1/3" />
                    <Skeleton variant="text" className="h-3 w-1/4" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" className="w-2/3" />
            </div>
        </div>
    );
}

export function TableRowSkeleton({ cells = 5 }: { cells?: number }) {
    return (
        <tr>
            {Array.from({ length: cells }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton variant="text" className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}
