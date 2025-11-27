export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Files</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">1,248</p>
                    <span className="text-green-500 text-sm font-medium mt-2 inline-block">↑ 12% from last month</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Users</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">24</p>
                    <span className="text-blue-500 text-sm font-medium mt-2 inline-block">5 new this week</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Storage Used</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">4.5 GB</p>
                    <span className="text-slate-500 text-sm font-medium mt-2 inline-block">45% of quota</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                    <button className="text-blue-500 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    📄
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        Project_Specs_v2.pdf uploaded
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        by Sarah Johnson • 2 hours ago
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
