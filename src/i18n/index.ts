import * as ReactI18next from "react-i18next";
import { I18nKey } from "./key";

export type Translation = {
    t: (key: I18nKey, data?: { [key: string]: any }) => string;
};

export function useTranslation(): Translation {
    const { t } = ReactI18next.useTranslation();

    return {
        t: t,
    };
}
