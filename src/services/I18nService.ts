import React from "react";
import { I18nKey } from "../i18n/key";

export const I18nServiceContext = React.createContext<I18nService>(undefined);

export type Translation = {
    t: (key: I18nKey, data?: { [key: string]: any }) => string;
};

export interface I18nService {
    useTranslation(): Translation;
}
