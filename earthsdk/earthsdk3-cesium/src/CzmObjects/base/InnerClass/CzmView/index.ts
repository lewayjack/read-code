import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { flyTo, getCameraPosition, getCameraRotation } from "../../../../utils";
import { Destroyable, Listener, Event, reactArrayWithUndefined, reactArray, extendClassProps, ReactivePropsToNativePropsAndChanged, ObjResettingWithEvent, createProcessingFromAsyncFunc, SceneObjectKey, createGuid, react } from "xbsj-base";
import { CzmCameraHelper } from "./CzmCameraHelper";

export class CzmView extends Destroyable {
    static ResetFlag = {
        Position: 1,
        Rotation: 2,
        ViewDistance: 4,
    };

    private _captureEvent = this.disposeVar(new Event<[width?: number, height?: number]>());
    get captureEvent() { return this._captureEvent; }
    /**
    * 获取缩略图
    * @param x 缩略图的宽度
    * @param y 缩略图的高度
    */
    capture(width?: number, height?: number) { this._captureEvent.emit(width, height); }

    static defaults = {
        thumbnailWidth: 64,
        thumbnailHeight: 64,
        enabled: true,
        show: false,
        position: [116.39, 39.9, 100] as [number, number, number],
        duration: 1000,
        default: false,
        thumbnail: '',
    };

    private _id = this.disposeVar(react<string>(createGuid()));
    get id() { return this._id.value; }
    set id(value: string) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    constructor(private _czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        const viewer = _czmViewer.viewer;
        if (!viewer) return;

        this.disposeVar(new ObjResettingWithEvent(this.showChanged, () => {
            if ((this.show) && this.position) {
                return new CzmCameraHelper(this, _czmViewer);
            } else {
                return undefined;
            }
        }));
        if ((this.default)) {
            this.flyTo(undefined, false);
        }

        const processing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
            const {
                position,
                rotation,
                viewDistance,
                duration = 1000,
            } = this;
            if (position) {
                const flyToPromise = flyTo(viewer, position, viewDistance, rotation, duration, () => {
                    this.enabled = false;
                });
                if (flyToPromise) {
                    await cancelsManager.promise(flyToPromise);
                }
                this.enabled = false;
            }
        }));

        this.dispose(this.enabledChanged.disposableOn(() => {
            if (processing.isRunning) {
                processing.cancel();
            }
            if (this.enabled) {
                processing.restart();
            }
        }));

        const captureProcessing = this.disposeVar(createProcessingFromAsyncFunc<void, [width?: number, height?: number]>(async (cancelsManager, width, height) => {
            const promise = _czmViewer.capture(width, height);
            if (!promise) return;
            const thumbnail = await cancelsManager.promise(promise);
            thumbnail && (this.thumbnail = thumbnail);
        }));

        this.dispose(this.captureEvent.disposableOn((width, height) => {
            captureProcessing.restart(undefined, width ?? CzmView.defaults.thumbnailWidth, height ?? CzmView.defaults.thumbnailHeight);
        }));
    }
    /**
     * 
     * @param flag 1表示位置 2表示姿态 4表示视距 1|2|4表示全部
     * @returns 
     */
    resetWithCurrentCamera(flag: number) {
        const { _czmViewer } = this;
        if (!_czmViewer.actived) {
            return;
        }
        const { viewer } = this._czmViewer;
        if (!viewer) {
            return;
        }

        const view = this;
        if (flag & CzmView.ResetFlag.Position) {
            view.position = getCameraPosition(viewer.camera);
        }
        if (flag & CzmView.ResetFlag.Rotation) {
            view.rotation = getCameraRotation(viewer.camera);
        }
        if (flag & CzmView.ResetFlag.ViewDistance) {
            view.viewDistance = 0;
        }
    }
    /**
    * 飞入视角
    * @param duration 飞行时间
    */
    flyTo(duration?: number, onlyActived?: boolean) {
        if ((onlyActived ?? true) && !this._czmViewer.actived) {
            return;
        }

        const { _czmViewer: { viewer } } = this;
        const { position, rotation, viewDistance, duration: durationAlias } = this;
        if (!viewer || !position) {
            return;
        }
        flyTo(viewer, position, viewDistance, rotation, duration ?? durationAlias);
    }
}

export namespace CzmView {
    export const createDefaultProps = () => ({
        enabled: true,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单位
        positionEditing: false,
        show: false,
        rotation: reactArray<[number, number, number]>([0, 0, 0]), // 偏航俯仰翻转，度为单位
        viewDistance: 0,
        duration: undefined as number | undefined,
        default: false, // 是否为默认视角，默认为false, 加载后即执行飞入操作
        thumbnail: "", // TODO 展示图像的Property
        // cameraShow: undefined as boolean | undefined,
    });
}
extendClassProps(CzmView.prototype, CzmView.createDefaultProps);
export interface CzmView extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmView.createDefaultProps>> { }