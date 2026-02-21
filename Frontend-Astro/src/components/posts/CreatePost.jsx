import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addPost, ERROR_TYPES } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
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

export default function CreatePost() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]); // Array of { file, previewUrl, caption }
    const [postRole, setPostRole] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser?.role) {
            setPostRole(currentUser.role === 'admin' ? 'Cloud Architect' : 'Infrastructure Specialist');
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser && !loading) {
            const timer = setTimeout(() => {
                if (!currentUser) window.location.href = '/login';
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            caption: ''
        }));

        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index) => {
        setImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].previewUrl);
            updated.splice(index, 1);
            return updated;
        });
    };

    const updateCaption = (index, caption) => {
        setImages(prev => {
            const updated = [...prev];
            updated[index].caption = caption;
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await addPost(title, content, images, isPinned, postRole);
            window.location.href = '/posts';
        } catch (err) {
            setError(err.message || 'Failed to create post');
            setLoading(false);
        }
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="glass-card p-12 text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Permission Denied</h2>
                    <p className="text-text-secondary">You must be an administrator to create new architecture Posts.</p>
                    <a href="/posts" className="btn-primary mt-8 inline-block">Back to Blog</a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pt-32 pb-24 px-6 md:px-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-10"
            >
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Build New Architecture</h1>
                    <p className="text-text-secondary">Share your latest project or insight with the community.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-white/70 ml-1">Post Title</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xl font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                            placeholder="Multi-Cloud Governance with Draco..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-white/70 ml-1">Your Role for this Post</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                            placeholder="e.g. Lead Developer, Cloud Architect..."
                            value={postRole}
                            onChange={(e) => setPostRole(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-white/70 ml-1">Architecture Diagrams & Images</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence>
                                {images.map((img, index) => (
                                    <motion.div
                                        key={img.previewUrl}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative group bg-white/5 border border-white/10 rounded-2xl p-3"
                                    >
                                        <img src={img.previewUrl} className="w-full h-40 object-cover rounded-xl mb-3" />
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary/30"
                                            placeholder="Add a caption..."
                                            value={img.caption}
                                            onChange={(e) => updateCaption(index, e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <label className="flex flex-col items-center justify-center h-52 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-primary/30 transition-all group">
                                <div className="flex flex-col items-center justify-center py-5">
                                    <svg className="w-10 h-10 mb-3 text-white/40 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <p className="text-sm text-white/40 group-hover:text-white transition-colors">Click to upload image</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-white/70 ml-1">The Post (Rich Text)</label>
                        <Editor
                            value={content}
                            onTextChange={(e) => setContent(e.htmlValue)}
                            headerTemplate={header}
                            style={{ height: '320px' }}
                            placeholder="Detail the architecture, implementation steps, and cloud resources used..."
                            className="bg-white/5 border border-white/10"
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="toggle"
                                id="toggle"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer outline-none checked:right-0 right-4 checked:bg-primary transition-all duration-300"
                            />
                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-white/20 cursor-pointer"></label>
                        </div>
                        <label htmlFor="toggle" className="text-sm font-bold text-white/80 cursor-pointer">Pin this post to the top of the feed</label>
                    </div>

                    <div className="flex items-center justify-end gap-5 border-t border-white/5 pt-10 mt-10">
                        <a href="/posts" className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">Cancel</a>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-background-dark px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-light active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <>
                                    <div className="h-5 w-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></div>
                                    <span>Publishing...</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Publish Post
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

