import * as Cesium from 'cesium';
import { ESVisualObject, getGeoBoundingSphereFromPositions } from "earthsdk3";
import { CzmCustomPrimitive, CzmModelPrimitive } from '../../CzmObjects';
import { ESCesiumViewer } from '../../ESCesiumViewer';
import { CancelError, pairToPromise, Vector } from 'xbsj-base';
import { positionFromCartesian } from '../czmUtils';

export const defaultFlyToRotation = [0, -30, 0] as [number, number, number];

const scratchDestination = new Cesium.Cartesian3();
const flyToHPR = new Cesium.HeadingPitchRoll();
const flyToMatrix4 = new Cesium.Matrix4();
const flyTocartesian3 = new Cesium.Cartesian3();

function fromCartographic(carto: Cesium.Cartographic, result?: [number, number, number]) {
    result = result || [0, 0, 0];
    result[0] = Cesium.Math.toDegrees(carto.longitude);
    result[1] = Cesium.Math.toDegrees(carto.latitude);
    result[2] = carto.height;
    return result;
}

const scratchLbh = [0, 0, 0] as [number, number, number];

export type CzmFlyToOptions = {
    position?: [number, number, number],
    viewDistance?: number,
    rotation?: [number, number, number],
    duration?: number, // 单位是毫秒！
    hdelta?: number,  // 该参数有问题，一般情况下不要使用 
    pdelta?: number  // 该参数有问题，一般情况下不要使用
    cancelCallback?: () => void,
}

/**
 * 
 * @param czmCamera Cesium.Camera
 * @param options options.duration的单位是毫秒！
 * @returns 
 */
export function czmFlyTo(czmCamera: Cesium.Camera, options: CzmFlyToOptions) {
    const { position, viewDistance, rotation, duration, cancelCallback, hdelta, pdelta } = options;

    // 如果同时为undefined，那么直接return
    if (!position && viewDistance === undefined && !rotation) {
        return;
    }

    const [l, b, h] = position ?? fromCartographic(czmCamera.positionCartographic, scratchLbh);
    const destination = Cesium.Cartesian3.fromDegrees(l, b, h, undefined, scratchDestination)

    const hpr = rotation && [...rotation].map(Cesium.Math.toRadians) || [czmCamera.heading, czmCamera.pitch, czmCamera.roll];

    let orientation: any = {
        heading: hpr[0],
        pitch: hpr[1],
        roll: hpr[2],
    };

    if (viewDistance) {
        flyToHPR.heading = hpr[0];
        flyToHPR.pitch = hpr[1];
        flyToHPR.roll = hpr[2];

        flyToHPR.heading -= Cesium.Math.PI_OVER_TWO;

        // hdelta && (flyToHPR.heading += hdelta);
        // pdelta && (flyToHPR.pitch += pdelta);

        const mat4 = Cesium.Transforms.headingPitchRollToFixedFrame(destination, flyToHPR, undefined, undefined, flyToMatrix4);
        const dir = Cesium.Matrix4.multiplyByPointAsVector(mat4, Cesium.Cartesian3.UNIT_X, flyTocartesian3);

        Cesium.Cartesian3.multiplyByScalar(dir, viewDistance, dir);
        Cesium.Cartesian3.subtract(destination, dir, destination);

        // const direction = new Cesium.Cartesian3(mat4[0], mat4[1], mat4[2]);
        // const up = new Cesium.Cartesian3(mat4[8], mat4[9], mat4[10]);

        // orientation = { direction, up };
    }

    hdelta && (orientation.heading -= Cesium.Math.toRadians(hdelta));
    pdelta && (orientation.pitch += Cesium.Math.toRadians(pdelta));

    if (duration === 0) { // duration为0则立即执行
        czmCamera.setView({ destination, orientation });
        return undefined;
    }

    let cancelFunc: (cancelError?: CancelError) => void;
    const promise = new Promise<boolean>((resolve, reject) => {
        czmCamera.flyTo({
            destination,
            orientation,
            duration: ((duration ?? 1000) * .001),
            complete: () => {
                resolve(true);
            },
            cancel: () => {
                cancelCallback && cancelCallback();
                resolve(false);
            }
        });
        // @ts-ignore
        const currentFlight = czmCamera._currentFlight;
        cancelFunc = () => {
            // @ts-ignore
            if (currentFlight === czmCamera._currentFlight) {
                czmCamera.cancelFlight();
                // @ts-ignore
                if (czmCamera._currentFlight) {
                    console.error(`cancelFlight后_currentFlight不应该存在！`);
                    reject(`cancelFlight后_currentFlight不应该存在！`);
                }
            }
        }
    });

    // @ts-ignore
    return pairToPromise([cancelFunc, promise]);
}

/**
 * 
 * @param czmCamera cesium的Camera
 * @param position 目标位置, 形式如：[经度, 纬度, 高度] 其中经纬度的单位是弧度，高度的单位是米。
 * @param viewDistance 距离目标多远距离时停下，默认为0，即直接飞到目标点处，单位是米。
 * @param rotation 相机飞入后的姿态控制，从什么角度观察目标，形式如: [偏航角, 俯仰角, 翻转角], 单位是弧度。
 * @param duration 飞行持续时间，如果是0，则直接跳转，单位是秒。
 * @returns 
 * 
 * @example
 * // 示例1
 * // 相机直接飞入北京(116.39, 39.9)的位置，高度100米。相机位于目标点上。
 * flyTo(camera, [116.39, 39.9, 100]);
 * 
 * // 示例2
 * // 相机直接飞向北京(116.39, 39.9)的位置，高度100米的目标，再距离目标点1000米的距离停下来，此时目标点刚好位置屏幕中心位置。
 * flyTo(camera, [116.39, 39.9, 100], 1000);
 * 
 * // 示例3
 * // 相机直接飞向北京(116.39, 39.9)的位置，高度100米的目标，再距离目标点1000米的距离停下来，此时目标点刚好位置屏幕中心位置。
 * // 同时相机的方向是正东向，向下倾斜30度。
 * // 相机方向是这样的 朝北是0度，朝东是90度，朝南是180度，朝西是270度。抬头看天的俯仰角是90度，俯视地面是-90度。
 * flyTo(camera, [116.39, 39.9, 100], 1000, [90, -30, 0]);
 * 
 */
export function flyTo(
    viewer: Cesium.Viewer | undefined,
    position?: [number, number, number],
    viewDistance?: number,
    rotation?: [number, number, number],
    duration?: number,
    cancelCallback?: () => void,
) {
    const camera = viewer?.camera;
    return camera && czmFlyTo(camera, { position, viewDistance, rotation, duration: duration && duration * 1000, cancelCallback });
}
export async function flyWithPosition(czmViewer: ESCesiumViewer, sceneObject: ESVisualObject, id: number, position: [number, number, number], radius: number, duration: number | undefined, useSceneObjectHeading: boolean = false) {
    if (!czmViewer.viewer) return;
    const viewDistance = getViewDistance(czmViewer, radius);
    const rotation = [...defaultFlyToRotation] as [number, number, number];
    if (useSceneObjectHeading) {
        //@ts-ignore
        rotation[0] = sceneObject.rotation[0] - 90;
    }
    const { position: flyPosition, rotation: flyRotation } = getFlyToCenterAndRotation(position, rotation, viewDistance);
    let r = await czmViewer.flyTo({
        distance: 0,
        heading: flyRotation[0],
        pitch: flyRotation[1],
        flyDuration: (duration ?? 1),
        hDelta: 0,
        pDelta: 0,
    }, flyPosition);
    sceneObject.flyOverEvent.emit(id, r ? 'over' : r == undefined ? 'error' : 'cancelled', czmViewer);
    return r ?? false;
}
export async function flyWithPositions(czmViewer: ESCesiumViewer, sceneObject: ESVisualObject, id: number, positions: [number, number, number][], duration: number | undefined, useSceneObjectHeading: boolean = false) {
    const centerAndRadius = getGeoBoundingSphereFromPositions(positions);
    if (centerAndRadius && centerAndRadius.center && centerAndRadius.radius && czmViewer.viewer) {
        const viewDistance = getViewDistance(czmViewer, centerAndRadius.radius);
        const rotation = [...defaultFlyToRotation] as [number, number, number];
        if (useSceneObjectHeading) {
            //@ts-ignore
            rotation[0] = sceneObject.rotation[0] - 90;
        }
        const { position: flyPosition, rotation: flyRotation } = getFlyToCenterAndRotation(centerAndRadius.center, rotation, viewDistance);
        let r = await czmViewer.flyTo({
            distance: 0,
            heading: flyRotation[0],
            pitch: flyRotation[1],
            flyDuration: (duration ?? 1),
            hDelta: 0,
            pDelta: 0,
        }, flyPosition);
        sceneObject.flyOverEvent.emit(id, r ? 'over' : r == undefined ? 'error' : 'cancelled', czmViewer);
        return r ?? false;
    }
    return false;
}
export async function flyWithPrimitive(czmViewer: ESCesiumViewer, sceneObject: ESVisualObject, id: number, duration: number | undefined, czmPrimitive: CzmCustomPrimitive | CzmModelPrimitive, useSceneObjectHeading: boolean = false) {
    const cav = getCav(czmViewer, czmPrimitive);
    if (cav != undefined) {
        const [center, viewDistance] = cav
        const rotation = [...defaultFlyToRotation] as [number, number, number];
        if (useSceneObjectHeading) {
            //@ts-ignore
            rotation[0] = sceneObject.rotation[0] - 90;
        }
        const { position: flyPosition, rotation: flyRotation } = getFlyToCenterAndRotation(center, rotation, viewDistance);
        let r = await czmViewer.flyTo({
            distance: 0,
            heading: flyRotation[0],
            pitch: flyRotation[1],
            flyDuration: (duration ?? 1),
            hDelta: 0,
            pDelta: 0,
        }, flyPosition);
        sceneObject.flyOverEvent.emit(id, r ? 'over' : r == undefined ? 'error' : 'cancelled', czmViewer);
        return r ?? false;
    }
    return false;
}

function getCav(czmViewer: ESCesiumViewer, czmCustomPrimitiveTemp: CzmCustomPrimitive | CzmModelPrimitive) {
    if (czmCustomPrimitiveTemp instanceof CzmCustomPrimitive
        && czmCustomPrimitiveTemp.nativePrimitive
        && czmCustomPrimitiveTemp.nativePrimitive.boundingVolume
    ) {
        return getCenterAndViewDistance(czmViewer, czmCustomPrimitiveTemp.nativePrimitive.boundingVolume);
    } else if (czmCustomPrimitiveTemp instanceof CzmModelPrimitive
        && czmCustomPrimitiveTemp.primitive) {
        return getCenterAndViewDistance(czmViewer, czmCustomPrimitiveTemp.primitive.boundingSphere);
    }
}

// 获取包围盒中心点和视距，包围盒半径默认占屏幕128像素
export function getCenterAndViewDistance(czmViewer: ESCesiumViewer, boundingVolume: Cesium.BoundingSphere | Cesium.BoundingRectangle | Cesium.OrientedBoundingBox) {
    let viewDistance: number | undefined;
    let center: [number, number, number] | undefined;
    if (boundingVolume instanceof Cesium.BoundingSphere) {
        center = positionFromCartesian(boundingVolume.center);
        viewDistance = boundingVolume.radius;
    } else if (boundingVolume instanceof Cesium.BoundingRectangle) {
        const { x, y, width, height } = boundingVolume;
        const rectangle = Cesium.Rectangle.fromRadians(x, y, x + width, y + height);
        const bs = Cesium.BoundingSphere.fromRectangle2D(rectangle);
        center = positionFromCartesian(bs.center);
        viewDistance = bs.radius;
    } else if (boundingVolume instanceof Cesium.OrientedBoundingBox) {
        center = positionFromCartesian(boundingVolume.center);
        const h = boundingVolume.halfAxes;
        const d0 = Vector.magnitude([h[0], h[1], h[2]]);
        const d1 = Vector.magnitude([h[3], h[4], h[5]]);
        const d2 = Vector.magnitude([h[6], h[7], h[8]]);
        viewDistance = Math.max(d0, d1, d2);
    }

    if (!center || viewDistance === undefined || !czmViewer.viewer) {
        return undefined;
    }
    viewDistance = getViewDistance(czmViewer, viewDistance);
    return [center, viewDistance] as [center: [number, number, number], viewDistance: number];
}
function getViewDistance(czmViewer: ESCesiumViewer, viewDistance: number) {
    viewDistance = Math.abs(viewDistance);
    if (viewDistance == 0) viewDistance = 1;
    if (!czmViewer.viewer) return viewDistance;
    // 获取切线长度 核心公式为夹角tan比值等于像素比值，从而通过像素比值和视口fov可以算出夹角大小，进而算出切线长度
    const tempTangent = viewDistance / ((czmViewer.flyToBoundingSize ?? 256) * .5 / (czmViewer.viewer.canvas.width / 2) * Math.tan(Cesium.Math.toRadians(czmViewer.fov / 2)));//TODO:sceneCameraFrustumFov改为fov
    // 勾股定理求视距
    return Math.sqrt(viewDistance * viewDistance + tempTangent * tempTangent)
}

function getFlyToCenterAndRotation(targetPoint: [number, number, number], targetRotation: [number, number, number], viewDistance: number) {
    // 获取局部坐标点
    const localPosition = new Cesium.Cartesian3(
        -viewDistance * Math.cos(Cesium.Math.toRadians(targetRotation[1])) * Math.cos(Cesium.Math.toRadians(targetRotation[0] - 90)),
        viewDistance * Math.cos(Cesium.Math.toRadians(targetRotation[1])) * Math.sin(Cesium.Math.toRadians(targetRotation[0] - 90)),
        -viewDistance * Math.sin(Cesium.Math.toRadians(targetRotation[1]))
    );
    // 获取局部坐标矩阵
    const localMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(...targetPoint));
    // 本地坐标转世界坐标
    let worldPoint = Cesium.Matrix4.multiplyByPoint(localMatrix, localPosition, new Cesium.Cartesian3())

    const targetPointCar3 = Cesium.Cartesian3.fromDegrees(...targetPoint);

    //向量
    const normal = Cesium.Cartesian3.subtract(
        targetPointCar3,
        worldPoint,
        new Cesium.Cartesian3()
    );
    //归一化
    Cesium.Cartesian3.normalize(normal, normal);
    //旋转矩阵 rotationMatrixFromPositionVelocity源码中有，并未出现在cesiumAPI中
    const rotationMatrix3 = Cesium.Transforms.rotationMatrixFromPositionVelocity(
        worldPoint,
        normal,
        Cesium.Ellipsoid.WGS84
    );
    const modelMatrix4 = Cesium.Matrix4.fromRotationTranslation(
        rotationMatrix3,
        worldPoint
    );
    var m1 = Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Matrix4.getTranslation(modelMatrix4, new Cesium.Cartesian3()),
        Cesium.Ellipsoid.WGS84,
        new Cesium.Matrix4()
    );
    // 矩阵相除
    var m3 = Cesium.Matrix4.multiply(
        Cesium.Matrix4.inverse(m1, new Cesium.Matrix4()),
        modelMatrix4,
        new Cesium.Matrix4()
    );
    // 得到旋转矩阵
    var mat3 = Cesium.Matrix4.getMatrix3(m3, new Cesium.Matrix3());
    // 计算四元数
    var q = Cesium.Quaternion.fromRotationMatrix(mat3);
    // 计算旋转角(弧度)
    var hpr = Cesium.HeadingPitchRoll.fromQuaternion(q);
    const flyPosition = Cesium.Cartographic.fromCartesian(worldPoint)
    return {
        position: [
            Cesium.Math.toDegrees(flyPosition.longitude),
            Cesium.Math.toDegrees(flyPosition.latitude),
            flyPosition.height
        ] as [number, number, number],
        rotation: [
            Cesium.Math.toDegrees(hpr.heading) + 90,
            Cesium.Math.toDegrees(hpr.pitch),
            Cesium.Math.toDegrees(hpr.roll)
        ] as [number, number, number]
    }
}
