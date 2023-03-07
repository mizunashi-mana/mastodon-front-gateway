import React from "react";
import { I18nKey } from "../i18n/resource";
import * as ReactHookForm from "react-hook-form";
import { I18nServiceContext } from "../services/I18nService";
import { SiteConfigServiceContext } from "../services/SiteConfigService";
import { StorageService, StorageServiceContext } from "../services/StorageService";
import { StorageItem } from "../storage/types";
import { NavigationService, NavigationServiceContext } from "../services/NavigationService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-regular-svg-icons/faCheckCircle";
import { faRotate } from "@fortawesome/free-solid-svg-icons/faRotate";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons/faCircleXmark";

const expireDurationMs = 30 * 24 * 60 * 60 * 1000;

type FormValues = {
    userId?: string;
    saveUserId?: boolean;
    enableAutoJump?: boolean;
}

export type FormState =
    | {
        type: "ok";
    }
    | {
        type: "redirect-automatically";
    }
    | {
        type: "expired-redirect-automatically";
        messageKey: I18nKey;
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
    redirectAutomatically: boolean;
    shouldSaveUserId: boolean;
    onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
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

    const postData = React.useMemo(() => {
        return getPostData(propsAndStates.location.href);
    }, [propsAndStates.location.href]);

    const shareConfig = React.useMemo(() => {
        const storageItem = storageService.get();
        return loadShareConfig(storageItem);
    }, [storageService]);

    const redirectAutomatically = shareConfig.enableAutoJump && !shareConfig.expired;

    const [formState, updateFormState] = React.useState<FormState>(
        redirectAutomatically
            ? { type: "redirect-automatically" }
            : shareConfig.expired
                ? {
                    type: "expired-redirect-automatically",
                    messageKey: "Expired auto redirecting. Re-enable if you re-submit.",
                }
                : { type: "ok" }
    );
    console.log(formState);
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: reactHookFormState,
        setError,
    } = ReactHookForm.useForm<FormValues>({
        defaultValues: {
            userId: shareConfig.userId,
            saveUserId: shareConfig.userId !== undefined,
            enableAutoJump: shareConfig.enableAutoJump,
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
        if (reactHookFormState.isSubmitting || reactHookFormState.isSubmitSuccessful) {
            return [false, undefined, { type: "submitting" }];
        } else {
            switch (formState.type) {
                case "ok":
                    if (reactHookFormState.isValid) {
                        return [true, undefined, { type: "can-submit" }];
                    } else {
                        return [false, "Some items are not filled.", { type: "validation-failed" }];
                    }
                case "redirect-automatically":
                    return [false, undefined, { type: "submitting" }];
                case "expired-redirect-automatically":
                    return [true, formState.messageKey, { type: "can-submit" }];
                case "input-error":
                    return [true, formState.messageKey, { type: "validation-failed" }];
                case "critical-error":
                    return [false, formState.messageKey, { type: "validation-failed" }];
            }
        }
    }, [formState, reactHookFormState]);

    const onInputError = React.useCallback((errorMsg: I18nKey) => {
        setError("root", {
            message: errorMsg,
        });
        updateFormState(currentFormError => {
            switch (currentFormError.type) {
                case "ok":
                case "redirect-automatically":
                case "expired-redirect-automatically":
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
    }, [updateFormState]);

    const onCriticalError = React.useCallback((errorMsg: I18nKey) => {
        setError("root", {
            message: errorMsg,
        });
        updateFormState(currentFormError => {
            switch (currentFormError.type) {
                case "ok":
                case "redirect-automatically":
                case "expired-redirect-automatically":
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
    }, [updateFormState]);

    const onChangeInput = React.useCallback(() => {
        updateFormState(currentFormError => {
            switch (currentFormError.type) {
                case "ok":
                case "redirect-automatically":
                case "input-error":
                    return {
                        type: "ok",
                    };
                case "expired-redirect-automatically":
                    // keep expired redirect automatically
                    return currentFormError;
                case "critical-error":
                    // not overwrite error.
                    return currentFormError;
            }
        })
    }, [updateFormState]);

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
            redirectAutomatically: redirectAutomatically,
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
        redirectAutomatically,
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
        if (propsInView.redirectAutomatically) {
            propsInView.onSubmit();
        }
    }, [propsInView.redirectAutomatically]);

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
                                font-medium text-gray-100
                                bg-yellow-600 disabled:bg-slate-300
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
    enableAutoJump: boolean;
    expired: boolean;
} {
    const current = new Date().valueOf();

    if (storageItem === undefined) {
        return {
            enableAutoJump: false,
            expired: false,
        };
    }

    let shareConfig: StorageItem["shareConfig"];
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
        enableAutoJump: shareConfig.redirectAutomatically,
        expired: shareConfig.expiredAtMs !== undefined && shareConfig.expiredAtMs <= current,
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
                    <FontAwesomeIcon
                        icon={faRotate}
                        aria-hidden="true"
                        className="w-8 h-8 text-gray-300 dark:text-gray-600"
                        spin></FontAwesomeIcon>
                    <span className="sr-only">{t("Submitting...")}</span>
                </div>
            );
        case "can-submit":
            return (
                <div role="status" title={t("Ready to submit.")}>
                    <FontAwesomeIcon
                        icon={faCheckCircle}
                        aria-hidden="true"
                        fill={undefined}
                        className="w-8 h-8 text-green-600 dark:text-gray-600"></FontAwesomeIcon>
                    <span className="sr-only">{t("Ready to submit.")}</span>
                </div>
            );
        case "validation-failed":
            return (
                <div role="status" title={t("Invalid input!")}>
                    <FontAwesomeIcon
                        icon={faCircleXmark}
                        aria-hidden="true"
                        className="w-8 h-8 text-red-600 dark:text-gray-600"></FontAwesomeIcon>
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
        return;
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
    const expiredAtMs = new Date().valueOf() + expireDurationMs;

    storageService.updateOrInsert(
        oldItem => {
            return {
                ...oldItem,
                primaryMastodonUserId: userId ?? oldItem.primaryMastodonUserId,
                primaryMastodonProfileURL: profileUrl?.toString() ?? oldItem.primaryMastodonProfileURL,
                shareConfig: {
                    redirectAutomatically: redirectAutomatically,
                    expiredAtMs: expiredAtMs,
                },
            };
        },
        () => {
            return {
                version: 1,
                primaryMastodonUserId: userId,
                primaryMastodonProfileURL: profileUrl.toString(),
                shareConfig: {
                    redirectAutomatically: redirectAutomatically,
                    expiredAt: expiredAtMs,
                },
            };
        },
    );
}

function shareArticle(navigationService: NavigationService, originUrl: string, postData: PostData): void {
    const shareUrl = new URL(originUrl);
    shareUrl.pathname = "/share";
    shareUrl.searchParams.set("text", postData.text);
    shareUrl.searchParams.set("url", postData.url);
    navigationService.moveToUrl(shareUrl);
}

