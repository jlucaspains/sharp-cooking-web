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

import i18next from 'i18next'
import I18NextVue from 'i18next-vue'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend';

registerSW({ immediate: true, onOfflineReady() { } });

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

i18next
  .use(LanguageDetector)
  .use(Backend)
  .init({
    debug: true,
    fallbackLng: 'en'
  });

const app = createApp(App);

app.use(router);
app.use(I18NextVue, { i18next });
app.use(Notifications);
app.provide(stateSymbol, createState());
app.mount('#app')