"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import LencoPayButton from "@/components/payments/LencoPayButton";

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    period: string;
    features: string[];
    popular?: boolean;
}

const plans: SubscriptionPlan[] = [
    {
        id: "starter",
        name: "Starter",
        price: 99,
        currency: "ZMW",
        period: "month",
        features: [
            "Up to 5 team members",
            "5 GB storage",
            "Basic file sharing",
            "Email support",
        ],
    },
    {
        id: "professional",
        name: "Professional",
        price: 299,
        currency: "ZMW",
        period: "month",
        popular: true,
        features: [
            "Up to 25 team members",
            "50 GB storage",
            "Advanced file sharing",
            "Priority support",
            "Activity analytics",
            "Custom branding",
        ],
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: 799,
        currency: "ZMW",
        period: "month",
        features: [
            "Unlimited team members",
            "500 GB storage",
            "Enterprise file sharing",
            "24/7 dedicated support",
            "Advanced analytics",
            "Custom integrations",
            "SSO & SAML",
            "Audit logs",
        ],
    },
];

interface BillingHistory {
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: "paid" | "pending" | "failed";
    description: string;
}

export default function BillingPage() {
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string>("starter");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([
        {
            id: "1",
            date: "2024-11-01",
            amount: 99,
            currency: "ZMW",
            status: "paid",
            description: "Starter Plan - November 2024",
        },
        {
            id: "2",
            date: "2024-10-01",
            amount: 99,
            currency: "ZMW",
            status: "paid",
            description: "Starter Plan - October 2024",
        },
    ]);
    const [userInfo, setUserInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        if (user) {
            // In production, fetch user details from database
            setUserInfo({
                firstName: user.displayName?.split(" ")[0] || "User",
                lastName: user.displayName?.split(" ")[1] || "",
                email: user.email || "",
                phone: "", // Would come from user profile
            });
        }
    }, [user]);

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        if (selectedPlan) {
            setCurrentPlan(selectedPlan.id);
            // Add to billing history
            setBillingHistory([
                {
                    id: Date.now().toString(),
                    date: new Date().toISOString().split("T")[0],
                    amount: selectedPlan.price,
                    currency: selectedPlan.currency,
                    status: "paid",
                    description: `${selectedPlan.name} Plan - ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
                },
                ...billingHistory,
            ]);
        }
        alert("Payment successful! Your subscription has been updated.");
    };

    const handlePaymentClose = () => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Billing & Subscription
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage your subscription and payment methods
                    </p>
                </div>
            </div>

            {/* Current Plan Status */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-purple-200 text-sm">Current Plan</p>
                        <h2 className="text-2xl font-bold mt-1">
                            {plans.find((p) => p.id === currentPlan)?.name || "Free"}
                        </h2>
                        <p className="text-purple-200 mt-2">
                            Next billing date: December 1, 2024
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold">
                            {plans.find((p) => p.id === currentPlan)?.price || 0} ZMW
                        </p>
                        <p className="text-purple-200">per month</p>
                    </div>
                </div>
            </div>

            {/* Subscription Plans */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Choose Your Plan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 transition-all ${plan.popular
                                    ? "border-purple-500 shadow-lg shadow-purple-500/20"
                                    : "border-gray-200 dark:border-slate-700 hover:border-purple-300"
                                } ${currentPlan === plan.id
                                    ? "ring-2 ring-green-500 ring-offset-2"
                                    : ""
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            {currentPlan === plan.id && (
                                <div className="absolute -top-3 right-4">
                                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                                        <Icons.Check className="w-3 h-3" /> Current
                                    </span>
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {plan.name}
                            </h3>
                            <div className="mt-4">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                    {plan.price}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                    {" "}
                                    {plan.currency}/{plan.period}
                                </span>
                            </div>

                            <ul className="mt-6 space-y-3">
                                {plan.features.map((feature, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                                    >
                                        <Icons.Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                                disabled={currentPlan === plan.id}
                                className={`w-full mt-6 py-3 rounded-xl font-semibold transition-all ${currentPlan === plan.id
                                        ? "bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
                                        : plan.popular
                                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/30"
                                            : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600"
                                    }`}
                            >
                                {currentPlan === plan.id ? "Current Plan" : "Select Plan"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Payment Methods
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <Icons.Phone className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                Mobile Money
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                MTN, Airtel, Zamtel
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Icons.CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                Debit/Credit Card
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Visa, Mastercard
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing History */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Billing History
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-700">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Date
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Description
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Amount
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {billingHistory.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-gray-100 dark:border-slate-700/50"
                                >
                                    <td className="py-4 px-4 text-gray-900 dark:text-white">
                                        {new Date(item.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                                        {item.description}
                                    </td>
                                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">
                                        {item.amount} {item.currency}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "paid"
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : item.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                }`}
                                        >
                                            {item.status.charAt(0).toUpperCase() +
                                                item.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Complete Payment
                            </h2>
                            <button
                                onClick={handlePaymentClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Icons.X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Selected Plan
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedPlan.name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedPlan.price} {selectedPlan.currency}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        per {selectedPlan.period}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone Number (for Mobile Money)
                                </label>
                                <input
                                    type="tel"
                                    value={userInfo.phone}
                                    onChange={(e) =>
                                        setUserInfo({ ...userInfo, phone: e.target.value })
                                    }
                                    placeholder="260971234567"
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <LencoPayButton
                                amount={selectedPlan.price}
                                currency={selectedPlan.currency}
                                email={userInfo.email}
                                firstName={userInfo.firstName}
                                lastName={userInfo.lastName}
                                phone={userInfo.phone}
                                onSuccess={handlePaymentSuccess}
                                onClose={handlePaymentClose}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                <Icons.CreditCard className="w-5 h-5" />
                                Pay {selectedPlan.price} {selectedPlan.currency}
                            </LencoPayButton>

                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                Secure payment powered by Lenco Pay
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
