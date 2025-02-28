import { extendClassProps, PartialWithUndefinedReactivePropsToNativeProps, react, ReactivePropsToNativePropsAndChanged } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { StringProperty, ESJResource, GroupProperty, NumberProperty } from "@sdkSrc/ESJTypes";
// import { ESJResource, GroupProperty, NumberProperty, StringProperty } from "earthsdk3";

export class ESGaussianSplatting extends ESObjectWithLocation {
    static readonly type = this.register('ESGaussianSplatting', this, { chsName: '高斯溅射模型', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: '用于加载高斯溅射模型的ES对象' });
    get typeName() { return 'ESGaussianSplatting'; }
    override get defaultProps() { return ESGaussianSplatting.createDefaultProps(); }
    static override defaults = {
        ...ESObjectWithLocation.defaults,
    }
    // 加载进度
    private _progress = this.disposeVar(react<number>(0));
    get progress() { return this._progress.value; }
    set progress(value: number) { this._progress.value = value; }
    get progressChanged() { return this._progress.changed; }
    constructor() {
        super();
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new StringProperty('路径', 'url', true, false, [this, 'url']),
                new NumberProperty('进度', 'progress', false, false, [this, 'progress'], 0),]
        }
    }
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new StringProperty('路径', 'url', true, false, [this, 'url']),
                new NumberProperty('进度', 'progress', false, false, [this, 'progress'], 0),
            ])
        ];
    }
}
export namespace ESGaussianSplatting {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        url: '' as string | ESJResource,
    })
}
extendClassProps(ESGaussianSplatting.prototype, ESGaussianSplatting.createDefaultProps);
export interface ESGaussianSplatting extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESGaussianSplatting.createDefaultProps>> { }
type JsonType = PartialWithUndefinedReactivePropsToNativeProps<ReturnType<typeof ESGaussianSplatting.createDefaultProps> & { type: string }>;
