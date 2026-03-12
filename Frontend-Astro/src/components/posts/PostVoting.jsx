import React, { useState, useEffect } from 'react';
import { voteOnPost, getUserVote } from '../../api/api.js';
import { useAuth } from '../../hooks/useAuth';

export default function PostVoting({ postId, initialVotes = 0, initialUserVote = null }) {
    const { currentUser } = useAuth();
    const [votes, setVotes] = useState(initialVotes);
    const [userVote, setUserVote] = useState(initialUserVote);
    const [isVoting, setIsVoting] = useState(false);

    useEffect(() => {
        if (currentUser && initialUserVote === null) {
            getUserVote(postId).then(setUserVote);
        }
    }, [currentUser, postId, initialUserVote]);

    const handleVote = async (direction) => {
        if (!currentUser) {
            alert('Please sign in to vote');
            return;
        }
        if (isVoting) return;

        setIsVoting(true);
        try {
            await voteOnPost(postId, direction);

            // Re-fetch or locally update
            const newVote = await getUserVote(postId);
            setUserVote(newVote);

            // Adjust local count (simple approach)
            if (userVote === direction) {
                // Clicking same direction usually removes vote in reddit style if implemented, 
                // but our API handles toggle. Let's just re-fetch count if possible or estimate.
                // For now, let's keep it simple.
            }

            // Ideally getPost(postId) again, but let's just use local state for immediate feedback
            if (direction === 'up') {
                setVotes(prev => userVote === 'up' ? prev - 1 : (userVote === 'down' ? prev + 2 : prev + 1));
            } else {
                setVotes(prev => userVote === 'down' ? prev + 1 : (userVote === 'up' ? prev - 2 : prev - 1));
            }

        } catch (err) {
            console.error('Vote failed:', err);
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <>
            {/* Desktop Rail */}
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
                            {votes}
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

            {/* Mobile Bar (for reuse in the action bar section) */}
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
                            {votes}
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
        </>
    );
}
