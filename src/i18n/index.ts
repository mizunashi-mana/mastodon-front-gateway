import * as ReactI18next from "react-i18next";
import i18next, * as I18n from "i18next";
import I18nLanguageDetector from 'i18next-browser-languagedetector';

import {
    I18nService,
    SupportedLanguage,
    Translation,
    supportedLanguages,
    isSupportedLanguage,
} from "../services/I18nService";
import * as localesJaCommon from "../locales/ja/common";


export function buildI18nService(): I18nService {
    return new I18nServiceImpl();
}

class I18nServiceImpl implements I18nService {
    async setup(fallbackLang: SupportedLanguage): Promise<Translation> {
        const t = await I18n
            .use(ReactI18next.initReactI18next)
            .use(I18nLanguageDetector)
            .init({
                fallbackLng: fallbackLang,
                interpolation: {
                    escapeValue: false,
                },
                supportedLngs: supportedLanguages,
                resources: {
                    ja: {
                        translation: localesJaCommon.locale,
                    },
                },
            });

        return {
            t: t,
        };
    }

    useTranslation(): Translation {
        const { t } = ReactI18next.useTranslation();
        return {
            t: t,
        };
    }

    async changeLanguage(lang: SupportedLanguage): Promise<Translation> {
        const t = await I18n.changeLanguage(lang);
        return {
            t: t,
        };
    }

    getLanguage(): SupportedLanguage | undefined {
        const language = i18next.language;
        if (isSupportedLanguage(language)) {
            return language;
        } else {
            return undefined;
        }
    }

    onLanguageChanged(listener: (lang: SupportedLanguage) => void): void {
        i18next.on("languageChanged", language => {
            if (isSupportedLanguage(language)) {
                listener(language);
            }
        });
    }
}
