import { main } from "code-scanner";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	let data = await main();
	return { data };
}