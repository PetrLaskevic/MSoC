import { Options } from "acorn"; //typing info
//The configuration for the project you're analyzing
interface Config {
    //the directory of the project we want to analyze
    analysisTargetDir: string,
    //exclude .gitignore entries from analysis?
    useGitIgnore?: boolean,
    //What the authors wanted to have in git, but what we want to exclude from analysis
    //evaluated with analysisTargetDir as base directory
    otherIgnores?: string[],
    //default if not specified 2020
    ecmaScriptVersion?: Options["ecmaVersion"] //"latest" or number 2020 etc
}

export let config: Config = {
    analysisTargetDir: "testProjects/yt-anti-translate",
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
    ]
}