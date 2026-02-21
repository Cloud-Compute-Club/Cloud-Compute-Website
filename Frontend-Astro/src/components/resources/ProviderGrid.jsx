import React from 'react';
import { providers } from '../../data/resources';
import { motion } from 'framer-motion';

export default function ProviderGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider, index) => (
                <motion.a
                    key={provider.slug}
                    href={`/providers/${provider.slug}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group glass-card p-8 hover:border-primary/50 transition-all duration-300 relative overflow-hidden"
                >
                    {/* Subtle background glow on hover */}
                    <div
                        className="absolute -right-12 -top-12 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full"
                        style={{ backgroundColor: provider.color }}
                    />

                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white p-3 shadow-lg"
                                style={{ backgroundColor: provider.color }}
                            >
                                {/* Provider Icon */}
                                <img src={provider.icon} alt={`${provider.name} logo`} className="w-8 h-8 object-contain" />
                            </div>
                            <svg className="w-5 h-5 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                            {provider.name}
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-grow">
                            {provider.description}
                        </p>

                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                            <span>EXPLORE RESOURCES</span>
                            <div className="h-px bg-primary/30 flex-grow" />
                        </div>
                    </div>
                </motion.a>
            ))}
        </div>
    );
}
