import { ColorProperty, GroupProperty } from "../../ESJTypes";
import { ESObjectWithLocation } from "../base";
import { extendClassProps, reactArray, ReactivePropsToNativePropsAndChanged } from "xbsj-base";

export class ESCityBasePoint extends ESObjectWithLocation {
    static readonly type = this.register('ESCityBasePoint', this, { chsName: '城市基点(Czm)', tags: ['ESObjects', 'CityObjects', '_ES_Impl_Cesium'], description: "城市基点(Czm)" });
    get typeName() { return 'ESCityBasePoint'; }
    override get defaultProps() { return { ...ESCityBasePoint.createDefaultProps() }; }

    constructor(id?: string) {
        super(id);
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new ColorProperty('颜色', '颜色', false, false, [this, 'color'], [1, 1, 0, 1]),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new ColorProperty('颜色', '颜色', false, false, [this, 'color']),
            ]),
        ];
    }
}

export namespace ESCityBasePoint {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        color: reactArray<[number, number, number, number]>([1, 1, 0, 1]),
    });
}
extendClassProps(ESCityBasePoint.prototype, ESCityBasePoint.createDefaultProps);
export interface ESCityBasePoint extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESCityBasePoint.createDefaultProps>> { }