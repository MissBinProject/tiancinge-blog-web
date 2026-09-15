import type { CSSProperties, ReactNode } from 'react';
import type { Article, ArticleTextRun } from '@tian-xin-ge/contracts';
import { SafeImage } from './SafeImage';

function InlineText({ runs, fallback }: { runs?: ArticleTextRun[]; fallback: string }): ReactNode {
  if (!runs?.length) return fallback;
  return runs.map((run, index) => {
    const style: CSSProperties = { color: run.color, fontSize: run.fontSize, fontFamily: run.fontFamily, fontWeight: run.bold ? 700 : undefined, fontStyle: run.italic ? 'italic' : undefined, textDecoration: [run.underline && 'underline', run.strike && 'line-through'].filter(Boolean).join(' ') || undefined };
    const text = <span style={style}>{run.text}</span>;
    return run.href ? <a className="article-body-link" href={run.href} rel="noreferrer" key={index}>{text}</a> : <span key={index}>{text}</span>;
  });
}

export function ArticleBody({ blocks }: { blocks: Article['body'] }) {
  return <div className="article-body-content">{blocks.map((block, index) => {
    const style: CSSProperties = { textAlign: block.textAlign };
    if (block.type === 'heading') return <h2 key={index} style={style}><InlineText runs={block.content} fallback={block.text} /></h2>;
    if (block.type === 'list') { const List = block.ordered ? 'ol' : 'ul'; return <List key={index}>{block.items?.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}><InlineText runs={block.itemContent?.[itemIndex]} fallback={item} /></li>)}</List>; }
    if (block.type === 'quote') return <blockquote key={index} style={style}><InlineText runs={block.content} fallback={block.text} /></blockquote>;
    if (block.type === 'link') return <p key={index} style={style}><a className="article-body-link" href={block.url} rel="noreferrer">{block.text}</a></p>;
    if (block.type === 'image') return <figure key={index}><SafeImage src={block.url} alt={block.alt || block.text} /><figcaption>{block.text}</figcaption></figure>;
    return <p key={index} style={style}><InlineText runs={block.content} fallback={block.text} /></p>;
  })}</div>;
}
