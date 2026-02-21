import React from 'react';
import { useStore } from '@nanostores/react';
import { $currentUser, logout, initAuth } from '../../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
    const user = useStore($currentUser);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    React.useEffect(() => {
        initAuth();
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 py-4 px-4 md:px-12">
            <nav className="max-w-7xl mx-auto glass-card flex items-center justify-between px-4 md:px-6 py-3 relative">
                <a href="/" className="flex items-center gap-2">
                    <img src="/logos/CCC_Logo.jpg" alt="Logo" className="h-8 rounded-full" />
                    <span className="hidden sm:block text-xl font-bold text-white tracking-tight">cloud computing club</span>
                </a>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="/links" className="nav-link">Resources</a>
                    <a href="/posts" className="nav-link">Blog</a>
                    <a href="/about" className="nav-link">About</a>
                    {user?.role === 'admin' && (
                        <a href="/admin" className="nav-link text-primary font-bold">Admin</a>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <a href="/profile" className="flex items-center gap-2 group">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-primary/20 group-hover:border-primary/50 transition-all object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 group-hover:border-primary/50 transition-all">
                                        {user.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </a>
                            <button
                                onClick={logout}
                                className="hidden md:block text-xs font-bold text-text-secondary hover:text-red-500 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-4">
                            <a href="/login" className="nav-link font-bold text-sm mr-2">Login</a>
                            <a href="/signup" className="btn-primary text-sm">Join Club</a>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-white/80 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>

                {/* Mobile Dropdown Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 right-0 mt-4 bg-background-dark p-4 flex flex-col gap-4 shadow-[0_30px_60px_rgba(0,0,0,0.8)] md:hidden border border-white/20 rounded-2xl z-[100]"
                        >
                            <a href="/links" className="nav-link w-full text-center py-2" onClick={() => setIsMenuOpen(false)}>Resources</a>
                            <a href="/posts" className="nav-link w-full text-center py-2" onClick={() => setIsMenuOpen(false)}>Blog</a>
                            <a href="/about" className="nav-link w-full text-center py-2" onClick={() => setIsMenuOpen(false)}>About</a>
                            {user?.role === 'admin' && (
                                <a href="/admin" className="nav-link w-full text-center py-2 text-primary font-bold" onClick={() => setIsMenuOpen(false)}>Admin</a>
                            )}

                            {!user && (
                                <div className="flex flex-col gap-3 py-2 border-t border-white/10 w-full px-2">
                                    <a href="/login" className="nav-link text-center w-full block font-bold text-sm" onClick={() => setIsMenuOpen(false)}>Login</a>
                                    <a href="/signup" className="btn-primary text-center w-full block text-sm" onClick={() => setIsMenuOpen(false)}>Join Club</a>
                                </div>
                            )}

                            {user && (
                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="w-full text-center py-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors border-t border-white/10 mt-2 p-2"
                                >
                                    Sign Out
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
}
