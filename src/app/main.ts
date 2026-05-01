import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../App.vue';
import { createAppRouter } from './router';
import './shell.css';
import '../assets/css/styles.css';

const app = createApp(App);
const pinia = createPinia();
const router = createAppRouter();

app.use(pinia);
app.use(router);
app.mount('#app');
