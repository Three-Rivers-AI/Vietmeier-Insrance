// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://vietmeier-insurance-concept.vercel.app',
  output: 'static',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always' },
  // Cast: @tailwindcss/vite ships types for a newer Vite than Astro 5 bundles.
  vite: { plugins: [/** @type {any} */ (tailwindcss())] },
});
