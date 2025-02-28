import { extendClassProps, UniteChanged } from "xbsj-base";
import { NumberProperty } from "../../ESJTypes";
import { ESObjectWithLocation } from "../base";

/**
 * https://www.wolai.com/earthsdk/uraiJ6nPZBuNTiNMsx78vP
 */
export class ESCameraVisibleRange extends ESObjectWithLocation {
    static readonly type = this.register('ESCameraVisibleRange', this, { chsName: '摄像头可视域', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "摄像头可视域" });
    get typeName() { return 'ESCameraVisibleRange'; }
    override get defaultProps() { return ESCameraVisibleRange.createDefaultProps(); }
    constructor(id?: string) {
        super(id);
    }
    static override defaults = {
        ...ESObjectWithLocation.defaults,
        fov: 90,
        aspectRatio: 1.77778,
        far: 100,
        near: 5,
        collision: false,
    };
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new NumberProperty('宽高比', 'aspectRatio', false, false, [this, 'aspectRatio'], 1.77778),
                new NumberProperty('横向夹角', 'fov', false, false, [this, 'fov'], 90),
                new NumberProperty('视野长度', 'far', false, false, [this, 'far'], 100),
                new NumberProperty('近面距离', 'near', false, false, [this, 'near'], 5),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new NumberProperty('横向夹角', 'fov', false, false, [this, 'fov']),
            new NumberProperty('宽高比', 'aspectRatio', false, false, [this, 'aspectRatio']),
            new NumberProperty('视野长度', 'far', false, false, [this, 'far']),
            new NumberProperty('近面距离', 'near', false, false, [this, 'near']),
        ];
    }
}

export namespace ESCameraVisibleRange {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        fov: 90,
        aspectRatio: 1.77778,
        far: 100,
        near: 5,
        collision: false,
    });
}
extendClassProps(ESCameraVisibleRange.prototype, ESCameraVisibleRange.createDefaultProps);
export interface ESCameraVisibleRange extends UniteChanged<ReturnType<typeof ESCameraVisibleRange.createDefaultProps>> { }
