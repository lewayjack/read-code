import { extendClassProps, react, reactJsonWithUndefined, UniteChanged } from "xbsj-base";
import { ESJColor, ESJResource, GroupProperty, JsonProperty, NumberProperty, StringProperty } from "../../ESJTypes";
import { ESObjectWithLocation } from "../base";

export type ESDataMeshColorStopType = {
    ratio: number;
    rgba: ESJColor;
};

export class ESDataMesh extends ESObjectWithLocation {
    static readonly type = this.register('ESDataMesh', this, { chsName: '数值面着色', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "数值面着色" });
    get typeName() { return 'ESDataMesh'; }
    override get defaultProps() { return ESDataMesh.createDefaultProps(); }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        url: 'http://114.242.26.126:6003/ESDataMesh/water-assets2/',
        maxTime: 23,
        currentTime: 0,
        minPropValue: 0,
        maxPropValue: 1,
        colorStops: [
            { ratio: 0., rgba: [0, 0, 1, 1] },
            { ratio: .2, rgba: [0, 1, 0, 1] },
            { ratio: .8, rgba: [1, 1, 0, 1] },
            { ratio: 1., rgba: [1, 0, 0, 1] },
        ] as ESDataMeshColorStopType[],
    };

    private _maxTime = this.dv(react<number | undefined>(ESDataMesh.defaults.maxTime));
    get maxTime() { return this._maxTime.value; }
    get maxTimeChanged() { return this._maxTime.changed; }

    constructor(id?: string) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty('url', 'url', false, false, [this, 'url']),
                new NumberProperty('maxTime', 'maxTime', true, true, [this, 'maxTime'], ESDataMesh.defaults.maxTime), // 康总要求maxTime不能修改 20230905
                new NumberProperty('currentTime', 'currentTime', false, false, [this, 'currentTime']),
                new NumberProperty('minPropValue', 'minPropValue', false, false, [this, 'minPropValue']),
                new NumberProperty('maxPropValue', 'maxPropValue', false, false, [this, 'maxPropValue']),
                new JsonProperty('colorStops', 'colorStops', true, false, [this, 'colorStops'], ESDataMesh.defaults.colorStops),
            ]),
        ];
    }
}

export namespace ESDataMesh {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        url: 'http://114.242.26.126:6003/ESDataMesh/water-assets2/' as string | ESJResource,
        currentTime: 0,
        minPropValue: 0,
        maxPropValue: 1,
        colorStops: reactJsonWithUndefined<ESDataMeshColorStopType[]>(undefined),
    });
}
extendClassProps(ESDataMesh.prototype, ESDataMesh.createDefaultProps);
export interface ESDataMesh extends UniteChanged<ReturnType<typeof ESDataMesh.createDefaultProps>> { }
