import * as Cesium from 'cesium';
import { FirstPersonController } from "../FirstPersonController";
import { MouseCameraController } from "./MouseCameraController";
import { Destroyable } from 'xbsj-base';

function controlCameraRotation(camera: Cesium.Camera, e: PointerEvent) {
    camera.lookRight(Cesium.Math.toRadians(e.movementX) * 0.1);
    camera.lookDown(Cesium.Math.toRadians(e.movementY) * 0.1);

    // TODO(vtxf) 这种方式无法限制角度，还得考虑别的办法
    const originPitch = camera.pitch;
    const cosntrainedPitch = Cesium.Math.clamp(originPitch, -Cesium.Math.PI_OVER_TWO, Cesium.Math.PI_OVER_TWO);

    if (cosntrainedPitch !== originPitch) {
        camera.setView({
            destination: camera.positionWC,
            orientation: {
                heading: camera.heading,
                pitch: cosntrainedPitch,
                roll: camera.roll,
            }
        });
    }
}

export class MouseMoving extends Destroyable {
    constructor(private _firstPersonController: FirstPersonController, private _mouseCameraController: MouseCameraController) {
        super();

        const { canvas } = this._firstPersonController.viewer;
        {
            const pointerMoveFunc = (e: PointerEvent) => {
                const { camera } = this._firstPersonController.viewer.scene;
                controlCameraRotation(camera, e);
            };
            canvas.addEventListener('pointermove', pointerMoveFunc);
            this.dispose(() => canvas.removeEventListener('pointermove', pointerMoveFunc));
        }
    }
}
