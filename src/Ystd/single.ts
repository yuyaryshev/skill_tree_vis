export function single<T>(array: T[]): T {
    if (!Array.isArray(array)) throw new Error(`Expected array with a single value, but not an array given!`);

    if (!array.length) throw new Error(`Expected single value, but got none`);

    if (array.length === 1) return array[0];
    throw new Error(`Expected single value, but got many.`);
}
