"use client";

declare global {
    interface Window {
        LencoPay: {
            getPaid: (config: {
                key: string;
                amount: number;
                currency: string;
                reference: string;
                email: string;
                customer: {
                    firstName: string;
                    lastName: string;
                    phone: string;
                };
                channels: string[];
                onSuccess: (resp: { reference: string }) => void;
                onClose: () => void;
            }) => void;
        };
    }
}

interface LencoPayButtonProps {
    amount: number;
    currency?: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    onSuccess?: () => void;
    onClose?: () => void;
    className?: string;
    children?: React.ReactNode;
}

export default function LencoPayButton({
    amount,
    currency = "ZMW",
    email,
    firstName,
    lastName,
    phone,
    onSuccess,
    onClose,
    className = "px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02]",
    children = "Pay with Lenco"
}: LencoPayButtonProps) {

    const handlePay = () => {
        const reference = "ref-" + Date.now();

        if (typeof window !== "undefined" && window.LencoPay) {
            window.LencoPay.getPaid({
                key: process.env.NEXT_PUBLIC_VSHR_PUBLIC_KEY!,
                amount,
                currency,
                reference,
                email,
                customer: {
                    firstName,
                    lastName,
                    phone,
                },
                channels: ["card", "mobile-money"],
                onSuccess: async (resp) => {
                    // Verify payment on server
                    await fetch(`/api/pay/verify?reference=${resp.reference}`);
                    onSuccess?.();
                },
                onClose: () => {
                    onClose?.();
                },
            });
        } else {
            console.error("LencoPay not loaded");
            alert("Payment system is loading. Please try again.");
        }
    };

    return (
        <button onClick={handlePay} className={className}>
            {children}
        </button>
    );
}
