import * as Cesium from 'cesium';

export function generateCartesianArc(options: {
    positions: Cesium.Cartesian3[],
    arcType: Cesium.ArcType;
    granularity: number;
    ellipsoid: Cesium.Ellipsoid;
}): Cesium.Cartesian3[] | undefined;