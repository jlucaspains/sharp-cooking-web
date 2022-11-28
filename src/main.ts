// vite-env.d.ts
/// <reference types="vite-plugin-pages/client" />

import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import routes from '~pages';
import { createState, stateSymbol } from './services/store';
import Notifications from 'notiwind';
import i18n from './i18n';

registerSW({ immediate: true, onOfflineReady() { } });

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

const app = createApp(App);

app.use(router);
app.use(Notifications);
app.provide(stateSymbol, createState());
i18n(app);
app.mount('#app')