import Link from "next/link";
import Image from "next/image";

export default function Home() {
    return (
        <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
            {/* Background Gradient Orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[30%] right-[-5%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            {/* Navigation */}
            <nav className="relative z-20 container mx-auto px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20">
                        <Image src="/logo.jpg" alt="Shared Spaces Logo" fill className="object-cover" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Shared Spaces
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</Link>
                    <Link href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</Link>
                    <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/login">
                        <button className="px-5 py-2 text-sm text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                            Sign In
                        </button>
                    </Link>
                    <Link href="/register">
                        <button className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                            Get Started Free
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative z-10 container mx-auto px-6 pt-20 pb-32">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-slate-300">Trusted by 10,000+ teams worldwide</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-8 tracking-tight leading-[1.1]">
                        Your team&apos;s files,
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            secured & shared
                        </span>
                    </h1>

                    <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Enterprise-grade file sharing with real-time collaboration, end-to-end encryption,
                        and the simplicity your team deserves. No complexity, no compromises.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/register">
                            <button className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300 w-full sm:w-auto">
                                Start Free Trial
                                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </Link>
                        <Link href="/login">
                            <button className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 w-full sm:w-auto">
                                Live Demo
                            </button>
                        </Link>
                    </div>

                    {/* Product Preview */}
                    <div className="mt-20 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent z-10 pointer-events-none" />
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-500/10 bg-gradient-to-br from-slate-900 to-slate-800 p-1">
                            <div className="rounded-xl bg-slate-900 overflow-hidden">
                                {/* Mock Dashboard UI */}
                                <div className="h-8 bg-slate-800 flex items-center gap-2 px-4 border-b border-slate-700">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <div className="px-4 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-400">
                                            app.sharedspaces.io/dashboard
                                        </div>
                                    </div>
                                </div>
                                <div className="flex h-[300px] sm:h-[400px]">
                                    {/* Sidebar */}
                                    <div className="w-48 bg-slate-800/50 p-3 border-r border-slate-700/50 hidden sm:block">
                                        <div className="space-y-2">
                                            {["📁 My Files", "👥 Team Space", "💬 Messages", "⭐ Starred", "🗑️ Trash"].map((item, i) => (
                                                <div key={i} className={`px-3 py-2 rounded-lg text-xs ${i === 0 ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400"}`}>
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Content area */}
                                    <div className="flex-1 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-sm font-semibold text-slate-300">My Files</div>
                                            <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded text-[10px]">+ Upload</div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {[
                                                { name: "Project Brief.pdf", icon: "📄", color: "from-blue-500/20 to-blue-600/10" },
                                                { name: "Design Assets", icon: "🎨", color: "from-purple-500/20 to-purple-600/10" },
                                                { name: "Q4 Reports", icon: "📊", color: "from-green-500/20 to-green-600/10" },
                                                { name: "Brand Guide.pdf", icon: "📋", color: "from-orange-500/20 to-orange-600/10" },
                                                { name: "Meeting Notes", icon: "📝", color: "from-yellow-500/20 to-yellow-600/10" },
                                                { name: "Marketing", icon: "📁", color: "from-pink-500/20 to-pink-600/10" },
                                            ].map((file, i) => (
                                                <div key={i} className={`p-3 rounded-lg bg-gradient-to-br ${file.color} border border-white/5 hover:border-white/10 transition-colors`}>
                                                    <div className="text-2xl mb-2">{file.icon}</div>
                                                    <div className="text-[10px] text-slate-300 truncate">{file.name}</div>
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
            <section id="features" className="relative z-10 py-32">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest">Features</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4 text-white">
                            Everything your team needs
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Built for modern teams who value security, speed, and simplicity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: "🔐",
                                title: "End-to-End Encryption",
                                desc: "Military-grade encryption ensures your files are protected at rest and in transit. Only you and your team can access them.",
                                gradient: "from-blue-500/10 to-indigo-500/10",
                                border: "border-blue-500/20"
                            },
                            {
                                icon: "⚡",
                                title: "Blazing Fast Uploads",
                                desc: "CDN-powered infrastructure delivers your files in milliseconds. Large file support up to 10GB with parallel chunked uploads.",
                                gradient: "from-purple-500/10 to-pink-500/10",
                                border: "border-purple-500/20"
                            },
                            {
                                icon: "💬",
                                title: "Built-in Messaging",
                                desc: "Real-time team chat with channels, DMs, emoji reactions, and file sharing. No need for a separate messaging tool.",
                                gradient: "from-emerald-500/10 to-teal-500/10",
                                border: "border-emerald-500/20"
                            },
                            {
                                icon: "👥",
                                title: "Team Management",
                                desc: "Granular permissions, role-based access control, and tenant isolation. Keep your organization's data properly segmented.",
                                gradient: "from-orange-500/10 to-amber-500/10",
                                border: "border-orange-500/20"
                            },
                            {
                                icon: "📊",
                                title: "Activity Audit Logs",
                                desc: "Complete audit trail of every file access, download, and share. Meet compliance requirements with detailed reporting.",
                                gradient: "from-cyan-500/10 to-blue-500/10",
                                border: "border-cyan-500/20"
                            },
                            {
                                icon: "🔗",
                                title: "Secure Sharing Links",
                                desc: "Generate time-limited, password-protected sharing links. Revoke access instantly when needed.",
                                gradient: "from-rose-500/10 to-pink-500/10",
                                border: "border-rose-500/20"
                            }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className={`group relative p-8 rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.border} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 hover:shadow-lg`}
                            >
                                <div className="text-4xl mb-5 group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-3 text-white">{feature.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="relative z-10 py-32">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">How It Works</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4 text-white">
                            Up and running in minutes
                        </h2>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50" />

                        {[
                            { step: "01", title: "Create Your Space", desc: "Sign up and create your team workspace in seconds. No credit card required.", color: "indigo" },
                            { step: "02", title: "Invite Your Team", desc: "Add team members by email. Set roles and permissions for granular control.", color: "purple" },
                            { step: "03", title: "Start Collaborating", desc: "Upload files, create channels, and start messaging. Everything syncs in real-time.", color: "pink" }
                        ].map((item, i) => (
                            <div key={i} className="text-center relative">
                                <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-600/10 border border-${item.color}-500/20 flex items-center justify-center relative z-10`}>
                                    <span className={`text-3xl font-extrabold text-${item.color}-400`}>{item.step}</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
                                <p className="text-sm text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="relative z-10 py-32">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">Testimonials</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4 text-white">
                            Loved by teams everywhere
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-colors">
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s} className="text-yellow-400 text-sm">★</span>
                                    ))}
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-sm text-white">
                                        {testimonial.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                                        <p className="text-xs text-slate-500">{testimonial.role}, {testimonial.company}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="relative z-10 py-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: "10K+", label: "Active Users" },
                            { value: "1M+", label: "Files Shared" },
                            { value: "99.9%", label: "Uptime" },
                            { value: "50+", label: "Countries" }
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-slate-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-32">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center relative">
                        {/* Glow background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl -z-10" />

                        <div className="p-12 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm">
                            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                                Ready to get started?
                            </h2>
                            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                                Join thousands of teams who trust Shared Spaces for secure file collaboration. Free for up to 5 team members.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/register">
                                    <button className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300">
                                        Create Free Account
                                        <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </Link>
                                <Link href="/login">
                                    <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300">
                                        Contact Sales
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-12">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                                    <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
                                </div>
                                <span className="font-bold text-white">Shared Spaces</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Secure file sharing and team collaboration platform for modern businesses.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
                            <ul className="space-y-2 text-xs text-slate-500">
                                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
                            <ul className="space-y-2 text-xs text-slate-500">
                                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
                            <ul className="space-y-2 text-xs text-slate-500">
                                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-slate-600">
                            &copy; {new Date().getFullYear()} Shared Spaces. Powered by Oran.
                        </p>
                        <div className="flex gap-6 text-xs text-slate-600">
                            <a href="#" className="hover:text-white transition-colors">Twitter</a>
                            <a href="#" className="hover:text-white transition-colors">GitHub</a>
                            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
