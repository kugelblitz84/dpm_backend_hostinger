declare module "colors" {
	interface Colors {
		(text: string): string;
		bold: Colors;
		italic: Colors;
		underline: Colors;
		inverse: Colors;
		white: Colors;
		gray: Colors;
		grey: Colors;
		black: Colors;
		blue: Colors;
		cyan: Colors;
		green: Colors;
		magenta: Colors;
		red: Colors;
		yellow: Colors;
		rainbow: Colors;
		zebra: Colors;
		random: Colors;
		strip: Colors;
		stripColors: Colors;
		[key: string]: any; // Allow any other properties
	}

	const colors: Colors;
	export = colors;
}
