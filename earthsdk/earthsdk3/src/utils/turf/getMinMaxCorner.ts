import { max, min, objsIterator } from "xbsj-base";

export function getMinMaxCorner(positions: Iterable<[number, number, number]>) {
    const minX = min(objsIterator(positions, ['0']));
    const minY = min(objsIterator(positions, ['1']));
    const minZ = min(objsIterator(positions, ['2']));
    const maxX = max(objsIterator(positions, ['0']));
    const maxY = max(objsIterator(positions, ['1']));
    const maxZ = max(objsIterator(positions, ['2']));

    return {
        minPos: [minX, minY, minZ] as [number, number, number],
        maxPos: [maxX, maxY, maxZ] as [number, number, number],
        center: [(minX + maxX) * .5, (minY + maxY) * .5, (minZ + maxZ) * .5] as [number, number, number],
    };
}
