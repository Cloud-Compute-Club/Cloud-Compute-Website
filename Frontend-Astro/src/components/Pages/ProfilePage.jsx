import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../api/api';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function ProfilePage() {
    const { currentUser, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!currentUser && !loading) {
            const timer = setTimeout(() => {
                if (!currentUser) window.location.href = '/login';
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    if (!currentUser) return null;

    return (
        <div className="max-w-4xl mx-auto pt-32 pb-24 px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card overflow-hidden"
            >
                <div className="h-32 bg-gradient-to-r from-primary/20 to-primary-dark/20 relative">
                    <div className="absolute -bottom-12 left-10">
                        <div className="w-24 h-24 rounded-2xl bg-surface-dark border-4 border-background-dark flex items-center justify-center text-3xl font-black text-primary shadow-xl overflow-hidden">
                            {currentUser.photoURL ? (
                                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-20 pb-10 px-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/5 pb-10">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">{currentUser.displayName || 'Cloud Architect'}</h1>
                            <p className="text-text-secondary">{currentUser.email}</p>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn-outline text-sm">Edit Profile</button>
                            <button onClick={logout} className="px-6 py-2.5 rounded-full border border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500/5 transition-all">Sign Out</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
                        <div className="space-y-6">
                            <h3 className="font-bold text-white/90">Account Information</h3>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mb-1">User ID</p>
                                    <p className="text-sm font-mono text-white/80">{currentUser.uid}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mb-1">Account Created</p>
                                    <p className="text-sm text-white/80">{currentUser.metadata?.creationTime || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="font-bold text-white/90">Cloud Statistics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center">
                                    <p className="text-2xl font-black text-primary">0</p>
                                    <p className="text-xs text-text-secondary font-bold uppercase mt-1">Posts</p>
                                </div>
                                <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center">
                                    <p className="text-2xl font-black text-primary">0</p>
                                    <p className="text-xs text-text-secondary font-bold uppercase mt-1">Votes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
