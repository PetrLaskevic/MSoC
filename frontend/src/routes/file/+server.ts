import { json } from '@sveltejs/kit';
import { page } from '$app/state';
import * as fs from 'node:fs/promises';
//the import does work here but openedFile is always at its default style 
// import { openedFile } from '$/components/FileSidebar/index.svelte';

//TLDR: putting this in file/[[path]]/+server.ts does not work
export async function GET({ url }) {
    let path = url.searchParams.get("path") as string;
    console.log(path);
    // Error: Can only read 'page.url' on the server during rendering (not in e.g. `load` functions), as it is bound to the current request via component context. This prevents state from leaking between users.For more information, see https://svelte.dev/docs/kit/state-management#avoid-shared-state-on-the-server
    // console.log("skibidi", page.url.searchParams.get("path"));

    // console.log(page.params.path);
    let file: string = await fs.readFile(path, 'utf8');
    return json(file);
}