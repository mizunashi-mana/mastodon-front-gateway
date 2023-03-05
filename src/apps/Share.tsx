import React, { ReactElement } from "react";
import { useTranslation } from "../i18n";
import { I18nKey } from "../i18n/key";

export type Props = {
    baseUrl: URL;
};

export type FormError =
    | {
        type: "ok";
    }
    | {
        type: "location-error";
        messageKey: I18nKey;
    }
    | {
        type: "input-error";
        messageKey: I18nKey;
    }
    ;

type SubmitStatus =
    | {
        type: "can-submit";
    }
    | {
        type: "validation-failed";
    }
    | {
        type: "submitting";
    }
    ;

type PropsInView = {
    postData?: PostData;
    submitEnabled: boolean;
    submitStatus: SubmitStatus;
    errorMessageKey?: I18nKey;
    resetUrlString: string;
    onInputError: (error: I18nKey) => void;
    onLocationError: (error: I18nKey) => void;
    onChangeInput: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

function usePropsInView(
    props: Props,
    location: Location,
    formError: FormError,
    updateFormError: (updater: (currentError: FormError) => FormError) => void,
    submitting: boolean,
    setSubmitting: (submitting: boolean) => void,
): PropsInView {
    const postData = React.useMemo(() => {
        return getPostData(location.href);
    }, [location.href]);

    const resetUrlString = React.useMemo(() => {
        return new URL("./reset/", props.baseUrl).toString();
    }, [props.baseUrl]);

    const [submitEnabled, errorMessageKey, submitStatus] = React.useMemo<[
        boolean,
        I18nKey | undefined,
        SubmitStatus
    ]>(() => {
        if (submitting) {
            return [false, undefined, { type: "submitting" }];
        } else {
            switch (formError.type) {
                case "ok":
                    return [true, undefined, { type: "can-submit" }];
                case "input-error":
                    return [true, formError.messageKey, { type: "validation-failed" }];
                case "location-error":
                    return [false, formError.messageKey, { type: "validation-failed" }];
            }
        }
    }, [formError, submitting]);

    const onInputError = React.useCallback((errorMsg: I18nKey) => {
        updateFormError(currentFormError => {
            switch (currentFormError.type) {
                case "ok":
                case "input-error":
                    return {
                        type: "input-error",
                        messageKey: errorMsg,
                    };
                case "location-error":
                    // not overwrite error.
                    return currentFormError;
            }
        })
    }, [updateFormError]);

    const onLocationError = React.useCallback((errorMsg: I18nKey) => {
        updateFormError(currentFormError => {
            switch (currentFormError.type) {
                case "ok":
                case "input-error":
                    return {
                        type: "location-error",
                        messageKey: errorMsg,
                    };
                case "location-error":
                    // not overwrite error.
                    return currentFormError;
            }
        })
    }, [updateFormError]);

    const onChangeInput = React.useCallback(() => {
        updateFormError(currentFormError => {
            switch (currentFormError.type) {
                case "ok":
                case "input-error":
                    return {
                        type: "ok",
                    };
                case "location-error":
                    // not overwrite error.
                    return currentFormError;
            }
        })
    }, [updateFormError]);

    const onSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await onSubmitShareMastodon(onInputError, event, postData);
        } finally {
            setSubmitting(false);
        }
    }, [onInputError, postData, setSubmitting]);

    return React.useMemo(() => {
        return {
            postData: postData,
            resetUrlString: resetUrlString,
            errorMessageKey: errorMessageKey,
            submitEnabled: submitEnabled,
            submitStatus: submitStatus,
            onInputError: onInputError,
            onLocationError: onLocationError,
            onChangeInput: onChangeInput,
            onSubmit: onSubmit,
        };
    }, [
        postData,
        resetUrlString,
        submitEnabled,
        submitStatus,
        errorMessageKey,
        onInputError,
        onLocationError,
        onChangeInput,
        onSubmit
    ]);
}

export const Share: React.FC<Props> = props => {
    const { t } = useTranslation();
    const [formError, updateFormError] = React.useState<FormError>({ type: "ok" });
    const [submitting, setSubmitting] = React.useState(false);
    const propsInView = usePropsInView(props, location, formError, updateFormError, submitting, setSubmitting);

    React.useEffect(() => {
        if (propsInView.postData === undefined) {
            propsInView.onLocationError("Missing any post contents. Some troubles happened.");
        }
    }, [propsInView.onLocationError, propsInView.postData]);

    return (
        <section className="p-4 flex flex-col justify-center max-w-md mx-auto">
            <div className="p-6 bg-gray-100 rounded">
                <h1 className="tracking-wide text-3xl text-gray-900">{t("Share the Post!")}</h1>
                <p className="tracking-wide text-1xl text-gray-800">{t("Input your Mastodon server to share it.")}</p>
                <form className="flex flex-col justify-center py-3 mt-1" onSubmit={propsInView.onSubmit}>
                    <label htmlFor="input_user_id" className="text-base font-medium">{t("User ID:")}</label>
                    <input
                        id="input_user_id"
                        name="user_id"
                        defaultValue={undefined}
                        placeholder="@username@example.com"
                        required
                        onChange={propsInView.onChangeInput}
                        className="
                            px-2 py-1.5 mt-1 mb-1 block w-full
                            border border-gray-300 rounded-md
                            text-base shadow-base
                            placeholder-gray-400
                            focus:outline-none
                            focus:border-gray-500
                            focus:ring-1
                            focus:ring-gray-500
                            focus:invalid:border-red-500 focus:invalid:ring-red-500
                        "
                        ></input>
                    <small className="text-sm font-medium text-gray-400 mb-3">
                        {t("Your user ID of Mastodon to share the post.")}
                    </small>
                    <div className="flex mt-2 mb-1">
                        <input
                            id="input_save_userid"
                            type="checkbox"
                            name="save_userid"
                            defaultChecked={undefined}
                            className="rounded mr-2"
                            disabled // TODO
                            ></input>
                        <label
                            htmlFor="input_save_userid"
                            className="text-base font-medium"
                            >{t("Save your user ID on your browser.")}</label>
                    </div>
                    <small className="text-sm font-medium text-gray-400 mb-3">
                        {t("Your user ID will save on the local storage, and autocomplete from next time.")}
                    </small>
                    <div>
                        <input
                            id="input_enable_autojump"
                            type="checkbox"
                            name="enable_autojump"
                            defaultChecked={undefined}
                            className="rounded mr-2"
                            disabled // TODO
                            ></input>
                        <label
                            htmlFor="input_enable_autojump"
                            className="text-base font-medium"
                            >{t("Redirect automatically from next time.")}</label>
                    </div>
                    <small className="text-sm font-medium text-gray-400 mb-3">
                        {t("Any submissions will be no longer needed to share from next time. You can reset your user ID by {{url}}.", {
                            url: propsInView.resetUrlString
                        })}
                    </small>
                    <p className="text-red-500 text-sm font-medium py-2">
                        {propsInView.errorMessageKey === undefined
                            ? ""
                            : t(propsInView.errorMessageKey)
                        }
                    </p>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow mt-3 mb-3">
                        <span id="post_preview">
                            {propsInView.postData === undefined
                                ? ""
                                : <PostDataPreview postData={propsInView.postData}></PostDataPreview>
                            }
                        </span>
                    </div>
                    <div className="flex items-center justify-center mt-3">
                        <button
                            type="submit"
                            className="
                                w-5/6 py-1.5 mr-3
                                rounded-md block
                                bg-yellow-600
                                font-medium text-gray-100
                                disabled:bg-slate-300
                            "
                            disabled={!propsInView.submitEnabled}
                            >{t("Share")}</button>
                        <SubmitStatusPreview status={propsInView.submitStatus}></SubmitStatusPreview>
                    </div>
                </form>
            </div>
        </section>
    );
};

type PostData = {
    text?: string;
    url: string;
} | {
    text: string;
    url?: string;
};

function getPostData(currentHref: string): PostData | undefined {
    const currentUrl = new URL(currentHref);

    const text = currentUrl.searchParams.get("text") ?? undefined;
    const url = currentUrl.searchParams.get("url") ?? undefined;

    if (text === undefined && url === undefined) {
        return undefined;
    }

    return {
        text: text,
        url: url,
    };
}

const PostDataPreview: React.FC<{ postData: PostData }> = props => {
    let elements: string[] = [];

    if (props.postData.text !== undefined) {
        elements.push(props.postData.text);
    }

    if (props.postData.url !== undefined) {
        elements.push(props.postData.url);
    }

    return <React.Fragment>{elements.map((text, idx) => {
        if (idx === 0) {
            return <React.Fragment key={text}>{text}</React.Fragment>;
        } else {
            return <React.Fragment key={text}>&nbsp;{text}</React.Fragment>;
        }
    })}</React.Fragment>;
}

const SubmitStatusPreview: React.FC<{ status: SubmitStatus }> = props => {
    const { t } = useTranslation();

    switch (props.status.type) {
        case "submitting":
            return (
                <div role="status" title={t("Submitting...")}>
                    <svg
                        aria-hidden="true"
                        className="
                            w-8 h-8 text-gray-200 animate-spin
                            dark:text-gray-600 fill-blue-600
                        "
                        viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    <span className="sr-only">{t("Submitting...")}</span>
                </div>
            );
        case "can-submit":
            return (
                <div role="status" title={t("Ready to submit.")}>
                    <svg
                        aria-hidden="true"
                        className="
                            w-8 h-8
                            fill-green-600 dark:fill-gray-600
                        "
                        viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                        {/** @license Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                        <path d="M243.8 339.8C232.9 350.7 215.1 350.7 204.2 339.8L140.2 275.8C129.3 264.9 129.3 247.1 140.2 236.2C151.1 225.3 168.9 225.3 179.8 236.2L224 280.4L332.2 172.2C343.1 161.3 360.9 161.3 371.8 172.2C382.7 183.1 382.7 200.9 371.8 211.8L243.8 339.8zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"/>
                    </svg>
                    <span className="sr-only">{t("Ready to submit.")}</span>
                </div>
            );
        case "validation-failed":
            return (
                <div role="status" title={t("Invalid input!")}>
                    <svg
                        aria-hidden="true"
                        className="
                            w-8 h-8
                            fill-red-600 dark:fill-gray-600
                        "
                        viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/** @license Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                        <path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/>
                    </svg>
                    <span className="sr-only">{t("Invalid input!")}</span>
                </div>
            );
    }
}

async function onSubmitShareMastodon(
    onError: (error: I18nKey) => void,
    event: React.FormEvent<HTMLFormElement>,
    postData: PostData | undefined
): Promise<void> {
    if (postData === undefined) {
        onError("Missing any post contents. Some troubles happened.");
    }

    const userIdItem = event.currentTarget.elements.namedItem("user_id");
    if (!(userIdItem instanceof HTMLInputElement)) {
        onError("User ID is required.");
        return;
    }

    const userId = userIdItem.value;
    if (typeof userId !== "string") {
        onError("User ID is required.");
        return;
    }

    const detectedResult = detectOrigin(userId);
    switch (detectedResult.type) {
        case "failed":
            onError(detectedResult.error);
            return;
        case "byDirect":
            shareArticle(detectedResult.url.origin, postData);
            return;
        case "detectByWebFinger":
            try {
                const result = await detectByWebFinger(detectedResult.url);
                switch (result.type) {
                    case "byDirect":
                        shareArticle(result.url.origin, postData);
                        return;
                    case "failed":
                        onError(result.error);
                        return;
                }
            } catch (e) {
                onError("Failed to find your user by given user ID. Check it.");
                return;
            }
    }
}

type DetectResultOfOriginWithContinuation =
    | {
        type: "byDirect";
        url: URL;
    }
    | {
        type: "detectByWebFinger";
        url: URL;
    }
    | {
        type: "failed";
        error: I18nKey;
    }
    ;

function detectOrigin(userId: string): DetectResultOfOriginWithContinuation {
    try {
        const url = new URL(userId);
        console.log(url);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return parseUserIdByMentionFormat(userId);
        } else if (!url.pathname.startsWith("/@")) {
            return parseUserIdByMentionFormat(userId);
        } else {
            return {
                type: "byDirect",
                url: url
            };
        }
    } catch (e) {
        return parseUserIdByMentionFormat(userId);
    }
}

function parseUserIdByMentionFormat(userId: string): DetectResultOfOriginWithContinuation {
    const matchResult = userId.match("@?[^@]+@(.+)");
    if (matchResult === null || matchResult.length !== 2) {
        return {
            type: "failed",
            error: 'Given user ID is invalid. The format is "@username@example.com".'
        };
    }

    const domain = matchResult[1];

    try {
        const url = new URL(`https://${domain}/.well-known/webfinger`);
        url.searchParams.set("resource", `acct:${userId}`)
        return {
            type: "detectByWebFinger",
            url: url,
        };
    } catch (e) {
        return {
            type: "failed",
            error: "Given user ID is invalid or not found. Check it.",
        };
    }
}

type DetectResultOfOrigin =
    | {
        type: "byDirect";
        url: URL;
    }
    | {
        type: "failed";
        error: I18nKey;
    }
    ;

async function detectByWebFinger(
    webFingerUrl: URL
): Promise<DetectResultOfOrigin> {
    const response = await fetch(webFingerUrl);
    const body = await response.json();
    if ("aliases" in body && body["aliases"].length >= 1) {
        return {
            type: "byDirect",
            url: new URL(body["aliases"][0])
        };
    } else {
        throw new Error("Illegal response by WebFinger.");
    }
}

function shareArticle(originUrl: string, postData: PostData): void {
    const shareUrl = new URL(originUrl);
    shareUrl.pathname = "/share";
    shareUrl.searchParams.set("text", postData.text);
    shareUrl.searchParams.set("url", postData.url);
    window.open(shareUrl);
}

