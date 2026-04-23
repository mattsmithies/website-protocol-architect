// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import smartypants from 'remark-smartypants';

export default defineConfig({
  site: 'https://mattsmithies.com',
  // Editorial typography: smart quotes, em/en dashes, ellipses.
  markdown: {
    remarkPlugins: [smartypants],
  },
  integrations: [mdx({ remarkPlugins: [smartypants] }), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
