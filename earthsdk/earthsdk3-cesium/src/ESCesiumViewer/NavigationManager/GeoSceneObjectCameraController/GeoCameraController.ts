import * as Cesium from 'cesium';
import { ESJVector3D } from "earthsdk3";
import { Destroyable, Event, UniteChanged, Vector, extendClassProps, reactArray, reactArrayWithUndefined } from "xbsj-base";
import { czmFlyTo, getCameraRotation, positionToCartesian } from "../../../utils";
import { ESCesiumViewer } from "../../index";

class CameraListening extends Destroyable {
    constructor(geoCameraController: GeoCameraController, czmViewer: ESCesiumViewer) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) throw new Error('viewer is undefined');

        let cameraUpdate = true;
        this.d(geoCameraController.positionChanged.don(() => cameraUpdate = true));
        this.d(geoCameraController.rotationChanged.don(() => cameraUpdate = true));
        this.d(geoCameraController.offsetHeightChanged.don(() => cameraUpdate = true));
        this.d(geoCameraController.viewDistanceChanged.don(() => cameraUpdate = true));
        this.d(geoCameraController.offsetRotationChanged.don(() => cameraUpdate = true));
        this.d(geoCameraController.relativeRotationChanged.don(() => cameraUpdate = true));

        const finalRotation: ESJVector3D = [0, 0, 0];
        const finalPosition: ESJVector3D = [0, 0, 0];
        // const initialRotation = [viewer.camera.heading, viewer.camera.pitch, viewer.camera.roll].map(Cesium.Math.toDegrees) as ESJVector3D;
        // 相机的修改必须在preUpdate之前就要定下来，这样preUpdate中的模型位置调整才合适
        this.d(viewer.clock.onTick.addEventListener(() => {
            if (!cameraUpdate) return;
            cameraUpdate = false;

            if (!geoCameraController.position) {
                console.warn(`相机控制器未能设置位置，无法启用！`);
                return;
            }

            if (geoCameraController.viewDistance === undefined) {
                console.warn(`相机控制器未能设置视距，将自动设置视距！`);
                const c0 = positionToCartesian(geoCameraController.position);
                const c1 = viewer.camera.positionWC;
                const d = Cesium.Cartesian3.distance(c0, c1);
                geoCameraController.viewDistance = d;
            }

            Vector.clone(geoCameraController.position, finalPosition);
            geoCameraController.offsetHeight && (finalPosition[2] += geoCameraController.offsetHeight);
            const { rotation, offsetRotation = GeoCameraController.defaults.offsetRotation } = geoCameraController;
            Vector.set(finalRotation, 0, 0, 0);
            if (rotation && (geoCameraController.relativeRotation ?? GeoCameraController.defaults.relativeRotation)) {
                Vector.add(rotation, finalRotation, finalRotation);
            }
            Vector.add(offsetRotation, finalRotation, finalRotation);
            const opt = {
                "distance": geoCameraController.viewDistance,
                "heading": finalRotation[0],
                "pitch": finalRotation[1],
                "flyDuration": 0,
                "hDelta": 0,
                "pDelta": 0
            }
            czmViewer.flyTo(opt, finalPosition);
        }));

        czmViewer.incrementDisabledInputStack();
        this.d(() => {
            czmViewer.decrementDisabledInputStack();
        });

        this.d(czmViewer.pointerMoveEvent.don(event => {
            const pointerEvent = event?.pointerEvent;
            if (!pointerEvent) return;
            if (!(geoCameraController.enabledRotationInput)) return;
            if (pointerEvent.buttons === 1 || pointerEvent.buttons === 2) {
                const { movementX, movementY } = pointerEvent;
                geoCameraController.offsetRotation = Vector.add<ESJVector3D>(geoCameraController.offsetRotation ?? GeoCameraController.defaults.offsetRotation, [movementX * .2, movementY * -.2, 0]);
            }
        }));

        this.d(czmViewer.wheelEvent.don(wheeleEvent => {
            if (!(geoCameraController.enabledScaleInput)) return;
            const delta = wheeleEvent.deltaY;
            const base = Math.max(1, geoCameraController.viewDistance);
            const offsetViewDistance = base * (delta * .001);
            geoCameraController.viewDistance = (geoCameraController.viewDistance) + offsetViewDistance;
        }));
    }
}

export class GeoCameraController extends Destroyable {
    private _resetWithCameraEvent = this.dv(new Event<[viewerTags: string[] | undefined]>());
    get resetWithCameraEvent() { return this._resetWithCameraEvent; }
    resetWithCamera(viewerTags?: string[]) { this._resetWithCameraEvent.emit(viewerTags); }

    static defaults = {
        position: [116.39, 39.9, 0] as ESJVector3D,
        rotation: [0, 0, 0] as ESJVector3D,
        offsetRotation: [0, -60, 0] as ESJVector3D,
        relativeRotation: true,
    };
    // private _sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'positionEditing'], this.components));
    // get sPositionEditing() { return this._sPositionEditing; }

    constructor(czmViewer: ESCesiumViewer) {
        super();

        const viewer = czmViewer.viewer;
        if (!viewer) throw new Error('viewer is undefined');

        const sceneObject = this;
        let cameraListening: CameraListening | undefined;

        const resetCameraListening = () => {
            if (cameraListening) {
                cameraListening.destroy();
                cameraListening = undefined;
            }
        };
        this.d(resetCameraListening);

        const updateEnabled = () => {
            resetCameraListening();
            if (sceneObject.enabled) {
                cameraListening = new CameraListening(sceneObject, czmViewer);
            }
        };
        updateEnabled();
        this.d(sceneObject.enabledChanged.don(updateEnabled));

        this.d(sceneObject.resetWithCameraEvent.don((viewerTags) => {
            if (!czmViewer.actived) return;
            //viewerTags没使用
            const cameraRotation = getCameraRotation(viewer.camera);
            if (!cameraRotation) return;

            const rotation = sceneObject.rotation as ESJVector3D;
            // sceneObject.rotation = [0, 0, 0];
            sceneObject.offsetRotation = [
                (cameraRotation[0] - (sceneObject.relativeRotation ? rotation[0] : 0)),
                (cameraRotation[1] - (sceneObject.relativeRotation ? rotation[1] : 0)),
                (cameraRotation[2] - (sceneObject.relativeRotation ? rotation[2] : 0)),
            ];
        }));
    }
}

export namespace GeoCameraController {
    export const createDefaultProps = () => ({
        enabled: false,
        showTarget: false,
        position: reactArrayWithUndefined<ESJVector3D>(undefined),
        rotation: reactArrayWithUndefined<ESJVector3D>(undefined),
        positionEditing: false,
        rotationEditing: false,
        viewDistance: 1000,
        offsetHeight: 0,
        offsetRotation: reactArray<ESJVector3D>([0, -60, 0]),
        enabledRotationInput: true,
        enabledScaleInput: true,
        relativeRotation: true,
    });
}
extendClassProps(GeoCameraController.prototype, GeoCameraController.createDefaultProps);
export interface GeoCameraController extends UniteChanged<ReturnType<typeof GeoCameraController.createDefaultProps>> { }
