import "./main.css";

import * as ReactDOM from "react-dom/client";
import i18n from "i18next";
import * as ReactI18n from "react-i18next";

import { Share } from "./apps/Share";
import { Reset } from "./apps/Reset";
import { buildI18nService } from "./i18n";
import { I18nService, I18nServiceContext } from "./services/I18nService";
import { SiteConfigService, SiteConfigServiceContext } from "./services/SiteConfigService";
import { buildStorageService } from "./storage";
import { StorageService, StorageServiceContext } from "./services/StorageService";
import { NavigationService, NavigationServiceContext } from "./services/NavigationService";
import { buildNavigationService } from "./navigation";

/**
 * @license CC-BY-4.0 Font Awesome Free Icons: Copyright (c) 2022 Fonticons, Inc. (https://fontawesome.com)
 * @license OFL-1.1 Font Awesome Free Fonts: Copyright (c) 2022 Fonticons, Inc. (https://fontawesome.com)
 * @license MIT Font Awesome Free Code: Copyright (c) 2022 Fonticons, Inc. (https://fontawesome.com)
 */
function main() {
    i18n.use(ReactI18n.initReactI18next).init({
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
    });

    const i18nService = buildI18nService();
    const storageService = buildStorageService();
    const navigationService = buildNavigationService();

    const services = {
        i18nService,
        storageService,
        navigationService,
    };

    const rootElement = document.querySelector("#app");
    if (rootElement !== null) {
        render(rootElement, services);
    } else {
        window.addEventListener('DOMContentLoaded', (event) => {
            const rootElement = document.querySelector("#app");
            render(rootElement, services);
        });
    }
}

function render(rootElement: Element, services: {
    i18nService: I18nService,
    storageService: StorageService,
    navigationService: NavigationService,
}) {
    const appId = rootElement.getAttribute("data-app-id");
    const baseUrl = new URL(rootElement.getAttribute("data-base-url"), location.href);
    const root = ReactDOM.createRoot(rootElement);

    const siteConfigService: SiteConfigService = {
        baseUrl: baseUrl,
    };

    root.render(<I18nServiceContext.Provider value={services.i18nService}>
        <SiteConfigServiceContext.Provider value={siteConfigService}>
            <StorageServiceContext.Provider value={services.storageService}>
                <NavigationServiceContext.Provider value={services.navigationService}>
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
    </I18nServiceContext.Provider>);
}

main();
