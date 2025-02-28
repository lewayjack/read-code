import { extendClassProps, reactPositionsSet, UniteChanged } from "xbsj-base";
import { GroupProperty, JsonProperty } from "../../ESJTypes";
import { ESGeoPolygon } from "./ESGeoPolygon";

/**
 * https://www.wolai.com/earthsdk/6fsNXeZye81jUFUhL7U7xM
 */
export class ESPolygonWithHole extends ESGeoPolygon {
    static override readonly type = this.register('ESPolygonWithHole', this, { chsName: '内部裁切多边形', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: '带洞多边形' });
    override get typeName() { return 'ESPolygonWithHole'; }
    override get defaultProps() { return ESPolygonWithHole.createDefaultProps(); }
    static override defaults = {
        ...ESGeoPolygon.defaults,
        innerRings: [],
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new JsonProperty('裁切多边形数组', '必须在内部，且没有相交，裁切的多边形数组', true, false, [this, 'innerRings'], []),
            ],
        }
    }
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty('裁切多边形数组', '必须在内部，且没有相交，裁切的多边形数组', true, false, [this, 'innerRings'], []),
            ])
        ];
    }
}

export namespace ESPolygonWithHole {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        innerRings: reactPositionsSet(undefined),
    })
}
extendClassProps(ESPolygonWithHole.prototype, ESPolygonWithHole.createDefaultProps);
export interface ESPolygonWithHole extends UniteChanged<ReturnType<typeof ESPolygonWithHole.createDefaultProps>> { }
