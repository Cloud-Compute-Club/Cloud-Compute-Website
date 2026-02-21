import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CliDownloadWidget({ providerName, providerColor }) {
    const [copied, setCopied] = useState(false);
    const [os, setOs] = useState('macOS');

    const commands = {
        'AWS': {
            'macOS': 'curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"\nsudo installer -pkg AWSCLIV2.pkg -target /',
            'Linux': 'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"\nunzip awscliv2.zip\nsudo ./aws/install',
            'Windows': 'msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi'
        },
        'Azure': {
            'macOS': 'brew update && brew install azure-cli',
            'Linux': 'curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash',
            'Windows': 'Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\\AzureCLI.msi\nStart-Process msiexec.exe -Wait -ArgumentList \'/I AzureCLI.msi /quiet\''
        },
        'Google Cloud': {
            'macOS': 'curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-darwin-x86_64.tar.gz\ntar -xf google-cloud-cli-darwin-x86_64.tar.gz\n./google-cloud-sdk/install.sh',
            'Linux': 'curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz\ntar -xf google-cloud-cli-linux-x86_64.tar.gz\n./google-cloud-sdk/install.sh',
            'Windows': '(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\\GoogleCloudSDKInstaller.exe")\n& $env:Temp\\GoogleCloudSDKInstaller.exe'
        }
    };

    const activeCommand = commands[providerName]?.[os] || 'npm install -g cloud-cli';

    const handleCopy = () => {
        navigator.clipboard.writeText(activeCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass-card p-6 md:p-8 relative overflow-hidden group flex flex-col justify-between h-full">
            <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none transition-opacity group-hover:opacity-20" style={{ backgroundColor: providerColor }}></div>

            <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl border flex items-center justify-center transition-colors shadow-lg shrink-0"
                        style={{ borderColor: providerColor + '40', backgroundColor: providerColor + '10', color: providerColor }}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white leading-tight">Install {providerName} CLI</h3>
                        <p className="text-sm text-text-secondary mt-0.5">Select your operating system.</p>
                    </div>
                </div>

                <div className="flex bg-background-dark/50 p-1 rounded-lg border border-white/10 shrink-0 self-start">
                    {['macOS', 'Linux', 'Windows'].map(sys => (
                        <button
                            key={sys}
                            onClick={() => setOs(sys)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${os === sys ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-white'}`}
                        >
                            {sys}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative group/code z-10 mt-2">
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 shrink-0 opacity-0 group-hover/code:opacity-100 focus:opacity-100"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
                <div className="bg-background-dark/90 border border-white/10 rounded-xl p-4 md:p-5 font-mono text-sm text-green-400 overflow-x-auto whitespace-pre block w-full custom-scrollbar min-h-[120px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={os}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeCommand.split('\n').map((line, i) => (
                                <div key={i} className="mb-1">{line}</div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            <p className="text-xs text-text-secondary mt-4 opacity-70">Requires administrator privileges to install packages on your system.</p>
        </div>
    );
}
