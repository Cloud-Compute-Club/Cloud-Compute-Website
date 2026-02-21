import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { getPost } from '../../api/api';

export default function PostDetail({ postId }) {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchPost() {
            try {
                const data = await getPost(postId);
                setPost(data);
            } catch (err) {
                setError(err.message || 'Failed to load post');
            } finally {
                setLoading(false);
            }
        }
        if (postId) fetchPost();
    }, [postId]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex min-h-screen items-center justify-center text-center px-6">
                <div className="glass-card p-10 max-w-md">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Oops!</h2>
                    <p className="text-text-secondary mb-8">{error || 'Post not found'}</p>
                    <a href="/posts" className="btn-primary inline-block">Back to Feed</a>
                </div>
            </div>
        );
    }

    return (
        <article className="max-w-4xl mx-auto pt-40 pb-24 px-6 md:px-12">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <header className="mb-12 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">Cloud Insight</span>
                        <span className="text-text-secondary text-xs">•</span>
                        <span className="text-text-secondary text-xs">{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight">{post.title}</h1>
                    <div className="flex items-center justify-center gap-3">
                        {post.authorPhotoURL ? (
                            <img src={post.authorPhotoURL} alt={post.authorName} className="w-10 h-10 rounded-full border border-primary/20 object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {post.authorName?.charAt(0) || 'A'}
                            </div>
                        )}
                        <div className="text-left">
                            <p className="text-sm font-bold text-white leading-none mb-1">{post.authorName || 'Anonymous'}</p>
                            <p className="text-xs text-text-secondary">Official Member</p>
                        </div>
                    </div>
                </header>

                <div className="glass-card p-8 md:p-12 mb-12 prose prose-invert prose-orange max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {post.content}
                    </ReactMarkdown>
                </div>

                <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <span className="font-bold text-primary">{post.votes || 0}</span>
                            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/30 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-text-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm font-medium">{post.commentCount || 0} Comments</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button className="btn-outline text-xs px-6 py-2">Share Insight</button>
                    </div>
                </footer>
            </motion.div>
        </article>
    );
}
