if (process.env.SITEMAP_STAGING !== '1') {
  console.error('舊 web Hosting 流程已停用；請使用 pnpm deploy:web:static，讓完整 HTML、robots 與 sitemap 經由同一發布佇列。');
  process.exit(1);
}
