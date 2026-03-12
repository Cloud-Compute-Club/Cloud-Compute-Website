import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { deletePost } from '../../api/api.js';

export default function AdminPostActions({ postId, authorId }) {
    const { currentUser } = useAuth();

    // An admin OR the original author can edit/delete
    const isPostAuthorOrAdmin = currentUser && (currentUser.uid === authorId || currentUser.role === 'admin');

    if (!isPostAuthorOrAdmin) return null;

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this Post?')) {
            try {
                await deletePost(postId);
                window.location.href = '/posts';
            } catch (err) {
                alert(err.message);
            }
        }
    };

    return (
        <>
            <div className="w-px h-4 bg-white/10 hidden md:block"></div>
            <a href={`/post/edit/${postId}`} className="flex items-center gap-1.5 text-text-secondary hover:text-white cursor-pointer transition-colors text-sm font-bold">
                Edit
            </a>
            <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-text-secondary hover:text-red-500 cursor-pointer transition-colors text-sm font-bold"
            >
                Delete
            </button>
        </>
    );
}
