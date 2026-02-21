import React, { useState, useEffect } from 'react';

export default function ServiceHealthWidget({ providerName, providerColor }) {
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        // Mock a network request delay
        const timer = setTimeout(() => {
            setStatus('operational');
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="glass-card p-6 relative overflow-hidden group flex flex-col justify-between h-full">
            <div className="flex items-center gap-4 mb-4">
                <div
                    className="w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shadow-lg shrink-0"
                    style={{ borderColor: providerColor + '40', backgroundColor: providerColor + '10', color: providerColor }}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Service Health</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Real-time simulated status</p>
                </div>
            </div>

            <div>
                <div className="bg-background-dark/50 border border-white/5 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-sm text-text-secondary font-medium">Global Array</span>
                    {status === 'checking' ? (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-ping"></div>
                            <span className="text-sm font-bold text-yellow-500">Pinging...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                            <span className="text-sm font-bold text-green-500">Operational</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
