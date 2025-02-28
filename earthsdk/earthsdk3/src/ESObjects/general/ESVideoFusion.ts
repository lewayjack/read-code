import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey, Event } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { BooleanProperty, EnumProperty, ESJResource, FunctionProperty, GroupProperty, JsonProperty, NumberProperty, StringProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/fpxkCB8cdbHSnuVBtsSREL
 */
export class ESVideoFusion extends ESObjectWithLocation {
    static readonly type = this.register('ESVideoFusion', this, { chsName: '视频融合', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "视频融合" });
    get typeName() { return 'ESVideoFusion'; }
    override get defaultProps() { return ESVideoFusion.createDefaultProps(); }

    private _resetWithCameraInfoEvent = this.dv(new Event());
    get resetWithCameraInfoEvent() { return this._resetWithCameraInfoEvent; }
    resetWithCameraInfo() { this._resetWithCameraInfoEvent.emit(); }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        fov: 90,
        aspectRatio: 1.77778,
        far: 100,
        near: 5,
        videoStreamUrl: "" as string | ESJResource,
        zIndex: 1,
        showFrustum: true,
        looping: true,
        videoStreamTypes: [['video', 'video'], ['hls', 'hls'], ['flv', 'flv'], ['img', 'img'], ['gif', 'gif']] as [name: string, value: string][],
    };
    constructor(id?: SceneObjectKey) {
        super(id);
        this.collision = false;
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new BooleanProperty('循环', 'looping', false, false, [this, 'looping'], ESVideoFusion.defaults.looping),
                new BooleanProperty('视椎体', 'showFrustum', false, false, [this, 'showFrustum'], ESVideoFusion.defaults.showFrustum),
                new NumberProperty('宽高比', 'aspectRatio', false, false, [this, 'aspectRatio'], ESVideoFusion.defaults.aspectRatio),
                new NumberProperty('横向夹角', 'fov', false, false, [this, 'fov'], ESVideoFusion.defaults.fov),
                new NumberProperty('视野长度', 'far', false, false, [this, 'far'], ESVideoFusion.defaults.far),
                new NumberProperty('近面距离', 'near', false, false, [this, 'near'], ESVideoFusion.defaults.near),
                new JsonProperty('视频路径', 'videoStreamUrl', false, false, [this, 'videoStreamUrl'], ESVideoFusion.defaults.videoStreamUrl),
                new NumberProperty('显示优先级', 'zIndex', false, false, [this, 'zIndex'], ESVideoFusion.defaults.zIndex),
                new EnumProperty('视频类型', '视频类型', false, false, [this, 'videoStreamType'], ESVideoFusion.defaults.videoStreamTypes, 'video'),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('横向夹角', 'fov', false, false, [this, 'fov']),
                new NumberProperty('宽高比', 'aspectRatio', false, false, [this, 'aspectRatio']),
                new NumberProperty('视野长度', 'far', false, false, [this, 'far']),
                new NumberProperty('近面距离', 'near', false, false, [this, 'near']),
                new JsonProperty('视频路径', 'videoStreamUrl', false, false, [this, 'videoStreamUrl']),
                new NumberProperty('显示优先级', 'zIndex', false, false, [this, 'zIndex']),
                new BooleanProperty('视椎体', 'showFrustum', false, false, [this, 'showFrustum']),
                new BooleanProperty('循环', 'looping', false, false, [this, 'looping']),
            ]),
            new GroupProperty('czm', 'czm', [
                new EnumProperty('视频类型', '视频类型', false, false, [this, 'videoStreamType'], ESVideoFusion.defaults.videoStreamTypes),
                new FunctionProperty('重置', '以当前相机状态', [], () => this.resetWithCameraInfo(), [])
            ])
        ];
    }
}

export namespace ESVideoFusion {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        fov: 90,
        aspectRatio: 1.77778,
        far: 100,
        near: 5,
        videoStreamUrl: "" as string | ESJResource,
        zIndex: 1,
        showFrustum: true,
        looping: true,
        videoStreamType: 'video',
    });
}
extendClassProps(ESVideoFusion.prototype, ESVideoFusion.createDefaultProps);
export interface ESVideoFusion extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESVideoFusion.createDefaultProps>> { }
