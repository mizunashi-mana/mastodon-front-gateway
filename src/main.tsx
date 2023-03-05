import "./main.css";

import * as ReactDOM from "react-dom/client";
import i18n from "i18next";
import * as ReactI18n from "react-i18next";

import { Share } from "./apps/Share";
import { Reset } from "./apps/Reset";

function render(rootElement: Element) {
    const appId = rootElement.getAttribute("data-app-id");
    const baseUrl = new URL(rootElement.getAttribute("data-base-url"), location.href);
    const root = ReactDOM.createRoot(rootElement);
    switch (appId) {
        case "share":
            root.render(<Share baseUrl={baseUrl}/>);
            break;
        case "reset":
            root.render(<Reset />);
            break;
    }
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
