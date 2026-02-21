import React from 'react';
import { motion } from 'framer-motion';

export default function PostCard({ post }) {
    const { id, title, authorName, authorPhotoURL, authorRole, createdAt, commentCount, pinned } = post;

    // Format date
    const dateStr = createdAt?.seconds
        ? new Date(createdAt.seconds * 1000).toLocaleDateString()
        : 'Recently';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`glass-card overflow-hidden group hover:border-primary/40 transition-all duration-300 flex flex-col relative h-full ${pinned ? 'border-primary/50 ring-1 ring-primary/20 bg-gradient-to-br from-primary/10 via-background-dark/80 to-background-dark' : ''}`}
        >
            <a href={`/post/${id}`} className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    {authorPhotoURL ? (
                        <img src={authorPhotoURL} alt="" className="w-8 h-8 rounded-full border border-white/10" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {authorName?.charAt(0)}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-none mb-1">{authorName || 'Anonymous'}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-primary uppercase tracking-widest font-black leading-none">{authorRole || 'Member'}</span>
                            <span className="text-[9px] text-text-secondary">• {dateStr}</span>
                        </div>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-tight mb-auto">
                    {title}
                </h3>

                <div className="flex items-center gap-4 text-text-secondary mt-6 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span className="text-xs font-bold">{post.votes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs font-bold">{commentCount || 0}</span>
                    </div>
                </div>
            </a>
        </motion.div>
    );
}
