// TODO: todo文件夹中的代码，是通过Cesium的算法实现的，需要从Cesium中剥离出来，不再依赖Cesium的js。
import { toCartesian } from '../czmConverts';
import { getQuaternionWithXForwardZUp, getQuaternionWithYForwardZUp } from '../getQuaternion';
// import { getQuaternionWithXForwardZUp, getQuaternionWithYForwardZUp } from './getQuaternion';
import { NativeNumber16Type } from './numberTypes';
import * as Cesium from 'cesium';

// TODO(vtxf): 必须改造成脱离Cesium使用的方法！

function czmMat4ToArray(czmMat4: Cesium.Matrix4, result?: NativeNumber16Type) {
    result = result ?? new Array(16) as NativeNumber16Type;
    for (let i = 0; i < 16; ++i) {
        result[i] = czmMat4[i];
    }
    return result;
}

export type RotationModeType = 'YForwardZUp' | 'XForwardZUp';
export function getModelMatrixFromPosition(options: {
    position?: [number, number, number],
    rotation?: [number, number, number],
    initialRotationMode?: RotationModeType,
    scale?: [number, number, number],
}, result?: NativeNumber16Type) {
    const modelMatrix = Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY);

    const { position, rotation, scale, initialRotationMode = 'YForwardZUp' } = options;
    if (position) {
        const [l, b, h] = position;
        Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(l, b, h), undefined, modelMatrix);
    }

    if (rotation) {
        const quaternion = new Cesium.Quaternion();
        if (initialRotationMode === 'YForwardZUp') {
            getQuaternionWithYForwardZUp(rotation, quaternion);
        } else if (initialRotationMode === 'XForwardZUp') {
            getQuaternionWithXForwardZUp(rotation, quaternion);
        }
        const matrix3 = Cesium.Matrix3.fromQuaternion(quaternion);
        Cesium.Matrix4.multiply(modelMatrix, Cesium.Matrix4.fromRotationTranslation(matrix3), modelMatrix);
    }

    if (scale) {
        Cesium.Matrix4.multiplyByScale(modelMatrix, toCartesian(scale), modelMatrix);
    }

    return czmMat4ToArray(modelMatrix, result);
}

const getInverseModelMatrix_scratchMatrix4 = new Cesium.Matrix4();
export function getInverseModelMatrix(modelMatrix: NativeNumber16Type, result?: NativeNumber16Type) {
    const czmMat4 = Cesium.Matrix4.fromArray(modelMatrix, 0, getInverseModelMatrix_scratchMatrix4);
    Cesium.Matrix4.inverse(czmMat4, czmMat4);
    return czmMat4ToArray(czmMat4, result);
}

const positionToLocalPosition_scratchMatrix4 = new Cesium.Matrix4();
const positionToLocalPosition_scratchCartesian3 = new Cesium.Cartesian3();
export function positionToLocalPosition(inverseModelMatrix: NativeNumber16Type, position: [number, number, number], result?: [number, number, number]) {
    const [l, b, h] = position;
    const p0 = Cesium.Cartesian3.fromDegrees(l, b, h, undefined, positionToLocalPosition_scratchCartesian3);
    const czmMat4 = Cesium.Matrix4.fromArray(inverseModelMatrix, 0, positionToLocalPosition_scratchMatrix4);
    const local_p0 = Cesium.Matrix4.multiplyByPoint(czmMat4, p0, p0);
    const { x, y, z } = local_p0;
    result = result || [0, 0, 0];
    result[0] = x;
    result[1] = y;
    result[2] = z;
    return result;
}

const localPositionToPosition_scratchMatrix4 = new Cesium.Matrix4();
const localPositionToPosition_cartesian = new Cesium.Cartesian3();
const localPositionToPosition_cartographic = new Cesium.Cartographic();
export function localPositionToPosition(modelMatrix: NativeNumber16Type, localPosition: [number, number, number], result?: [number, number, number]) {
    const [x, y, z] = localPosition;
    const lp0 = Cesium.Cartesian3.fromElements(x, y, z, localPositionToPosition_cartesian);
    const czmMat4 = Cesium.Matrix4.fromArray(modelMatrix, 0, localPositionToPosition_scratchMatrix4);
    const cartesian = Cesium.Matrix4.multiplyByPoint(czmMat4, lp0, lp0);
    const carto = Cesium.Cartographic.fromCartesian(cartesian, undefined, localPositionToPosition_cartographic);
    result = result || [0, 0, 0];
    result[0] = Cesium.Math.toDegrees(carto.longitude);
    result[1] = Cesium.Math.toDegrees(carto.latitude);
    result[2] = carto.height;
    return result;
}

export function positionsToLocalPositions(options: { originPosition?: [number, number, number], originRotation?: [number, number, number], initialRotationMode?: RotationModeType, originScale?: [number, number, number] }, positions: [number, number, number][]) {
    const { originPosition: position, originRotation: rotation, originScale: scale, initialRotationMode } = options;
    const modelMatrix = getModelMatrixFromPosition({ position, rotation, scale, initialRotationMode });
    const inverseModelMatrix = getInverseModelMatrix(modelMatrix);
    const localPositons = positions.map(e => positionToLocalPosition(inverseModelMatrix, e));
    return [localPositons, modelMatrix, inverseModelMatrix] as [localPositons: [number, number, number][], modelMatrix: NativeNumber16Type, inverseModelMatrix: NativeNumber16Type];
}

export function localPositionsToPositions(options: { originPosition?: [number, number, number], originRotation?: [number, number, number], initialRotationMode?: RotationModeType, originScale?: [number, number, number] }, localPositons: [number, number, number][]) {
    const { originPosition: position, originRotation: rotation, originScale: scale, initialRotationMode } = options;
    const modelMatrix = getModelMatrixFromPosition({ position, rotation, scale, initialRotationMode });
    const positons = localPositons.map(e => localPositionToPosition(modelMatrix, e));
    return [positons, modelMatrix] as [positons: [number, number, number][], modelMatrix: NativeNumber16Type];
}
