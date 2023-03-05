import React from "react";
import { StorageItem } from "../storage/types";

export const StorageServiceContext = React.createContext<StorageService>(undefined);

export interface StorageService {
    get(): StorageItem | undefined;
    set(storageItem: StorageItem): void;
    updateOrInsert(updater: (oldItem: StorageItem) => StorageItem, gen: () => StorageItem): StorageItem;
    remove(): void;
}
