import * as Cesium from 'cesium';

export function positionToCartesian(position: [number, number, number], result?: Cesium.Cartesian3) {
    return Cesium.Cartesian3.fromDegrees(...position, undefined, result);
}

const scratchCartographic = new Cesium.Cartographic();
export function positionFromCartesian(cartesian: Cesium.Cartesian3, result?: [number, number, number]) {
    const carto = Cesium.Cartographic.fromCartesian(cartesian, undefined, scratchCartographic);
    if (!carto) {
        return undefined;
    }
    result = result || [0, 0, 0];
    result[0] = Cesium.Math.toDegrees(carto.longitude);
    result[1] = Cesium.Math.toDegrees(carto.latitude);
    result[2] = carto.height;
    return result;
}

export function toCartesian2(value: [number, number], result?: Cesium.Cartesian2) {
    result = result || new Cesium.Cartesian2();
    result.x = value[0];
    result.y = value[1];
    return result;
}

export function fromCartesian2(cartesian: Cesium.Cartesian2, result?: [number, number]) {
    result = result || [0, 0];
    result[0] = cartesian.x;
    result[1] = cartesian.y;
    return result;
}

export function toCartesian3(value: [number, number, number], result?: Cesium.Cartesian3) {
    result = result || new Cesium.Cartesian3();
    result.x = value[0];
    result.y = value[1];
    result.z = value[2];
    return result;
}

export function fromCartesian3(cartesian: Cesium.Cartesian3, result?: [number, number, number]) {
    result = result || [0, 0, 0];
    result[0] = cartesian.x;
    result[1] = cartesian.y;
    result[2] = cartesian.z;
    return result;
}

export function toCartesian4(value: [number, number, number, number], result?: Cesium.Cartesian4) {
    result = result || new Cesium.Cartesian4();
    result.x = value[0];
    result.y = value[1];
    result.z = value[2];
    result.w = value[3];
    return result;
}

export function fromCartesian4(cartesian: Cesium.Cartesian4, result?: [number, number, number, number]) {
    result = result || [0, 0, 0, 0];
    result[0] = cartesian.x;
    result[1] = cartesian.y;
    result[2] = cartesian.z;
    result[3] = cartesian.w;
    return result;
}

export function toCartesian(value: [number, number], result?: Cesium.Cartesian2): Cesium.Cartesian2;
export function toCartesian(value: [number, number, number], result?: Cesium.Cartesian3): Cesium.Cartesian3;
export function toCartesian(value: [number, number, number, number], result?: Cesium.Cartesian4): Cesium.Cartesian4;
export function toCartesian(value: [number, number] | [number, number, number] | [number, number, number, number], result?: any): any {
    if (value.length === 4) {
        return toCartesian4(value, result);
    } else if (value.length === 3) {
        return toCartesian3(value, result);
    } else if (value.length === 2) {
        return toCartesian2(value, result);
    } else {
        throw new Error(`toCartesian error: should not be here!`);
    }
}

export function fromCartesian(cartesian: Cesium.Cartesian2, result?: [number, number]): [number, number];
export function fromCartesian(cartesian: Cesium.Cartesian3, result?: [number, number, number]): [number, number, number];
export function fromCartesian(cartesian: Cesium.Cartesian4, result?: [number, number, number, number]): [number, number, number, number];
export function fromCartesian(cartesian: Cesium.Cartesian2 | Cesium.Cartesian3 | Cesium.Cartesian4, result?: any): any {
    if (cartesian instanceof Cesium.Cartesian2) {
        return fromCartesian2(cartesian, result);
    } else if (cartesian instanceof Cesium.Cartesian3) {
        return fromCartesian3(cartesian, result);
    } else if (cartesian instanceof Cesium.Cartesian4) {
        return fromCartesian4(cartesian, result);
    }
    throw new Error(`fromCartesian error: should not be here!`);
}

export function toCartographic(position: [number, number, number], result?: Cesium.Cartographic) {
    result = result || new Cesium.Cartographic();
    result.longitude = Cesium.Math.toRadians(position[0]);
    result.latitude = Cesium.Math.toRadians(position[1]);
    result.height = position[2];
    return result;
}

export function fromCartographic(carto: Cesium.Cartographic, result?: [number, number, number]) {
    result = result || [0, 0, 0];
    result[0] = Cesium.Math.toDegrees(carto.longitude);
    result[1] = Cesium.Math.toDegrees(carto.latitude);
    result[2] = carto.height;
    return result;
}

export function toColor(color: [number, number, number, number], result?: Cesium.Color) {
    result = result || new Cesium.Color;
    result.red = color[0];
    result.green = color[1];
    result.blue = color[2];
    result.alpha = color[3];
    return result;
}

export function fromColor(czmColor: Cesium.Color, result?: [number, number, number, number]) {
    result = result || [0, 0, 0, 0];
    result[0] = czmColor.red;
    result[1] = czmColor.green;
    result[2] = czmColor.blue;
    result[3] = czmColor.alpha;
    return result;
}

export function toNearFarScalar(NearFarScalar: [number, number, number, number], result?: Cesium.NearFarScalar) {
    result = result || new Cesium.NearFarScalar;
    result.near = NearFarScalar[0];
    result.nearValue = NearFarScalar[1];
    result.far = NearFarScalar[2];
    result.farValue = NearFarScalar[3];
    return result;
}
export function fromNearFarScalar(NearFarScalar: Cesium.NearFarScalar, result?: [number, number, number, number]) {
    result = result || [0, 0, 0, 0];
    result[0] = NearFarScalar.near;
    result[1] = NearFarScalar.nearValue;
    result[2] = NearFarScalar.far;
    result[3] = NearFarScalar.farValue;
    return result;
}

export function toHeadingPitchRoll(hpr: [number, number, number], result?: Cesium.HeadingPitchRoll) {
    result = result || new Cesium.HeadingPitchRoll();
    result.heading = Cesium.Math.toRadians(hpr[0] - 90);
    result.pitch = Cesium.Math.toRadians(hpr[1]);
    result.roll = Cesium.Math.toRadians(hpr[2]);
    return result;
}

export function fromHeadingPitchRoll(czmHpr: Cesium.HeadingPitchRoll, result?: [number, number, number]) {
    result = result || [0, 0, 0];
    result[0] = Cesium.Math.toDegrees(czmHpr.heading + Cesium.Math.PI_OVER_TWO);
    result[1] = Cesium.Math.toDegrees(czmHpr.pitch);
    result[2] = Cesium.Math.toDegrees(czmHpr.roll);
    return result;
}

export function toDistanceDisplayCondition(distanceDisplayCondition: [number, number], result?: Cesium.DistanceDisplayCondition) {
    result = result || new Cesium.DistanceDisplayCondition();
    result.near = distanceDisplayCondition[0];
    result.far = distanceDisplayCondition[1];
    return result;
}

export function fromDistanceDisplayCondition(czmDistanceDisplayCondition: Cesium.DistanceDisplayCondition, result?: [number, number]) {
    result = result || [0, 0];
    result[0] = czmDistanceDisplayCondition.near;
    result[1] = czmDistanceDisplayCondition.far;
    return result;
}

export function toQuaternion(quat: [number, number, number, number], result?: Cesium.Quaternion) {
    result = result || new Cesium.Quaternion();
    result.x = quat[0];
    result.y = quat[1];
    result.z = quat[2];
    result.w = quat[3];
    return result;
}

export function fromQuaternion(czmQuat: Cesium.Quaternion, result?: [number, number, number, number]) {
    result = result || [0, 0, 0, 0];
    result[0] = czmQuat.x;
    result[1] = czmQuat.y;
    result[2] = czmQuat.z;
    result[3] = czmQuat.w;
    return result;
}

const scratchHPR_getCesiumWorldQuaternions = new Cesium.HeadingPitchRoll();
const scratchCartesian_getCesiumWorldQuaternions = new Cesium.Cartesian3();
export function positionAndRotationToQuaternion(position: [number, number, number], rotation: [number, number, number], result: Cesium.Quaternion) {
    const hpr = toHeadingPitchRoll(rotation, scratchHPR_getCesiumWorldQuaternions);
    const origin = positionToCartesian(position, scratchCartesian_getCesiumWorldQuaternions)
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(origin, hpr, undefined, undefined, result);
    return orientation;
}

export function toRectangle(rectangle: [number, number, number, number], result?: Cesium.Rectangle) {
    result = result || new Cesium.Rectangle();
    result.west = rectangle[0] * Math.PI / 180;
    result.south = rectangle[1] * Math.PI / 180;
    result.east = rectangle[2] * Math.PI / 180;
    result.north = rectangle[3] * Math.PI / 180;
    return result;
}

export function fromRectangle(czmRectangle: Cesium.Rectangle, result?: [number, number, number, number]) {
    result = result || [0, 0, 0, 0];
    result[0] = czmRectangle.west;
    result[1] = czmRectangle.south;
    result[2] = czmRectangle.east;
    result[3] = czmRectangle.north;
    return result;
}

const toEllipsoid_scratchCartesian3 = new Cesium.Cartesian3();
export function toEllipsoid(ellipsoid: [x: number, y: number, z: number], result?: Cesium.Ellipsoid) {
    result = result || new Cesium.Ellipsoid();
    return Cesium.Ellipsoid.fromCartesian3(Cesium.Cartesian3.fromArray(ellipsoid, undefined, toEllipsoid_scratchCartesian3), result);
}

export function fromEllipsoid(czmEllipsoid: Cesium.Ellipsoid, result?: [x: number, y: number, z: number]) {
    result = result || [0, 0, 0];
    result[0] = czmEllipsoid.radii.x;
    result[1] = czmEllipsoid.radii.y;
    result[2] = czmEllipsoid.radii.z;
    return result;
}

// export function toGeometryCallback(Callback: [x: number, y: number, level: number], result?: Cesium.CustomHeightmapTerrainProvider.GeometryCallback) {
//     type GeometryCallback = (x: number, y: number, level: number) => Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | number[] | Promise<Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | number[]> | undefined;
//     result = result || geometryCallback;
//     return result;
// }
