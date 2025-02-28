import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { EnumProperty, GroupProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/g47RywL4KaFpET1CGJVZQQ
 */
export class ESCar extends ESObjectWithLocation {
    static readonly type = this.register('ESCar', this, { chsName: '车辆', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "警车等基础车辆模型" });
    get typeName() { return 'ESCar'; }
    override get defaultProps() { return ESCar.createDefaultProps(); }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        modeEnum: [["警车", 'policeCar']] as [name: string, value: string][],
        mode: 'policeCar',
    }

    constructor(id?: SceneObjectKey) {
        super(id);
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new EnumProperty('模式', 'mode', false, false, [this, 'mode'], ESCar.defaults.modeEnum, 'policeCar'),
            ],
        }
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new EnumProperty('mode', 'mode', false, false, [this, 'mode'], ESCar.defaults.modeEnum),
            ]),
        ];
    }
}

export namespace ESCar {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        mode: 'policeCar',
        allowPicking: true,
    });
}
extendClassProps(ESCar.prototype, ESCar.createDefaultProps);
export interface ESCar extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESCar.createDefaultProps>> { }