import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PostCard from './PostCard';
import { getPosts } from '../../api/api';
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

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {currentUser?.role === 'admin' && (
                <div className="flex justify-end">
                    <a href="/admin" className="btn-primary text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Post
                    </a>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.length > 0 ? (
                    posts.map((post, idx) => (
                        <PostCard key={post.id || idx} post={post} />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center glass-card">
                        <p className="text-text-secondary">No posts found. Be the first to build something!</p>
                        {currentUser?.role === 'admin' && (
                            <a href="/admin" className="btn-primary mt-6 inline-block text-sm">Create New Post</a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
