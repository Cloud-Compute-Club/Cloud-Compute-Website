const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/AdminDashboard.jsx', 'utf8');

if(!code.includes('activeTab')) {
    code = code.replace(
        "const [loading, setLoading] = useState(true);",
        `const [loading, setLoading] = useState(true);\n    const [activeTab, setActiveTab] = useState('content'); // 'content' or 'resources'\n    const [resourcesJson, setResourcesJson] = useState('{}');\n    const [isSavingResources, setIsSavingResources] = useState(false);`
    );

    code = code.replace(
        "import ReactMarkdown from 'react-markdown';",
        `import ReactMarkdown from 'react-markdown';\nimport { providers as initialProviders, featuredResources as initialFeatured } from '../../data/resources';`
    );

    code = code.replace(
        "useEffect(() => {",
        `useEffect(() => {\n        setResourcesJson(JSON.stringify({ providers: initialProviders, featuredResources: initialFeatured }, null, 2));\n    }, []);\n\n    const handleSaveResources = async () => {\n        setIsSavingResources(true);\n        setError('');\n        try {\n            const parsed = JSON.parse(resourcesJson);\n            const res = await fetch('/api/resources.json', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify(parsed)\n            });\n            if (!res.ok) throw new Error('Failed to save resources');\n            setSuccessMessage('Resources saved successfully!');\n        } catch (e) {\n            setError('Error: ' + e.message);\n        } finally {\n            setIsSavingResources(false);\n        }\n    };\n\n    useEffect(() => {`
    );

    const tabsHTML = `
            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 mb-8 pb-4">
                <button 
                    onClick={() => setActiveTab('content')} 
                    className={\`font-bold \${activeTab === 'content' ? 'text-primary border-b-2 border-primary pb-4 -mb-[17px]' : 'text-text-secondary hover:text-white'}\`}
                >
                    Content & Events
                </button>
                <button 
                    onClick={() => setActiveTab('resources')} 
                    className={\`font-bold \${activeTab === 'resources' ? 'text-primary border-b-2 border-primary pb-4 -mb-[17px]' : 'text-text-secondary hover:text-white'}\`}
                >
                    Resources Data
                </button>
            </div>
    `;

    code = code.replace(
        "            {/* Notifications */}",
        tabsHTML + "\n            {/* Notifications */}"
    );

    code = code.replace(
        "            {isCreatingPost ? (",
        `            {activeTab === 'resources' && (
                <div className="glass-card p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Manage Resources</h2>
                        <p className="text-text-secondary text-sm">Edit the raw JSON data that powers the Cloud Resources page and provider hubs.</p>
                    </div>
                    <textarea 
                        className="w-full h-[500px] bg-background-dark/80 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-white/80 outline-none focus:border-primary/50 transition-colors"
                        value={resourcesJson}
                        onChange={(e) => setResourcesJson(e.target.value)}
                    ></textarea>
                    <div>
                        <button 
                            onClick={handleSaveResources}
                            disabled={isSavingResources}
                            className="btn-primary"
                        >
                            {isSavingResources ? 'Saving Server...' : 'Save Resources File'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'content' && isCreatingPost ? (`
    );

    // Now replacing the end to wrap activeTab === 'content'
    code = code.replace(
        "            <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-10\">",
        `            {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">`
    );

    code = code.replace(
        "        </div>\n    );\n}",
        "            </div>\n            )}\n        </div>\n    );\n}"
    );

    fs.writeFileSync('src/components/Pages/AdminDashboard.jsx', code);
    console.log("Patched AdminDashboard.jsx");
} else {
    console.log("Already patched.");
}
