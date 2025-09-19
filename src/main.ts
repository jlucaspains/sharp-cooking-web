// vite-env.d.ts
/// <reference types="vite-plugin-pages/client" />

import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import Suspenser from './Suspenser.vue';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import routes from '~pages';
import { createState, stateSymbol } from './services/store';
import Notifications from 'notiwind';
import i18n from './i18n';
import { sendPageViewData, sendPageViewDurationData } from './sharp-web-insights';

registerSW({ immediate: true, onOfflineReady() { } });

const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (to.name === "recipe-id") {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ left: 0, top: 0 })
                }, 100)
            })
        }
    }
});

let lastToDateTime: Date | null = null;
let lastToPageViewId: string | null = null;

router.afterEach((to, from) => {
    if (import.meta.env.DEV || import.meta.env.CI) {
        console.log('Navigated from:', from.fullPath, 'to:', to.fullPath);
        return;
    }

    if (lastToDateTime && lastToPageViewId) {
        sendPageViewDurationData(lastToPageViewId, lastToDateTime);
    }

    lastToDateTime = new Date();
    if (to.matched.length > 0) {
        sendPageViewData(to.matched[0].path, document.referrer)
            .then((data) => {
                lastToPageViewId = data || "";
            }).catch((error) => {
                console.error('Error sending page view data:', error);
            })
    }
});


const app = createApp(Suspenser);

app.use(router);
app.use(Notifications);
app.provide(stateSymbol, createState());
i18n(app);
app.mount('#app')