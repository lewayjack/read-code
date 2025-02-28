import { CzmModelPrimitive, CzmPoint, CzmView, GeoAxis } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { getCameraTargetPos } from "../../../../utils";
import { createNextAnimateFrameEvent, Destroyable } from "xbsj-base";
import * as Cesium from 'cesium';

export class CzmCameraHelper extends Destroyable {
    private _model;
    get model() { return this._model; }

    private _geoPoint;
    get geoPoint() { return this._geoPoint; }

    private _geoAxis;
    get geoAxis() { return this._geoAxis; }

    constructor(sceneObject: CzmView, czmViewer: ESCesiumViewer) {
        super();

        this._model = this.disposeVar(new CzmModelPrimitive(czmViewer, sceneObject.id));
        this._geoPoint = this.disposeVar(new CzmPoint(czmViewer, sceneObject.id));
        this._geoAxis = this.disposeVar(new GeoAxis(czmViewer, sceneObject.id));
        {
            this._model.url = '${earthsdk3-assets-script-dir}/assets/glb/camera1/camera1.gltf';
            this._model.localRotation = [90, 0, 0];
            this._model.allowPicking = false;
            this._model.pixelSize = 30;
            {
                const update = () => {
                    if (!sceneObject.position) return;
                    this._model.position = getCameraTargetPos(sceneObject.position, sceneObject.rotation ?? [0, 0, 0], (sceneObject.viewDistance ?? 0));
                    this._model.rotation = sceneObject.rotation ?? [0, 0, 0];
                };
                update();
                const event = this.disposeVar(createNextAnimateFrameEvent(sceneObject.positionChanged, sceneObject.rotationChanged, sceneObject.viewDistanceChanged));
                this.dispose(event.disposableOn(update));
            }
            {
                // 相机靠得太近就不显示！
                const update = () => {
                    const cameraInfo = czmViewer.getCameraInfo()
                    if (!cameraInfo) return;
                    const cp = cameraInfo.position;
                    const sp = this._model.position;
                    if (!sp) return;

                    const spc = Cesium.Cartesian3.fromDegrees(sp[0], sp[1], sp[2]);
                    const cpc = Cesium.Cartesian3.fromDegrees(cp[0], cp[1], cp[2]);
                    const d2 = Cesium.Cartesian3.distanceSquared(spc, cpc);
                    this._model.show = d2 > 1;
                }
                update();
                const event = this.disposeVar(createNextAnimateFrameEvent(czmViewer.cameraChanged, this._model.positionChanged));
                this.dispose(event.disposableOn(update));
            }
        }
        {
            this._geoAxis.width = 6;
            this._geoAxis.color = [1, 1, 0, 0.7];
            {
                const update = () => {
                    if (!sceneObject.position) return;
                    if (!this.model.position) return;
                    this._geoAxis.startPosition = this.model.position;
                    this._geoAxis.stopPosition = sceneObject.position;
                };
                update();
                const event = this.disposeVar(createNextAnimateFrameEvent(sceneObject.positionChanged, this._model.positionChanged));
                this.dispose(event.disposableOn(update));
            }
        }
    }
}
