import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Shared Spaces",
    description: "Secure, multi-tenant document collaboration platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <Script
                    src="https://pay.lenco.co/js/v1/inline.js"
                    strategy="beforeInteractive"
                />
                <Script
                    id="lenco-init"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            if (typeof window !== 'undefined' && window.LencoPayClass) {
                                window.LencoPay = new window.LencoPayClass();
                            }
                        `,
                    }}
                />
            </head>
            <body className={inter.className}>{children}</body>
        </html>
    );
}
