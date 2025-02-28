import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { NumberProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/nsGR6B8LiEZKsfUYSN3pwS
 */
export class ESApertureEffect extends ESObjectWithLocation {
    static readonly type = this.register('ESApertureEffect', this, { chsName: '光圈特效', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: '光圈特效' });
    get typeName() { return 'ESApertureEffect'; }
    override get defaultProps() { return ESApertureEffect.createDefaultProps(); }

    constructor(id?: SceneObjectKey) {
        super(id);
        this.collision = false;
    }
    static override defaults = {
        ...ESObjectWithLocation.defaults,
        radius: 1,
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new NumberProperty('半径', 'radius', false, false, [this, 'radius'], 1)
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new NumberProperty('半径', 'radius', false, false, [this, 'radius'])
        ];
    }
}

export namespace ESApertureEffect {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        radius: 1,
    })
}
extendClassProps(ESApertureEffect.prototype, ESApertureEffect.createDefaultProps);
export interface ESApertureEffect extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESApertureEffect.createDefaultProps>> { }