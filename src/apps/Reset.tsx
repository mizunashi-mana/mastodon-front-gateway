import React from "react";
import * as ReactHookForm from "react-hook-form";
import { I18nKey } from "../i18n/resource";
import { I18nServiceContext } from "../services/I18nService";
import { StorageService, StorageServiceContext } from "../services/StorageService";
import { StorageItem } from "../storage/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-regular-svg-icons/faCheckCircle";
import { faRotate } from "@fortawesome/free-solid-svg-icons/faRotate";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons/faCircleXmark";

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
    submitEnabled: boolean;
    submitStatus: SubmitStatus;
    errorMessageKey: I18nKey;
    storageItem?: StorageItem;
    onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
};

function usePropsInView(): PropsInView {
    const storageService = React.useContext(StorageServiceContext);

    const {
        handleSubmit,
        formState: reactHookFormState,
    } = ReactHookForm.useForm<{}>();

    const storageItem = React.useMemo(() => {
        return storageService.get();
    }, [storageService]);

    const [submitEnabled, errorMessageKey, submitStatus] = React.useMemo<[
        boolean,
        I18nKey | undefined,
        SubmitStatus
    ]>(() => {
        if (reactHookFormState.isSubmitting || reactHookFormState.isSubmitSuccessful) {
            return [false, undefined, { type: "submitting" }];
        } else if (storageItem !== undefined) {
            return [true, undefined, { type: "can-submit" }];
        } else {
            return [false, "No storage data.", { type: "validation-failed" }];
        }
    }, [reactHookFormState]);

    const onHandleSubmit = React.useCallback(() => {
        onSubmitReset(storageService);
    }, [storageService])
    const onSubmit = handleSubmit(onHandleSubmit);

    return React.useMemo(() => {
        return {
            submitEnabled: submitEnabled,
            submitStatus: submitStatus,
            errorMessageKey: errorMessageKey,
            storageItem: storageItem,
            onSubmit: onSubmit
        };
    }, [
        submitEnabled,
        submitStatus,
        errorMessageKey,
        storageItem,
        onSubmit,
    ]);
}

export const Reset: React.FC<{}> = () => {
    const { t } = React.useContext(I18nServiceContext).useTranslation();
    const propsInView = usePropsInView();

    return (
        <section className="p-4 flex flex-col justify-center max-w-md mx-auto">
            <div className="p-6 bg-gray-100 rounded">
                <h1 className="tracking-wide text-3xl text-gray-900">{t("Reset Your Information")}</h1>
                <p className="tracking-wide text-1xl text-gray-800">{t("Remove your data saved on your browser.")}</p>
                <form className="flex flex-col justify-center py-3 mt-1" onSubmit={propsInView.onSubmit}>
                    <p className="text-red-500 text-sm font-medium py-2">
                        {propsInView.errorMessageKey === undefined
                            ? ""
                            : t(propsInView.errorMessageKey)
                        }
                    </p>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow mt-3 mb-3">
                        <pre className="overflow-auto">
                            {JSON.stringify(propsInView.storageItem, undefined, 2)}
                        </pre>
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
                            >{t("Reset")}</button>
                        <SubmitStatusPreview status={propsInView.submitStatus}></SubmitStatusPreview>
                    </div>
                </form>
            </div>
        </section>
    );
};

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

function onSubmitReset(storageService: StorageService) {
    storageService.remove();
    location.reload();
}
