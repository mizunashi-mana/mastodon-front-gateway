import React, { ReactElement } from "react";
import { useTranslation } from "../i18n";

export type Props = {
    baseUrl: URL;
};

export const Share: React.FC<Props> = props => {
    const { t } = useTranslation();

    const postData = React.useMemo(() => {
        return getPostData(location.href);
    }, [location.href]);

    return (
        <section className="p-4 flex flex-col justify-center max-w-md mx-auto">
            <div className="p-6 bg-gray-100 rounded">
                <h1 className="tracking-wide text-3xl text-gray-900">{t("Share the Post!")}</h1>
                <p className="tracking-wide text-1xl text-gray-800">{t("Input your Mastodon server to share it.")}</p>
                <form className="flex flex-col justify-center py-3 mt-1">
                    <label htmlFor="input_user_id" className="text-base font-medium">{t("User ID:")}</label>
                    <input
                        id="input_user_id"
                        name="user_id"
                        defaultValue={undefined}
                        placeholder="@username@pawoo.net"
                        required
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
                            ></input>
                        <label
                            htmlFor="input_enable_autojump"
                            className="text-base font-medium"
                            >{t("Redirect automatically from next time.")}</label>
                    </div>
                    <small className="text-sm font-medium text-gray-400 mb-3">
                        {t("Any submissions will be no longer needed to share from next time. You can reset your user ID by {{url}}.", {
                            url: new URL("./reset/", props.baseUrl).toString()
                        })}
                    </small>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow mt-3 mb-3">
                        <span id="post_preview">
                            <PostDataPreview postData={postData}></PostDataPreview>
                        </span>
                    </div>
                    <button
                        type="submit"
                        className="
                            px-4 py-1.5 mt-3
                            rounded-md block
                            bg-yellow-600
                            font-medium text-gray-100
                        "
                        >{t("Share")}</button>
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
            return text;
        } else {
            return <React.Fragment>&nbsp;{text}</React.Fragment>;
        }
    })}</React.Fragment>;
}
