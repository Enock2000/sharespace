import { Icons } from "@/components/ui/icons";

interface IconComponent {
    (props: { className?: string }): JSX.Element;
}

interface StatsWidgetProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: IconComponent;
    color: "blue" | "green" | "purple" | "orange" | "red";
    trend?: string;
}

export default function StatsWidget({ title, value, subtitle, icon: Icon, color, trend }: StatsWidgetProps) {
    const colorClasses = {
        blue: "from-blue-500 to-blue-600",
        green: "from-green-500 to-green-600",
        purple: "from-purple-500 to-purple-600",
        orange: "from-orange-500 to-orange-600",
        red: "from-red-500 to-red-600",
    };

    const iconBgClasses = {
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
        red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>

                {trend && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-600 dark:text-slate-400">{trend}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
