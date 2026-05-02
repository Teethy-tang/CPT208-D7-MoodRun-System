import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const githubPagesBase = '/CPT208-D7-MoodRun-System/';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : githubPagesBase,
  plugins: [vue()],
}));
