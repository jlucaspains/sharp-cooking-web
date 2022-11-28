import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend';
import I18NextVue from 'i18next-vue'

export const i18nextPromise = i18next
    .use(LanguageDetector)
    .use(Backend)
    .init({
        load: 'languageOnly',
        fallbackLng: 'en'
    });

export default function (app: any) {
    app.use(I18NextVue, { i18next })
    return app
}