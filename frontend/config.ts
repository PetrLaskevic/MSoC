import { type Config } from "code-scanner"; //yes js, that is an ESM & TypeScript quirk

//applied only if this is the current working directory (i. e. codeScanner is not imported in an other directory)
export let config: Config = {
    analysisTargetDir: "../testProjects/yt-anti-translate",
    useGitIgnore: true,
    otherIgnores: [
        "node_modules",
        ".git",
        ".github",
        "eslint.config.js",
        //both playwright links work, the wildcards are not needed, the ignores are evaluated with analysisTargetDir as base directory
        "**/playwright.config.ts",
        "playwright.config.js",
        "tests/**", 
        // "!(permission.js)", not supported by glob lib
        //so: ls testProjects/yt-anti-translate/**/**/.js an then removing the permission.js file
        // "app/src/background_audio.js",
        // "app/src/background_description.js",
        // "app/src/background.js",
        // "app/src/content_channelbranding.js",
        // "app/src/content_injectglobal.js",
        // "app/src/content_start.js",
        // "app/src/global.js",
        // "app/src/options.js",
        // "app/src/permission.js",
    ]
}