import { extendClassProps, reactArray, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESLabel } from "../base";
import { BooleanProperty, ColorProperty, EnumProperty, GroupProperty, LongStringProperty, Number4Property, NumberProperty } from "../../ESJTypes";

export class ESTextLabel extends ESLabel {
    static readonly type = this.register('ESTextLabel', this, { chsName: '文本标签', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "文本标签。" });
    get typeName() { return 'ESTextLabel'; }
    override get defaultProps() { return ESTextLabel.createDefaultProps(); }

    static override defaults = {
        ...ESLabel.defaults,
        allowTextEditing: true,
        width: 80,
        text: '请输入文字',
        editing: false,
        originRatioAndOffset: [0.5, 1, 0, 0] as [number, number, number, number],
        opacity: 1,
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
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new ColorProperty('文本颜色', '指定文本标签的字体颜色.', false, false, [this, 'color'], [1, 1, 1, 1]),
                new NumberProperty('文字大小', 'fontSize', false, false, [this, 'fontSize'], 14),
                new LongStringProperty('内容', '内容', true, false, [this, 'text'], ESTextLabel.defaults.text),
                new ColorProperty('背景颜色', ' 指定文本标签的背景颜色.', false, false, [this, 'backgroundColor'], ESTextLabel.defaults.backgroundColor),
                new Number4Property('内边距', '上，右，下，左顺序.', false, false, [this, 'padding'], ESTextLabel.defaults.padding),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new LongStringProperty('内容', '内容', true, false, [this, 'text'], ESTextLabel.defaults.text),
                // new StringProperty("文本", "文本标签显示内容", true, false, [this, 'text'], ESTextLabel.defaults.text),
                new ColorProperty('文本颜色', '指定文本标签的字体颜色.', false, false, [this, 'color']),
                new NumberProperty('文字大小', 'fontSize', false, false, [this, 'fontSize']),
                new ColorProperty('背景颜色', ' 指定文本标签的背景颜色.', false, false, [this, 'backgroundColor']),
                new Number4Property('内边距', '上，右，下，左顺序.', false, false, [this, 'padding']),
            ]),
            new GroupProperty('czm', 'czm', [
                // new BooleanProperty('是否显示背景', '开启或者关闭标签背景显示.', true, false, [this, 'showBackground'], ESTextLabel.defaults.showBackground),
                // new Number2Property('偏移', '偏移', true, false, [this, 'pixelOffset'], ESTextLabel.defaults.pixelOffset),
                new BooleanProperty('文本编辑交互', '文本编辑交互.', false, false, [this, 'textEditingInteraction']),
                new BooleanProperty('文本编辑', '文本编辑.', false, false, [this, 'textEditing']),
                // new PositionProperty('位置', '经度纬度高度，度为单位', true, false, [this, 'position']),
                new NumberProperty('宽度', '宽度', true, false, [this, 'width'], ESTextLabel.defaults.width),
                new BooleanProperty('位置编辑', '位置编辑.', false, false, [this, 'positionEditing']),
                new Number4Property('原点比例和偏移', '原点比例和偏移.', false, false, [this, 'originRatioAndOffset']),
                new NumberProperty('透明度', '透明度', false, false, [this, 'opacity']),
                new Number4Property('边框圆角', '左上，右上，右下，左下.', false, false, [this, 'borderRadius']),
                new ColorProperty('边框颜色', ' 边框色.', false, false, [this, 'borderColor']),
                new NumberProperty('边框宽度', '边框宽度', false, false, [this, 'borderWidth']),
                new EnumProperty('文字位置', '文字位置', false, false, [this, 'textAlign'], [['center', 'center'], ['left', 'left'], ['right', 'right']]),
                // new NonreactiveJsonStringProperty('geoJson', '生成GeoJSON数据。', false, false, () => this.geoJsonStr, (value: string | undefined) => value && (this.geoJsonStr = value)),
                new EnumProperty('边框类型', '边框类型', false, false, [this, 'borderStyle'],
                    [['none', 'none'], ['hidden', 'hidden'], ['dotted', 'dotted'], ['dashed', 'dashed'], ['solid', 'solid'], ['double', 'double'],
                    ['groove', 'groove'], ['ridge', 'ridge'], ['inset', 'inset'], ['outset', 'outset'],]),
            ]),
        ];
    }
}

export namespace ESTextLabel {
    export const createDefaultProps = () => ({
        ...ESLabel.createDefaultProps(),
        text: undefined as string | undefined,
        width: undefined as number | undefined,
        textEditing: false,
        textEditingInteraction: false,
        // originRatioAndOffset: reactArray<[leftRatio: number, topRatio: number, leftOffset: number, topOffset: number]>([0.5, 1, 0, 0]),
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
        // showBackground: undefined as boolean | undefined,
        // pixelOffset: reactArrayWithUndefined<[number, number] | undefined>(undefined),
    });
}
extendClassProps(ESTextLabel.prototype, ESTextLabel.createDefaultProps);
export interface ESTextLabel extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESTextLabel.createDefaultProps>> { }