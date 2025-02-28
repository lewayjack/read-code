import * as Cesium from 'cesium';
import { getQuaternionWithYForwardZUp } from './getQuaternion';

function checkArrayParam(array: number[], length: number) {
    if (!Array.isArray(array)) {
        console.warn(`!Array.isArray(array)`);
        return false;
    }
    if (array.length !== length) {
        console.warn(`array.length !== ${length}`);
        return false;
    }
    if (!array.every(v => Number.isFinite(v))) {
        console.warn(`!array.every(v => Number.isFinite(v))`);
        return false;
    }
    return true;
}

function checkScale(array: [number, number, number]) {
    if (array.some(e => e === 0)) {
        console.warn(`array.some(e => e === 0)`);
        return false;
    }
    return true;
}

export function computeCzmModelMatrix(options: {
    localScale?: [number, number, number];
    initialRotation?: 'xForwardzUp' | 'yForwardzUp';
    // reverseInitialRotation?: boolean; // 默认为false，对于3dtiels数据，需要设置为true，其他情况设置为false
    localRotation?: [number, number, number];
    localPosition?: [number, number, number];
    localModelMatrix?: [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
    sceneScaleFromPixelSize?: number;
    scale?: [number, number, number];
    rotation?: [number, number, number];
    position?: [number, number, number];
    modelMatrix?: [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
}, target?: Cesium.Matrix4) {

    const check0 = 
        (!options.localScale || checkArrayParam(options.localScale, 3)) &&
        (!options.localRotation || checkArrayParam(options.localRotation, 3)) &&
        (!options.localPosition || checkArrayParam(options.localPosition, 3)) &&
        (!options.localModelMatrix || checkArrayParam(options.localModelMatrix, 16)) &&
        (!options.scale || checkArrayParam(options.scale, 3)) &&
        (!options.rotation || checkArrayParam(options.rotation, 3)) &&
        (!options.position || checkArrayParam(options.position, 3)) &&
        (!options.modelMatrix || checkArrayParam(options.modelMatrix, 16));
    if (!check0) {
        return undefined;
    }

    if (options.localScale && !checkScale(options.localScale)) {
        return undefined;
    }

    if (options.scale && !checkScale(options.scale)) {
        return undefined;
    }

    if (options.sceneScaleFromPixelSize) {
        if (!Number.isFinite(options.sceneScaleFromPixelSize)) {
            console.warn(`!Number.isFinite(options.sceneScaleFromPixelSize)`);
            return undefined;
        }
        if (options.sceneScaleFromPixelSize === 0) {
            console.warn(`options.sceneScaleFromPixelSize === 0`);
            return undefined;
        }
    }

    const modelMatrix = target ?? Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY);

    if (options.localScale) {
        const [sx, sy, sz] = options.localScale ?? [1, 1, 1];
        const scaleMatrix = Cesium.Matrix4.fromScale(Cesium.Cartesian3.fromElements(sx, sy, sz), new Cesium.Matrix4());
        Cesium.Matrix4.multiply(scaleMatrix, modelMatrix, modelMatrix);
    }
    if ((options.initialRotation ?? 'yForwardzUp') === 'xForwardzUp') {
        // 针对gltf模型专门做个偏转，此时的模型+x为正前方，+z向上，此次旋转以后+y为前方，+z向上
        const quaternion = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(90));
        const matrix3 = Cesium.Matrix3.fromQuaternion(quaternion);
        Cesium.Matrix4.multiply(Cesium.Matrix4.fromRotationTranslation(matrix3), modelMatrix, modelMatrix);
    }
    if (options.localRotation) {
        const quaternion = getQuaternionWithYForwardZUp(options.localRotation);
        const matrix3 = Cesium.Matrix3.fromQuaternion(quaternion);
        Cesium.Matrix4.multiply(Cesium.Matrix4.fromRotationTranslation(matrix3), modelMatrix, modelMatrix);
    }
    if (options.localPosition) {
        const offsetMatrix = Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromArray(options.localPosition));
        Cesium.Matrix4.multiply(offsetMatrix, modelMatrix, modelMatrix);
    }
    if (options.localModelMatrix) {
        const localModelMatrix = Cesium.Matrix4.fromArray(options.localModelMatrix);
        Cesium.Matrix4.multiply(localModelMatrix, modelMatrix, modelMatrix);
    }
    if (options.sceneScaleFromPixelSize !== undefined && Number.isFinite(options.sceneScaleFromPixelSize)) {
        const s = options.sceneScaleFromPixelSize;
        const scaleMatrix = Cesium.Matrix4.fromScale(Cesium.Cartesian3.fromElements(s, s, s), new Cesium.Matrix4());
        Cesium.Matrix4.multiply(scaleMatrix, modelMatrix, modelMatrix);
    }
    if (options.scale) {
        const [sx, sy, sz] = options.scale ?? [1, 1, 1];
        const scaleMatrix = Cesium.Matrix4.fromScale(Cesium.Cartesian3.fromElements(sx, sy, sz), new Cesium.Matrix4());
        Cesium.Matrix4.multiply(scaleMatrix, modelMatrix, modelMatrix);
    }
    if (options.rotation) {
        const quaternion = getQuaternionWithYForwardZUp(options.rotation);
        const matrix3 = Cesium.Matrix3.fromQuaternion(quaternion);
        Cesium.Matrix4.multiply(Cesium.Matrix4.fromRotationTranslation(matrix3), modelMatrix, modelMatrix);
    }
    // 这个旋转应该不需要！ reverse 应该改为 reserve
    // if (options.reverseInitialRotation ?? false) {
    //     // 针对gltf模型专门做个偏转，此时的模型+x为正前方，+z向上，此次旋转以后+y为前方，+z向上
    //     const quaternion = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(-90));
    //     const matrix3 = Cesium.Matrix3.fromQuaternion(quaternion);
    //     Cesium.Matrix4.multiply(Cesium.Matrix4.fromRotationTranslation(matrix3), modelMatrix, modelMatrix);
    // }
    if (options.position) {
        const cartesian = Cesium.Cartesian3.fromDegrees(...options.position);
        const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(cartesian);
        Cesium.Matrix4.multiply(enuMatrix, modelMatrix, modelMatrix);
    }
    if (options.modelMatrix) {
        const modelMatrixAlias = Cesium.Matrix4.fromArray(options.modelMatrix);
        Cesium.Matrix4.multiply(modelMatrixAlias, modelMatrix, modelMatrix);
    }

    return modelMatrix;
}