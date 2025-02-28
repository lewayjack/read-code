import { geoNearestPointOnLine, geoRhumbDestination, geoRhumbDistance, geoRhumbHeading } from "earthsdk3";

/**
 * 
 * @param centerPosition 
 * @param heading 
 * @param position 
 * @param result result是两个元素的数组，第一个表示distance >0 表示和箭头方向一致，否则相反；第二个表示位置
 * @returns 
 */
export function geoNeareastPointOnRhumbLine(centerPosition: [number, number, number], heading: number, position: [number, number, number], result?: [number, number, number]) {
    const _distance = geoRhumbDistance(centerPosition, position);
    const _heading = geoRhumbHeading(centerPosition, position);
    const dot = Math.cos(_heading * Math.PI / 180) * Math.cos(heading * Math.PI / 180) + Math.sin(_heading * Math.PI / 180) * Math.sin(heading * Math.PI / 180);
    let resultPos: [number, number, number] | undefined;
    if (dot > 0) {
        resultPos = geoRhumbDestination(centerPosition, _distance, heading, result);
    } else {
        resultPos = geoRhumbDestination(centerPosition, _distance, heading + 180, result);
    }

    return [dot > 0 ? _distance : -_distance, result] as [number, [number, number, number] | undefined];
}

////////////////////////////////////////////////////////////////////////////////////////
// TODO 上面的计算实际上并不能求出真正的最近点，尤其是偏离坐标轴较远时，以下两个函数暂实验性，暂未使用，以后可以考虑替换！ vtxf 20220521

export function createHelperLine(centerPosition: [number, number, number], heading: number, dimension: number) {
    const advance = dimension * 0.1;
    const positions: [number, number, number][] = [];
    for (let i = -9; i < 10; ++i) {
        const position = geoRhumbDestination(centerPosition, advance * i, heading);
        position && positions.push(position);
    }
    return positions;
}

export function geoNeareastPointOnRhumbLine2(line: ([number, number, number] | [number, number])[], position: [number, number, number]) {
    const np = geoNearestPointOnLine(line, position);
    return np.geometry.coordinates;
}
