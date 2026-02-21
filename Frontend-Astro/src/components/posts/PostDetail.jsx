import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { getPost, voteOnPost, addComment, getComments, auth, voteOnComment, getPostsByUser, deleteComment, updateComment, getUserVote } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';

function Comment({ comment, onReply, postId, depth = 0 }) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [votes, setVotes] = useState(comment.votes || 0);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const isAuthor = auth.currentUser?.uid === comment.authorId;

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
                {comment.authorPhotoURL ? (
                    <img src={comment.authorPhotoURL} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 text-sm font-bold">
                        {comment.authorName?.charAt(0)}
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

                        {isAuthor && (
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

export default function PostDetail({ postId }) {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const { currentUser } = useAuth();
    const [isVoting, setIsVoting] = useState(false);
    const [userVote, setUserVote] = useState(null);
    const [authorPosts, setAuthorPosts] = useState([]);

    async function fetchAuthorPosts(authorId) {
        try {
            const posts = await getPostsByUser(authorId, 6);
            setAuthorPosts(posts.filter(p => p.id !== postId).slice(0, 5));
        } catch (err) {
            console.error('Failed to fetch author posts:', err);
        }
    }

    async function fetchUserVote() {
        if (currentUser) {
            const vote = await getUserVote(postId);
            setUserVote(vote);
        }
    }

    useEffect(() => {
        if (post?.authorId) {
            fetchAuthorPosts(post.authorId);
        }
    }, [post?.authorId, postId]);

    useEffect(() => {
        async function fetchPost() {
            try {
                const data = await getPost(postId);
                setPost(data);
                fetchUserVote();
            } catch (err) {
                setError(err.message || 'Failed to load post');
            } finally {
                setLoading(false);
            }
        }

        let unsubscribeComments;
        if (postId) {
            fetchPost();
            unsubscribeComments = getComments(postId, (data) => {
                // Organize comments into threads
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

        return () => unsubscribeComments && unsubscribeComments();
    }, [postId, currentUser]);

    const handleVote = async (direction) => {
        if (!currentUser) {
            alert('Please sign in to vote');
            return;
        }

        if (!postId || isVoting) return;

        setIsVoting(true);
        try {
            await voteOnPost(postId, direction);

            const [postData, voteData] = await Promise.all([
                getPost(postId),
                getUserVote(postId)
            ]);

            setPost(postData);
            setUserVote(voteData);
        } catch (err) {
            console.error('[PostDetail] Vote failed:', err);
            alert(`Vote Error: ${err.message || 'Unknown error occurred'}`);
        } finally {
            setIsVoting(false);
        }
    };

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

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex min-h-screen items-center justify-center text-center px-6">
                <div className="glass-card p-10 max-w-md">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Oops!</h2>
                    <p className="text-text-secondary mb-8">{error || 'Post not found'}</p>
                    <a href="/posts" className="btn-primary inline-block">Back to Feed</a>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen pt-40 pb-24 px-4 md:px-6">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                {/* Main Content Area */}
                <article className="flex-1 min-w-0">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card overflow-hidden border-white/5 shadow-2xl flex"
                    >
                        {/* Desktop Side Voting Rail (Reddit Style) */}
                        <div className="hidden md:flex w-12 bg-white/5 flex-col items-center py-6 gap-3 border-r border-white/5">
                            <button
                                onClick={() => handleVote('up')}
                                disabled={isVoting}
                                className={`relative z-10 p-1 rounded-md transition-all active:scale-90 cursor-pointer ${userVote === 'up' ? 'text-primary bg-primary/20' : 'text-white/40 hover:bg-primary/20 hover:text-primary'} ${isVoting ? 'opacity-50' : 'hover:scale-110'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 pointer-events-none" fill={userVote === 'up' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <div className="h-6 flex items-center justify-center">
                                {isVoting ? (
                                    <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <span className={`text-lg font-black transition-colors ${userVote === 'up' ? 'text-primary' : userVote === 'down' ? 'text-red-500' : 'text-white'}`}>
                                        {post.votes || 0}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => handleVote('down')}
                                disabled={isVoting}
                                className={`relative z-10 p-1 rounded-md transition-all active:scale-90 cursor-pointer ${userVote === 'down' ? 'text-red-500 bg-red-500/20' : 'text-white/40 hover:bg-red-500/20 hover:text-red-500'} ${isVoting ? 'opacity-50' : 'hover:scale-110'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 pointer-events-none" fill={userVote === 'down' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 p-6 md:p-10">
                            <header className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-text-secondary text-xs">{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                        {post.pinned && (
                                            <span className="ml-2 px-2 py-0.5 rounded-md bg-white/5 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20 shadow-lg shadow-primary/10">Pinned</span>
                                        )}
                                    </div>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight text-white">{post.title}</h1>
                            </header>

                            {/* Imagery Section */}
                            {post.images && post.images.length > 0 && (
                                <div className="space-y-6 mb-10">
                                    {post.images.map((img, idx) => (
                                        <figure key={idx} className="rounded-2xl overflow-hidden border border-white/5 bg-background-dark/50">
                                            <img
                                                src={img.url}
                                                className="w-full h-auto max-h-[700px] object-contain mx-auto"
                                                alt={img.caption || `Diagram ${idx + 1}`}
                                            />
                                            {img.caption && (
                                                <figcaption className="p-4 bg-white/5 text-xs text-text-secondary border-t border-white/5 font-medium italic text-center">
                                                    {img.caption}
                                                </figcaption>
                                            )}
                                        </figure>
                                    ))}
                                </div>
                            )}

                            {/* Post Content */}
                            <div className="prose prose-invert prose-orange max-w-none text-lg leading-relaxed mb-12">
                                {post.content?.startsWith('<') ? (
                                    <div className="ql-editor !p-0 font-sans" dangerouslySetInnerHTML={{ __html: post.content }} />
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                        {post.content}
                                    </ReactMarkdown>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5 border-dashed">
                                {/* Mobile Voting (Hidden on Desktop) */}
                                <div className="md:hidden flex items-center gap-3 bg-white/5 rounded-full px-3 py-1">
                                    <button
                                        onClick={() => handleVote('up')}
                                        className={`transition-colors ${userVote === 'up' ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={userVote === 'up' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                    </button>
                                    <div className="w-6 flex items-center justify-center">
                                        {isVoting ? (
                                            <svg className="animate-spin h-3 w-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <span className={`text-sm font-bold ${userVote === 'up' ? 'text-primary' : userVote === 'down' ? 'text-red-500' : 'text-white'}`}>
                                                {post.votes || 0}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleVote('down')}
                                        className={`transition-colors ${userVote === 'down' ? 'text-red-500' : 'text-text-secondary hover:text-red-500'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={userVote === 'down' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-text-secondary hover:text-white cursor-pointer transition-colors text-sm font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)} Comments
                                </div>
                                <div className="flex items-center gap-2 text-text-secondary hover:text-white cursor-pointer transition-colors text-sm font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Discussions Section */}
                    <div className="mt-8 glass-card border-white/5 p-6 md:p-10">
                        <h3 className="text-xl font-black text-white mb-8">Discussions</h3>

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
                </article>

                {/* Desktop Sidebar (Optional, but adds to Reddit feel) */}
                <aside className="hidden lg:block w-80 space-y-6">
                    <div className="glass-card p-6 border-white/5">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">About the Author</h4>
                        <div className="flex items-center gap-4 mb-4">
                            {post.authorPhotoURL ? (
                                <img src={post.authorPhotoURL} alt="" className="w-12 h-12 rounded-xl object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 font-black text-xl">
                                    {post.authorName?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="text-white font-black leading-tight">{post.authorName || 'Anonymous'}</p>
                            </div>
                        </div>
                        <a
                            href={`/profile?id=${post.authorId}`}
                            className="block w-full text-center bg-white/5 border border-white/10 text-white py-3 rounded-xl text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-widest"
                        >
                            View Profile
                        </a>
                    </div>

                    {authorPosts.length > 0 && (
                        <div className="glass-card p-6 border-white/5">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Previous Posts</h4>
                            <div className="space-y-4">
                                {authorPosts.map(prevPost => (
                                    <a key={prevPost.id} href={`/post/${prevPost.id}`} className="block group/item">
                                        <p className="text-sm font-bold text-white group-hover/item:text-primary transition-colors line-clamp-2 leading-tight mb-1">
                                            {prevPost.title}
                                        </p>
                                        <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">
                                            {prevPost.createdAt?.seconds ? new Date(prevPost.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}

