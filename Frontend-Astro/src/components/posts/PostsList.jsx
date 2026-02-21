import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from './PostCard';
import { getPosts, togglePinPost } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';

export default function PostsList() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const unsubscribe = getPosts((data) => {
            setPosts(data);
            setLoading(false);
        }, (error) => {
            console.error(error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleTogglePin = async (e, postId, currentPinned) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await togglePinPost(postId, currentPinned);
        } catch (error) {
            alert(error.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {currentUser?.role === 'admin' && (
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/40">Infrastructure Posts</h2>
                    <a href="/admin" className="bg-primary text-background-dark px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary-light transition-all shadow-lg shadow-primary/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        New Post
                    </a>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <motion.div
                                key={post.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative h-full"
                            >
                                <PostCard post={post} />

                                {currentUser?.role === 'admin' && (
                                    <button
                                        onClick={(e) => handleTogglePin(e, post.id, post.pinned)}
                                        className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${post.pinned
                                            ? 'bg-primary text-background-dark shadow-lg shadow-primary/30'
                                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                                            }`}
                                        title={post.pinned ? "Unpin Post" : "Pin Post"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                        </svg>
                                    </button>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-24 text-center glass-card border-dashed">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Posts Yet</h3>
                            <p className="text-text-secondary max-w-sm mx-auto mb-8">Be the first to share an architecture Post with the club.</p>
                            {currentUser?.role === 'admin' && (
                                <a href="/admin" className="btn-primary inline-flex">Create First Post</a>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

