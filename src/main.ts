// vite-env.d.ts
/// <reference types="vite-plugin-pages/client" />

import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { createI18n } from 'vue-i18n';
import English from './locales/en.json';
import routes from '~pages';
import { createState, stateSymbol } from './services/store';
import Notifications from 'notiwind';

registerSW({ immediate: true, onOfflineReady() { } });

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: English },
});

const app = createApp(App);

app.use(router);
app.use(i18n);
app.use(Notifications);
app.provide(stateSymbol, createState());
app.mount('#app')