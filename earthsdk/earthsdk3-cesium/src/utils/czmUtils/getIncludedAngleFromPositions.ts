import { Cartesian3, Math as CesiumMath } from "cesium";

export function getIncludedAngleFromPositions(positions: [number, number, number][]) {
    if (positions.length < 2) {
        console.error("getIncludedAngleFromPositions需要传入的点不能少于三个！！！！！");
        return false;
    }
    let angles = [];
    for (let i = 0; i < positions.length - 2; i++) {
        const start = Cartesian3.fromDegrees(...positions[i]);
        const middle = Cartesian3.fromDegrees(...positions[i + 1]);
        const end = Cartesian3.fromDegrees(...positions[i + 2]);
        const angleBetween = Cartesian3.angleBetween(Cartesian3.subtract(start, middle, new Cartesian3()), Cartesian3.subtract(end, middle, new Cartesian3()));

        angles.push(isNaN(angleBetween) ? 0 : CesiumMath.toDegrees(angleBetween));
    }
    return angles;
}
