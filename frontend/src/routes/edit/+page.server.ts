import { main, type Config } from "code-scanner";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {

 	let config: Config = {
		analysisTargetDir: "../codeScanner", //"../testProjects/yt-anti-translate"
		useGitIgnore: false, //true
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
	let [fileNames, diagrams] = await main(config);
	return { fileNames, diagrams };
}