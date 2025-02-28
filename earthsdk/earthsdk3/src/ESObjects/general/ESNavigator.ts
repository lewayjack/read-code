import { BooleanProperty, GroupProperty, Number2Property, NumberProperty, UriProperty } from "../../ESJTypes";
import { ESSceneObject } from "../base";
import { extendClassProps, ReactivePropsToNativePropsAndChanged } from "xbsj-base";

export class ESNavigator extends ESSceneObject {
    static readonly type = this.register('ESNavigator', this, { chsName: '导航控件', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "导航控件" });
    get typeName() { return 'ESNavigator'; }
    override get defaultProps() { return ESNavigator.createDefaultProps(); }
    static override defaults = {
        ...ESSceneObject.defaults,
        show: true,
        cssPosition: [170, 30] as [number, number],
        cssSize: 100,
        imgUrl: ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/zhinanzhen.png'),
    };
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new BooleanProperty('是否显示', 'A boolean Property specifying the visibility .', false, false, [this, 'show']),
                new NumberProperty('尺寸', '尺寸', false, false, [this, 'cssSize']),
                new Number2Property('位置', '位置(top,right)', false, false, [this, 'cssPosition']),
                new UriProperty('图片地址', '图片地址', false, false, [this, 'imgUrl']),
            ]),
        ]
    }
}

export namespace ESNavigator {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        show: true,
        cssSize: 100,
        cssPosition: [170, 30],
        imgUrl: ESNavigator.defaults.imgUrl,
    });
}
extendClassProps(ESNavigator.prototype, ESNavigator.createDefaultProps);
export interface ESNavigator extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESNavigator.createDefaultProps>> { }
