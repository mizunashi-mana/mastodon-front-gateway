import "./main.css";

import * as ReactDOM from "react-dom/client";

import { Share } from "./apps/Share";
import { Reset } from "./apps/Reset";
import { buildI18nService } from "./i18n";
import { I18nService, I18nServiceContext, supportedLanguages, isSupportedLanguage } from "./services/I18nService";
import { SiteConfigService, SiteConfigServiceContext } from "./services/SiteConfigService";
import { buildStorageService } from "./storage";
import { StorageService, StorageServiceContext } from "./services/StorageService";
import { NavigationService, NavigationServiceContext } from "./services/NavigationService";
import { buildNavigationService } from "./navigation";

/**
 * @license Apache-2.0 OR MPL-2.0 Mastodon Front Gateway: Copyright (c) 2023 Mizunashi Mana (https://raw.githubusercontent.com/mizunashi-mana/mastodon-front-gateway/main/LICENSE.md)
 * and licenses of depdencies:
 * @license CC-BY-4.0 Font Awesome Free Icons: Copyright (c) 2022 Fonticons, Inc. (https://fontawesome.com)
 * @license OFL-1.1 Font Awesome Free Fonts: Copyright (c) 2022 Fonticons, Inc. (https://fontawesome.com)
 * @license MIT Font Awesome Free Code: Copyright (c) 2022 Fonticons, Inc. (https://fontawesome.com)
 */
function main() {
    const i18nService = buildI18nService();
    const storageService = buildStorageService();
    const navigationService = buildNavigationService();

    i18nService.setup("en");

    const services = {
        i18nService,
        storageService,
        navigationService,
    };

    const rootElement = document.querySelector("#app");
    if (rootElement !== null) {
        renderApp(rootElement, services);
    } else {
        window.addEventListener('DOMContentLoaded', _ => {
            const rootElement = document.querySelector("#app");
            renderApp(rootElement, services);
        });
    }
}

function renderApp(rootElement: Element, services: {
    i18nService: I18nService,
    storageService: StorageService,
    navigationService: NavigationService,
}) {
    const appId = rootElement.getAttribute("data-app-id");
    if (appId === null) {
        return;
    }

    setupI18nSelectorForApp(services);

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

function setupI18nSelectorForApp(services: {
    i18nService: I18nService,
    storageService: StorageService,
}) {
    const item = services.storageService.get();
    if (item?.language !== undefined) {
        services.i18nService.changeLanguage(item.language);
    }

    const langSelector = document.querySelector<HTMLSelectElement>("select#app-i18n-select-lng");
    if (langSelector === null) {
        return;
    }

    langSelector.addEventListener("change", _ => {
        const selectedLanguage = langSelector.value;
        if (isSupportedLanguage(selectedLanguage)) {
            services.storageService.updateOrInsert(
                oldItem => ({
                    ...oldItem,
                    language: selectedLanguage,
                }),
                () => ({
                    version: 1,
                    language: selectedLanguage,
                }),
            )
            services.i18nService.changeLanguage(selectedLanguage);
        }
    });

    langSelector.removeChild(langSelector.querySelector("option"));
    langSelector.append(...supportedLanguages.map(lang => {
        const option: HTMLOptionElement = document.createElement("option");
        option.setAttribute("value", lang);
        switch(lang) {
            case "en":
                option.append(document.createTextNode("English"));
                return option;
            case "ja":
                option.append(document.createTextNode("日本語"));
                return option;
        }
    }));
    langSelector.disabled = false;

    services.i18nService.onLanguageChanged(lang => {
        langSelector.value = lang;
    });
    langSelector.value = services.i18nService.getLanguage();
}

main();
