import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { addPost, ERROR_TYPES } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';

export default function CreatePost() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser && !loading) {
            // Small delay to allow auth to initialize
            const timer = setTimeout(() => {
                if (!currentUser) window.location.href = '/login';
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await addPost(title, content);
            window.location.href = '/posts';
        } catch (err) {
            setError(err.message || 'Failed to create post');
            setLoading(false);
        }
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="glass-card p-12 text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Permission Denied</h2>
                    <p className="text-text-secondary">You must be an administrator to create new architecture blueprints.</p>
                    <a href="/posts" className="btn-primary mt-8 inline-block">Back to Blog</a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto pt-32 pb-24 px-6 md:px-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-10"
            >
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Build New Architecture</h1>
                    <p className="text-text-secondary">Share your latest project or insight with the community.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 ml-1">Title</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xl font-bold outline-none focus:border-primary/50 transition-colors"
                            placeholder="Deploying Multi-Region EKS..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 ml-1">Content (Markdown supported)</label>
                        <textarea
                            required
                            rows={12}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-primary/50 transition-colors font-mono text-sm leading-relaxed"
                            placeholder="Explain your approach, tools used, and the results..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex items-center justify-end gap-4 border-t border-white/5 pt-8">
                        <a href="/posts" className="btn-outline text-sm">Cancel</a>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Publish Post
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
