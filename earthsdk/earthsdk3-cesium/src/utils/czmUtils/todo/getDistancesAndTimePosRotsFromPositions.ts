// TODO: todo文件夹中的代码，是通过Cesium的算法实现的，需要从Cesium中剥离出来，不再依赖Cesium的js。
import * as Cesium from 'cesium';
import { lbhToXyz, xyzToLbh } from "earthsdk3";
import { generateCartesianArc } from './generateCartesianArc';
import { TimePosRotType } from './timePosRotType';

export function getDistancesAndTimePosRotsFromPositions(positions: [number, number, number][], arcType: "GEODESIC" | "NONE" | "RHUMB" = "GEODESIC", granularity: number) {
    const xyzs = positions.map(lbhToXyz);

    const cartesians = xyzs.map(e => Cesium.Cartesian3.fromArray(e));

    let arcCartesians;
    if (granularity > 0 && arcType !== "NONE") {
        arcCartesians = generateCartesianArc({
            arcType: Cesium.ArcType[arcType ?? 'GEODESIC'],
            granularity,
            ellipsoid: Cesium.Ellipsoid.WGS84,
            positions: cartesians,
        });

        if (!arcCartesians) {
            return undefined;
        }
    } else {
        arcCartesians = cartesians;
    }

    let accumDistance = 0;
    const distances = [0] as number[];
    const l = arcCartesians.length;
    for (let i = 1; i < l; ++i) {
        accumDistance += Cesium.Cartesian3.distance(arcCartesians[i - 1], arcCartesians[i]);
        distances.push(accumDistance);
    }

    const lbhs = arcCartesians.map(e => xyzToLbh([e.x, e.y, e.z]));

    // const rotations: [number, number, number][] = [[0, 0, 0]];
    // for (let i = 1; i < l; ++i) {
    //     const lp = lbhs[i - 1];
    //     const rp = lbhs[i];
    //     const heading = geoHeading(lp, rp);
    //     const height = rp[2] - lp[2];
    //     const pitch = Math.asin(height / (distances[i] - distances[i - 1])) * 180 / Math.PI;
    //     rotations.push([heading, pitch, 0]);
    // }
    // if (l > 1) {
    //     rotations[0] = [...rotations[1]];
    // }

    const timePosRots: TimePosRotType[] = distances.map((e, i) => [
        distances[i],
        lbhs[i],
        undefined,
        // rotations[i],
    ]);

    return {
        timePosRots,
        distances,
    };
}
