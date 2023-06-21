export const numbers = [
	0,
	1,
	-1,
	//
	Math.PI,
	-Math.PI,
	//8 bit
	0x7f,
	0x0f,
	//16 bit
	0x7fff,
	0x0fff,
	//32 bit
	0x7fffffff,
	0x0fffffff,
	//64 bit
	// 0x7FFFFFFFFFFFFFFF,
	// eslint-disable-next-line no-loss-of-precision
	0x0fffffffffffffff,
];
export const long_string = "ThisIsÁTèstString".repeat(100000);
export const strings = [
	"",
	"hello",
	"café",
	"中文",
	"broccoli🥦līp𨋢grin😃ok",
	"\u{10ffff}",
];

export { commit_data } from "./commit_data.js";

export const typed_arrays = [
	new Uint8Array(),
	new Uint8Array([0]),
	new Uint8Array([0, 1, 2, 3, 4, 6, 7]),
	new Uint8Array([0, 1, 2, 3, 4, 6, 78, 9, 10, 11, 12, 13, 14, 15]),
	new Uint8Array([
		0, 1, 2, 3, 4, 6, 78, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23,
		24, 25, 26, 27, 28, 30, 31,
	]),
	new Int32Array([0].map((x) => -x)),
	new Int32Array([0, 1, 2, 3, 4, 6, 7].map((x) => -x)),
	new Int32Array(
		[0, 1, 2, 3, 4, 6, 78, 9, 10, 11, 12, 13, 14, 15].map((x) => -x),
	),
	new Int32Array(
		[
			0, 1, 2, 3, 4, 6, 78, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22,
			23, 24, 25, 26, 27, 28, 30, 31,
		].map((x) => -x),
	),
];

export const typed_array_view = new Uint8Array(typed_arrays[6].buffer, 4);

export const array_buffers = [
	new Uint8Array(),
	new Uint8Array([0]),
	new Uint8Array([0, 1, 2, 3, 4, 6, 7]),
	new Uint8Array([0, 1, 2, 3, 4, 6, 78, 9, 10, 11, 12, 13, 14, 15]),
	new Uint8Array([
		0, 1, 2, 3, 4, 6, 78, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23,
		24, 25, 26, 27, 28, 30, 31,
	]),
].map((x) => x.buffer);

export const dates = [
	new Date(Date.UTC(2024, 1, 1, 1, 1, 1, 1)),
	new Date(Date.UTC(1, 1, 1, 1, 1, 1, 1)),
];
