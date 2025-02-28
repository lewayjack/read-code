import { ESVideoFusion } from "earthsdk3";
import { CzmESObjectWithLocation, CzmTexture } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, flyWithPosition } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track, Vector } from "xbsj-base";
import { CzmCameraVideo } from "./CzmESVideoFusionImpl";

// this.d是this.dispose简写，this.dv是this.disposeVar简写
export class CzmESVideoFusion extends CzmESObjectWithLocation<ESVideoFusion> {
    static readonly type = this.register("ESCesiumViewer", ESVideoFusion.type, this);

    // 创建视频融合
    private _czmCameraVideo;
    get czmCameraVideo() { return this._czmCameraVideo; }

    // 创建czm材质纹理
    private _czmTexture;
    get czmTexture() {
        return this._czmTexture;
    }

    constructor(sceneObject: ESVideoFusion, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmCameraVideo = this.dv(new CzmCameraVideo(czmViewer, sceneObject.id));
        this._czmTexture = this.dv(new CzmTexture(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn('viewer is undefined!');
            return;
        }
        // 添加到场景
        const { czmCameraVideo } = this;

        const { czmTexture } = this;
        czmCameraVideo.czmTextureId = czmTexture.id;

        // 绑定参数
        this.d(track([czmCameraVideo, 'show'], [sceneObject, 'show']));
        this.d(bindNorthRotation([czmCameraVideo, 'rotation'], [sceneObject, 'rotation']));
        {
            this.sPrsEditing.enabled = false; // 禁用基类中的编辑
            this.d(bind([czmCameraVideo, 'editing'], [sceneObject, 'editing']));
        }
        // this.d(track([czmCameraVideo, 'czmTextureUri'], [sceneObject, 'videoStreamUrl']));
        this.d(track([czmCameraVideo, 'showHelperPrimitive'], [sceneObject, 'showFrustum']));
        this.d(track([czmTexture, 'uriType'], [sceneObject, 'videoStreamType']));
        {
            const update = () => {
                if (sceneObject.aspectRatio <= 0 || sceneObject.fov <= 0 || sceneObject.fov >= 180) return;
                czmCameraVideo.fovx = sceneObject.fov ?? ESVideoFusion.defaults.fov;
                czmCameraVideo.aspectRatio = sceneObject.aspectRatio ?? ESVideoFusion.defaults.aspectRatio;
            }
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.fovChanged,
                sceneObject.aspectRatioChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }
        {
            this.d(bind([sceneObject, 'far'], [czmCameraVideo, 'far']));
            const update = () => {
                if (sceneObject.far < sceneObject.near) {
                    sceneObject.far = sceneObject.near;
                    return
                };
                czmCameraVideo.far = sceneObject.far;
            }
            update();
            this.ad(sceneObject.farChanged.don(update));
        }
        {
            const update = () => {
                if (sceneObject.near > sceneObject.far || sceneObject.near <= 0) return;
                czmCameraVideo.near = sceneObject.near;
            }
            update();
            this.ad(sceneObject.nearChanged.don(update));
        }
        // 更改宽高比后需要修正横轴角度
        this.dispose(sceneObject.aspectRatioChanged.disposableOn(() => {
            czmCameraVideo.fovx = sceneObject.fov;
        }))
        // 为了使双点编辑生效，需要监听sceneObject和czmCustomPrimitive的position,
        // 如果是在[0,0,0]点的话，就把czm对象位置设置为undefined,就能双点编辑了
        {
            const updated = () => {
                if (Vector.equals(sceneObject.position, [0, 0, 0])) {
                    czmCameraVideo.position = undefined;
                } else {
                    czmCameraVideo.position = sceneObject.position;
                }
            }
            updated();
            this.dispose(this.sceneObject.positionChanged.disposableOn(updated));
        }
        {
            const updated = () => {
                if (czmCameraVideo.position == undefined) {
                    sceneObject.position = [0, 0, 0];
                }
                else {
                    sceneObject.position = czmCameraVideo.position;
                }
            }
            this.dispose(czmCameraVideo.positionChanged.disposableOn(updated));
        }
        // 更改宽高比后需要修正横轴角度
        // this.dispose(sceneObject.aspectRatioChanged.disposableOn(() => {
        //     czmCameraVideo.fov = sceneObject.fov;
        // }))
        {
            const updated = () => {
                if (sceneObject.videoStreamUrl) {
                    czmTexture.uri = typeof sceneObject.videoStreamUrl == 'string' ? sceneObject.videoStreamUrl : sceneObject.videoStreamUrl.url;
                }
            }
            updated()
            this.d(sceneObject.videoStreamUrlChanged.disposableOn(updated))
        }
        {
            const updated = () => {
                czmTexture.loop = sceneObject.looping;
            }
            updated()
            this.d(sceneObject.loopingChanged.don(updated))
        }
        // 重置视角
        this.d(sceneObject.resetWithCameraInfoEvent.disposableOn(() => {
            czmCameraVideo.resetWithCameraInfo();
        }))
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            const viewDistance = (sceneObject.far ?? ESVideoFusion.defaults.far);
            if (sceneObject.position) {
                flyWithPosition(czmViewer, sceneObject, id, sceneObject.position, viewDistance, duration);
                return true;
            }
            return false;
        }
    }
}
