declare module "sharp" {
	import { Sharp } from "sharp";

	const sharp: (input?: string | Buffer) => Sharp;
	export = sharp;
}
