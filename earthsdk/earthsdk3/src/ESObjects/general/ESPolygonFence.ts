import { extendClassProps, react, UniteChanged } from "xbsj-base";
import { EnumProperty, ESJFillStyle, GroupProperty, NumberProperty } from "../../ESJTypes";
import { geoArea, getDistancesFromPositions } from "../../utils";
import { ESGeoVector } from "../base";
/**
 * https://www.wolai.com/earthsdk/s3LNcfsVWEUHvchR6eeJSH
 */
export class ESPolygonFence extends ESGeoVector {
    static readonly type = this.register('ESPolygonFence', this, { chsName: '多边形电子围栏', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "多边形电子围栏" });
    get typeName() { return 'ESPolygonFence'; }
    override get defaultProps() { return ESPolygonFence.createDefaultProps(); }

    static override defaults = {
        ...ESGeoVector.defaults,
        fillStyle: {
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {}
        } as ESJFillStyle,
        filled: true,
        materialModes: [["模式一", 'danger'], ["模式二", "checkerboard"], ["模式三", "warning"], ["模式四", "cord"], ["模式五", "scanline"], ["模式六", "honeycomb"], ["模式七", "gradientColor"]] as [name: string, value: string][],
    };


    constructor(id?: string) {
        super(id);
        this.filled = true;
        this.collision = false;
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'basic',
            basic: [
                ...properties.basic,
                new NumberProperty('高度', 'height', false, false, [this, 'height'], 10),
                new EnumProperty('模式', 'materialMode', false, false, [this, 'materialMode'], ESPolygonFence.defaults.materialModes, 'danger'),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('高度', 'height', false, false, [this, 'height']),
                new EnumProperty('materialMode', 'materialMode', false, false, [this, 'materialMode'], ESPolygonFence.defaults.materialModes),
            ]),
            new GroupProperty('计算', '计算', [
                new NumberProperty('面积', '面积', false, true, [this, 'area']),
                new NumberProperty('周长', '周长', false, true, [this, 'perimeter'])
            ]),
        ]
    }
}

export namespace ESPolygonFence {
    export const createDefaultProps = () => ({
        pointEditing: false,
        height: 10,
        materialMode: 'danger',
        ...ESGeoVector.createDefaultProps(),
    });
}
extendClassProps(ESPolygonFence.prototype, ESPolygonFence.createDefaultProps);
export interface ESPolygonFence extends UniteChanged<ReturnType<typeof ESPolygonFence.createDefaultProps>> { }
