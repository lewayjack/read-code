import { ColorProperty, EnumProperty, ESJColor, GroupProperty, JsonProperty, NumberProperty, NumberSliderProperty, Property, StringProperty } from "../../../ESJTypes";
import { ESObjectWithLocation } from "../../base";
import { extendClassProps, ReactivePropsToNativePropsAndChanged, reactJson, SceneObjectKey, Event } from "xbsj-base";
import { parseWaterGlb } from "./parseGlb";

/**
 * 淹没分析
 * https://www.wolai.com/earthsdk/mZGssfGULnZsZuP7wEqno7
 */
export class ESSubmergingAnalysis extends ESObjectWithLocation {
    static readonly type = this.register('ESSubmergingAnalysis', this, { chsName: '淹没分析', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: 'ESSubmergingAnalysis' });
    get typeName() { return 'ESSubmergingAnalysis'; }
    override get defaultProps() { return ESSubmergingAnalysis.createDefaultProps(); }

    private _submergingData: any;
    get getSubmergingData() { return this._submergingData; }

    private _allMoments: number[] = [];
    public getAllMoments() { return this._allMoments; }

    public readyEvent = this.dv(new Event());

    /**
     * @description 默认属性
     * baseWaterColor: [0.1497, 0.165, 0.0031, 1] 水的底色
     * frequency: 1000 频率：控制波数的数值,单位 次/千米
     * waveVelocity: 0.5 波动速率：控制水波纹扰动的速率
     * amplitude: 0.1 振幅：控制水波振幅的数值
     * specularIntensity: 0.8 镜面反射强度：控制镜面反射强度的数值
     * waterType:river 水域类型，当为custom是其他控制效果的参数生效，否则不生效，使用对应水域类型的预定效果
     * flowSpeed: 0 流动速度：控制水流速度，单位 米/秒
     */
    static override defaults = {
        ...ESObjectWithLocation.defaults,
        // 属性的类型若存在undefined的情况，这里配置为undefined时应该使用的默认值
        url: '',
        currentTime: 0,
        materialParams: {},
        // 属性的类型若存在undefined的情况，这里配置为undefined时应该使用的默认值
        waterColor: [0.1497, 0.165, 0.0031, 1] as ESJColor,
        frequency: 1000,
        waveVelocity: 0.5,
        amplitude: 0.1,
        specularIntensity: 0.8,
        waterTypes: [["river", "river"], ["ocean", "ocean"], ["lake", "lake"], ["custom", "custom"]] as [name: string, value: string][],
        waterType: "river",
        flowSpeed: 0,
    }

    constructor(id?: SceneObjectKey) {
        super(id);
        {
            const update = () => {
                if (this.url == "") return;
                fetch(this.url).then((res) => {
                    if (res.status == 200 && res.ok) {
                        res.arrayBuffer().then((data) => {
                            this._submergingData = parseWaterGlb(data);
                            const timestampArr: number[] = this._submergingData.map((item: any) => Date.parse(item.name)).sort();
                            this._allMoments = timestampArr;
                            if (this.currentTime == 0) {
                                this.currentTime = timestampArr[0];
                            }
                            this.readyEvent.emit();
                        })
                    }
                }).catch(err => {
                    console.log(err);
                })
            }
            update()
            // 解析url,获取数据
            this.d(this.urlChanged.don(() => {
                update();
            }))
        }
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new StringProperty('Url地址', 'url', false, false, [this, 'url'], ESSubmergingAnalysis.defaults.url),
                new NumberSliderProperty('振幅', '控制水波振幅的数值', false, false, [this, 'amplitude'], 0.01, [0, 1], ESSubmergingAnalysis.defaults.amplitude),
                new NumberProperty('频率', '控制波数的数值(次/千米)', false, false, [this, 'frequency'], ESSubmergingAnalysis.defaults.frequency),
                new NumberProperty('当前时间', 'currentTime', false, false, [this, 'currentTime'], ESSubmergingAnalysis.defaults.currentTime),
                new JsonProperty('材质参数', 'materialParams', false, false, [this, 'materialParams'], ESSubmergingAnalysis.defaults.materialParams),
                new EnumProperty('水域类型', '当为custom是其他控制效果的参数生效，否则不生效，使用对应水域类型的预定效果', false, false, [this, 'waterType'], ESSubmergingAnalysis.defaults.waterTypes, 'river'),
                new ColorProperty('水的底色', 'waterColor', false, false, [this, 'waterColor'], ESSubmergingAnalysis.defaults.waterColor),
                new NumberSliderProperty('波动频率', '控制水波纹扰动的速率', false, false, [this, 'waveVelocity'], 0.01, [0, 1], ESSubmergingAnalysis.defaults.waveVelocity),
                new NumberProperty('水流速度', '控制水流速度，单位 米/秒', false, false, [this, 'flowSpeed'], ESSubmergingAnalysis.defaults.flowSpeed),
                new NumberSliderProperty('镜面反射强度', '控制镜面反射强度的数值', false, false, [this, 'specularIntensity'], 0.01, [0, 1], ESSubmergingAnalysis.defaults.specularIntensity),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            // 属性UI配置
            new GroupProperty('通用', '通用', [
                new StringProperty('模型Url地址', 'url', false, false, [this, 'url'], ESSubmergingAnalysis.defaults.url),
                new NumberProperty('当前时间', 'currentTime', false, false, [this, 'currentTime'], ESSubmergingAnalysis.defaults.currentTime),
                new JsonProperty('材质参数', 'materialParams', false, false, [this, 'materialParams'], ESSubmergingAnalysis.defaults.materialParams),
                new EnumProperty('水域类型', '当为custom是其他控制效果的参数生效，否则不生效，使用对应水域类型的预定效果', false, false, [this, 'waterType'], ESSubmergingAnalysis.defaults.waterTypes),
                new ColorProperty('水的底色', 'waterColor', false, false, [this, 'waterColor'], ESSubmergingAnalysis.defaults.waterColor),
                new NumberProperty('频率', '控制波数的数值(次/千米)', false, false, [this, 'frequency'], ESSubmergingAnalysis.defaults.frequency),
                new NumberSliderProperty('波动频率', '控制水波纹扰动的速率', false, false, [this, 'waveVelocity'], 0.01, [0, 1], ESSubmergingAnalysis.defaults.waveVelocity),
                new NumberSliderProperty('振幅', '控制水波振幅的数值', false, false, [this, 'amplitude'], 0.01, [0, 1], ESSubmergingAnalysis.defaults.amplitude),
                new NumberSliderProperty('镜面反射强度', '控制镜面反射强度的数值', false, false, [this, 'specularIntensity'], 0.01, [0, 1], ESSubmergingAnalysis.defaults.specularIntensity),
                new NumberProperty('水流速度', '控制水流速度，单位 米/秒', false, false, [this, 'flowSpeed'], ESSubmergingAnalysis.defaults.flowSpeed),
            ]),
        ];
    }
}

export namespace ESSubmergingAnalysis {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        // 属性配置
        url: '',
        currentTime: 0,
        materialParams: reactJson<{ [xx: string]: any }>({}),
        // 属性的类型若存在undefined的情况，这里配置为undefined时应该使用的默认值
        waterColor: [0.1497, 0.165, 0.0031, 1] as ESJColor,
        frequency: 1000,
        waveVelocity: 0.5,
        amplitude: 0.1,
        specularIntensity: 0.8,
        waterType: "river",
        flowSpeed: 0,
        allowPicking: true
    });
}
extendClassProps(ESSubmergingAnalysis.prototype, ESSubmergingAnalysis.createDefaultProps);
export interface ESSubmergingAnalysis extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESSubmergingAnalysis.createDefaultProps>> { }
