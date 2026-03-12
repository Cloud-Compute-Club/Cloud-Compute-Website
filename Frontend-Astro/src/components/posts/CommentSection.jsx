import React, { useState, useEffect } from 'react';
import { addComment, getComments, voteOnComment, deleteComment, updateComment } from '../../api/api.js';
import { useAuth } from '../../hooks/useAuth';

function Comment({ comment, onReply, postId, depth = 0 }) {
    const { currentUser } = useAuth();
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [votes, setVotes] = useState(comment.votes || 0);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [imgError, setImgError] = useState(false);

    const isAuthorOrAdmin = currentUser && (currentUser.uid === comment.authorId || currentUser.role === 'admin');

    const handleCommentVote = async (direction) => {
        try {
            await voteOnComment(postId, comment.id, direction);
            setVotes(prev => direction === 'up' ? prev + 1 : prev - 1);
        } catch (err) {
            console.error('Comment vote failed:', err);
        }
    };

    const handleReplySubmit = async () => {
        if (!replyText.trim()) return;
        try {
            await onReply(comment.id, replyText);
            setReplyText('');
            setIsReplying(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEditSubmit = async () => {
        if (!editText.trim()) return;
        try {
            await updateComment(postId, comment.id, editText);
            setIsEditing(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            await deleteComment(postId, comment.id);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className={`mt-6 ${depth > 0 ? 'ml-6 border-l-2 border-white/5 pl-6' : ''}`}>
            <div className="flex gap-4">
                {comment.authorPhotoURL && !imgError ? (
                    <img
                        src={comment.authorPhotoURL}
                        className="w-10 h-10 rounded-full border border-white/10 object-cover"
                        alt=""
                        onError={() => setImgError(true)}
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 text-sm font-bold">
                        {comment.authorName?.charAt(0) || 'U'}
                    </div>
                )}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{comment.authorName}</span>
                        <span className="text-xs text-text-secondary">
                            {comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                        </span>
                        {comment.updatedAt && (
                            <span className="text-[10px] text-text-secondary italic">(edited)</span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="mt-2 space-y-3">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary/50"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleEditSubmit} className="bg-primary text-background-dark px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Save</button>
                                <button onClick={() => setIsEditing(false)} className="bg-white/5 text-white/50 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-text-secondary text-sm leading-relaxed mb-3">{comment.content}</p>
                    )}

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-xs font-bold text-primary hover:text-primary-light transition-colors"
                        >
                            Reply
                        </button>

                        {isAuthorOrAdmin && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs font-bold text-text-secondary hover:text-white transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="text-xs font-bold text-text-secondary hover:text-red-500 transition-colors"
                                >
                                    Delete
                                </button>
                            </>
                        )}

                        <div className="flex items-center gap-2 text-text-secondary">
                            <button
                                onClick={() => handleCommentVote('up')}
                                className="hover:text-primary transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <span className="text-xs font-bold">{votes}</span>
                            <button
                                onClick={() => handleCommentVote('down')}
                                className="hover:text-red-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {isReplying && (
                        <div className="mt-4 flex gap-3">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-primary/50"
                            />
                            <button
                                onClick={handleReplySubmit}
                                className="bg-primary text-background-dark px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-light"
                            >
                                Post
                            </button>
                        </div>
                    )}

                    {comment.replies?.map(reply => (
                        <Comment key={reply.id} comment={reply} onReply={onReply} postId={postId} depth={depth + 1} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function CommentSection({ postId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        let unsubscribe;
        if (postId) {
            unsubscribe = getComments(postId, (data) => {
                const commentMap = {};
                const topLevel = [];

                data.forEach(c => {
                    commentMap[c.id] = { ...c, replies: [] };
                });

                data.forEach(c => {
                    if (c.parentId && commentMap[c.parentId]) {
                        commentMap[c.parentId].replies.push(commentMap[c.id]);
                    } else if (!c.parentId) {
                        topLevel.push(commentMap[c.id]);
                    }
                });

                setComments(topLevel);
            });
        }
        return () => unsubscribe && unsubscribe();
    }, [postId]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await addComment(postId, newComment);
            setNewComment('');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleReply = async (parentId, text) => {
        await addComment(postId, text, parentId);
    };

    const totalCount = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);

    return (
        <div className="mt-8 glass-card border-white/5 p-6 md:p-10">
            <h3 className="text-xl font-black text-white mb-8">Discussions ({totalCount})</h3>

            {currentUser ? (
                <form onSubmit={handleCommentSubmit} className="mb-12">
                    <div className="relative">
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-white text-sm outline-none focus:border-primary/50 transition-all min-h-[140px] placeholder:text-white/20"
                            placeholder="What are your thoughts on this architecture?"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="absolute bottom-4 right-4">
                            <button type="submit" className="bg-primary text-background-dark px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary-light transition-all active:scale-95 shadow-lg shadow-primary/20">
                                Post Comment
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-8 border border-dashed border-white/10 rounded-xl text-center mb-12">
                    <p className="text-text-secondary text-sm mb-4 font-medium">Join the architecture discussion.</p>
                    <a href="/login" className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl inline-block hover:bg-white/10 transition-all font-bold text-sm">Sign In to Comment</a>
                </div>
            )}

            <div className="space-y-2">
                {comments.map(comment => (
                    <Comment key={comment.id} comment={comment} onReply={handleReply} postId={postId} />
                ))}
            </div>
        </div>
    );
}
