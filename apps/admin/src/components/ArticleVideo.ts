import { Node, mergeAttributes } from '@tiptap/core';

/** Block media node shared by uploaded videos and privacy-enhanced YouTube embeds. */
export const ArticleVideo = Node.create({
  name: 'articleVideo',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      title: { default: '' },
      sourceUrl: { default: null, parseHTML: (element) => element.getAttribute('data-source-url') },
      videoKind: { default: 'upload', parseHTML: (element) => element.getAttribute('data-video-kind') || 'upload' },
    };
  },
  parseHTML() {
    return [{ tag: 'video[data-article-video]' }, { tag: 'iframe[data-article-video]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const { videoKind, sourceUrl, ...attributes } = HTMLAttributes;
    const shared = { 'data-article-video': '', 'data-video-kind': videoKind, 'data-source-url': sourceUrl };
    if (videoKind === 'youtube') {
      return ['iframe', mergeAttributes(attributes, shared, { allowfullscreen: 'true', frameborder: '0', title: attributes.title || 'YouTube 影片' })];
    }
    return ['video', mergeAttributes(attributes, shared, { controls: 'true', preload: 'metadata', playsinline: 'true' })];
  },
});
