import React from "react";
import { I18nKey, LocaleResource } from "../i18n/resource";

export const I18nServiceContext = React.createContext<I18nService>(undefined);

export const supportedLanguages: SupportedLanguage[] = ["en", "ja"];
export type SupportedLanguage = "en" | "ja";

export function isSupportedLanguage(language: string): language is SupportedLanguage {
    return (supportedLanguages as string[]).includes(language);
}

export type Translation = {
    t: <K extends I18nKey>(key: K, data?: { [key: string]: any }) => LocaleResource[K];
};

export interface I18nService {
    setup(fallbackLang: SupportedLanguage): Promise<Translation>;
    getLanguage(): SupportedLanguage | undefined;
    onLanguageChanged(listener: (lang: SupportedLanguage) => void): void;
    useTranslation(): Translation;
    changeLanguage(lang: SupportedLanguage): Promise<Translation>;
}
