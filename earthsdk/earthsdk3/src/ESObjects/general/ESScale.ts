import { extendClassProps, UniteChanged } from "xbsj-base";
import { BooleanProperty, EnumProperty, ESJVector2D, GroupProperty, Number2Property } from "../../ESJTypes";
import { ESSceneObject } from "../base";

export class ESScale extends ESSceneObject {
    static readonly type = this.register('ESScale', this, { chsName: '比例尺', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "比例尺" });
    get typeName() { return 'ESScale'; }
    override get defaultProps() { return ESScale.createDefaultProps(); }
    static override defaults = {
        ...ESSceneObject.defaults,
        show: true,
        screenPosition: 'right',
        cssPosition: [40, 18] as ESJVector2D,
    };
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new BooleanProperty('是否显示', 'A boolean Property specifying the visibility .', false, false, [this, 'show']),
                new EnumProperty('定位', '放到屏幕的哪个位置', false, false, [this, 'screenPosition'], [['left', 'left'], ['right', 'right']]),
                new Number2Property('位置', '位置(bottom,right/left)', false, false, [this, 'cssPosition']),
            ]),
        ]
    }
}
export namespace ESScale {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        show: true,
        screenPosition: 'right',
        cssPosition: [40, 30],
    });
}
extendClassProps(ESScale.prototype, ESScale.createDefaultProps);
export interface ESScale extends UniteChanged<ReturnType<typeof ESScale.createDefaultProps>> { }
