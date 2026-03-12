import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileTabs({ initialActivity, isAdminProfile }) {
    const [activeTab, setActiveTab] = useState(isAdminProfile ? 'posts' : 'voted');
    const activity = initialActivity || { posts: [], voted: [] };

    return (
        <div className="lg:col-span-2 space-y-6">
            {/* Desktop Navigation Tabs */}
            <div className="hidden lg:flex gap-8 border-b border-white/5">
                {isAdminProfile && (
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'posts' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                    >
                        My Posts
                        {activeTab === 'posts' && <motion.div layoutId="desktopTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('voted')}
                    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'voted' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                >
                    Interactions
                    {activeTab === 'voted' && <motion.div layoutId="desktopTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
            </div>

            {/* Mobile Navigation Tabs */}
            <div className="lg:hidden flex border-b border-white/5 mb-8">
                {isAdminProfile && (
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'posts' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                    >
                        Posts
                        {activeTab === 'posts' && <motion.div layoutId="mobileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('voted')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'voted' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                >
                    Activity
                    {activeTab === 'voted' && <motion.div layoutId="mobileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'posts' && (
                        <motion.div
                            key="posts-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {activity.posts.length > 0 ? (
                                activity.posts.map(post => (
                                    <a href={`/post/${post.id}`} key={post.id} className="block p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">{post.title}</h4>
                                            <span className="text-[10px] text-text-secondary uppercase font-black">{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                                {post.votes || 0} Votes
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                                {post.commentCount || 0} Comments
                                            </div>
                                        </div>
                                    </a>
                                ))
                            ) : (
                                <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl">
                                    <p className="text-text-secondary text-sm">No architecture blueprints shared yet.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'voted' && (
                        <motion.div
                            key="voted-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {activity.voted.length > 0 ? (
                                activity.voted.map(post => (
                                    <a href={`/post/${post.id}`} key={post.id} className="block p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">{post.title}</h4>
                                            <div className="flex items-center gap-2">
                                                {post.voteDirection === 'up' ? (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase">Upvoted</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[8px] font-black uppercase">Downvoted</span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-text-secondary line-clamp-1 opacity-60">By {post.authorName}</p>
                                    </a>
                                ))
                            ) : (
                                <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl">
                                    <p className="text-text-secondary text-sm">No interactions logged in the network yet.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
