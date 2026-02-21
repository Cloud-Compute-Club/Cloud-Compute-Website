import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getUserProfile, updateUserProfile, getUserActivity, logout } from '../../api/api';

export default function ProfilePage() {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [activity, setActivity] = useState({ posts: [], voted: [] });
    const [loading, setLoading] = useState(true);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState('');
    const [newTag, setNewTag] = useState('');
    const [activeTab, setActiveTab] = useState('voted');

    // Get target UID from URL or use current user
    const [targetUid, setTargetUid] = useState(null);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const id = searchParams.get('id');
        setTargetUid(id || (currentUser ? currentUser.uid : null));
    }, [currentUser]);

    useEffect(() => {
        if (targetUid) {
            fetchFullProfile(targetUid);
        } else if (!loading && !currentUser) {
            const timer = setTimeout(() => {
                if (!currentUser) window.location.href = '/login';
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [targetUid]);

    const isOwnProfile = currentUser && targetUid === currentUser.uid;

    async function fetchFullProfile(uid) {
        try {
            setLoading(true);
            const data = await getUserProfile(uid);
            setProfile(data);
            setBioText(data.bio || '');

            // Default interactions for desktop. For mobile, we explicitly start on the Profile tab to save space.
            if (window.innerWidth < 1024) {
                setActiveTab('profile');
            } else if (data.role === 'admin') {
                setActiveTab('posts');
            } else {
                setActiveTab('voted');
            }

            console.log('[DEBUG] ProfilePage - fetching activity for:', uid);
            const activityData = await getUserActivity(uid);
            console.log('[DEBUG] ProfilePage - activity data:', activityData);
            setActivity(activityData);
        } catch (err) {
            console.error('[DEBUG] ProfilePage - Error fetching profile or activity:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleSaveBio = async () => {
        if (!isOwnProfile) return;
        try {
            await updateUserProfile(currentUser.uid, { bio: bioText });
            setProfile(prev => ({ ...prev, bio: bioText }));
            setIsEditingBio(false);
        } catch (err) {
            alert('Failed to update bio');
        }
    };

    const handleAddTag = async (e) => {
        if (!isOwnProfile) return;
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            const tag = newTag.trim().toLowerCase();
            const currentTags = profile.tags || [];

            if (currentTags.length >= 8) {
                alert('Maximum 8 expertise tags allowed');
                return;
            }

            if (!currentTags.includes(tag)) {
                const updatedTags = [...currentTags, tag];
                try {
                    await updateUserProfile(currentUser.uid, { tags: updatedTags });
                    setProfile(prev => ({ ...prev, tags: updatedTags }));
                    setNewTag('');
                } catch (err) {
                    alert('Failed to add tag');
                }
            } else {
                setNewTag('');
            }
        }
    };

    const handleRemoveTag = async (tagToRemove) => {
        if (!isOwnProfile) return;
        const updatedTags = profile.tags.filter(t => t !== tagToRemove);
        try {
            await updateUserProfile(currentUser.uid, { tags: updatedTags });
            setProfile(prev => ({ ...prev, tags: updatedTags }));
        } catch (err) {
            alert('Failed to remove tag');
        }
    };

    if (loading && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="max-w-5xl mx-auto pt-32 pb-24 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden"
            >
                {/* Banner Header */}
                <div className="h-48 bg-gradient-to-br from-primary/30 via-background-dark/50 to-background-dark relative border-b border-white/5">
                    <div className="absolute -bottom-12 md:-bottom-16 left-4 md:left-10 flex items-end gap-4 md:gap-6 pr-4">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-surface-dark border-4 border-background-dark flex-shrink-0 flex items-center justify-center text-3xl md:text-4xl font-black text-primary shadow-2xl overflow-hidden glass-card">
                            {profile.photoURL ? (
                                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                profile.displayName?.charAt(0) || 'U'
                            )}
                        </div>
                        <div className="pb-1 md:pb-4 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                                <h1 className="text-xl md:text-3xl font-black text-white leading-tight break-words">{profile.displayName || 'Cloud Architect'}</h1>
                                {profile.role === 'admin' && (
                                    <span className="px-2 md:px-3 py-1 bg-primary text-background-dark rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex-shrink-0">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 mt-1 md:mt-0">
                                <p className="text-text-secondary font-mono text-[10px] md:text-sm opacity-60">ID://{profile.userKey}</p>
                                <span className="text-white/10 text-xs text-text-secondary hidden sm:inline">•</span>
                                <span className="text-white/10 text-[9px] md:text-xs text-text-secondary opacity-80">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Tabs (Only visible on small screens) */}
                <div className="lg:hidden flex border-b border-white/5 px-6 md:px-10 mt-20">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'profile' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                    >
                        Profile
                        {activeTab === 'profile' && <motion.div layoutId="mobileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                    {profile.role === 'admin' && (
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'posts' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                        >
                            Posts
                            {activeTab === 'posts' && <motion.div layoutId="mobileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('voted')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'voted' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                    >
                        Activity
                        {activeTab === 'voted' && <motion.div layoutId="mobileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                </div>

                <div className="pt-8 lg:pt-24 pb-12 px-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Sidebar: Bio & Info (Visible on Desktop always, Visible on Mobile only if 'profile' tab is active) */}
                        <div className={`space-y-8 ${activeTab === 'profile' ? 'block' : 'hidden lg:block'}`}>
                            {/* Expertise Tags */}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Interests</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(profile.tags || []).map(tag => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 group/tag"
                                        >
                                            {tag}
                                            {isOwnProfile && (
                                                <button
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="opacity-40 group-hover/tag:opacity-100 hover:text-white transition-all"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                    {(profile.tags || []).length === 0 && (
                                        <p className="text-text-secondary text-[10px] italic">No specialization tags added.</p>
                                    )}
                                </div>
                                {isOwnProfile && (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            placeholder="Add skill (Press Enter)"
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-primary/30 transition-all placeholder:text-white/20"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Bio</h3>
                                    {isOwnProfile && !isEditingBio && (
                                        <button
                                            onClick={() => setIsEditingBio(true)}
                                            className="text-[10px] font-black uppercase text-text-secondary hover:text-white transition-all"
                                        >
                                            Update
                                        </button>
                                    )}
                                </div>
                                {isEditingBio ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={bioText}
                                            onChange={(e) => setBioText(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-primary/50 transition-all min-h-[120px]"
                                            placeholder="Tell the club about your cloud journey..."
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveBio} className="btn-primary flex-1 py-2 text-[10px]">Save Bio</button>
                                            <button onClick={() => setIsEditingBio(false)} className="bg-white/5 text-white/50 px-4 py-2 rounded-xl text-[10px] font-bold">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap italic">
                                        {profile.bio || "No mission objectives specified yet. Update your bio to share your expertise."}
                                    </p>
                                )}
                            </div>

                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">User information</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-secondary">Role</span>
                                        <span className="text-white font-medium capitalize">{profile.role}</span>
                                    </div>
                                    {isOwnProfile && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-secondary">Email</span>
                                            <span className="text-white font-medium">{profile.email}</span>
                                        </div>
                                    )}
                                </div>
                                {isOwnProfile ? (
                                    <button onClick={logout} className="w-full mt-4 py-3 rounded-xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/5 transition-all">
                                        Terminate Session
                                    </button>
                                ) : (
                                    <a href="/profile" className="block w-full mt-4 py-3 rounded-xl bg-primary text-background-dark text-[10px] font-black uppercase tracking-widest text-center hover:bg-primary-light transition-all">
                                        Go to My Profile
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Main Content: Activity (Visible on Desktop always, Visible on Mobile only if 'posts' or 'voted' tab is active) */}
                        <div className={`lg:col-span-2 space-y-6 ${activeTab === 'profile' ? 'hidden lg:block' : 'block'}`}>
                            {/* Desktop only Navigation Tabs */}
                            <div className="hidden lg:flex gap-8 border-b border-white/5">
                                {profile.role === 'admin' && (
                                    <button
                                        onClick={() => setActiveTab('posts')}
                                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'posts' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                                    >
                                        My Posts
                                        {activeTab === 'posts' && <motion.div layoutId="desktopTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('voted')}
                                    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'voted' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                                >
                                    Interactions
                                    {activeTab === 'voted' && <motion.div layoutId="desktopTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'posts' && (
                                        <motion.div
                                            key="posts-list"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-4"
                                        >
                                            {activity.posts.length > 0 ? (
                                                activity.posts.map(post => (
                                                    <a href={`/post/${post.id}`} key={post.id} className="block p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">{post.title}</h4>
                                                            <span className="text-[10px] text-text-secondary uppercase font-black">{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex gap-4 items-center">
                                                            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                                                {post.votes || 0} Votes
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                                                {post.commentCount || 0} Comments
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))
                                            ) : (
                                                <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl">
                                                    <p className="text-text-secondary text-sm">No architecture blueprints shared yet.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'voted' && (
                                        <motion.div
                                            key="voted-list"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-4"
                                        >
                                            {activity.voted.length > 0 ? (
                                                activity.voted.map(post => (
                                                    <a href={`/post/${post.id}`} key={post.id} className="block p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">{post.title}</h4>
                                                            <div className="flex items-center gap-2">
                                                                {post.voteDirection === 'up' ? (
                                                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase">Upvoted</span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[8px] font-black uppercase">Downvoted</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-text-secondary line-clamp-1 opacity-60">By {post.authorName}</p>
                                                    </a>
                                                ))
                                            ) : (
                                                <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl">
                                                    <p className="text-text-secondary text-sm">No interactions logged in the network yet.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
