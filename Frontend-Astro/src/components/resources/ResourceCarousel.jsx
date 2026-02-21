import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { featuredResources } from '../../data/resources';

export default function ResourceCarousel() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % featuredResources.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden rounded-3xl group">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    {/* Background Image with Gradient Overlay */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${featuredResources[index].image})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background-dark/80 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 mb-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold mb-4 backdrop-blur-md">
                                Featured: {featuredResources[index].provider}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                                {featuredResources[index].title}
                            </h2>
                            <p className="max-w-xl text-text-secondary text-lg mb-6 line-clamp-2">
                                {featuredResources[index].description}
                            </p>
                            <a
                                href={featuredResources[index].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                Go to Resource
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </a>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Progress Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {featuredResources.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-primary' : 'w-2 bg-white/20 hover:bg-white/40'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
