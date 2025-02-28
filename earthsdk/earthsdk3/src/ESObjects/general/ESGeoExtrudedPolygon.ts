import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESGeoPolygon } from "./ESGeoPolygon";
import { BooleanProperty, GroupProperty, NumberProperty } from "../../ESJTypes";

/**
 * 挤压多边形体
 */
export class ESGeoExtrudedPolygon extends ESGeoPolygon {
    static override readonly type = this.register('ESGeoExtrudedPolygon', this, { chsName: '地理多边形体', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "地理多边形体" });
    override get typeName() { return 'ESGeoExtrudedPolygon'; }
    override get defaultProps() { return ESGeoExtrudedPolygon.createDefaultProps(); }

    static override defaults = {
        ...ESGeoPolygon.defaults,
        perPositionHeight: false,
    }

    constructor(id?: SceneObjectKey) {
        super(id);
        this.collision = false;
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            coordinate: [
                ...properties.coordinate,
                new NumberProperty('高度', '高度 m', true, false, [this, 'height']),
                new NumberProperty('拉伸高度', '拉伸高度 m', true, false, [this, 'extrudedHeight']),
                new BooleanProperty('应用每个位置高度', '应用每个位置高度', true, false, [this, 'perPositionHeight'], ESGeoExtrudedPolygon.defaults.perPositionHeight)
            ]
        };
    };
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('高度', '高度 m', true, false, [this, 'height']),
                new NumberProperty('拉伸高度', '拉伸高度 m', true, false, [this, 'extrudedHeight']),
                new BooleanProperty('应用每个位置高度', '应用每个位置高度', true, false, [this, 'perPositionHeight'], ESGeoExtrudedPolygon.defaults.perPositionHeight)
            ]),
        ];
    }
}

export namespace ESGeoExtrudedPolygon {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        height: undefined as number | undefined,
        extrudedHeight: undefined as number | undefined,
        perPositionHeight: undefined as boolean | undefined,
    });
}
extendClassProps(ESGeoExtrudedPolygon.prototype, ESGeoExtrudedPolygon.createDefaultProps);
export interface ESGeoExtrudedPolygon extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESGeoExtrudedPolygon.createDefaultProps>> { }