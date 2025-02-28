import { extendClassProps, reactArray, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { BooleanProperty, ColorProperty, EnumProperty, GroupProperty, LongStringProperty, Number4Property, NumberProperty } from "../../ESJTypes";

export class ESGeoDivTextPoi extends ESObjectWithLocation {
    static readonly type = this.register('ESGeoDivTextPoi', this, { chsName: '图标点', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "图标点" });
    get typeName() { return 'ESGeoDivTextPoi'; }
    override get defaultProps() { return ESGeoDivTextPoi.createDefaultProps(); }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        allowTextEditing: true,
        width: 80,
        text: '请输入文字',
        originRatioAndOffset: [0.5, 1, 0, 0] as [number, number, number, number],
        opacity: 1,
        fontSize: 14,
        color: [1, 1, 1, 1] as [number, number, number, number],
        backgroundColor: [0, 0, 0, 0.8] as [number, number, number, number],
        padding: [5, 5, 5, 5] as [number, number, number, number],
        borderRadius: [6, 6, 6, 6] as [number, number, number, number],
        borderColor: [1, 1, 1, 1] as [number, number, number, number],
        borderWidth: 0,
        textAlign: 'left',
        borderStyle: "solid"
    }
    constructor(id?: SceneObjectKey) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new BooleanProperty('文本编辑交互', '文本编辑交互.', false, false, [this, 'textEditingInteraction']),
                new BooleanProperty('文本编辑', '文本编辑.', false, false, [this, 'textEditing']),
                new NumberProperty('宽度', '宽度', true, false, [this, 'width'], ESGeoDivTextPoi.defaults.width),
                new LongStringProperty('内容', '内容', true, false, [this, 'text'], ESGeoDivTextPoi.defaults.text),
                new Number4Property('原点比例和偏移', '原点比例和偏移.', false, false, [this, 'originRatioAndOffset']),
                new NumberProperty('透明度', '透明度', false, false, [this, 'opacity']),
                new NumberProperty('字体大小', '字体大小', false, false, [this, 'fontSize']),
                new ColorProperty('字体颜色', ' 字体颜色.', false, false, [this, 'color']),
                new ColorProperty('背景颜色', ' 背景颜色.', false, false, [this, 'backgroundColor']),
                new Number4Property('内边距', '上，右，下，左顺序.', false, false, [this, 'padding']),
                new Number4Property('边框圆角', '左上，右上，右下，左下.', false, false, [this, 'borderRadius']),
                new ColorProperty('边框颜色', ' 边框色.', false, false, [this, 'borderColor']),
                new NumberProperty('边框宽度', '边框宽度', false, false, [this, 'borderWidth']),
                new EnumProperty('文字位置', '文字位置', false, false, [this, 'textAlign'], [['center', 'center'], ['left', 'left'], ['right', 'right']]),
                new EnumProperty('边框类型', '边框类型', false, false, [this, 'borderStyle'],
                    [['none', 'none'], ['hidden', 'hidden'], ['dotted', 'dotted'], ['dashed', 'dashed'], ['solid', 'solid'], ['double', 'double'],
                    ['groove', 'groove'], ['ridge', 'ridge'], ['inset', 'inset'], ['outset', 'outset'],]),
            ]),
        ];
    }
}

export namespace ESGeoDivTextPoi {
    export const createDefaultProps = () => ({
        text: undefined as string | undefined,
        width: undefined as number | undefined,
        textEditingInteraction: false,
        textEditing: false,
        originRatioAndOffset: reactArray<[leftRatio: number, topRatio: number, leftOffset: number, topOffset: number]>([0.5, 1, 0, 0]),
        opacity: 1,
        fontSize: 14,
        textAlign: 'left',
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        backgroundColor: reactArray<[number, number, number, number]>([0, 0, 0, 0.8]),
        padding: reactArray<[number, number, number, number]>([5, 5, 5, 5]),
        borderRadius: reactArray<[number, number, number, number]>([6, 6, 6, 6]),
        borderWidth: 0,
        borderColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        borderStyle: "solid",
        ...ESObjectWithLocation.createDefaultProps(),
    });
}
extendClassProps(ESGeoDivTextPoi.prototype, ESGeoDivTextPoi.createDefaultProps);
export interface ESGeoDivTextPoi extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESGeoDivTextPoi.createDefaultProps>> { }