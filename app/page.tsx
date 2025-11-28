import Link from "next/link";
import Image from "next/image";

export default function Home() {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Hero Section */}
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50 z-0"></div>
                <div className="container mx-auto px-6 py-24 relative z-10">
                    <nav className="flex justify-between items-center mb-16">
                        <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                                <Image
                                    src="/logo.jpg"
                                    alt="Shared Spaces Logo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                Shared Spaces
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/login">
                                <button className="px-6 py-2 text-slate-600 hover:text-blue-600 font-medium transition-colors">
                                    Sign In
                                </button>
                            </Link>
                            <Link href="/register">
                                <button className="px-6 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                    Get Started
                                </button>
                            </Link>
                        </div>
                    </nav>

                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                            Secure File Sharing for <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient">
                                Modern Teams
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Experience enterprise-grade security with consumer-grade simplicity.
                            Store, share, and collaborate on files with absolute confidence.
                        </p>
                        <div className="flex justify-center gap-6">
                            <Link href="/register">
                                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                                    Start Free Trial
                                </button>
                            </Link>
                            <Link href="/login">
                                <button className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-lg shadow-md hover:shadow-lg hover:bg-slate-50 transition-all duration-300">
                                    Live Demo
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: "🔒",
                                title: "Bank-Level Security",
                                desc: "End-to-end encryption and secure infrastructure ensure your data never falls into the wrong hands."
                            },
                            {
                                icon: "⚡",
                                title: "Lightning Fast",
                                desc: "Global CDN distribution means your files are available instantly, wherever your team is located."
                            },
                            {
                                icon: "👥",
                                title: "Team Collaboration",
                                desc: "Built for teams with granular permissions, audit logs, and seamless sharing capabilities."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group hover:-translate-y-1">
                                <div className="text-4xl mb-6 bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        {[
                            { label: "Active Users", value: "10k+" },
                            { label: "Files Stored", value: "1M+" },
                            { label: "Uptime", value: "99.9%" },
                            { label: "Countries", value: "50+" }
                        ].map((stat, i) => (
                            <div key={i}>
                                <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                                <div className="text-slate-500 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
                    <div>
                        &copy; {new Date().getFullYear()} Shared Spaces. Powered by Oran.
                    </div>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
