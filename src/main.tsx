import "./main.css";

import * as ReactDOM from "react-dom/client";
import i18n from "i18next";
import * as ReactI18n from "react-i18next";

import { Share } from "./apps/Share";
import { Reset } from "./apps/Reset";
import { buildI18nService } from "./i18n";
import { I18nServiceContext } from "./services/I18nService";
import { SiteConfigService, SiteConfigServiceContext } from "./services/SiteConfigService";
import { buildStorageService } from "./storage";
import { StorageServiceContext } from "./services/StorageService";
import { NavigationServiceContext } from "./services/NavigationService";
import { buildNavigationService } from "./navigation";

function render(rootElement: Element) {
    const appId = rootElement.getAttribute("data-app-id");
    const baseUrl = new URL(rootElement.getAttribute("data-base-url"), location.href);
    const root = ReactDOM.createRoot(rootElement);

    const siteConfigService: SiteConfigService = {
        baseUrl: baseUrl,
    };
    const i18nService = buildI18nService();
    const storageService = buildStorageService();
    const navigationService = buildNavigationService();

    root.render(<I18nServiceContext.Provider value={i18nService}>
        <SiteConfigServiceContext.Provider value={siteConfigService}>
            <StorageServiceContext.Provider value={storageService}>
                <NavigationServiceContext.Provider value={navigationService}>
                    {(() => {
                        switch (appId) {
                            case "share":
                                return <Share></Share>;
                            case "reset":
                                return <Reset></Reset>;
                        }
                    })()}
                </NavigationServiceContext.Provider>
            </StorageServiceContext.Provider>
        </SiteConfigServiceContext.Provider>
    </I18nServiceContext.Provider>)


}

i18n.use(ReactI18n.initReactI18next).init({
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

const rootElement = document.querySelector("#app");
if (rootElement !== null) {
    render(rootElement);
} else {
    window.addEventListener('DOMContentLoaded', (event) => {
        const rootElement = document.querySelector("#app");
        render(rootElement);
    });
}
