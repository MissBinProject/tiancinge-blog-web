import type { Article } from '@tian-xin-ge/contracts';
import { SafeImage } from './SafeImage';

export function ArticleBody({ blocks }: { blocks: Article['body'] }) {
  return <div className="article-body-content">
    {blocks.map((block, index) => {
      if (block.type === 'heading') return <h2 key={index}>{block.text}</h2>;
      if (block.type === 'list') return <ul key={index}>{block.items?.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{item}</li>)}</ul>;
      if (block.type === 'link') return <p key={index}><a className="article-body-link" href={block.url} rel="noreferrer">{block.text}</a></p>;
      if (block.type === 'image') return <figure key={index}><SafeImage src={block.url} alt={block.alt || block.text} /><figcaption>{block.text}</figcaption></figure>;
      return <p key={index}>{block.text}</p>;
    })}
  </div>;
}
