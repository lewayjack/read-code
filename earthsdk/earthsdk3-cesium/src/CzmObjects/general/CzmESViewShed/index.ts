import { ESJVector3D, ESViewShed } from "earthsdk3";
import { CzmESObjectWithLocation, RayEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, flyWithPosition, positionToCartesian } from "../../../utils";
import { createNextAnimateFrameEvent, reactArray, reactArrayWithUndefined, Vector } from "xbsj-base";
import { XbsjViewshed } from "./XbsjViewshed";
import * as Cesium from 'cesium';

export class CzmESViewShed extends CzmESObjectWithLocation<ESViewShed> {
    static readonly type = this.register("ESCesiumViewer", ESViewShed.type, this);

    private _czmViewShed;
    get czmViewShed() { return this._czmViewShed; }

    private _rayEditing;
    get rayEditing() { return this._rayEditing; }

    private _innerPositionReact = this.disposeVar(reactArrayWithUndefined<ESJVector3D>(undefined));
    private _innerRotationReact = this.disposeVar(reactArray<ESJVector3D>([0, 0, 0]));

    constructor(sceneObject: ESViewShed, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this._czmViewShed = this.disposeVar(new XbsjViewshed(viewer.scene));
        const czmViewShed = this._czmViewShed;
        //@ts-ignore
        czmViewShed.ESSceneObjectID = sceneObject.id;
        viewer.scene.primitives.add(czmViewShed);
        this.dispose(() => viewer.scene.primitives.remove(czmViewShed));
        {
            this.sPrsEditing && (this.sPrsEditing.enabled = false); // 禁用基类中的编辑
            //启用自定义编辑
            this._rayEditing = this.disposeVar(new RayEditing(this._innerPositionReact, this._innerRotationReact, [this.sceneObject, 'far'], [this.sceneObject, 'editing'], czmViewer));
            // 互相监听，RayEditing输入的位置是undefinded就会开启双点
            const updated = () => {
                if (Vector.equals(sceneObject.position, [0, 0, 0])) {
                    this._innerPositionReact.value = undefined;
                } else {
                    this._innerPositionReact.value = sceneObject.position;
                }
            }
            updated();
            this.dispose(this.sceneObject.positionChanged.disposableOn(updated));
        }
        {
            const updated = () => {
                if (this._innerPositionReact.value == undefined) {
                    sceneObject.position = [0, 0, 0];
                }
                else {
                    sceneObject.position = this._innerPositionReact.value;
                }
            }
            this.dispose(this._innerPositionReact.changed.disposableOn(updated));
        }
        {
            // @ts-ignore
            this.dispose(bindNorthRotation(this._innerRotationReact, [sceneObject, 'rotation']));
        }

        {
            const update = () => {
                if (sceneObject.aspectRatio <= 0 || sceneObject.fov <= 0 || sceneObject.fov >= 180) return;
                czmViewShed.fovH = Cesium.Math.toRadians(sceneObject.fov ?? ESViewShed.defaults.fov);
                if (sceneObject.fov != 0 && sceneObject.aspectRatio != 0) {
                    czmViewShed.fovV = Cesium.Math.toRadians(sceneObject.fov / sceneObject.aspectRatio);
                }
            }
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.fovChanged,
                sceneObject.aspectRatioChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }

        {
            const update = () => {
                czmViewShed.enabled = !!sceneObject.position && sceneObject.show;
                if (czmViewShed.position) {
                    czmViewShed.position = positionToCartesian(sceneObject.position);
                }
            };
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.positionChanged,
                sceneObject.showChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }
        {
            const update = () => {
                czmViewShed.heading = Cesium.Math.toRadians(sceneObject.rotation[0] + 90);
                czmViewShed.pitch = Cesium.Math.toRadians(sceneObject.rotation[1]);
                czmViewShed.roll = Cesium.Math.toRadians(sceneObject.rotation[2]);
            }
            update();
            this.ad(sceneObject.rotationChanged.don(update));
        }
        {
            const update = () => {
                czmViewShed.showHelper = sceneObject.showFrustum ?? ESViewShed.defaults.showFrustum;
            }
            update();
            this.ad(sceneObject.showFrustumChanged.don(update));
        }
        {
            const update = () => {
                if (sceneObject.far < sceneObject.near) {
                    sceneObject.far = sceneObject.near;
                    return
                };
                czmViewShed.far = sceneObject.far;
            }
            update();
            this.ad(sceneObject.farChanged.don(update));
        }
        {
            const update = () => {
                if (sceneObject.near > sceneObject.far || sceneObject.near <= 0) return;
                czmViewShed.near = sceneObject.near;
            }
            update();
            this.ad(sceneObject.nearChanged.don(update));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            const viewDistance = (sceneObject.far ?? ESViewShed.defaults.far);
            if (sceneObject.position) {
                flyWithPosition(czmViewer, sceneObject, id, sceneObject.position, viewDistance, duration);
                return true;
            }
            return false;
        }
    }
}
