import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { BooleanProperty, EnumProperty, GroupProperty, NumberProperty } from "../../ESJTypes";

export type ESLocalSkyBoxUrlType = {
    hdr: string,
    positiveX: string,
    negativeX: string,
    positiveY: string,
    negativeY: string,
    positiveZ: string,
    negativeZ: string,
}

export class ESLocalSkyBox extends ESObjectWithLocation {
    static readonly type = this.register('ESLocalSkyBox', this, { chsName: '局部天空盒', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: '效果类' });
    get typeName() { return 'ESLocalSkyBox'; }
    override get defaultProps() { return ESLocalSkyBox.createDefaultProps(); }

    constructor(id?: SceneObjectKey) {
        super(id);
        this.collision = false;
        this.allowPicking = false;
    }
    // size:10000（米，设置球形天空盒直径和立方体天空盒长宽高），
    // autoFollow:false（自动跟随，天空盒是否与相机位置绑定，跟随相机位置移动）,
    // autoOpacityFactor:2（自动不透明度系数，渐变效果，根据天空盒位置和相机位置的距离与size*autoOpacity比值控制天空盒透明度）,
    // url:ESJLocalBox（天空盒显示背景，支持HDR图片和自定义六张图进行显示）同时设置以HDR为准,
    static override defaults = {
        ...ESObjectWithLocation.defaults,
        size: 10000,
        autoFollow: true,
        autoOpacityFactor: 2,
        // url: {
        //     hdr: '',
        //     positiveX: '',
        //     negativeX: '',
        //     positiveY: '',
        //     negativeY: '',
        //     positiveZ: '',
        //     negativeZ: '',
        // } as ESLocalSkyBoxUrlType,
        modes: [
            ["baiyun", "baiyun"],
            ["blueSky", "blueSky"],
            ["clearSky", "clearSky"],
            ["dream", "dream"],
            ["starrySky", "starrySky"],
            ["sunnySky", "sunnySky"],
            ["sunSets", "sunSets"]
        ] as [name: string, value: string][]
    }

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new NumberProperty('尺寸', '圆直径或包围盒边长', false, false, [this, 'size'], ESLocalSkyBox.defaults.size),
                new BooleanProperty('自动跟随', '是否跟随相机', false, false, [this, 'autoFollow'], ESLocalSkyBox.defaults.autoFollow),
                // new NumberProperty('autoOpacityFactor', '自动消失系数', false, false, [this, 'autoOpacityFactor'], ESLocalSkyBox.defaults.autoOpacityFactor),
                new EnumProperty('mode', '模式', false, false, [this, 'mode'], ESLocalSkyBox.defaults.modes, 'blueSky'),
                // new JsonProperty('url', '天空盒背景', false, false, [this, 'url'], ESLocalSkyBox.defaults.url),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('size', '圆直径或包围盒边长', false, false, [this, 'size'], ESLocalSkyBox.defaults.size),
                new BooleanProperty('autoFollow', '是否跟随相机（自动跟随效果为渐变，会在5000米左右消失）', false, false, [this, 'autoFollow'], ESLocalSkyBox.defaults.autoFollow),
                new NumberProperty('autoOpacityFactor', '自动消失系数', false, false, [this, 'autoOpacityFactor'], ESLocalSkyBox.defaults.autoOpacityFactor),
                new EnumProperty('mode', '模式', false, false, [this, 'mode'], ESLocalSkyBox.defaults.modes),
                // new JsonProperty('url', '天空盒背景', false, false, [this, 'url'], ESLocalSkyBox.defaults.url),
            ]),
        ];
    }
}

export namespace ESLocalSkyBox {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        size: 10000,
        autoFollow: true,
        autoOpacityFactor: 2,
        // url: {
        //     hdr: '',
        //     positiveX: '',
        //     negativeX: '',
        //     positiveY: '',
        //     negativeY: '',
        //     positiveZ: '',
        //     negativeZ: '',
        // } as ESLocalSkyBoxUrlType,
        mode: "blueSky",
    })
}
extendClassProps(ESLocalSkyBox.prototype, ESLocalSkyBox.createDefaultProps);
export interface ESLocalSkyBox extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESLocalSkyBox.createDefaultProps>> { }