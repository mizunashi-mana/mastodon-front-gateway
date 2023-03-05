import * as JsonSchema from "jsonschema";

export type StorageItem = {
    version: 1,
    primaryMastodonUserId?: string;
    primaryMastodonProfileURL?: string;
    shareConfig?: {
        redirectAutomatically: boolean;
    };
}

export const StorageItemSchema: JsonSchema.Schema = {
    type: "object",
    properties: {
        version: {
            type: "number",
            enum: [1]
        },
        primaryMastodonUserId: {
            type: "string"
        },
        primaryMastodonProfileURL: {
            type: "string"
        },
        shareConfig: {
            type: "object",
            properties: {
                redirectAutomatically: {
                    type: "boolean"
                }
            },
            required: [
                "redirectAutomatically"
            ]
        }
    },
    required: [
        "version"
    ]
};

export function validateStorageItem(item: any): boolean {
    const validateResult = JsonSchema.validate(item, StorageItemSchema);
    return validateResult.valid;
}
