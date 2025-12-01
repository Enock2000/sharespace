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
    free: PricingPlan;
    basic: PricingPlan;
    pro: PricingPlan;
    enterprise: PricingPlan;
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
            name: "Free",
            key: "free" as keyof PricingData,
            description: "Perfect for trying out",
            popular: false,
            color: "slate",
        },
        {
            name: "Basic",
            key: "basic" as keyof PricingData,
            description: "For small teams",
            popular: false,
            color: "blue",
        },
        {
            name: "Pro",
            key: "pro" as keyof PricingData,
            description: "For growing businesses",
            popular: true,
            color: "purple",
        },
        {
            name: "Enterprise",
            key: "enterprise" as keyof PricingData,
            description: "For large organizations",
            popular: false,
            color: "indigo",
        },
    ];

    const getPrice = (plan: PricingPlan) => {
        if (billingCycle === "annual") {
            return (plan.price * 12 * 0.8).toFixed(2); // 20% discount for annual
        }
        return plan.price.toFixed(2);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Icons.Logo className="w-8 h-8 text-purple-600" />
                        <span className="text-xl font-bold text-slate-900 dark:text-white">Shared Spaces</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            Home
                        </Link>
                        <Link href="/login" className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium">
                            Sign In
                        </Link>
                        <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
                    Simple, Transparent Pricing
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                    Choose the perfect plan for your team. No hidden fees.
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors"
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === "annual" ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                    <span className={`text-sm font-medium ${billingCycle === "annual" ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                        Annual <span className="text-green-600">(Save 20%)</span>
                    </span>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan) => {
                        const planData = pricing?.[plan.key];
                        if (!planData) return null;

                        return (
                            <div
                                key={plan.key}
                                className={`relative bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all hover:scale-105 ${plan.popular
                                    ? "border-purple-600 shadow-xl shadow-purple-600/20"
                                    : "border-slate-200 dark:border-slate-700 shadow-lg"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-full">
                                        Most Popular
                                    </div>
                                )}

                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{plan.description}</p>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-bold text-slate-900 dark:text-white">
                                                ZMW {getPrice(planData)}
                                            </span>
                                            <span className="text-slate-600 dark:text-slate-400">
                                                /{billingCycle === "monthly" ? "mo" : "yr"}
                                            </span>
                                        </div>
                                        {billingCycle === "annual" && planData.price > 0 && (
                                            <p className="text-sm text-slate-500 mt-1">
                                                ZMW {planData.price}/mo billed annually
                                            </p>
                                        )}
                                    </div>

                                    <Link
                                        href="/register"
                                        className={`block w-full py-3 rounded-lg font-medium text-center transition-all mb-6 ${plan.popular
                                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg"
                                            : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
                                            }`}
                                    >
                                        Get Started
                                    </Link>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Icons.User className="w-4 h-4 text-purple-600" />
                                            <span className="text-slate-700 dark:text-slate-300">
                                                {planData.user_limit === 99999 ? "Unlimited" : planData.user_limit} users
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Icons.HardDrive className="w-4 h-4 text-purple-600" />
                                            <span className="text-slate-700 dark:text-slate-300">
                                                {planData.storage_gb >= 1000
                                                    ? `${(planData.storage_gb / 1000).toFixed(0)}TB`
                                                    : `${planData.storage_gb}GB`} storage
                                            </span>
                                        </div>
                                    </div>

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
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="mt-24 max-w-3xl mx-auto text-left">
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
                </div>

                {/* CTA Section */}
                <div className="mt-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-12 text-center">
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
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm mt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-slate-600 dark:text-slate-400">
                        © 2024 Shared Spaces. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
