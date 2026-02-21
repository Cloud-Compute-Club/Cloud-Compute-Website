import React from 'react';
import { motion } from 'framer-motion';

export default function PostCard({ post }) {
    const { title, content, authorName, authorPhotoURL, createdAt, votes, commentCount } = post;

    // Format date
    const dateStr = createdAt?.seconds
        ? new Date(createdAt.seconds * 1000).toLocaleDateString()
        : 'Recently';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card overflow-hidden group hover:border-primary/30 transition-all duration-300"
        >
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    {authorPhotoURL ? (
                        <img src={authorPhotoURL} alt={authorName} className="w-8 h-8 rounded-full border border-primary/20 object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {authorName?.charAt(0) || 'U'}
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-white">{authorName || 'Anonymous'}</p>
                        <p className="text-xs text-text-secondary">{dateStr}</p>
                    </div>
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                </h3>
                <p className="text-text-secondary text-sm line-clamp-3 mb-6 leading-relaxed">
                    {content}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
                        <span className="flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            {votes || 0}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {commentCount || 0}
                        </span>
                    </div>

                    <button className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                        Read More →
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
