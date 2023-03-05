import * as ReactI18next from "react-i18next";
import { I18nService, Translation } from "../services/I18nService";

export function buildI18nService(): I18nService {
    return new I18nServiceImpl();
}

class I18nServiceImpl implements I18nService {
    useTranslation(): Translation {
        const { t } = ReactI18next.useTranslation();

        return {
            t: t,
        };
    }
}
