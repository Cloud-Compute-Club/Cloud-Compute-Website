import React, { useState } from 'react';
import { updateUserProfile } from '../../api/api.js';

export default function BioTagEditor({ profile, currentUserUid }) {
    const isOwnProfile = profile.uid === currentUserUid;
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState(profile.bio || '');
    const [newTag, setNewTag] = useState('');
    const [tags, setTags] = useState(profile.tags || []);
    const [localProfile, setLocalProfile] = useState(profile);

    if (!isOwnProfile) {
        return (
            <div className="space-y-8">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Interests</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {tags.map(tag => (
                            <span key={tag} className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                                {tag}
                            </span>
                        ))}
                        {tags.length === 0 && <p className="text-text-secondary text-[10px] italic">No specialization tags added.</p>}
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Bio</h3>
                    <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap italic">
                        {localProfile.bio || "No mission objectives specified yet."}
                    </p>
                </div>
            </div>
        );
    }

    const handleSaveBio = async () => {
        try {
            await updateUserProfile(currentUserUid, { bio: bioText });
            setLocalProfile(prev => ({ ...prev, bio: bioText }));
            setIsEditingBio(false);
        } catch (err) {
            alert('Failed to update bio');
        }
    };

    const handleAddTag = async (e) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            const tag = newTag.trim().toLowerCase();
            if (tags.length >= 8) {
                alert('Maximum 8 expertise tags allowed');
                return;
            }
            if (!tags.includes(tag)) {
                const updatedTags = [...tags, tag];
                try {
                    await updateUserProfile(currentUserUid, { tags: updatedTags });
                    setTags(updatedTags);
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
        const updatedTags = tags.filter(t => t !== tagToRemove);
        try {
            await updateUserProfile(currentUserUid, { tags: updatedTags });
            setTags(updatedTags);
        } catch (err) {
            alert('Failed to remove tag');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map(tag => (
                        <span key={tag} className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 group/tag">
                            {tag}
                            <button onClick={() => handleRemoveTag(tag)} className="opacity-40 group-hover/tag:opacity-100 hover:text-white transition-all">×</button>
                        </span>
                    ))}
                </div>
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
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Bio</h3>
                    {!isEditingBio && (
                        <button onClick={() => setIsEditingBio(true)} className="text-[10px] font-black uppercase text-text-secondary hover:text-white transition-all">Update</button>
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
                            <button onClick={handleSaveBio} className="bg-primary text-background-dark px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary-light transition-all flex-1">Save Bio</button>
                            <button onClick={() => setIsEditingBio(false)} className="bg-white/5 text-white/50 px-4 py-2 rounded-xl text-[10px] font-bold">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap italic">
                        {localProfile.bio || "No mission objectives specified yet. Update your bio to share your expertise."}
                    </p>
                )}
            </div>
        </div>
    );
}
