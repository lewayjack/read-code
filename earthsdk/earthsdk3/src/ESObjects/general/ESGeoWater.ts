import { ColorProperty, EnumProperty, ESJColor, GroupProperty, NumberProperty, NumberSliderProperty } from "../../ESJTypes";
import { extendClassProps, UniteChanged } from "xbsj-base";
import { ESGeoPolygon } from "./ESGeoPolygon";

/**
 * https://www.wolai.com/earthsdk/jRv9H5BbPGUaJ8MwxPf5oF
 */
export class ESGeoWater extends ESGeoPolygon {
    static override readonly type = this.register('ESGeoWater', this, { chsName: '地理水面', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: '地理动态水面' });
    override get typeName() { return 'ESGeoWater'; }
    override get defaultProps() { return ESGeoWater.createDefaultProps(); }
    /**
     * @description 默认属性
     * baseWaterColor: [0.1497, 0.165, 0.0031, 1] 水的底色
     * frequency: 1000 频率：控制波数的数值,单位 次/千米
     * waveVelocity: 0.5 波动速率：控制水波纹扰动的速率
     * amplitude: 0.1 振幅：控制水波振幅的数值
     * specularIntensity: 0.8 镜面反射强度：控制镜面反射强度的数值
     * waterType:river 水域类型，当为custom是其他控制效果的参数生效，否则不生效，使用对应水域类型的预定效果
     * flowDirection: 0 流动方向：控制水流方向，局部坐标方向
     * flowSpeed: 0 流动速度：控制水流速度，单位 米/秒
     */
    static override defaults = {
        ...ESGeoPolygon.defaults,
        waterColor: [0.1497, 0.165, 0.0031, 1] as ESJColor,
        frequency: 1000,
        waveVelocity: 0.5,
        amplitude: 0.1,
        specularIntensity: 0.8,
        waterTypes: [["river", "river"], ["ocean", "ocean"], ["lake", "lake"], ["custom", "custom"]] as [name: string, value: string][],
        waterType: "river" as 'river' | 'ocean' | 'lake' | 'custom',
        flowDirection: 0,
        flowSpeed: 0,
    }

    constructor(id?: string) {
        super(id);
    }

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'basic',
            basic: [
                ...properties.basic,
                new EnumProperty('水域类型', '当为custom是其他控制效果的参数生效，否则不生效，使用对应水域类型的预定效果', false, false, [this, 'waterType'], ESGeoWater.defaults.waterTypes, ESGeoWater.defaults.waterType),
                new NumberProperty('频率', '控制波数的数值(次/千米)', false, false, [this, 'frequency'], ESGeoWater.defaults.frequency),
                new NumberSliderProperty('振幅', '控制水波振幅的数值', false, false, [this, 'amplitude'], 0.01, [0, 1], ESGeoWater.defaults.amplitude),
                new NumberSliderProperty('流向', '控制水流方向，局部坐标方向', false, false, [this, 'flowDirection'], 0.01, [0, 360], ESGeoWater.defaults.flowDirection),
                new NumberSliderProperty('波动频率', '控制水波纹扰动的速率', false, false, [this, 'waveVelocity'], 0.01, [0, 1], ESGeoWater.defaults.waveVelocity),
                new NumberSliderProperty('镜面反射强度', '控制镜面反射强度的数值', false, false, [this, 'specularIntensity'], 0.01, [0, 1], ESGeoWater.defaults.specularIntensity),
                new NumberProperty('水流速度', '控制水流速度，单位 米/秒', false, false, [this, 'flowSpeed'], ESGeoWater.defaults.flowSpeed),
                new ColorProperty('水的底色', 'waterColor', false, false, [this, 'waterColor'], ESGeoWater.defaults.waterColor),
            ]
        }
    }

    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            // 属性UI配置
            new GroupProperty('ESGeoWater', 'ESGeoWater', [
                new EnumProperty('水域类型', '当为custom是其他控制效果的参数生效，否则不生效，使用对应水域类型的预定效果', false, false, [this, 'waterType'], ESGeoWater.defaults.waterTypes),
                new ColorProperty('水的底色', 'waterColor', false, false, [this, 'waterColor'], ESGeoWater.defaults.waterColor),
                new NumberProperty('频率', '控制波数的数值(次/千米)', false, false, [this, 'frequency'], ESGeoWater.defaults.frequency),
                new NumberSliderProperty('波动频率', '控制水波纹扰动的速率', false, false, [this, 'waveVelocity'], 0.01, [0, 1], ESGeoWater.defaults.waveVelocity),
                new NumberSliderProperty('振幅', '控制水波振幅的数值', false, false, [this, 'amplitude'], 0.01, [0, 1], ESGeoWater.defaults.amplitude),
                new NumberSliderProperty('镜面反射强度', '控制镜面反射强度的数值', false, false, [this, 'specularIntensity'], 0.01, [0, 1], ESGeoWater.defaults.specularIntensity),
                new NumberSliderProperty('流向', '控制水流方向，局部坐标方向', false, false, [this, 'flowDirection'], 0.01, [0, 360], ESGeoWater.defaults.flowDirection),
                new NumberProperty('水流速度', '控制水流速度，单位 米/秒', false, false, [this, 'flowSpeed'], ESGeoWater.defaults.flowSpeed),
            ]),
        ];
    }
}

export namespace ESGeoWater {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        // 属性配置
        waterColor: [0.1497, 0.165, 0.0031, 1] as ESJColor,
        frequency: 1000,
        waveVelocity: 0.5,
        amplitude: 0.1,
        specularIntensity: 0.8,
        waterType: "river" as 'river' | 'ocean' | 'lake' | 'custom',
        flowDirection: 0,
        flowSpeed: 0,
        allowPicking: true
    });
}
extendClassProps(ESGeoWater.prototype, ESGeoWater.createDefaultProps);
export interface ESGeoWater extends UniteChanged<ReturnType<typeof ESGeoWater.createDefaultProps>> { }
