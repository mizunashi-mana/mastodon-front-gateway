import React from "react";

export const NavigationServiceContext = React.createContext<NavigationService>(undefined);

export interface NavigationService {
    moveToUrl(url: URL): void;
}
