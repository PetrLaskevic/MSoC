import { json } from '@sveltejs/kit';
import * as fs from 'node:fs/promises';

export async function GET({ url }) {
    let path = url.searchParams.get("path") as string;
    console.log(path);
    let file: string = await fs.readFile(path, 'utf8');
    return json(file);
}