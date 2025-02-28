import { extendClassProps, reactArray, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { GroupProperty, Number3Property, UriProperty } from "../../ESJTypes";

export class ESFireParticleSystem extends ESObjectWithLocation {
    static readonly type = this.register('ESFireParticleSystem', this, { chsName: '粒子烟火', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "粒子烟火" });
    get typeName() { return 'ESFireParticleSystem'; }
    override get defaultProps() { return ESFireParticleSystem.createDefaultProps(); }

    constructor(id?: SceneObjectKey) {
        super(id);
    }
    static override defaults = {
        ...ESObjectWithLocation.defaults,
        image: `\${earthsdk3-assets-script-dir}/assets/img/smoke.png`,
        translation: [0, 0, 0] as [number, number, number],
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'general',
        };
    };
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new GroupProperty('czm', 'czm', [
                    new UriProperty('图片', 'The URI, HTMLImageElement, or HTMLCanvasElement to use for the billboard.', false, false, [this, 'image']),
                    new Number3Property('偏移', 'translation', false, false, [this, 'translation']),
                    // new BooleanProperty('是否编辑位置', '是否编辑位置.', true, false, [this, 'positionEditing'], ESFireParticleSystem.defaults.positionEditing),
                ]),
            ]),
        ];
    }
}

export namespace ESFireParticleSystem {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        image: "",
        translation: reactArray<[number, number, number]>([0, 0, 0]),
    });
}
extendClassProps(ESFireParticleSystem.prototype, ESFireParticleSystem.createDefaultProps);
export interface ESFireParticleSystem extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESFireParticleSystem.createDefaultProps>> { }
