import React from "react";

export const SiteConfigServiceContext = React.createContext<SiteConfigService>(undefined);

export interface SiteConfigService {
    baseUrl: URL
}
