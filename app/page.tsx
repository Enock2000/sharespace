import Link from "next/link";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden relative">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-white/5">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xl">
                                S
                            </div>
                            <span className="text-2xl font-bold text-gradient">Shared Spaces</span>
                        </div>
                        <nav className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="px-6 py-2.5 text-sm font-medium text-white/90 hover:text-white transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
                            >
                                Get Started
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10">
                <div className="container mx-auto px-6 py-20">
                    <div className="max-w-5xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-glow">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-sm font-medium">Enterprise-Ready Collaboration Platform</span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                            Your Files,
                            <br />
                            <span className="text-gradient">Securely Shared</span>
                        </h1>

                        {/* Subheading */}
                        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Multi-tenant document collaboration with enterprise-grade security,
                            permission controls, and audit logging. Built for teams that value privacy.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <Link
                                href="/register"
                                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.05] flex items-center gap-2"
                            >
                                Start Free Trial
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link
                                href="/login"
                                className="px-8 py-4 glass rounded-xl font-semibold text-lg hover:bg-white/20 transition-all hover-lift"
                            >
                                View Demo
                            </Link>
                        </div>

                        {/* Feature Cards */}
                        <div className="grid md:grid-cols-3 gap-6 mt-20">
                            <div className="glass rounded-2xl p-8 hover-lift group">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Enterprise Security</h3>
                                <p className="text-gray-400">Bank-level encryption, RBAC permissions, and complete tenant isolation</p>
                            </div>

                            <div className="glass rounded-2xl p-8 hover-lift group">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Team Collaboration</h3>
                                <p className="text-gray-400">Invite unlimited users, assign roles, and manage permissions seamlessly</p>
                            </div>

                            <div className="glass rounded-2xl p-8 hover-lift group">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Full Audit Trail</h3>
                                <p className="text-gray-400">Complete activity logging with CSV exports for compliance and security</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="container mx-auto px-6 py-16">
                    <div className="glass rounded-3xl p-12">
                        <div className="grid md:grid-cols-4 gap-8 text-center">
                            <div>
                                <div className="text-4xl font-bold text-gradient mb-2">99.9%</div>
                                <div className="text-gray-400">Uptime SLA</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-gradient mb-2">256-bit</div>
                                <div className="text-gray-400">Encryption</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-gradient mb-2">Unlimited</div>
                                <div className="text-gray-400">Team Members</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-gradient mb-2">24/7</div>
                                <div className="text-gray-400">Support</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 backdrop-blur-sm bg-white/5 mt-20">
                <div className="container mx-auto px-6 py-8">
                    <div className="text-center text-gray-400 text-sm">
                        © 2024 Shared Spaces. Built with Next.js, Firebase & Backblaze B2.
                    </div>
                </div>
            </footer>
        </div>
    );
}
