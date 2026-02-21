import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getPosts, db, addPost, deletePost, togglePinPost } from '../../api/api';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { providers as initialProviders, featuredResources as initialFeatured } from '../../data/resources';
import { Editor } from 'primereact/editor';

const renderHeader = () => {
    return (
        <span className="ql-formats">
            <select className="ql-header" defaultValue="0">
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
                <option value="0">Normal</option>
            </select>
            <select className="ql-font">
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
            </select>
            <select className="ql-size" defaultValue="normal">
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
                <option value="huge">Huge</option>
            </select>
            <button className="ql-bold" aria-label="Bold"></button>
            <button className="ql-italic" aria-label="Italic"></button>
            <button className="ql-underline" aria-label="Underline"></button>
            <span className="ql-formats">
                <button className="ql-list" value="ordered" aria-label="Ordered List"></button>
                <button className="ql-list" value="bullet" aria-label="Bullet List"></button>
            </span>
            <span className="ql-formats">
                <button className="ql-link" aria-label="Insert Link"></button>
                <button className="ql-image" aria-label="Insert Image"></button>
                <button className="ql-code-block" aria-label="Insert Code Block"></button>
            </span>
            <button className="ql-clean" aria-label="Remove Formatting"></button>
        </span>
    );
};

const header = renderHeader();


export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('content');
    const [providersData, setProvidersData] = useState([]);
    const [featuredData, setFeaturedData] = useState([]);
    const [isSavingResources, setIsSavingResources] = useState(false);

    useEffect(() => {
        setProvidersData(JSON.parse(JSON.stringify(initialProviders)));
        setFeaturedData(JSON.parse(JSON.stringify(initialFeatured)));
    }, []);

    const handleSaveResources = async () => {
        setIsSavingResources(true);
        setError('');
        try {
            const res = await fetch('/api/resources.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ providers: providersData, featuredResources: featuredData })
            });
            if (!res.ok) throw new Error('Failed to save resources');
            setSuccessMessage('Resources saved successfully!');
        } catch (e) {
            setError('Error: ' + e.message);
        } finally {
            setIsSavingResources(false);
        }
    };

    const updateProvider = (index, field, value) => {
        const newData = [...providersData];
        newData[index][field] = value;
        setProvidersData(newData);
    };

    const updateProviderResource = (providerIndex, resourceIndex, field, value) => {
        const newData = [...providersData];
        newData[providerIndex].resources[resourceIndex][field] = value;
        setProvidersData(newData);
    };

    const updateFeatured = (index, field, value) => {
        const newData = [...featuredData];
        newData[index][field] = value;
        setFeaturedData(newData);
    };

    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImages, setNewPostImages] = useState([]); // Array of { file, previewUrl, caption }
    const [isPinned, setIsPinned] = useState(false);
    const [postRole, setPostRole] = useState('Cloud Architect'); // Default for admin
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // Auto-promote specific user for testing/setup
        if (currentUser?.email === 'batsteel209@gmail.com' && currentUser?.role !== 'admin') {
            const promoteUser = async () => {
                try {
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const userRef = doc(db, 'users', currentUser.uid);
                    await updateDoc(userRef, { role: 'admin' });
                    // Force reload to pick up changes or update local state logic if needed
                    // For now, next refresh will have it, but we also bypass the check below
                    console.log('Promoted user to admin');
                } catch (e) {
                    console.error('Promotion failed', e);
                }
            };
            promoteUser();
        }

        if (currentUser?.role !== 'admin' && currentUser?.email !== 'batsteel209@gmail.com' && !loading) {
            const timer = setTimeout(() => {
                // If not admin, redirect or show access denied
                // For now, let the component render the Access Denied view
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (currentUser?.uid) {
                try {
                    const userRef = doc(db, 'users', currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists() && userSnap.data().role) {
                        setPostRole(userSnap.data().role);
                    }
                } catch (err) {
                    console.error('Failed to fetch user role:', err);
                }
            }
        };
        fetchUserRole();

        const unsubscribePosts = getPosts(setPosts);
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, orderBy('date', 'asc'));
        const unsubscribeEvents = onSnapshot(q, (snapshot) => {
            const evts = [];
            snapshot.forEach(doc => evts.push({ id: doc.id, ...doc.data() }));
            setEvents(evts);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });

        return () => {
            unsubscribePosts();
            unsubscribeEvents();
        };
    }, [currentUser]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            caption: ''
        }));

        setNewPostImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index) => {
        setNewPostImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].previewUrl);
            updated.splice(index, 1);
            return updated;
        });
    };

    const updateImageCaption = (index, caption) => {
        setNewPostImages(prev => {
            const updated = [...prev];
            updated[index].caption = caption;
            return updated;
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        setError('');

        try {
            if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                // Handle DOCX via dynamic import
                const mammoth = (await import('mammoth')).default || await import('mammoth');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                setNewPostContent(result.value);
                setSuccessMessage('Content extracted from DOCX successfully!');
            } else if (file.type === 'application/pdf') {
                // Handle PDF via dynamic import
                const pdfjsLib = await import('pdfjs-dist');
                // Set worker src dynamically
                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
                }

                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }

                setNewPostContent(fullText);
                setSuccessMessage('Content extracted from PDF successfully!');
            } else {
                setError('Unsupported file type. Please upload .docx or .pdf');
            }
        } catch (err) {
            console.error('File extraction error:', err);
            setError('Failed to read file content: ' + err.message);
        } finally {
            setUploadingFile(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!newPostTitle.trim() || !newPostContent.trim()) {
            setError('Title and content are required.');
            return;
        }

        try {
            await addPost(newPostTitle, newPostContent, newPostImages, isPinned, postRole);
            setSuccessMessage('Post created successfully!');
            setNewPostTitle('');
            setNewPostContent('');
            setNewPostImages([]);
            setIsPinned(false);
            setIsCreatingPost(false);
        } catch (err) {
            setError('Failed to create post: ' + err.message);
        }
    };

    const handleTogglePinPost = async (postId, currentPinned) => {
        try {
            await togglePinPost(postId, currentPinned);
            setSuccessMessage(`Post ${currentPinned ? 'unpinned' : 'pinned'} successfully.`);
        } catch (err) {
            setError('Failed to update pin status: ' + err.message);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return;

        try {
            await deletePost(postId);
            setSuccessMessage('Post deleted successfully.');
        } catch (err) {
            setError('Failed to delete post: ' + err.message);
            // Clear error after 3 seconds
            setTimeout(() => setError(''), 3000);
        }
    };

    const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'batsteel209@gmail.com';

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="glass-card p-12 text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
                    <p className="text-text-secondary">Administrators only beyond this point.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pt-32 pb-24 px-6 md:px-12">
            <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">Admin <span className="text-gradient">Control Center</span></h1>
                    <p className="text-text-secondary text-lg max-w-2xl">Manage content, events, and community engagement.</p>
                </div>
                {!isCreatingPost && (
                    <button
                        onClick={() => setIsCreatingPost(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        New Post
                    </button>
                )}
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 mb-8 pb-4">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`font-bold transition-colors ${activeTab === 'content' ? 'text-primary border-b-2 border-primary pb-4 -mb-[17px]' : 'text-text-secondary hover:text-white'}`}
                >
                    Content & Events
                </button>
                <button
                    onClick={() => setActiveTab('resources')}
                    className={`font-bold transition-colors ${activeTab === 'resources' ? 'text-primary border-b-2 border-primary pb-4 -mb-[17px]' : 'text-text-secondary hover:text-white'}`}
                >
                    Resources Data
                </button>
            </div>

            {/* Notifications */}
            <AnimatePresence>
                {/* Error Banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex justify-between items-center"
                    >
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="text-red-500 hover:text-red-400">×</button>
                    </motion.div>
                )}
                {/* Success Banner */}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 flex justify-between items-center"
                    >
                        <span>{successMessage}</span>
                        <button onClick={() => setSuccessMessage('')} className="text-green-500 hover:text-green-400">×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {activeTab === 'resources' && (
                <div className="space-y-12">
                    <div className="glass-card p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Manage Cloud Providers</h2>
                                <p className="text-text-secondary text-sm">Update text, colors, and direct documentation links.</p>
                            </div>
                            <button onClick={handleSaveResources} disabled={isSavingResources} className="btn-primary shrink-0">
                                {isSavingResources ? 'Saving...' : 'Save All Changes'}
                            </button>
                        </div>

                        <div className="space-y-8">
                            {providersData.map((provider, pIndex) => (
                                <div key={pIndex} className="p-6 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
                                    <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: provider.color }}></div>

                                    <div className="flex items-center gap-4 mb-6 ml-4">
                                        <img src={provider.icon} className="w-8 h-8 object-contain bg-white/5 rounded-lg p-1" />
                                        <h3 className="text-xl font-bold">Provider: {provider.name}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4 mb-6">
                                        <div>
                                            <label className="text-xs text-text-secondary font-bold uppercase tracking-wider block mb-1">Name</label>
                                            <input type="text" className="w-full bg-background-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50" value={provider.name} onChange={(e) => updateProvider(pIndex, 'name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-secondary font-bold uppercase tracking-wider block mb-1">Color (Hex)</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={provider.color || '#000000'} onChange={(e) => updateProvider(pIndex, 'color', e.target.value)} className="w-10 h-10 rounded shrink-0 bg-transparent border-none cursor-pointer p-0 shadow-lg" />
                                                <input type="text" className="w-full bg-background-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50" value={provider.color} onChange={(e) => updateProvider(pIndex, 'color', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs text-text-secondary font-bold uppercase tracking-wider block mb-1">Description</label>
                                            <input type="text" className="w-full bg-background-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50" value={provider.description} onChange={(e) => updateProvider(pIndex, 'description', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="ml-4 pt-4 border-t border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-3">Core Resources List</h4>
                                        <div className="space-y-3">
                                            {provider.resources.map((resource, rIndex) => (
                                                <div key={rIndex} className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end bg-background-dark/30 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                    <div className="lg:col-span-3">
                                                        <label className="text-[10px] text-text-secondary font-bold uppercase block mb-1">Title</label>
                                                        <input type="text" className="w-full bg-background-dark border border-white/10 rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-primary/50" value={resource.title} onChange={(e) => updateProviderResource(pIndex, rIndex, 'title', e.target.value)} />
                                                    </div>
                                                    <div className="lg:col-span-6">
                                                        <label className="text-[10px] text-text-secondary font-bold uppercase block mb-1">URL / Link Target</label>
                                                        <input type="text" className="w-full bg-background-dark border border-white/10 rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-primary/50" value={resource.url} onChange={(e) => updateProviderResource(pIndex, rIndex, 'url', e.target.value)} />
                                                    </div>
                                                    <div className="lg:col-span-3">
                                                        <label className="text-[10px] text-text-secondary font-bold uppercase block mb-1">Badge Type</label>
                                                        <select className="w-full bg-background-dark border border-white/10 rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-primary/50 appearance-none" value={resource.type} onChange={(e) => updateProviderResource(pIndex, rIndex, 'type', e.target.value)}>
                                                            <option value="link">Link</option>
                                                            <option value="resource">Resource</option>
                                                            <option value="blog">Blog</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Featured Carousel Items</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {featuredData.map((item, fIndex) => (
                                <div key={fIndex} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4 hover:border-white/20 transition-all">
                                    {item.image && (
                                        <div className="h-32 rounded-lg overflow-hidden bg-background-dark relative">
                                            <img src={item.image} alt="preview" className="w-full h-full object-cover opacity-80" />
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">Preview</div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs text-text-secondary font-bold uppercase mb-1 block">Carousel Title</label>
                                        <input type="text" className="w-full bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" value={item.title} onChange={(e) => updateFeatured(fIndex, 'title', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-secondary font-bold uppercase mb-1 block">Description</label>
                                        <input type="text" className="w-full bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" value={item.description} onChange={(e) => updateFeatured(fIndex, 'description', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-secondary font-bold uppercase mb-1 block">Destination URL</label>
                                        <input type="text" className="w-full bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" value={item.url} onChange={(e) => updateFeatured(fIndex, 'url', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-secondary font-bold uppercase mb-1 block">Backdrop Image URL</label>
                                        <input type="text" className="w-full bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" value={item.image} onChange={(e) => updateFeatured(fIndex, 'image', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/10 flex justify-end">
                            <button onClick={handleSaveResources} disabled={isSavingResources} className="btn-primary">
                                {isSavingResources ? 'Saving Server...' : 'Save All Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'content' && isCreatingPost && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 mb-10"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Create New Post</h2>
                        <button onClick={() => setIsCreatingPost(false)} className="text-text-secondary hover:text-white transition-colors">Cancel</button>
                    </div>

                    <form onSubmit={handleCreatePost} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Post Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                                    placeholder="Enter post title..."
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-white/70">Post Display Role</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                                    placeholder="e.g. Cloud Architect, System Engineer..."
                                    value={postRole}
                                    onChange={(e) => setPostRole(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-white/70">Import Content (DOCX/PDF)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".docx,.pdf"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 border border-white/10 rounded-xl cursor-pointer transition-colors ${uploadingFile ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        {uploadingFile ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                <span className="text-white/50">Processing file...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <span className="text-text-secondary">Upload Document to Extract Text</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Gallery */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-white/70">Architecture Diagrams & Images</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {newPostImages.map((img, index) => (
                                        <motion.div
                                            key={img.previewUrl}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="relative group bg-white/5 border border-white/10 rounded-xl p-2"
                                        >
                                            <img src={img.previewUrl} className="w-full h-32 object-cover rounded-lg mb-2" />
                                            <input
                                                type="text"
                                                className="w-full bg-black/40 border border-white/5 rounded-md px-2 py-1 text-[10px] text-white outline-none focus:border-primary/30"
                                                placeholder="Caption..."
                                                value={img.caption}
                                                onChange={(e) => updateImageCaption(index, e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                <label className="flex flex-col items-center justify-center h-[178px] bg-white/5 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/10 hover:border-primary/20 transition-all group">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-8 h-8 mb-2 text-white/30 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <p className="text-xs text-white/30 group-hover:text-white">Add Image</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-white/70">Content (Rich Text Editor)</label>
                            <Editor
                                value={newPostContent}
                                onTextChange={(e) => setNewPostContent(e.htmlValue)}
                                headerTemplate={header}
                                style={{ height: '320px' }}
                                placeholder="Write your post content here or import from a file..."
                                className="bg-white/5 border border-white/10"
                            />
                        </div>

                        {/* Pin Toggle */}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 max-w-sm">
                            <div
                                onClick={() => setIsPinned(!isPinned)}
                                className={`relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in cursor-pointer rounded-full ${isPinned ? 'bg-primary' : 'bg-white/20'}`}
                            >
                                <span
                                    className={`absolute block w-4 h-4 mt-1 ml-1 rounded-full bg-white transition-transform duration-200 ease-in ${isPinned ? 'translate-x-4' : ''}`}
                                />
                            </div>
                            <label className="text-sm font-bold text-white/80 cursor-pointer" onClick={() => setIsPinned(!isPinned)}>Pin post to top of feed</label>
                        </div>

                        {/* Live Preview Snippet */}
                        {newPostContent && (
                            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mb-2">Content Preview</p>
                                <div className="prose prose-invert max-w-none">
                                    <div className="ql-editor !p-0" dangerouslySetInnerHTML={{ __html: newPostContent }} />
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/5 flex gap-4">
                            <button
                                type="submit"
                                disabled={uploadingFile}
                                className="btn-primary px-8 py-3"
                            >
                                Publish Post
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {activeTab === 'content' && !isCreatingPost && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Quick Stats */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="glass-card p-8 border-primary/20 bg-primary/5">
                            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Total Posts</p>
                            <h3 className="text-4xl font-black">{posts.length}</h3>
                        </div>
                        {/* ... other stats ... */}
                        <div className="glass-card p-8 border-primary/20 bg-primary/5">
                            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Upcoming Events</p>
                            <h3 className="text-4xl font-black">{events.length}</h3>
                        </div>
                    </div>

                    {/* Post Management */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Manage Posts</h2>
                        </div>

                        <div className="space-y-4">
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <div key={post.id} className="glass-card p-6 flex items-center justify-between gap-4 group">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-white mb-1 truncate">{post.title}</h4>
                                            <p className="text-xs text-text-secondary">By {post.authorName} • {post.votes} votes • {new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleTogglePinPost(post.id, post.pinned)}
                                                className={`p-2 rounded-lg transition-colors ${post.pinned ? 'bg-primary/20 text-primary' : 'bg-white/5 hover:bg-white/10 text-white/50'}`}
                                                title={post.pinned ? "Unpin Post" : "Pin Post"}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v11l-5 2.5L5 18V5z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                                title="Delete Post"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 glass-card">
                                    <p className="text-text-secondary">No posts found. Create one to get started!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Event Management */}
                    <div className="space-y-8">
                        {/* ... (Existing event code) ... */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Events</h2>
                            {/* ... */}
                        </div>
                        <div className="space-y-4">
                            {events.length > 0 ? (
                                events.map(event => (
                                    <div key={event.id} className="glass-card p-6 border-l-4 border-l-primary">
                                        <p className="text-[10px] font-black uppercase text-primary mb-1">{event.type || 'Workshop'}</p>
                                        <h4 className="font-bold text-white mb-2">{event.title}</h4>
                                        <p className="text-xs text-text-secondary flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {event.date}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="glass-card p-10 text-center">
                                    <p className="text-text-secondary text-sm italic">No events scheduled.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
