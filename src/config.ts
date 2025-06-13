//The configuration for the project you're analyzing
interface Config {
    useGitIgnore?: boolean,
    otherIgnores?: string[],
}

export let config: Config = {
    useGitIgnore: true,
    //What the authors wanted to have in git, but what we want to exclude from analysis
    otherIgnores: [
        "node_modules",
        ".git",
        ".github",
        "eslint.config.js",
        "playwright.config.ts",
        "tests/**",
    ]
}