import * as JsonSchema from "jsonschema";
import { SupportedLanguage } from "../services/I18nService";

export type StorageItem = {
    version: 1;
    language?: SupportedLanguage;
    primaryMastodonUserId?: string;
    primaryMastodonProfileURL?: string;
    shareConfig?: {
        redirectAutomatically: boolean;
    };
};

export const StorageItemSchema: JsonSchema.Schema = {
    type: "object",
    properties: {
        version: {
            type: "number",
            enum: [1]
        },
        language: {
            type: "string",
            enum: ["en", "ja"],
        },
        primaryMastodonUserId: {
            type: "string",
        },
        primaryMastodonProfileURL: {
            type: "string",
        },
        shareConfig: {
            type: "object",
            properties: {
                redirectAutomatically: {
                    type: "boolean",
                },
            },
            required: [
                "redirectAutomatically",
            ],
        },
    },
    required: [
        "version",
    ],
};

export function validateStorageItem(item: any): boolean {
    const validateResult = JsonSchema.validate(item, StorageItemSchema);
    return validateResult.valid;
}
