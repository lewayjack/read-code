import * as Cesium from 'cesium';

export function getEllipsoidGeodesicCenter(left: [number, number, number], right: [number, number, number]) {
    const tr = Math.PI / 180;
    const tr_1 = 1 / tr;
    const c0 = new Cesium.Cartographic(left[0] * tr, left[1] * tr, left[2]);
    const c1 = new Cesium.Cartographic(right[0] * tr, right[1] * tr, right[2]);
    const cm = new Cesium.EllipsoidGeodesic(c0, c1).interpolateUsingFraction(0.5, new Cesium.Cartographic());
    if (!cm) return undefined;
    cm.height = (c0.height + c1.height) * .5;
    return [cm.longitude * tr_1, cm.latitude * tr_1, cm.height] as [number, number, number];
}
