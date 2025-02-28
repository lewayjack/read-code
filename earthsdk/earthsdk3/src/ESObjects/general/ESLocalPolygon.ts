import { ESJVector2DArray, GroupProperty, JsonProperty, Number2sProperty } from "../../ESJTypes";
import { ESLocalVector2D } from "../base";
import { reactPosition2Ds } from "../../utils";
import { extendClassProps, UniteChanged } from "xbsj-base";

export class ESLocalPolygon extends ESLocalVector2D {
    static readonly type = this.register('ESLocalPolygon', this, { chsName: '局部2D坐标多边形', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESLocalPolygon" });
    get typeName() { return 'ESLocalPolygon'; }
    override get defaultProps() { return { ...ESLocalPolygon.createDefaultProps() }; }

    static override defaults = {
        ...ESLocalVector2D.defaults,
        points: [] as ESJVector2DArray,
        filled: true,
    }

    constructor(id?: string) {
        super(id);
        this.filled = true;
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            coordinate: [
                ...properties.coordinate,
                new Number2sProperty('坐标', '偏移量[x,y],单位米,不含高度', false, false, [this, 'points'], []),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESLocalPolygon', 'ESLocalPolygon', [
                new JsonProperty('位置偏移数组', '偏移量[x,y],单位米,不含高度', false, false, [this, 'points']),
            ]),
        ];
    }
}

export namespace ESLocalPolygon {
    export const createDefaultProps = () => ({
        ...ESLocalVector2D.createDefaultProps(),
        points: reactPosition2Ds(undefined),
    });
}
extendClassProps(ESLocalPolygon.prototype, ESLocalPolygon.createDefaultProps);
export interface ESLocalPolygon extends UniteChanged<ReturnType<typeof ESLocalPolygon.createDefaultProps>> { }
