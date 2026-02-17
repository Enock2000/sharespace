import Link from "next/link";
import Image from "next/image";
import { BackgroundSlider } from "@/components/ui/background-slider";
import { MobileNav } from "@/components/ui/mobile-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const BACKGROUND_IMAGES = [
    "/bg-1.png", // Cloud storage dashboard
    "/bg-2.png", // Data center servers
    "/bg-3.png", // Secure file network
    "/bg-4.png", // Digital security vault
    "/bg-5.png", // Global data network
];

export default function Home() {
    return (
        <div className="min-h-screen bg-transparent dark:bg-[#0a0a1a] text-slate-900 dark:text-white overflow-hidden relative transition-colors duration-300">
            {/* Background Slider */}
            <BackgroundSlider images={BACKGROUND_IMAGES} />

            {/* Navigation */}
            <nav className="relative z-20 container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20">
                        <Image src="/logo.jpg" alt="Shared Spaces Logo" fill className="object-cover" />
                    </div>
                    <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                        Shared Spaces
                    </span>
                </div>

                {/* Desktop nav links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link>
                    <Link href="#how-it-works" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">How It Works</Link>
                    <Link href="/pricing" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link>
                </div>

                {/* Desktop auth buttons + theme toggle */}
                <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                    <ThemeToggle />
                    <Link href="/login">
                        <button className="px-4 sm:px-5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                            Sign In
                        </button>
                    </Link>
                    <Link href="/register">
                        <button className="px-4 sm:px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 whitespace-nowrap">
                            Get Started Free
                        </button>
                    </Link>
                </div>

                {/* Mobile hamburger menu */}
                <MobileNav />
            </nav>

            {/* Hero Section */}
            <header className="relative z-10 container mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-32">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-indigo-50 dark:bg-white/5 border border-indigo-200/50 dark:border-white/10 rounded-full mb-6 sm:mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">Trusted by 10,000+ teams worldwide</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 tracking-tight leading-[1.1]">
                        Your team&apos;s files,
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                            secured &amp; shared
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
                        Enterprise-grade file sharing with real-time collaboration, end-to-end encryption,
                        and the simplicity your team deserves. No complexity, no compromises.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                        <Link href="/register" className="w-full sm:w-auto">
                            <button className="group w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300">
                                Start Free Trial
                                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </Link>
                        <Link href="/login" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-xl font-bold text-base sm:text-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm">
                                Live Demo
                            </button>
                        </Link>
                    </div>

                    {/* Product Preview */}
                    <div className="mt-12 sm:mt-20 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0a0a1a] via-transparent to-transparent z-10 pointer-events-none" />
                        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-500/10 bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 p-0.5 sm:p-1">
                            <div className="rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                                {/* Mock Dashboard UI */}
                                <div className="h-7 sm:h-8 bg-slate-100 dark:bg-slate-800 flex items-center gap-2 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400/80" />
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400/80" />
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400/80" />
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <div className="px-3 sm:px-4 py-0.5 bg-slate-200/50 dark:bg-slate-700/50 rounded text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-none">
                                            app.sharedspaces.io/dashboard
                                        </div>
                                    </div>
                                </div>
                                <div className="flex h-[220px] sm:h-[300px] md:h-[400px]">
                                    {/* Sidebar */}
                                    <div className="w-36 sm:w-48 bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-3 border-r border-slate-200/50 dark:border-slate-700/50 hidden sm:block">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            {["📁 My Files", "👥 Team Space", "💬 Messages", "⭐ Starred", "🗑️ Trash"].map((item, i) => (
                                                <div key={i} className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs ${i === 0 ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"}`}>
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Content area */}
                                    <div className="flex-1 p-3 sm:p-4">
                                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                                            <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">My Files</div>
                                            <div className="px-2 sm:px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded text-[9px] sm:text-[10px]">+ Upload</div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                                            {[
                                                { name: "Project Brief.pdf", icon: "📄", color: "from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-600/10" },
                                                { name: "Design Assets", icon: "🎨", color: "from-purple-100 to-purple-50 dark:from-purple-500/20 dark:to-purple-600/10" },
                                                { name: "Q4 Reports", icon: "📊", color: "from-green-100 to-green-50 dark:from-green-500/20 dark:to-green-600/10" },
                                                { name: "Brand Guide.pdf", icon: "📋", color: "from-orange-100 to-orange-50 dark:from-orange-500/20 dark:to-orange-600/10" },
                                                { name: "Meeting Notes", icon: "📝", color: "from-yellow-100 to-yellow-50 dark:from-yellow-500/20 dark:to-yellow-600/10" },
                                                { name: "Marketing", icon: "📁", color: "from-pink-100 to-pink-50 dark:from-pink-500/20 dark:to-pink-600/10" },
                                            ].map((file, i) => (
                                                <div key={i} className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${file.color} border border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors`}>
                                                    <div className="text-lg sm:text-2xl mb-1 sm:mb-2">{file.icon}</div>
                                                    <div className="text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-300 truncate">{file.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-16 sm:py-24 md:py-32">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-10 sm:mb-16">
                        <span className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-semibold uppercase tracking-widest">Features</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-3 sm:mb-4 text-slate-900 dark:text-white">
                            Everything your team needs
                        </h2>
                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto px-2">
                            Built for modern teams who value security, speed, and simplicity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {[
                            {
                                icon: "🔐",
                                title: "End-to-End Encryption",
                                desc: "Military-grade encryption ensures your files are protected at rest and in transit. Only you and your team can access them.",
                                gradient: "from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10",
                                border: "border-blue-200/60 dark:border-blue-500/20"
                            },
                            {
                                icon: "⚡",
                                title: "Blazing Fast Uploads",
                                desc: "CDN-powered infrastructure delivers your files in milliseconds. Large file support up to 10GB with parallel chunked uploads.",
                                gradient: "from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10",
                                border: "border-purple-200/60 dark:border-purple-500/20"
                            },
                            {
                                icon: "💬",
                                title: "Built-in Messaging",
                                desc: "Real-time team chat with channels, DMs, emoji reactions, and file sharing. No need for a separate messaging tool.",
                                gradient: "from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10",
                                border: "border-emerald-200/60 dark:border-emerald-500/20"
                            },
                            {
                                icon: "👥",
                                title: "Team Management",
                                desc: "Granular permissions, role-based access control, and tenant isolation. Keep your organization's data properly segmented.",
                                gradient: "from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10",
                                border: "border-orange-200/60 dark:border-orange-500/20"
                            },
                            {
                                icon: "📊",
                                title: "Activity Audit Logs",
                                desc: "Complete audit trail of every file access, download, and share. Meet compliance requirements with detailed reporting.",
                                gradient: "from-cyan-50 to-blue-50 dark:from-cyan-500/10 dark:to-blue-500/10",
                                border: "border-cyan-200/60 dark:border-cyan-500/20"
                            },
                            {
                                icon: "🔗",
                                title: "Secure Sharing Links",
                                desc: "Generate time-limited, password-protected sharing links. Revoke access instantly when needed.",
                                gradient: "from-rose-50 to-pink-50 dark:from-rose-500/10 dark:to-pink-500/10",
                                border: "border-rose-200/60 dark:border-rose-500/20"
                            }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className={`group relative p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.border} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 hover:shadow-lg`}
                            >
                                <div className="text-3xl sm:text-4xl mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="relative z-10 py-16 sm:py-24 md:py-32">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-10 sm:mb-16">
                        <span className="text-purple-600 dark:text-purple-400 text-xs sm:text-sm font-semibold uppercase tracking-widest">How It Works</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-3 sm:mb-4 text-slate-900 dark:text-white">
                            Up and running in minutes
                        </h2>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-indigo-300/50 via-purple-300/50 to-pink-300/50 dark:from-indigo-500/50 dark:via-purple-500/50 dark:to-pink-500/50" />

                        {[
                            { step: "01", title: "Create Your Space", desc: "Sign up and create your team workspace in seconds. No credit card required.", color: "indigo" },
                            { step: "02", title: "Invite Your Team", desc: "Add team members by email. Set roles and permissions for granular control.", color: "purple" },
                            { step: "03", title: "Start Collaborating", desc: "Upload files, create channels, and start messaging. Everything syncs in real-time.", color: "pink" }
                        ].map((item, i) => (
                            <div key={i} className="text-center relative">
                                <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-${item.color}-100 to-${item.color}-50 dark:from-${item.color}-500/20 dark:to-${item.color}-600/10 border border-${item.color}-200/60 dark:border-${item.color}-500/20 flex items-center justify-center relative z-10`}>
                                    <span className={`text-2xl sm:text-3xl font-extrabold text-${item.color}-600 dark:text-${item.color}-400`}>{item.step}</span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold mb-2 text-slate-900 dark:text-white">{item.title}</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="relative z-10 py-16 sm:py-24 md:py-32">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-10 sm:mb-16">
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-widest">Testimonials</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-3 sm:mb-4 text-slate-900 dark:text-white">
                            Loved by teams everywhere
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
                        {[
                            {
                                quote: "Shared Spaces completely transformed how our team handles file sharing. The built-in chat means we don't need Slack anymore.",
                                name: "Sarah Chen",
                                role: "Engineering Lead",
                                company: "TechFlow Inc."
                            },
                            {
                                quote: "The security features are incredible. End-to-end encryption and audit logs give us complete peace of mind with client files.",
                                name: "Marcus Johnson",
                                role: "CTO",
                                company: "DataShield"
                            },
                            {
                                quote: "We switched from Dropbox and the difference is night and day. Upload speeds are blazing fast and the UI is gorgeous.",
                                name: "Amara Osei",
                                role: "Design Director",
                                company: "CreativeHub"
                            }
                        ].map((testimonial, i) => (
                            <div key={i} className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors shadow-sm">
                                <div className="flex gap-1 mb-3 sm:mb-4">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s} className="text-yellow-500 dark:text-yellow-400 text-xs sm:text-sm">★</span>
                                    ))}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 sm:mb-6">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-xs sm:text-sm text-white flex-shrink-0">
                                        {testimonial.name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">{testimonial.name}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">{testimonial.role}, {testimonial.company}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="relative z-10 py-12 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                        {[
                            { value: "10K+", label: "Active Users" },
                            { value: "1M+", label: "Files Shared" },
                            { value: "99.9%", label: "Uptime" },
                            { value: "50+", label: "Countries" }
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-16 sm:py-24 md:py-32">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="max-w-3xl mx-auto text-center relative">
                        {/* Glow background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 dark:from-indigo-600/20 dark:via-purple-600/20 dark:to-pink-600/20 rounded-3xl blur-3xl -z-10" />

                        <div className="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/[0.02] border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">
                                Ready to get started?
                            </h2>
                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 max-w-lg mx-auto px-2">
                                Join thousands of teams who trust Shared Spaces for secure file collaboration. Free for up to 5 team members.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                                <Link href="/register" className="w-full sm:w-auto">
                                    <button className="group w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300">
                                        Create Free Account
                                        <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </Link>
                                <Link href="/login" className="w-full sm:w-auto">
                                    <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-xl font-bold text-base sm:text-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm">
                                        Contact Sales
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-200 dark:border-white/5 py-8 sm:py-12">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden">
                                    <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Shared Spaces</span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                                Secure file sharing and team collaboration platform for modern businesses.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">Product</h4>
                            <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
                                <li><Link href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link></li>
                                <li><Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link></li>
                                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Security</Link></li>
                                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Integrations</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">Company</h4>
                            <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
                                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">About</Link></li>
                                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Blog</Link></li>
                                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Careers</Link></li>
                                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">Legal</h4>
                            <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
                                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-white/5 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-600">
                            &copy; {new Date().getFullYear()} Shared Spaces. Powered by Oran.
                        </p>
                        <div className="flex gap-4 sm:gap-6 text-[11px] sm:text-xs text-slate-400 dark:text-slate-600">
                            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
                            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
                            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
