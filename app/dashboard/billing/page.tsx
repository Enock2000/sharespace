"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import LencoPayButton from "@/components/payments/LencoPayButton";

type BillingPeriod = "monthly" | "annually";

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
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
    const [userInfo, setUserInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
    });

    // Pricing
    const monthlyPrice = 600;
    const annualPrice = 570; // Per month when paid annually
    const annualTotal = annualPrice * 12; // 6840 ZMW total
    const currentPrice = billingPeriod === "monthly" ? monthlyPrice : annualPrice;
    const savings = (monthlyPrice - annualPrice) * 12; // 360 ZMW saved annually

    useEffect(() => {
        if (user) {
            setUserInfo({
                firstName: user.displayName?.split(" ")[0] || "User",
                lastName: user.displayName?.split(" ")[1] || "",
                email: user.email || "",
                phone: "",
            });
        }
    }, [user]);

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        const newEntry: BillingHistory = {
            id: Date.now().toString(),
            date: new Date().toISOString().split("T")[0],
            amount: billingPeriod === "monthly" ? monthlyPrice : annualTotal,
            currency: "ZMW",
            status: "paid",
            description: `Shared Spaces - ${billingPeriod === "monthly" ? "Monthly" : "Annual"} Subscription`,
        };
        setBillingHistory([newEntry, ...billingHistory]);
        alert("Payment successful! Your subscription has been activated.");
    };

    const handlePaymentClose = () => {
        setShowPaymentModal(false);
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

            {/* Pricing Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                {/* Billing Period Toggle */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annually" : "monthly")}
                            className={`relative w-14 h-7 rounded-full transition-colors ${billingPeriod === "annually" ? "bg-purple-600" : "bg-gray-300 dark:bg-slate-600"
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${billingPeriod === "annually" ? "translate-x-8" : "translate-x-1"
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${billingPeriod === "annually" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                            Annually
                        </span>
                        {billingPeriod === "annually" && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
                                Save {savings} ZMW/year
                            </span>
                        )}
                    </div>
                </div>

                {/* Price Display */}
                <div className="p-8 text-center">
                    <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Icons.Logo className="w-5 h-5" />
                        Shared Spaces Pro
                    </div>

                    <div className="mb-4">
                        <span className="text-5xl font-bold text-gray-900 dark:text-white">
                            {currentPrice}
                        </span>
                        <span className="text-xl text-gray-500 dark:text-gray-400 ml-2">
                            ZMW/month
                        </span>
                    </div>

                    {billingPeriod === "annually" && (
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Billed as {annualTotal} ZMW annually
                        </p>
                    )}

                    <ul className="text-left max-w-md mx-auto space-y-3 mb-8">
                        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <Icons.Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            Unlimited team members
                        </li>
                        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <Icons.Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            250 GB secure storage
                        </li>
                        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <Icons.Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            Advanced file sharing & permissions
                        </li>
                        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <Icons.Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            Priority email & chat support
                        </li>
                        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <Icons.Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            Activity audit logs
                        </li>
                        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <Icons.Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            Custom branding
                        </li>
                    </ul>

                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02]"
                    >
                        Subscribe Now
                    </button>
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
                {billingHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Icons.CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No billing history yet</p>
                        <p className="text-sm">Your payment history will appear here</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-slate-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Description</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billingHistory.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 dark:border-slate-700/50">
                                        <td className="py-4 px-4 text-gray-900 dark:text-white">
                                            {new Date(item.date).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{item.description}</td>
                                        <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">
                                            {item.amount} {item.currency}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "paid"
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : item.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                }`}>
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Payment</h2>
                            <button onClick={handlePaymentClose} className="text-gray-400 hover:text-gray-600">
                                <Icons.X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Shared Spaces Pro</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {billingPeriod === "monthly" ? "Monthly" : "Annual"} Plan
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {billingPeriod === "monthly" ? monthlyPrice : annualTotal} ZMW
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {billingPeriod === "monthly" ? "per month" : "per year"}
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
                                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                                    placeholder="260971234567"
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                                />
                            </div>

                            <LencoPayButton
                                amount={billingPeriod === "monthly" ? monthlyPrice : annualTotal}
                                currency="ZMW"
                                email={userInfo.email}
                                firstName={userInfo.firstName}
                                lastName={userInfo.lastName}
                                phone={userInfo.phone}
                                onSuccess={handlePaymentSuccess}
                                onClose={handlePaymentClose}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                <Icons.CreditCard className="w-5 h-5" />
                                Pay {billingPeriod === "monthly" ? monthlyPrice : annualTotal} ZMW
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
