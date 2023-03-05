import { NavigationService } from "../services/NavigationService";

export function buildNavigationService(): NavigationService {
    return new NavigationServiceImpl();
}

class NavigationServiceImpl implements NavigationService {
    moveToUrl(url: URL): void {
        window.open(url, "_self");
    }
}
