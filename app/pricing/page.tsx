"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";

interface PricingPlan {
    price: number;
    storage_gb: number;
    user_limit: number;
    features: string[];
}

interface PricingData {
    standard: PricingPlan;
}

export default function PricingPage() {
    const [pricing, setPricing] = useState<PricingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

    useEffect(() => {
        fetchPricing();
    }, []);

    const fetchPricing = async () => {
        try {
            const res = await fetch("/api/pricing");
            const data = await res.json();
            setPricing(data.pricing);
        } catch (error) {
            console.error("Failed to fetch pricing:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const plans = [
        {
            name: "Premium Plan",
            key: "standard" as keyof PricingData,
            description: "All-in-one solution for your team",
            popular: true,
                                            </span >
                                        </div >
                                    </div >

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">
                Features
            </p>
            <ul className="space-y-2">
                {planData.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Icons.CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
                                </div >
                            </div >
                        );
})}
                </div >

    {/* FAQ Section */ }
    < div className = "mt-24 max-w-3xl mx-auto text-left" >
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                Can I change my plan later?
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                What payment methods do you accept?
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                Is there a free trial?
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Yes! All paid plans come with a 14-day free trial. No credit card required.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                What happens when I reach my storage limit?
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                You'll receive notifications before reaching your limit. You can upgrade your plan or purchase additional storage.
                            </p>
                        </div>
                    </div>
                </div >

    {/* CTA Section */ }
    < div className = "mt-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-12 text-center" >
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to get started?
                    </h2>
                    <p className="text-xl text-white/80 mb-8">
                        Join thousands of teams already using Shared Spaces
                    </p>
                    <Link
                        href="/register"
                        className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg font-bold hover:shadow-xl transition-all"
                    >
                        Start Your Free Trial
                    </Link>
                </div >
            </div >

    {/* Footer */ }
    < footer className = "border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm mt-24" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-slate-600 dark:text-slate-400">
                © 2024 Shared Spaces. All rights reserved.
            </p>
        </div>
            </footer >
        </div >
    );
}
