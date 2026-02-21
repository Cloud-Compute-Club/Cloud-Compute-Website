import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPosts } from '../../api/api';
import PostCard from '../posts/PostCard';

export function HomeCTA() {
    const { currentUser, loading } = useAuth();
    const [latestPost, setLatestPost] = useState(null);
    const [postsLoading, setPostsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = getPosts((data) => {
            if (data && data.length > 0) {
                setLatestPost(data[0]);
            }
            setPostsLoading(false);
        }, (error) => {
            console.error(error);
            setPostsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (loading) return null; // Wait for auth to initialize before making flash changes

    if (currentUser) {
        return (
            <div className="max-w-3xl mx-auto glass-card p-8 text-left border-primary/20 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
                            Welcome back, <span className="text-primary">{currentUser.displayName || 'Developer'}</span>!
                        </h2>
                        <p className="text-text-secondary text-sm">Here is the latest from the community blog.</p>
                    </div>
                    <a href="/posts" className="btn-outline text-xs">View All</a>
                </div>

                {postsLoading ? (
                    <div className="py-12 flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : latestPost ? (
                    <div className="border border-white/5 bg-background-dark/30 rounded-xl">
                        <PostCard post={latestPost} />
                    </div>
                ) : (
                    <div className="py-10 text-center glass-card border-none bg-background-dark/30">
                        <p className="text-text-secondary mb-4">No posts found. Be the first to build something!</p>
                        <a href="/create" className="btn-primary inline-block text-xs">Create New Post</a>
                    </div>
                )}
            </div>
        );
    }

    // Default Logged out CTA
    return (
        <div className="max-w-5xl mx-auto glass-card p-12 text-center border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
            <h2 className="text-4xl font-bold mb-6">Ready to scale your skills?</h2>
            <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto">Join hundreds of developers already building the next generation of cloud applications.</p>
            <a href="/signup" className="btn-primary inline-block">Create Your Account</a>
        </div>
    );
}
