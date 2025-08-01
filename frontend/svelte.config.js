import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
   vitePreprocess()
  ],
  kit: {
    alias: {
      '$/*': './src/lib/*'
    },
    adapter: adapter({
      pages: 'docs',
      fallback: '404.html'
    })
  }
};

export default config;
