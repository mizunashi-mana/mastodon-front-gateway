const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const config = require("./site.config");

const templatesDir = path.resolve(__dirname, "templates");

ejs.fileLoader = (filePath) => {
    return fs.readFileSync(path.resolve(templatesDir, filePath));
};

const appTemplate = ejs.compile(
    fs.readFileSync(path.resolve(templatesDir, "app.html")).toString("utf-8"),
    {
        root: templatesDir,
    }
);

fs.writeFileSync("src/index.html", ejs.render(
    fs.readFileSync(path.resolve(templatesDir, "index.html")).toString("utf-8"),
    {
        ...config,
        url: `${config.baseUrl}/`,
        title: "Mastodon Web Gateway",
        description: "A portal of Web apps for Mastodon.",
    },
    {
        root: templatesDir,
    }
));
fs.writeFileSync("src/add-share-button.html", ejs.render(
    fs.readFileSync(path.resolve(templatesDir, "add-share-button.html")).toString("utf-8"),
    {
        ...config,
        url: `${config.baseUrl}/`,
        title: "Add a Mastodon Share Button",
        description: "How to add a Mastodon share button to your site.",
    },
    {
        root: templatesDir,
    }
));
fs.writeFileSync("src/share.html", appTemplate({
    ...config,
    appId: "share",
    url: `${config.baseUrl}/share/`,
    title: "Share to Mastodon",
    description: "Share an article to your Mastodon server.",
}));
fs.writeFileSync("src/reset.html", appTemplate({
    ...config,
    appId: "reset",
    url: `${config.baseUrl}/reset/`,
    title: "Reset Mastodon Data",
    description: "Reset your Mastodon data on your browser.",
}));

