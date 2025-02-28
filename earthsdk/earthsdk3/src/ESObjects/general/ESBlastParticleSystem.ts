import { extendClassProps, reactArray, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { GroupProperty, Number3Property, UriProperty } from "../../ESJTypes";

export class ESBlastParticleSystem extends ESObjectWithLocation {
    static readonly type = this.register('ESBlastParticleSystem', this, { chsName: '粒子爆炸', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "粒子爆炸" });
    get typeName() { return 'ESBlastParticleSystem'; }
    override get defaultProps() { return ESBlastParticleSystem.createDefaultProps(); }

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
                ]),
            ]),
        ];
    }
}

export namespace ESBlastParticleSystem {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        image: `\${earthsdk3-assets-script-dir}/assets/img/smoke.png`,
        positionEditing: undefined as boolean | undefined,
        translation: reactArray<[number, number, number]>([0, 0, 0]),
    });
}
extendClassProps(ESBlastParticleSystem.prototype, ESBlastParticleSystem.createDefaultProps);
export interface ESBlastParticleSystem extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESBlastParticleSystem.createDefaultProps>> { }
