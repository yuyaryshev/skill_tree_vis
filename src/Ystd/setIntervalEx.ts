export type SetIntervalExCallback = () => boolean | undefined;
export const setIntervalEx = (callback: SetIntervalExCallback, intervalBetweenCalls: number) => {
    if (callback() !== false) setTimeout(callback, intervalBetweenCalls);
};
