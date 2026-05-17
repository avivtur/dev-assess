'use client';

import { type FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import './markdown-renderer.scss';

type MarkdownRendererProps = {
  content: string;
};

const MarkdownRenderer: FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="da-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
