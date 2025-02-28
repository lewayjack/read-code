import { extendClassProps, react, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESGeoPolygon } from "./ESGeoPolygon";
import { GroupProperty, StringProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/sqfdFs3bjWsL6WRdDVu4JM
 */
export class ESPolygonFlattenedPlane extends ESGeoPolygon {
    static override readonly type = this.register('ESPolygonFlattenedPlane', this, { chsName: '压平', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESPolygonFlattenedPlane" });
    override get typeName() { return 'ESPolygonFlattenedPlane'; }
    override get defaultProps() { return ESPolygonFlattenedPlane.createDefaultProps(); }

    private _czmFlattenedPlaneId = this.disposeVar(react<string>(""));
    get czmFlattenedPlaneId() { return this._czmFlattenedPlaneId.value; }
    set czmFlattenedPlaneId(value: string) { this._czmFlattenedPlaneId.value = value; }
    get czmFlattenedPlaneIdChanged() { return this._czmFlattenedPlaneId.changed; }

    constructor(id?: SceneObjectKey) {
        super(id);
        this.filled = false
    }
    static override defaults = {
        ...ESGeoPolygon.defaults,
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new StringProperty('瓦片图层', 'targetID', false, false, [this, 'targetID'], '')
            ]
        }
    }
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new StringProperty('瓦片图层', 'targetID', false, false, [this, 'targetID']),
            ]),
        ];
    }
}

export namespace ESPolygonFlattenedPlane {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        targetID: "",
    });
}
extendClassProps(ESPolygonFlattenedPlane.prototype, ESPolygonFlattenedPlane.createDefaultProps);
export interface ESPolygonFlattenedPlane extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESPolygonFlattenedPlane.createDefaultProps>> { }