export async function asyncForEach<T>(
	array: Array<T>,
	callback: (x: T, index: number, array: Array<T>) => Promise<void>
) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

export function injectAt(
	code: string,
	position: number,
	injectCode: string
): string {
	return code.slice(0, position) + injectCode + code.slice(position);
}

export async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
