import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { BooleanProperty, GroupProperty, NonreactiveJsonStringProperty, NumberProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/sAHf2XpnfBguZh2eJbTZcM
 */
export class ESViewShed extends ESObjectWithLocation {
    static readonly type = this.register('ESViewShed', this, { chsName: '视域分析', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "信号传输器" });
    get typeName() { return 'ESViewShed'; }
    override get defaultProps() { return ESViewShed.createDefaultProps(); }

    constructor(id?: SceneObjectKey) {
        super(id);
        this.collision = false;
    }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        fov: 90,
        aspectRatio: 1.77778,
        near: 10,
        far: 100,
        zIndex: 1,
        showFrustum: true
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new BooleanProperty('视椎体', 'showFrustum', false, false, [this, 'showFrustum'], ESViewShed.defaults.showFrustum),
                new NumberProperty('宽高比', 'aspectRatio', false, false, [this, 'aspectRatio'], ESViewShed.defaults.aspectRatio),
                new NumberProperty('横向夹角', 'fov', false, false, [this, 'fov'], ESViewShed.defaults.fov),
                new NumberProperty('近面距离', 'near', false, false, [this, 'near'], ESViewShed.defaults.near),
                new NumberProperty('视野长度', 'far', false, false, [this, 'far'], ESViewShed.defaults.far),
                new NumberProperty('显示优先级', 'zIndex', false, false, [this, 'zIndex'], ESViewShed.defaults.zIndex),
            ],
        }
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('横向夹角', "fov", false, false, [this, 'fov']),
                new NumberProperty('宽高比', "aspectRatio", false, false, [this, 'aspectRatio']),
                new NumberProperty('近面距离', "near", false, false, [this, 'near']),
                new NumberProperty('视野长度', "far", false, false, [this, 'far']),
                new NumberProperty('显示优先级', 'zIndex', false, false, [this, 'zIndex']),
                new BooleanProperty('视椎体', 'showFrustum', false, false, [this, 'showFrustum']),
            ]),
        ]
    }
}

export namespace ESViewShed {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        fov: 90,
        aspectRatio: 1.77778,
        near: 10,
        far: 100,
        zIndex: 1,
        showFrustum: true
    });
}

extendClassProps(ESViewShed.prototype, ESViewShed.createDefaultProps);
export interface ESViewShed extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESViewShed.createDefaultProps>> { }