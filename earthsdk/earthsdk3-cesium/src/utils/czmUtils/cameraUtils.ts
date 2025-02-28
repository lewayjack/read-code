import * as Cesium from 'cesium';
import { getPositionOffset } from './getPositionOffset';
import { Destroyable, Event } from 'xbsj-base';
/**
 * 获取相机偏移后的位置
 * @param position 
 * @param rotation 
 * @param viewDistance 
 * @param result 
 * @returns 
 */
export function getCameraTargetPos(
    position: [number, number, number],
    rotation: [number, number, number],
    viewDistance: number,
    result?: [number, number, number],
) {
    return getPositionOffset(position, rotation, viewDistance, result);
}
const td = Cesium.Math.toDegrees;
/**
 * 获取相机位置
 * @param camera 
 * @param result 
 * @returns 
 */
export function getCameraPosition(camera: Cesium.Camera, result?: [number, number, number]): [number, number, number] {
    const { longitude, latitude, height } = camera.positionCartographic;
    if (!result) {
        return [td(longitude), td(latitude), height];
    }
    result[0] = td(longitude);
    result[1] = td(latitude);
    result[2] = height;
    return result;
}
/**
 * 获取相机旋转
 * @param camera 
 * @param result 
 * @returns 
 */
export function getCameraRotation(camera: Cesium.Camera, result?: [number, number, number]): [number, number, number] {
    const { heading, pitch, roll } = camera;
    if (!result) {
        return [heading, pitch, roll].map(td) as [number, number, number];
    }
    result[0] = td(heading);
    result[1] = td(pitch);
    result[2] = td(roll);
    return result;
}

export class CzmCameraChanged extends Destroyable {
    _originViewMatrix: Cesium.Matrix4 = new Cesium.Matrix4();
    _originProjMatrix: Cesium.Matrix4 = new Cesium.Matrix4();
    _changed: Event = new Event();
    constructor(private _scene: Cesium.Scene) {
        super();
        const camera = this._scene.camera;
        Cesium.Matrix4.clone(camera.viewMatrix, this._originViewMatrix);
        Cesium.Matrix4.clone(camera.frustum.projectionMatrix, this._originViewMatrix);

        this.dispose(this._scene.preUpdate.addEventListener(() => {
            this._update();
        }));
    }

    _update() {
        if (!Cesium.Matrix4.equals(this._scene.camera.viewMatrix, this._originViewMatrix)) {
            Cesium.Matrix4.clone(this._scene.camera.viewMatrix, this._originViewMatrix);
            this._changed.emit();
        }

        if (!Cesium.Matrix4.equals(this._scene.camera.frustum.projectionMatrix, this._originProjMatrix)) {
            Cesium.Matrix4.clone(this._scene.camera.frustum.projectionMatrix, this._originProjMatrix);
            this._changed.emit();
        }
    }

    get changed() {
        return this._changed;
    }
}