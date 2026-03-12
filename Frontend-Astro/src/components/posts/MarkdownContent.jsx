import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function MarkdownContent({ content }) {
    if (!content) return null;

    if (content.startsWith('<')) {
        return (
            <div className="prose prose-invert prose-orange max-w-none text-lg leading-relaxed mb-12">
                <div className="ql-editor !p-0 font-sans" dangerouslySetInnerHTML={{ __html: content }} />
            </div>
        );
    }

    return (
        <div className="prose prose-invert prose-orange max-w-none text-lg leading-relaxed mb-12">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
