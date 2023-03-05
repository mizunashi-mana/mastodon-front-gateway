import React from "react";
import { I18nKey } from "../i18n/key";
import * as ReactHookForm from "react-hook-form";
import { I18nServiceContext } from "../services/I18nService";
import { SiteConfigServiceContext } from "../services/SiteConfigService";
import { StorageService, StorageServiceContext } from "../services/StorageService";
import { StorageItem } from "../storage/types";
import { NavigationService, NavigationServiceContext } from "../services/NavigationService";

type FormValues = {
    userId?: string;
    saveUserId?: boolean;
    enableAutoJump?: boolean;
}

export type FormError =
    | {
        type: "ok";
    }
    | {
        type: "critical-error";
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
    shouldSaveUserId: boolean;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    register: ReactHookForm.UseFormRegister<FormValues>;
    setValue: ReactHookForm.UseFormSetValue<FormValues>;
    watch: ReactHookForm.UseFormWatch<FormValues>;
    onInputError: (error: I18nKey) => void;
    onCriticalError: (error: I18nKey) => void;
    onChangeInput: () => void;
};

function usePropsInView(propsAndStates: {
    location: Location
}): PropsInView {
    const siteConfigService = React.useContext(SiteConfigServiceContext);
    const storageService = React.useContext(StorageServiceContext);
    const navigationService = React.useContext(NavigationServiceContext);
    const [formError, updateFormError] = React.useState<FormError>({ type: "ok" });

    const postData = React.useMemo(() => {
        return getPostData(propsAndStates.location.href);
    }, [propsAndStates.location.href]);

    const shareConfig = React.useMemo(() => {
        const storageItem = storageService.get();
        return loadShareConfig(storageItem);
    }, [storageService]);

    const { register, handleSubmit, watch, setValue, formState } = ReactHookForm.useForm<FormValues>({
        defaultValues: {
            userId: shareConfig.userId,
            saveUserId: shareConfig.userId !== undefined,
            enableAutoJump: shareConfig.redirectAutomatically
        },
    });

    const resetUrlString = React.useMemo(() => {
        return new URL("./reset/", siteConfigService.baseUrl).toString();
    }, [siteConfigService.baseUrl]);

    const enableAutoJump = watch("enableAutoJump");

    const [submitEnabled, errorMessageKey, submitStatus] = React.useMemo<[
        boolean,
        I18nKey | undefined,
        SubmitStatus
    ]>(() => {
        if (formState.isSubmitting) {
            return [false, undefined, { type: "submitting" }];
        } else {
            switch (formError.type) {
                case "ok":
                    if (formState.isValid) {
                        return [true, undefined, { type: "can-submit" }];
                    } else {
                        return [false, "Some items are not filled.", { type: "validation-failed" }];
                    }
                case "input-error":
                    return [true, formError.messageKey, { type: "validation-failed" }];
                case "critical-error":
                    return [false, formError.messageKey, { type: "validation-failed" }];
            }
        }
    }, [formError, formState]);

    const onInputError = React.useCallback((errorMsg: I18nKey) => {
        updateFormError(currentFormError => {
            switch (currentFormError.type) {
                case "ok":
                case "input-error":
                    return {
                        type: "input-error",
                        messageKey: errorMsg,
                    };
                case "critical-error":
                    // not overwrite error.
                    return currentFormError;
            }
        })
    }, [updateFormError]);

    const onCriticalError = React.useCallback((errorMsg: I18nKey) => {
        updateFormError(currentFormError => {
            switch (currentFormError.type) {
                case "ok":
                case "input-error":
                    return {
                        type: "critical-error",
                        messageKey: errorMsg,
                    };
                case "critical-error":
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
                case "critical-error":
                    // not overwrite error.
                    return currentFormError;
            }
        })
    }, [updateFormError]);

    const onHandleSubmit = React.useCallback(async (formValues: FormValues) => {
        await onSubmitShareMastodon(
            onInputError,
            formValues,
            postData,
            storageService,
            navigationService,
        );
    }, [onInputError, postData, storageService])
    const onSubmit = handleSubmit(onHandleSubmit);

    return React.useMemo(() => {
        return {
            postData: postData,
            resetUrlString: resetUrlString,
            errorMessageKey: errorMessageKey,
            submitEnabled: submitEnabled,
            submitStatus: submitStatus,
            shouldSaveUserId: enableAutoJump ?? false,
            setValue: setValue,
            register: register,
            watch: watch,
            onSubmit: onSubmit,
            onInputError: onInputError,
            onCriticalError: onCriticalError,
            onChangeInput: onChangeInput,
        };
    }, [
        postData,
        resetUrlString,
        submitEnabled,
        submitStatus,
        enableAutoJump,
        errorMessageKey,
        onSubmit,
        register,
        setValue,
        onInputError,
        onCriticalError,
        onChangeInput,
    ]);
}

export const Share: React.FC<{}> = () => {
    const { t } = React.useContext(I18nServiceContext).useTranslation();
    const propsInView = usePropsInView({
        location,
    });

    React.useEffect(() => {
        if (propsInView.shouldSaveUserId) {
            propsInView.setValue("saveUserId", true);
        }
    }, [propsInView.shouldSaveUserId, propsInView.setValue]);

    React.useEffect(() => {
        if (propsInView.postData === undefined) {
            propsInView.onCriticalError("Missing any post contents. Some troubles happened.");
        }
    }, [propsInView.onCriticalError, propsInView.postData]);

    React.useEffect(() => {
        propsInView.onChangeInput();
    }, propsInView.watch(["userId", "saveUserId", "enableAutoJump"]));

    return (
        <section className="p-4 flex flex-col justify-center max-w-md mx-auto">
            <div className="p-6 bg-gray-100 rounded">
                <h1 className="tracking-wide text-3xl text-gray-900">{t("Share the Post!")}</h1>
                <p className="tracking-wide text-1xl text-gray-800">{t("Input your Mastodon server to share it.")}</p>
                <form className="flex flex-col justify-center py-3 mt-1" onSubmit={propsInView.onSubmit}>
                    <label htmlFor="input_user_id" className="text-base font-medium">{t("User ID:")}</label>
                    <input
                        id="input_user_id"
                        placeholder="@username@example.com"
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
                        required
                        {...propsInView.register("userId", {
                            required: "User ID is required."
                        })}
                        ></input>
                    <small className="text-sm font-medium text-gray-400 mb-3">
                        {t("Your user ID of Mastodon to share the post.")}
                    </small>
                    <div className="flex mt-2 mb-1">
                        <input
                            id="input_save_userid"
                            type="checkbox"
                            className="rounded mr-2"
                            disabled={propsInView.shouldSaveUserId}
                            {...propsInView.register("saveUserId")}
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
                            className="rounded mr-2"
                            disabled // TODO
                            {...propsInView.register("enableAutoJump")}
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

function loadShareConfig(storageItem: StorageItem | undefined): {
    userId?: string;
    redirectAutomatically: boolean;
} {
    if (storageItem === undefined) {
        return {
            redirectAutomatically: false,
        };
    }

    let shareConfig: {
        redirectAutomatically: boolean;
    };
    if (storageItem.shareConfig !== undefined) {
        shareConfig = storageItem.shareConfig;
    } else {
        shareConfig = {
            redirectAutomatically: false,
        };
    }

    let userId: string | undefined = undefined;
    if (storageItem.primaryMastodonUserId !== undefined) {
        userId = storageItem.primaryMastodonUserId;
    } else if (storageItem.primaryMastodonProfileURL !== undefined) {
        userId = storageItem.primaryMastodonProfileURL;
    }

    return {
        userId: userId,
        redirectAutomatically: shareConfig.redirectAutomatically,
    };
}

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
    const { t } = React.useContext(I18nServiceContext).useTranslation();

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
    formValues: FormValues,
    postData: PostData | undefined,
    storageService: StorageService,
    navigationService: NavigationService,
): Promise<void> {
    if (postData === undefined) {
        onError("Missing any post contents. Some troubles happened.");
    }

    if (typeof formValues.userId !== "string") {
        onError("User ID is required.");
        return;
    }

    const redirectAutomatically = formValues.enableAutoJump ?? false;

    const detectedResult = detectOrigin(formValues.userId);
    switch (detectedResult.type) {
        case "failed":
            onError(detectedResult.error);
            return;
        case "byProfileUrl":
            if (formValues.saveUserId) {
                saveUserIdToStorage(
                    storageService,
                    undefined,
                    detectedResult.profileUrl,
                    redirectAutomatically,
                );
            }
            shareArticle(navigationService, detectedResult.profileUrl.origin, postData);
            return;
        case "detectByWebFinger":
            try {
                const result = await detectByWebFinger(detectedResult.webFingerEndpoint);
                switch (result.type) {
                    case "byProfileUrl":
                        if (formValues.saveUserId) {
                            saveUserIdToStorage(
                                storageService,
                                detectedResult.userId,
                                result.profileUrl,
                                redirectAutomatically,
                            );
                        }
                        shareArticle(navigationService, result.profileUrl.origin, postData);
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
        type: "byProfileUrl";
        profileUrl: URL;
    }
    | {
        type: "detectByWebFinger";
        userId: string;
        webFingerEndpoint: URL;
    }
    | {
        type: "failed";
        error: I18nKey;
    }
    ;

function detectOrigin(userId: string): DetectResultOfOriginWithContinuation {
    try {
        const url = new URL(userId);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return parseUserIdByMentionFormat(userId);
        } else if (!url.pathname.startsWith("/@")) {
            return parseUserIdByMentionFormat(userId);
        } else {
            return {
                type: "byProfileUrl",
                profileUrl: url
            };
        }
    } catch (e) {
        return parseUserIdByMentionFormat(userId);
    }
}

function parseUserIdByMentionFormat(userId: string): DetectResultOfOriginWithContinuation {
    const matchResult = userId.match("@?([^@]+@(.+))");
    if (matchResult === null || matchResult.length !== 3) {
        return {
            type: "failed",
            error: 'Given user ID is invalid. The format is "@username@example.com".'
        };
    }

    const accountResourceId = matchResult[1];
    const domain = matchResult[2];

    try {
        const url = new URL(`https://${domain}/.well-known/webfinger`);
        url.searchParams.set("resource", `acct:${accountResourceId}`)
        return {
            type: "detectByWebFinger",
            userId: accountResourceId,
            webFingerEndpoint: url,
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
        type: "byProfileUrl";
        profileUrl: URL;
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
            type: "byProfileUrl",
            profileUrl: new URL(body["aliases"][0])
        };
    } else {
        throw new Error("Illegal response by WebFinger.");
    }
}

function saveUserIdToStorage(
    storageService: StorageService,
    userId: string | undefined,
    profileUrl: URL | undefined,
    redirectAutomatically: boolean
): void {
    storageService.updateOrInsert(
        oldItem => {
            return {
                ...oldItem,
                primaryMastodonUserId: userId ?? oldItem.primaryMastodonUserId,
                primaryMastodonProfileURL: profileUrl?.toString() ?? oldItem.primaryMastodonProfileURL,
                shareConfig: {
                    redirectAutomatically: redirectAutomatically,
                }
            };
        },
        () => {
            return {
                version: 1,
                primaryMastodonUserId: userId,
                primaryMastodonProfileURL: profileUrl.toString(),
                shareConfig: {
                    redirectAutomatically: redirectAutomatically,
                }
            }
        }
    );
}

function shareArticle(navigationService: NavigationService, originUrl: string, postData: PostData): void {
    const shareUrl = new URL(originUrl);
    shareUrl.pathname = "/share";
    shareUrl.searchParams.set("text", postData.text);
    shareUrl.searchParams.set("url", postData.url);
    navigationService.moveToUrl(shareUrl);
}

