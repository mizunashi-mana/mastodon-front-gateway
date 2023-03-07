export type I18nKey = keyof LocaleResource;

export type LocaleResource = {
    "Share the Post!": string;
    "Input your Mastodon server to share it.": string;
    "Your user ID of Mastodon to share the post.": string;
    "Save your user ID on your browser.": string;
    "Your user ID will save on the local storage, and autocomplete from next time.": string;
    "Redirect automatically from next time.": string;
    "Any submissions will be no longer needed to share from next time. You can reset your user ID by {{url}}.": string;
    "User ID:": string;
    "Share": string;
    "Missing any post contents. Some troubles happened.": string;
    "User ID is required.": string;
    'Given user ID is invalid. The format is "@username@example.com".': string;
    "Given user ID is invalid or not found. Check it.": string;
    "Failed to find your user by given user ID. Check it.": string;
    "Some items are not filled.": string;
    "Submitting...": string;
    "Ready to submit.": string;
    "Invalid input!": string;
    "Reset Your Information": string;
    "Remove your data saved on your browser.": string;
    "Reset": string;
    "No storage data.": string;
}
