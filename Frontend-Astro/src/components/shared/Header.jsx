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
        <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-12">
            <nav className="max-w-7xl mx-auto flex items-center justify-between glass-card px-6 py-3">
                <a href="/" className="flex items-center gap-2">
                    <img src="/logos/CCC_Logo.jpg" alt="Logo" className="h-8 rounded-full" />
                    <span className="text-xl font-bold text-white">cloud computing club</span>
                </a>

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
                        <>
                            <a href="/login" className="nav-link mr-2">Login</a>
                            <a href="/signup" className="btn-primary text-sm">Join Club</a>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}
