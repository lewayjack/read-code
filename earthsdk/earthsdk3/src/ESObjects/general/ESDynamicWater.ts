import { ColorProperty, EnumProperty, ESJColor, NumberProperty, NumberSliderProperty } from "../../ESJTypes";
import { extendClassProps, UniteChanged } from "xbsj-base";
import { ESLocalPolygon } from "./ESLocalPolygon";

export class ESDynamicWater extends ESLocalPolygon {
    static override readonly type = this.register('ESDynamicWater', this, { chsName: '动态水面', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "局部多边形水面" });
    override get typeName() { return 'ESDynamicWater'; }
    override get defaultProps() { return { ...ESDynamicWater.createDefaultProps() }; }
    /**
     * @description 默认属性
     * baseWaterColor: [0.1497, 0.165, 0.0031, 1] 水的底色
     * frequency: 1000 频率：控制波数的数值,单位 次/千米
     * waveVelocity: 0.5 波动速率：控制水波纹扰动的速率
     * amplitude: 0.1 振幅：控制水波振幅的数值
     * specularIntensity: 0.8 镜面反射强度：控制镜面反射强度的数值
     * waterType:river 水域类型，当为custom是其他控制效果的参数生效，否则不生效，使用对应水域类型的预定效果
     * flowDirection: [0, 0, 0] 流动方向：控制水流方向，局部坐标方向
     * flowSpeed: 1 流动速度：控制水流速度，单位 米/秒
     */
    static override defaults = {
        ...ESLocalPolygon.defaults,
        // 属性的类型若存在undefined的情况，这里配置为undefined时应该使用的默认值
        waterColor: [0.1497, 0.165, 0.0031, 1] as ESJColor,
        frequency: 1000,
        waveVelocity: 0.5,
        amplitude: 0.1,
        specularIntensity: 0.8,
        waterTypes: [["river", "river"], ["ocean", "ocean"], ["lake", "lake"], ["custom", "custom"]] as [name: string, value: string][],
        waterType: "river",
        flowDirection: 0,
        flowSpeed: 0,
    }
    constructor(id?: string) {
        super(id);
        this.stroked = false;
        this.filled = true;
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new EnumProperty('水域类型', '当为custom是其他控制效果的参数生效，否则不生效，使用对应水域类型的预定效果', false, false, [this, 'waterType'], ESDynamicWater.defaults.waterTypes, ESDynamicWater.defaults.waterType),
                new NumberProperty('频率', '控制波数的数值(次/千米)', false, false, [this, 'frequency'], ESDynamicWater.defaults.frequency),
                new NumberSliderProperty('振幅', '控制水波振幅的数值', false, false, [this, 'amplitude'], 0.01, [0, 1], ESDynamicWater.defaults.amplitude),
                new NumberSliderProperty('流向', '控制水流方向，局部坐标方向', false, false, [this, 'flowDirection'], 0.01, [0, 360], ESDynamicWater.defaults.flowDirection),
                new NumberSliderProperty('波动频率', '控制水波纹扰动的速率', false, false, [this, 'waveVelocity'], 0.01, [0, 1], ESDynamicWater.defaults.waveVelocity),
                new NumberSliderProperty('镜面反射强度', '控制镜面反射强度的数值', false, false, [this, 'specularIntensity'], 0.01, [0, 1], ESDynamicWater.defaults.specularIntensity),
                new NumberProperty('水流速度', '控制水流速度，单位 米/秒', false, false, [this, 'flowSpeed'], ESDynamicWater.defaults.flowSpeed),
                new ColorProperty('水的底色', 'waterColor', false, false, [this, 'waterColor'], ESDynamicWater.defaults.waterColor),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new EnumProperty('水域类型', '当为custom是其他控制效果的参数生效，否则不生效，使用对应水域类型的预定效果', false, false, [this, 'waterType'], ESDynamicWater.defaults.waterTypes),
            new ColorProperty('水的底色', 'waterColor', false, false, [this, 'waterColor'], ESDynamicWater.defaults.waterColor),
            new NumberProperty('频率', '控制波数的数值(次/千米)', false, false, [this, 'frequency'], ESDynamicWater.defaults.frequency),
            new NumberSliderProperty('波动频率', '控制水波纹扰动的速率', false, false, [this, 'waveVelocity'], 0.01, [0, 1], ESDynamicWater.defaults.waveVelocity),
            new NumberSliderProperty('振幅', '控制水波振幅的数值', false, false, [this, 'amplitude'], 0.01, [0, 1], ESDynamicWater.defaults.amplitude),
            new NumberSliderProperty('镜面反射强度', '控制镜面反射强度的数值', false, false, [this, 'specularIntensity'], 0.01, [0, 1], ESDynamicWater.defaults.specularIntensity),
            new NumberSliderProperty('流向', '控制水流方向，局部坐标方向', false, false, [this, 'flowDirection'], 0.01, [0, 360], ESDynamicWater.defaults.flowDirection),
            new NumberProperty('水流速度', '控制水流速度，单位 米/秒', false, false, [this, 'flowSpeed'], ESDynamicWater.defaults.flowSpeed),
        ];
    }
}

export namespace ESDynamicWater {
    export const createDefaultProps = () => ({
        ...ESLocalPolygon.createDefaultProps(),
        // 属性配置
        waterColor: [0.1497, 0.165, 0.0031, 1] as ESJColor,
        frequency: 1000,
        waveVelocity: 0.5,
        amplitude: 0.1,
        specularIntensity: 0.8,
        waterType: "river",
        flowDirection: 0,
        flowSpeed: 0,
        allowPicking: true,
    });
}
extendClassProps(ESDynamicWater.prototype, ESDynamicWater.createDefaultProps);
export interface ESDynamicWater extends UniteChanged<ReturnType<typeof ESDynamicWater.createDefaultProps>> { }
