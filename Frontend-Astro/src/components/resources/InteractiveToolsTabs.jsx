import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PricingCalculatorWidget from './PricingCalculatorWidget';
import ServiceHealthWidget from './ServiceHealthWidget';
import CliDownloadWidget from './CliDownloadWidget';

export default function InteractiveToolsTabs({ providerName, providerColor }) {
    const [activeTab, setActiveTab] = useState('pricing');

    const tabs = [
        { id: 'pricing', label: 'Pricing Estimator' },
        { id: 'health', label: 'Service Health' },
        { id: 'cli', label: 'CLI Download' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'text-white' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                        style={activeTab === tab.id ? { color: providerColor, backgroundColor: providerColor + '20' } : {}}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'pricing' && (
                        <motion.div key="pricing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <PricingCalculatorWidget providerName={providerName} providerColor={providerColor} />
                        </motion.div>
                    )}
                    {activeTab === 'health' && (
                        <motion.div key="health" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <div className="md:w-1/2">
                                <ServiceHealthWidget providerName={providerName} providerColor={providerColor} />
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'cli' && (
                        <motion.div key="cli" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <CliDownloadWidget providerName={providerName} providerColor={providerColor} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
