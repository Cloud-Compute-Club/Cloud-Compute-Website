import React, { useState } from 'react';

export default function PricingCalculatorWidget({ providerName, providerColor }) {

    // Sliders state
    const [vcpus, setVcpus] = useState(0);
    const [ram, setRam] = useState(0);
    const [storage, setStorage] = useState(0);

    // Checkboxes state
    const [hasPublicIp, setHasPublicIp] = useState(false);
    const [hasLoadBalancer, setHasLoadBalancer] = useState(false);

    // Simple pseudo-realistic calculation logic that scales per provider
    const factor = providerName === 'AWS' ? 1.05 : providerName === 'Azure' ? 1.02 : providerName === 'Google Cloud' ? 0.98 : 1.0;

    const computeCost = vcpus * 4 * factor; // $4 per vCPU roughly
    const memoryCost = ram * 1.5 * factor; // $1.5 per GB
    const storageCost = storage * 0.08 * factor; // $0.08 per GB SSD
    const networkCost = (hasPublicIp ? 3.5 : 0) + (hasLoadBalancer ? 18 : 0);

    const totalCost = computeCost + memoryCost + storageCost + networkCost;

    return (
        <div className="glass-card p-6 md:p-10 relative overflow-hidden group">
            {/* Decorative background glow using provider color */}
            <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none transition-opacity group-hover:opacity-20" style={{ backgroundColor: providerColor }}></div>

            <div className="flex items-center gap-4 mb-8">
                <div
                    className="w-12 h-12 rounded-xl border flex items-center justify-center transition-colors shadow-lg"
                    style={{ borderColor: providerColor + '40', backgroundColor: providerColor + '10', color: providerColor }}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Pricing Estimator</h3>
                    <p className="text-sm text-text-secondary">Simulate monthly running costs for {providerName}.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between text-xs font-bold text-white mb-3 uppercase tracking-wider">
                            <span>vCPUs</span>
                            <span style={{ color: providerColor }}>{vcpus} Cores</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="32" step="1"
                            value={vcpus}
                            onChange={(e) => setVcpus(Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-background-dark/80 border border-white/5"
                            style={{ accentColor: providerColor }}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-xs font-bold text-white mb-3 uppercase tracking-wider">
                            <span>Memory (RAM)</span>
                            <span style={{ color: providerColor }}>{ram} GB</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="128" step="1"
                            value={ram}
                            onChange={(e) => setRam(Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-background-dark/80 border border-white/5"
                            style={{ accentColor: providerColor }}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-xs font-bold text-white mb-3 uppercase tracking-wider">
                            <span>Storage (SSD)</span>
                            <span style={{ color: providerColor }}>{storage} GB</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="2000" step="10"
                            value={storage}
                            onChange={(e) => setStorage(Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-background-dark/80 border border-white/5"
                            style={{ accentColor: providerColor }}
                        />
                    </div>
                </div>

                <div className="flex flex-col justify-between">
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group/chk">
                            <div
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasPublicIp ? 'border-transparent' : 'border-white/20 group-hover/chk:border-white/40'}`}
                                style={hasPublicIp ? { backgroundColor: providerColor } : {}}
                            >
                                {hasPublicIp && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input type="checkbox" className="hidden" checked={hasPublicIp} onChange={(e) => setHasPublicIp(e.target.checked)} />
                            <span className="text-sm font-medium text-white/80 select-none">Public IPv4 Address</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group/chk">
                            <div
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasLoadBalancer ? 'border-transparent' : 'border-white/20 group-hover/chk:border-white/40'}`}
                                style={hasLoadBalancer ? { backgroundColor: providerColor } : {}}
                            >
                                {hasLoadBalancer && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input type="checkbox" className="hidden" checked={hasLoadBalancer} onChange={(e) => setHasLoadBalancer(e.target.checked)} />
                            <span className="text-sm font-medium text-white/80 select-none">App Load Balancer</span>
                        </label>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/10">
                        <p className="text-xs text-text-secondary uppercase font-bold tracking-widest mb-1">Estimated Monthly Run Rate</p>
                        <p className="text-5xl font-black text-white flex items-start gap-1">
                            <span className="text-2xl mt-1.5" style={{ color: providerColor }}>$</span>
                            {totalCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-text-secondary mt-3">
                            * Pricing is an approximation based on generic {providerName} rates.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
