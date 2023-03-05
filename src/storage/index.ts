import { StorageService } from "../services/StorageService";
import { StorageItem, validateStorageItem } from "./types";

export function buildStorageService(storageKey: string = "MASTODON_FRONT_GATEWAY_LOCAL_STORAGE_KEY"): StorageService {
    return new StorageServiceImpl(storageKey);
}

class StorageServiceImpl implements StorageService {
    readonly storageKey: string;

    constructor(storageKey: string) {
        this.storageKey = storageKey;
    }

    get(): StorageItem | undefined {
        const item = localStorage.getItem(this.storageKey);
        if (item === null) {
            return undefined;
        }

        try {
            const storageItem = JSON.parse(item);
            if (!validateStorageItem(storageItem)) {
                return undefined;
            }

            return storageItem;
        } catch (e) {
            return undefined;
        }
    }

    set(storageItem: StorageItem): void {
        localStorage.setItem(this.storageKey, JSON.stringify(storageItem));
    }

    updateOrInsert(updater: (oldItem: StorageItem) => StorageItem, gen: () => StorageItem): StorageItem {
        const oldItem = this.get();

        let newItem: StorageItem;
        if (oldItem === undefined) {
            newItem = gen();
            this.set(newItem);
        } else {
            newItem = updater(oldItem);
            this.set(newItem);
        }

        return newItem;
    }
}
