
import Link from "next/link";
import { Icons } from "@/components/ui/icons";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Icons.Folder className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">SharedSpaces</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Link href="/login" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium">
                            Log in
                        </Link>
                        <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Terms of Service</h1>
                <div className="prose dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-300">
                    <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">1. Agreement to Terms</h2>
                        <p>By accessing or using our website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">2. Use License</h2>
                        <p>Permission is granted to temporarily download one copy of the materials (information or software) on SharedSpaces' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>modify or copy the materials;</li>
                            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                            <li>attempt to decompile or reverse engineer any software contained on SharedSpaces' website;</li>
                            <li>remove any copyright or other proprietary notations from the materials; or</li>
                            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">3. Disclaimer</h2>
                        <p>The materials on SharedSpaces' website are provided on an 'as is' basis. SharedSpaces makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">4. Limitations</h2>
                        <p>In no event shall SharedSpaces or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SharedSpaces' website, even if SharedSpaces or a SharedSpaces authorized representative has been notified orally or in writing of the possibility of such damage.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">5. Governing Law</h2>
                        <p>These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
                    </section>
                </div>
            </main>

            <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-slate-500 dark:text-slate-400">
                        &copy; {new Date().getFullYear()} SharedSpaces. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
