import { ESPathImpl, TimePosRotType } from ".";

export function subPath(geoPath: ESPathImpl, startTimeStamp: number, stopTimeStamp: number) {
    const { timePosRots } = geoPath;
    if (!timePosRots) throw new Error(`!timePosRots`);
    if (timePosRots.length === 0) throw new Error(`timePosRots.length === 0`);

    startTimeStamp = Math.max(startTimeStamp, timePosRots[0][0]);
    stopTimeStamp = Math.min(stopTimeStamp, timePosRots[timePosRots.length - 1][0]);

    const start = geoPath.getCurrent(startTimeStamp);
    const stop = geoPath.getCurrent(stopTimeStamp);

    if (!start || !stop) {
        return undefined;
    }

    const subTimePosRots: TimePosRotType[] = [];

    if (start.ratio < 1) {
        subTimePosRots.push([startTimeStamp, start.position, start.rotation,]);
    }

    for (let i = start.index + 1; i <= stop.index; ++i) {
        subTimePosRots.push(timePosRots[i]);
    }

    if (stop.ratio > 0) {
        subTimePosRots.push([stopTimeStamp, stop.position, stop.rotation,]);
    }

    return subTimePosRots;
}
