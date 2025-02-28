import { PickedInfo } from "earthsdk3";
import { CzmTexture, RayEditing } from "../../../../CzmObjects";
import { createGuid, createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, ObjResettingWithEvent, react, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { ESCesiumViewer } from "./../../../../ESCesiumViewer";
import { flyTo } from "../../../../utils";
import { XbsjCameraVideo } from "../XbsjCameraVideo";

export class CzmCameraVideo extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _resetWithCameraInfoEvent = this.disposeVar(new Event());
    get resetWithCameraInfoEvent() { return this._resetWithCameraInfoEvent; }
    resetWithCameraInfo() { this._resetWithCameraInfoEvent.emit(); }

    static defaults = {
        // 属性的类型若存在undefined的情况，这里配置为undefined时应该使用的默认值
        position: [116.39, 39.9, 100] as [number, number, number],
        czmTextureId: '',
    };

    // 位置编辑
    // private _positionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'editing'], this.components));
    // get positionEditing() { return this._positionEditing; }
    private _rayEditing;
    get rayEditing() { return this._rayEditing; }

    private _sharedCzmTexture: CzmTexture | undefined;
    get sharedCzmTexture() { return this._sharedCzmTexture; }
    getCurrentCzmTexture() { return this._sharedCzmTexture; }

    private _fovy = this.disposeVar(react<number>(0));
    get fovy() { return this._fovy.value; }
    set fovy(value: number) { this._fovy.value = value; }
    get fovyChanged() { return this._fovy.changed; }
    private _fovyUpdate = (() => {
        const tr = Cesium.Math.toRadians;
        const td = Cesium.Math.toDegrees;
        {
            const update = () => {
                const fovy = td(this.aspectRatio <= 1 ? tr(this.fov) : Math.atan(Math.tan(tr(this.fov) * 0.5) / this.aspectRatio) * 2.0);
                if (Math.abs(fovy - this.fovy) < 0.00001) return;
                this.fovy = fovy;
            };
            update();
            this.dispose(this.fovChanged.disposableOn(update));
            this.dispose(this.aspectRatioChanged.disposableOn(update));
        }

        {
            const update = () => {
                const fov = td(this.aspectRatio <= 1 ? tr(this.fovy) : Math.atan(Math.tan(tr(this.fovy) * 0.5) * this.aspectRatio) * 2.0);
                if (Math.abs(fov - this.fov) < 0.00001) return;
                this.fov = fov;
            };
            update();
            this.dispose(this.fovyChanged.disposableOn(update));
        }
    })();

    private _fovx = this.disposeVar(react<number>(0));
    get fovx() { return this._fovx.value; }
    set fovx(value: number) { this._fovx.value = value; }
    get fovxChanged() { return this._fovx.changed; }
    private _fovxUpdate = (() => {
        const tr = Cesium.Math.toRadians;
        const td = Cesium.Math.toDegrees;
        {
            const update = () => {
                const fovx = td(this.aspectRatio > 1 ? tr(this.fov) : Math.atan(Math.tan(tr(this.fov) * 0.5) * this.aspectRatio) * 2.0);
                if (Math.abs(fovx - this.fovx) < 0.00001) return;
                this.fovx = fovx;
            };
            update();
            this.dispose(this.fovChanged.disposableOn(update));
            this.dispose(this.aspectRatioChanged.disposableOn(update));
        }

        {
            const update = () => {
                const fov = td(this.aspectRatio > 1 ? tr(this.fovx) : Math.atan(Math.tan(tr(this.fovx) * 0.5) / this.aspectRatio) * 2.0);
                if (Math.abs(fov - this.fov) < 0.00001) return;
                this.fov = fov;
            };
            update();
            this.dispose(this.fovxChanged.disposableOn(update));
        }
    })();

    private _xbsjCameraVideoResettingEvent;
    private _xbsjCameraVideoResetting;
    get xbsjCameraVideoResetting() { return this._xbsjCameraVideoResetting; }

    get xbsjCameraVideoChanged() { return this._xbsjCameraVideoResetting.objChanged; }
    get xbsjCameraVideo() { return this._xbsjCameraVideoResetting.obj?.xbsjCameraVideo; }

    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }
    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        this._rayEditing = this.disposeVar(new RayEditing(this.positionReact, this.rotationReact, this.farReact, [this, 'editing'], czmViewer));
        {
            const update = () => {
                //@ts-ignore
                this.czmTextureId && (this._sharedCzmTexture = window.czmTexture[this.czmTextureId]);
            }
            update();
            this.ad(this.czmTextureIdChanged.don(update));
        }
        {
            this._xbsjCameraVideoResettingEvent = this.disposeVar(createNextAnimateFrameEvent(
                this.showChanged,
                this.positionChanged,
                this.rotationChanged,
                this.fovChanged,
                this.aspectRatioChanged,
                this.nearChanged,
                this.farChanged,
            ));
            this._xbsjCameraVideoResetting = this.disposeVar(new ObjResettingWithEvent<XbsjCameraVideoResetting>(this._xbsjCameraVideoResettingEvent, () => {
                if (!this.show || !this.position) {
                    return undefined;
                }
                return new XbsjCameraVideoResetting(this, czmViewer);
            }));
        }

        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        this.dispose(this.resetWithCameraInfoEvent.disposableOn(() => {
            if (!czmViewer.actived) {
                return;
            }

            const result = czmViewer.getCameraInfo();
            if (!result) return;
            this.position = result.position;
            this.rotation = result.rotation;
        }));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) return;
            if (!this.position) {
                console.warn(`CzmCameraVideo无法飞入，因为没有位置：!sceneObject.position`);
                return;
            }
            flyTo(czmViewer.viewer, this.position, 0, this.rotation, duration);
        }));
    }
}

export namespace CzmCameraVideo {
    export const createDefaultProps = () => ({
        // 属性配置
        show: true,
        editing: false,
        position: reactArrayWithUndefined<[number, number, number]>(undefined),
        rotation: reactArray<[number, number, number]>([0, 0, 0]),
        fov: 30,
        aspectRatio: 1.333,
        near: 3,
        far: 100,
        showHelperPrimitive: true,
        czmTextureId: undefined as string | undefined,
    });
}
extendClassProps(CzmCameraVideo.prototype, CzmCameraVideo.createDefaultProps);
export interface CzmCameraVideo extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmCameraVideo.createDefaultProps>> { }

var scratchSetViewMatrix3 = new Cesium.Matrix3();
function hpr2m(options: { position: Cesium.Cartesian3, heading: number, pitch: number, roll: number }, result?: Cesium.Matrix4) {
    const { position, heading, pitch, roll } = options;
    // const inverseViewMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, headingPitchRoll, undefined, undefined, result);
    const inverseViewMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, result);
    // const hpr = new Cesium.HeadingPitchRoll(heading - Cesium.Math.PI_OVER_TWO, pitch, roll);
    // var rotQuat = Cesium.Quaternion.fromHeadingPitchRoll(hpr, scratchSetViewQuaternion);
    // var rotMat = Cesium.Matrix3.fromQuaternion(rotQuat, scratchSetViewMatrix3);
    var rotMat = Cesium.Matrix3.fromRotationX(Cesium.Math.PI_OVER_TWO, scratchSetViewMatrix3);
    Cesium.Matrix4.multiplyByMatrix3(inverseViewMatrix, rotMat, inverseViewMatrix);

    rotMat = Cesium.Matrix3.fromRotationY(-heading, scratchSetViewMatrix3);
    Cesium.Matrix4.multiplyByMatrix3(inverseViewMatrix, rotMat, inverseViewMatrix);

    rotMat = Cesium.Matrix3.fromRotationX(pitch, scratchSetViewMatrix3);
    Cesium.Matrix4.multiplyByMatrix3(inverseViewMatrix, rotMat, inverseViewMatrix);

    rotMat = Cesium.Matrix3.fromRotationZ(-roll, scratchSetViewMatrix3);
    Cesium.Matrix4.multiplyByMatrix3(inverseViewMatrix, rotMat, inverseViewMatrix);

    return inverseViewMatrix;
}

class XbsjCameraVideoResetting extends Destroyable {
    private _xbsjCameraVideo: XbsjCameraVideo;
    get xbsjCameraVideo() { return this._xbsjCameraVideo; }

    constructor(czmCameraVideo: CzmCameraVideo, czmViewer: ESCesiumViewer) {
        super();
        const { viewer } = czmViewer;
        if (!viewer) {
            throw new Error(`XbsjCameraVideoResetting error: !viewer`);
        }

        const { position } = czmCameraVideo;
        if (!position) {
            throw new Error(`XbsjCameraVideoResetting error: !position`);
        }
        const { rotation: [h, p, r] } = czmCameraVideo;
        const tr = Cesium.Math.toRadians;
        const cartesian = Cesium.Cartesian3.fromDegrees(...position);
        const inverseViewMatrix = hpr2m({
            position: cartesian,
            heading: tr(h),
            pitch: tr(p),
            roll: tr(r),
        });

        const { fov, aspectRatio, near, far } = czmCameraVideo;
        const frustum = new Cesium.PerspectiveFrustum({ fov: tr(fov), aspectRatio, near, far });

        // const videoElement: HTMLVideoElement | undefined = czmCzmCameraVideo.videoResetting.obj?.videoElement;

        // 2.2.2.4 根据以上信息创建cameraVideo
        const cameraVideo = new XbsjCameraVideo({
            inverseViewMatrix: inverseViewMatrix,
            frustum: frustum,
            // videoElement: videoElement,
            showHelperPrimitive: true,
        });
        this._xbsjCameraVideo = cameraVideo;
        this.dispose(() => cameraVideo.destroy());
        //@ts-ignore
        cameraVideo.ESSceneObjectID = czmCameraVideo.id;
        viewer.scene.primitives.add(cameraVideo);
        this.dispose(() => viewer.scene.primitives.remove(cameraVideo));


        {
            const getVideoTexture = () => {
                const czmTexture = czmCameraVideo.getCurrentCzmTexture();
                if (!czmTexture) return undefined;
                if (!(czmTexture instanceof CzmTexture)) return undefined;
                // const czmCzmTexture = czmViewer.getCzmObject(czmTexture);
                // if (!czmCzmTexture) return undefined;
                // if (!(czmCzmTexture instanceof CzmCzmTexture)) return undefined;
                // if (!czmCzmTexture.texture) return undefined;
                return czmTexture.texture;
            };
            this.xbsjCameraVideo.videoTextureFunc = getVideoTexture;
        }

        {
            const update = () => {
                cameraVideo.showHelperPrimitive = czmCameraVideo.showHelperPrimitive;
            }
            update();
            this.dispose(czmCameraVideo.showHelperPrimitiveChanged.disposableOn(update));
        }
    }
}
