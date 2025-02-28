import { UniteChanged, extendClassProps, reactArray } from "xbsj-base";
import { ESVisualObject } from "../base";
import { ESJResource, ESJVector4D, GroupProperty, JsonProperty, Number4Property, NumberProperty, StringProperty, UriProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/mrRQPHx2hww6BgzBwEdPaV
 */
export class ESTerrainLayer extends ESVisualObject {
    static readonly type = this.register('ESTerrainLayer', this, { chsName: '地形图层', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "地形图层" });
    get typeName() { return 'ESTerrainLayer'; }
    override get defaultProps() { return ESTerrainLayer.createDefaultProps(); }

    static override defaults = {
        ...ESVisualObject.defaults,
        show: true,
        url: "http://inner.earthsdk.com/layer.json",
        rectangle: [-180, -90, 180, 90] as ESJVector4D,
        zIndex: 0,
    }

    constructor(id?: string) { super(id); }

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        const basic = [
            new NumberProperty('层级序号', '层级序号', false, false, [this, 'zIndex'], ESTerrainLayer.defaults.zIndex)
        ];
        const dataSource = [
            new JsonProperty('地形服务地址', '地形服务地址', false, false, [this, 'url'], ESTerrainLayer.defaults.url),
            new Number4Property('矩形范围', '西南东北', false, false, [this, 'rectangle'], ESTerrainLayer.defaults.rectangle)
        ]
        properties.basic.push(...basic);
        properties.dataSource.push(...dataSource);
        properties.defaultMenu = "dataSource";
        return properties;
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESTerrainLayer', 'ESTerrainLayer', [
                new JsonProperty('地形服务地址', '地形服务地址', false, false, [this, 'url']),
                new Number4Property('矩形范围', '西南东北', false, false, [this, 'rectangle']),
                new NumberProperty('层级', 'zIndex', false, false, [this, 'zIndex']),
                new GroupProperty('czm', 'czm', [
                    new NumberProperty('czmMinzoom', 'czmMinzoom', true, false, [this, 'czmMinzoom']),
                    new NumberProperty('czmMaxzoom', 'czmMaxzoom', true, false, [this, 'czmMaxzoom']),
                ])
            ]),
        ]
    }
}

export namespace ESTerrainLayer {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        url: "http://inner.earthsdk.com/layer.json" as string | ESJResource,
        rectangle: reactArray<ESJVector4D>([-180, -90, 180, 90]),
        zIndex: 0,
        czmMaxzoom: undefined as number | undefined,
        czmMinzoom: undefined as number | undefined,
    });
}
extendClassProps(ESTerrainLayer.prototype, ESTerrainLayer.createDefaultProps);
export interface ESTerrainLayer extends UniteChanged<ReturnType<typeof ESTerrainLayer.createDefaultProps>> { }
