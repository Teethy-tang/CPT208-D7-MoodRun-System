import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../App.vue';
import { createAppRouter } from './router';
import { initMobileViewport, registerMoodRunServiceWorker } from '../services/ui/viewport';
import './shell.css';
import '../assets/css/styles.css';
import '../assets/css/mobile-app.css';

const app = createApp(App);
const pinia = createPinia();
const router = createAppRouter();

initMobileViewport();
registerMoodRunServiceWorker();

app.use(pinia);
app.use(router);
app.mount('#app');
