import {
    BooleanProperty, ColorProperty, EnumProperty, ESJFillStyle, ESJFlyInParam, ESJRenderType,
    ESJResource,
    ESJStrokeStyle, ESJVector2D, ESJVector4D, EvalStringProperty, FunctionProperty, GroupProperty, JsonProperty, Number2Property,
    NumberProperty, Property, StringProperty, UriProperty
} from "../../../ESJTypes";
import { ESSceneObject, ESVisualObject } from "../../../ESObjects/base";
import {
    Event, extendClassProps, JsonValue, Listener, reactJson,
    reactJsonWithUndefined, UniteChanged
} from "xbsj-base";
import {
    data, dataMd, defaultLoadFuncDocStr, defaultLoadFuncStr,
    ESJImageStyle, ESJTextStyle, isJSONString
} from "./type";
const url = '${earthsdk3-assets-script-dir}/assets/misc/2.geojson'

/**
 * GeoJson数据加载
 * ESGeoJson - https://www.wolai.com/earthsdk/uU8Lc9viWAjB7xnAxBabjx
 */
export class ESGeoJson extends ESVisualObject {
    static readonly type = this.register('ESGeoJson', this, { chsName: 'ESGeoJson', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "GeoJson数据加载" });
    get typeName() { return 'ESGeoJson'; }
    override get defaultProps() { return ESGeoJson.createDefaultProps(); }

    private _flyToFeatureEvent = this.dv(new Event<[string, any, number | undefined]>());
    get flyToFeatureEvent(): Listener<[string, any, number | undefined]> { return this._flyToFeatureEvent; }
    flyToFeature(key: string, value: any, duration?: number) { this._flyToFeatureEvent.emit(key, value, duration); }

    private _flyToFeatureIndexEvent = this.dv(new Event<[number, number | undefined]>());
    get flyToFeatureIndexEvent(): Listener<[number, number | undefined]> { return this._flyToFeatureIndexEvent; }
    flyToFeatureIndex(index: number, duration?: number) { this._flyToFeatureIndexEvent.emit(index, duration); }

    private _features = this.disposeVar(reactJsonWithUndefined<{ [xx: string]: any } | undefined>(undefined));
    get features() { return this._features.value; }
    set features(value: { [xx: string]: any } | undefined) { this._features.value = value; }
    get featuresChanged() { return this._features.changed; }

    public pickedInfoType: string = "FeatureCollection";
    getFeatures() {
        if (this.features) {
            return this.features;
        } else {
            console.log("数据未加载完成，请稍后调用此方法getFeatures()");
        }
    };

    constructor(id?: string) {
        super(id);
        this.ad(this.urlChanged.don(() => {
            if (!this.url) {
                this.features = undefined;
                return;
            };
            do {
                if (typeof this.url == 'object') {
                    this.features = this.url;
                    break;
                }
                if (isJSONString(this.url)) {
                    this.features = JSON.parse(this.url);
                    break;
                }
                fetch(ESSceneObject.context.getStrFromEnv(this.url)).then(response => response.json()).then(res => {
                    this.features = res;
                }).catch(err => {
                    console.warn("ESEntityCluster数据加载失败", err);
                })
            } while (false);
            this.pickedInfoType = this.features?.type ?? 'FeatureCollection';
        }))
    }
    static override defaults = {
        ...ESVisualObject.defaults,
        show: true,
        allowPicking: true,
        url: url,
        defaultLoadFuncStr: defaultLoadFuncStr,
        defaultLoadFuncDocStr: defaultLoadFuncDocStr,
        data: data,
        dataMd: dataMd,

        // 线样式
        stroked: true,
        strokeWidth: 1,
        strokeWidthType: "world",
        strokeColor: [0.79, 0.91, 0.06, 1] as ESJVector4D,
        strokeMaterial: "",
        strokeMaterialParams: {},
        strokeGround: false,
        // 面样式
        filled: true,
        fillColor: [0.79, 0.91, 0.06, 0.2] as ESJVector4D,
        fillMaterial: "",
        fillMaterialParams: {},
        fillGround: false,
        // 图片样式
        imageShow: true,
        imageUrl: "${xe2-assets-script-dir}/xe2-assets/scene-manager/images/location.png",
        imageSize: [32, 32] as ESJVector2D,
        imageAnchor: [0.5, 1] as ESJVector2D,
        imageOffset: [0, 0] as ESJVector2D,
        // 文本样式
        textShow: true,
        textProperty: "",
        textDefaultText: "默认标注",
        textColor: [1, 1, 1, 1] as ESJVector4D,
        textBackgroundColor: undefined as ESJVector4D | undefined,
        textFontFamily: "Arial",
        textFontStyle: 'normal',
        textFontSize: 16,
        textFontWeight: 'normal',
        textAnchor: [0, 1] as ESJVector2D,
        textOffset: [-16, 8] as ESJVector2D,
        strokeWidthTypes: [["screen", "screen"], ["world", "world"]] as [name: string, value: string][],
        flyInParam: { position: [0, 0, 0], rotation: [0, 0, 0], flyDuration: 1 } as ESJFlyInParam,
        minFeatureVisibleDistance: 0,
        maxFeatureVisibleDistance: 0,
        heightReferences: [['NONE', 'NONE'], ['CLAMP_TO_GROUND', 'CLAMP_TO_GROUND'], ['RELATIVE_TO_GROUND', 'RELATIVE_TO_GROUND']] as [name: string, value: string][]
    };
    override getESProperties() {
        return {
            defaultMenu: 'style',
            basic: [
                // new JsonProperty('数据', '数据', true, false, [this, 'data'], ESGeoJson.defaults.data, ESGeoJson.defaults.dataMd),
                // new UriProperty('路径', '路径', false, false, [this, 'uri'], ESGeoJson.defaults.url),
                // new ColorProperty('填充颜色', '填充颜色', false, false, [this, 'fillColor'], ESGeoJson.defaults.fillColor),
                // new ColorProperty('轮廓颜色', '轮廓颜色', false, false, [this, 'strokeColor'], ESGeoJson.defaults.strokeColor),
                // new NumberProperty('轮廓宽度', '轮廓宽度', false, false, [this, 'strokeWidth'], ESGeoJson.defaults.strokeWidth),
                // new ColorProperty('文字颜色', '文字颜色', false, false, [this, 'textColor'], ESGeoJson.defaults.textColor),
                // new NumberProperty('文字大小', '文字大小', false, false, [this, 'textFontSize'], ESGeoJson.defaults.textFontSize),
            ],
            general: [
                new StringProperty('名称', 'name', true, false, [this, 'name']),
                new StringProperty('唯一标识', 'id', false, true, [this, 'id']),
                new BooleanProperty('是否显示', 'show', false, false, [this, 'show'], true),
                new BooleanProperty('开启碰撞', 'collision', false, false, [this, 'collision'], false),
                new BooleanProperty('允许拾取', 'allowPicking', false, false, [this, 'allowPicking'], false),
                new FunctionProperty("保存观察视角", "保存当前视角", [], () => this.calcFlyInParam(), []),
            ],
            dataSource: [
                new JsonProperty('服务地址', '服务地址', true, false, [this, 'url'], ESGeoJson.defaults.url),
                new NumberProperty('要素最小可视距离', '要素最小可视距离', false, false, [this, 'minFeatureVisibleDistance'], ESGeoJson.defaults.minFeatureVisibleDistance),
                new NumberProperty('要素最大可视距离', '要素最大可视距离', false, false, [this, 'maxFeatureVisibleDistance'], ESGeoJson.defaults.maxFeatureVisibleDistance),
                new EnumProperty('高度参考', '高度参考', false, false, [this, 'heightReference'], ESGeoJson.defaults.heightReferences)],
            location: [],
            coordinate: [],
            style: [
                new GroupProperty('点文字样式', '点样式集合', []),
                new BooleanProperty("是否显示", '是否显示', false, false, [this, 'textShow'], ESGeoJson.defaults.textShow),
                new Number2Property('锚点', '锚点', false, false, [this, 'textAnchor'], ESGeoJson.defaults.textAnchor),
                new StringProperty("标注显示属性", '要用于显示的文本属性', false, false, [this, 'textProperty'], ESGeoJson.defaults.textProperty),
                new StringProperty("默认文本", '默认统一显示的文本', false, false, [this, 'textDefaultText'], ESGeoJson.defaults.textDefaultText),
                new ColorProperty("文本颜色", '文本颜色', false, false, [this, 'textColor'], ESGeoJson.defaults.textColor),
                new ColorProperty("背景颜色", '背景颜色', true, false, [this, 'textBackgroundColor'], ESGeoJson.defaults.textBackgroundColor),
                new StringProperty('字体样式', '字体样式', false, false, [this, 'textFontStyle'], ESGeoJson.defaults.textFontStyle),
                new StringProperty('字体粗细', '字体粗细', false, false, [this, 'textFontWeight'], ESGeoJson.defaults.textFontWeight),
                new NumberProperty('字体大小', '字体大小', false, false, [this, 'textFontSize'], ESGeoJson.defaults.textFontSize),
                new Number2Property('像素偏移', '像素偏移', false, false, [this, 'textOffset'], ESGeoJson.defaults.textOffset),
                new GroupProperty('点图片样式', '图片样式集合', []),
                new BooleanProperty("是否显示", '是否显示', false, false, [this, 'imageShow'], ESGeoJson.defaults.imageShow),
                new Number2Property("锚点", "锚点", false, false, [this, 'imageAnchor'], ESGeoJson.defaults.imageAnchor),
                new JsonProperty("图片地址", '图片地址', false, false, [this, 'imageUrl'], ESGeoJson.defaults.imageUrl),
                new Number2Property("图片大小", "图片大小", false, false, [this, 'imageSize'], ESGeoJson.defaults.imageSize),
                new Number2Property("像素偏移", "像素偏移", false, false, [this, 'imageOffset'], ESGeoJson.defaults.imageOffset),
                new GroupProperty('线样式', '线样式集合', []),
                new BooleanProperty("是否显示", '是否显示', false, false, [this, 'stroked'], ESGeoJson.defaults.stroked),
                new BooleanProperty("贴地", "贴地（线）", false, false, [this, 'strokeGround'], ESGeoJson.defaults.strokeGround),
                new NumberProperty("线宽", "线宽", false, false, [this, 'strokeWidth'], ESGeoJson.defaults.strokeWidth),
                new EnumProperty("线宽类型", "线宽类型", false, false, [this, 'strokeWidthType'], ESGeoJson.defaults.strokeWidthTypes),
                new ColorProperty("线颜色", "线颜色", false, false, [this, 'strokeColor'], ESGeoJson.defaults.strokeColor),
                new StringProperty("线材质", "线材质", false, false, [this, 'strokeMaterial'], ESGeoJson.defaults.strokeMaterial),
                new JsonProperty("线材质参数", "线材质参数", false, false, [this, 'strokeMaterialParams'], ESGeoJson.defaults.strokeMaterialParams),
                new GroupProperty('面样式', '面样式集合', []),
                new BooleanProperty("是否显示", '是否显示', false, false, [this, 'filled'], ESGeoJson.defaults.filled),
                new BooleanProperty("贴地", "贴地（面）", false, false, [this, 'fillGround'], ESGeoJson.defaults.fillGround),
                new ColorProperty("填充颜色", "填充颜色", false, false, [this, 'fillColor'], ESGeoJson.defaults.fillColor),
                new StringProperty("填充材质", "填充材质", false, false, [this, 'fillMaterial'], ESGeoJson.defaults.fillMaterial),
                new JsonProperty("填充材质参数", "填充材质参数", false, false, [this, 'fillMaterialParams'], ESGeoJson.defaults.fillMaterialParams),
            ],
        }
    };
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new BooleanProperty('是否显示', 'A boolean Property specifying the visibility .', false, false, [this, 'show'], ESGeoJson.defaults.show),
                new BooleanProperty('允许拾取', '是否允许拾取', false, false, [this, 'allowPicking'], ESGeoJson.defaults.allowPicking),
                new FunctionProperty("飞入", "飞入", ['number'], (duration: number) => this.flyTo(duration), [1]),
                new FunctionProperty("清空飞入参数", "清空飞入参数", [], () => this.emptyFlyInParam(), []),
                new FunctionProperty('保存飞入参数', '保存飞入参数flyInParam', [], () => this.calcFlyInParam(), []),
                new JsonProperty('flyInParam', 'flyInParam', true, false, [this, 'flyInParam'], ESGeoJson.defaults.flyInParam),
            ]),
            new GroupProperty('标注文本样式', '标注文本样式', [
                new BooleanProperty("是否显示", '是否显示', false, false, [this, 'textShow'], ESGeoJson.defaults.textShow),
                new StringProperty("标注显示属性", '要用于显示的文本属性', false, false, [this, 'textProperty'], ESGeoJson.defaults.textProperty),
                new StringProperty("默认文本", '默认统一显示的文本', false, false, [this, 'textDefaultText'], ESGeoJson.defaults.textDefaultText),
                new ColorProperty("文本颜色", '文本颜色', false, false, [this, 'textColor'], ESGeoJson.defaults.textColor),
                new ColorProperty("背景颜色", '背景颜色', true, false, [this, 'textBackgroundColor'], ESGeoJson.defaults.textBackgroundColor),
                new StringProperty('字体', '字体', false, false, [this, 'textFontFamily'], ESGeoJson.defaults.textFontFamily),
                new StringProperty('字体样式', '字体样式', false, false, [this, 'textFontStyle'], ESGeoJson.defaults.textFontStyle),
                new StringProperty('字体粗细', '字体粗细', false, false, [this, 'textFontWeight'], ESGeoJson.defaults.textFontWeight),
                new NumberProperty('字体大小', '字体大小', false, false, [this, 'textFontSize'], ESGeoJson.defaults.textFontSize),
                new Number2Property('锚点', '锚点', false, false, [this, 'textAnchor'], ESGeoJson.defaults.textAnchor),
                new Number2Property('像素偏移', '像素偏移', false, false, [this, 'textOffset'], ESGeoJson.defaults.textOffset),
            ]),
            new GroupProperty("标注图标样式", "标注图标样式", [
                new BooleanProperty("是否显示", '是否显示', false, false, [this, 'imageShow'], ESGeoJson.defaults.imageShow),
                new JsonProperty("图片地址", '图片地址', false, false, [this, 'imageUrl'], ESGeoJson.defaults.imageUrl),
                new Number2Property("图片大小", "图片大小", false, false, [this, 'imageSize'], ESGeoJson.defaults.imageSize),
                new Number2Property("锚点", "锚点", false, false, [this, 'imageAnchor'], ESGeoJson.defaults.imageAnchor),
                new Number2Property("像素偏移", "像素偏移", false, false, [this, 'imageOffset'], ESGeoJson.defaults.imageOffset),
            ]),
            new GroupProperty("线样式", "线样式", [
                new BooleanProperty("是否显示", '是否显示', false, false, [this, 'stroked'], ESGeoJson.defaults.stroked),
                new NumberProperty("线宽", "线宽", false, false, [this, 'strokeWidth'], ESGeoJson.defaults.strokeWidth),
                new EnumProperty("线宽类型", "线宽类型", false, false, [this, 'strokeWidthType'], ESGeoJson.defaults.strokeWidthTypes),
                new ColorProperty("线颜色", "线颜色", false, false, [this, 'strokeColor'], ESGeoJson.defaults.strokeColor),
                new StringProperty("线材质", "线材质", false, false, [this, 'strokeMaterial'], ESGeoJson.defaults.strokeMaterial),
                new JsonProperty("线材质参数", "线材质参数", false, false, [this, 'strokeMaterialParams'], ESGeoJson.defaults.strokeMaterialParams),
                new BooleanProperty("贴地（线）", "贴地（线）", false, false, [this, 'strokeGround'], ESGeoJson.defaults.strokeGround),
            ]),
            new GroupProperty('填充样式', '填充样式', [
                new BooleanProperty("是否显示", '是否显示', false, false, [this, 'filled'], ESGeoJson.defaults.filled),
                new ColorProperty("填充颜色", "填充颜色", false, false, [this, 'fillColor'], ESGeoJson.defaults.fillColor),
                new StringProperty("填充材质", "填充材质", false, false, [this, 'fillMaterial'], ESGeoJson.defaults.fillMaterial),
                new JsonProperty("填充材质参数", "填充材质参数", false, false, [this, 'fillMaterialParams'], ESGeoJson.defaults.fillMaterialParams),
                new BooleanProperty("贴地（面）", "贴地（面）", false, false, [this, 'fillGround'], ESGeoJson.defaults.fillGround),
            ]),
            new GroupProperty("通用", "通用", [
                new JsonProperty('服务地址', '服务地址', true, false, [this, 'url'], ESGeoJson.defaults.url),
                new EvalStringProperty('loadFnStr', 'loadFnStr', true, false, [this, 'loadFuncStr'], ESGeoJson.defaults.defaultLoadFuncStr, ESGeoJson.defaults.defaultLoadFuncDocStr),
                new NumberProperty('要素最小可视距离', '要素最小可视距离', false, false, [this, 'minFeatureVisibleDistance'], ESGeoJson.defaults.minFeatureVisibleDistance),
                new NumberProperty('要素最大可视距离', '要素最大可视距离', false, false, [this, 'maxFeatureVisibleDistance'], ESGeoJson.defaults.maxFeatureVisibleDistance),
                new EnumProperty('高度参考', '高度参考', false, false, [this, 'heightReference'], ESGeoJson.defaults.heightReferences)
            ]),
        ]
    }

    get strokeWidth() { return this.strokeStyle.width; }
    set strokeWidth(value: number) { this.strokeStyle = { ...this.strokeStyle, width: value } }
    get strokeWidthChanged() { return this.strokeStyleChanged; }

    get strokeWidthType() { return this.strokeStyle.widthType; }
    set strokeWidthType(value: ESJRenderType) { this.strokeStyle = { ...this.strokeStyle, widthType: value } }
    get strokeWidthTypeChanged() { return this.strokeStyleChanged; }

    get strokeColor() { return this.strokeStyle.color; }
    set strokeColor(value: ESJVector4D) { this.strokeStyle = { ...this.strokeStyle, color: [...value] } }
    get strokeColorChanged() { return this.strokeStyleChanged; }

    get strokeMaterial() { return this.strokeStyle.material; }
    set strokeMaterial(value: string) { this.strokeStyle = { ...this.strokeStyle, material: value } }
    get strokeMaterialChanged() { return this.strokeStyleChanged; }

    get strokeMaterialParams() { return this.strokeStyle.materialParams; }
    set strokeMaterialParams(value: JsonValue) { this.strokeStyle = { ...this.strokeStyle, materialParams: value } }
    get strokeMaterialParamsChanged() { return this.strokeStyleChanged; }

    get strokeGround() { return this.strokeStyle.ground; }
    set strokeGround(value: boolean) { this.strokeStyle = { ...this.strokeStyle, ground: value } }
    get strokeGroundChanged() { return this.strokeStyleChanged; }

    get fillColor() { return this.fillStyle.color; }
    set fillColor(value: ESJVector4D) { this.fillStyle = { ...this.fillStyle, color: [...value] } }
    get fillColorChanged() { return this.fillStyleChanged; }

    get fillMaterial() { return this.fillStyle.material; }
    set fillMaterial(value: string) { this.fillStyle = { ...this.fillStyle, material: value } }
    get fillMaterialChanged() { return this.fillStyleChanged; }

    get fillMaterialParams() { return this.fillStyle.materialParams; }
    set fillMaterialParams(value: JsonValue | undefined) { this.fillStyle = { ...this.fillStyle, materialParams: value } }
    get fillMaterialParamsChanged() { return this.fillStyleChanged; }

    get fillGround() { return this.fillStyle.ground; }
    set fillGround(value: boolean) { this.fillStyle = { ...this.fillStyle, ground: value } }
    get fillGroundChanged() { return this.fillStyleChanged; }

    get textProperty() { return this.textStyle.textProperty; }
    set textProperty(value: string) { this.textStyle = { ...this.textStyle, textProperty: value } }
    get textPropertyChanged() { return this.textStyleChanged; }
    get textDefaultText() { return this.textStyle.defaultText; }
    set textDefaultText(value: string) { this.textStyle = { ...this.textStyle, defaultText: value } }
    get textDefaultTextChanged() { return this.textStyleChanged; }
    get textColor() { return this.textStyle.color; }
    set textColor(value: ESJVector4D) { this.textStyle = { ...this.textStyle, color: value } }
    get textColorChanged() { return this.textStyleChanged; }
    get textBackgroundColor() { return this.textStyle.backgroundColor; }
    set textBackgroundColor(value: ESJVector4D | undefined) { this.textStyle = { ...this.textStyle, backgroundColor: value } }
    get textBackgroundColorChanged() { return this.textStyleChanged; }
    get textFontFamily() { return this.textStyle.fontFamily; }
    set textFontFamily(value: string) { this.textStyle = { ...this.textStyle, fontFamily: value } }
    get textFontFamilyChanged() { return this.textStyleChanged; }
    get textFontStyle() { return this.textStyle.fontStyle; }
    set textFontStyle(value: string) { this.textStyle = { ...this.textStyle, fontStyle: value } }
    get textFontStyleChanged() { return this.textStyleChanged; }
    get textFontWeight() { return this.textStyle.fontWeight; }
    set textFontWeight(value: string) { this.textStyle = { ...this.textStyle, fontWeight: value } }
    get textFontWeightChanged() { return this.textStyleChanged; }
    get textFontSize() { return this.textStyle.fontSize; }
    set textFontSize(value: number) { this.textStyle = { ...this.textStyle, fontSize: value } }
    get textFontSizeChanged() { return this.textStyleChanged; }
    get textAnchor() { return this.textStyle.anchor; }
    set textAnchor(value: ESJVector2D) { this.textStyle = { ...this.textStyle, anchor: value } }
    get textAnchorChanged() { return this.textStyleChanged; }
    get textOffset() { return this.textStyle.offset; }
    set textOffset(value: ESJVector2D) { this.textStyle = { ...this.textStyle, offset: value } }
    get textOffsetChanged() { return this.textStyleChanged; }

    get imageUrl() { return this.imageStyle.url; }
    set imageUrl(value: string | ESJResource) { this.imageStyle = { ...this.imageStyle, url: value } }
    get imageUrlChanged() { return this.imageStyleChanged; }
    get imageSize() { return this.imageStyle.size; }
    set imageSize(value: ESJVector2D) { this.imageStyle = { ...this.imageStyle, size: value } }
    get imageSizeChanged() { return this.imageStyleChanged; }
    get imageAnchor() { return this.imageStyle.anchor; }
    set imageAnchor(value: ESJVector2D) { this.imageStyle = { ...this.imageStyle, anchor: value } }
    get imageAnchorChanged() { return this.imageStyleChanged; }
    get imageOffset() { return this.imageStyle.offset; }
    set imageOffset(value: ESJVector2D) { this.imageStyle = { ...this.imageStyle, offset: value } }
    get imageOffsetChanged() { return this.imageStyleChanged; }

}

export namespace ESGeoJson {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: true as boolean,
        loadFuncStr: undefined as string | undefined,
        url: undefined as string | undefined | { [xx: string]: any },
        // 线样式
        stroked: true as boolean,
        strokeStyle: reactJson<ESJStrokeStyle>({
            width: 1,
            widthType: 'world',
            color: [0.79, 0.91, 0.06, 1],
            material: '',
            materialParams: {},
            ground: false
        }),
        // 面样式
        filled: true as boolean,
        fillStyle: reactJson<ESJFillStyle>({
            color: [0.79, 0.91, 0.06, 0.2],
            material: '',
            materialParams: {},
            ground: false
        }),
        // 图片样式
        imageShow: true as boolean,
        imageStyle: reactJson<ESJImageStyle>({
            url: "${earthsdk3-assets-script-dir}/assets/img/location.png" as string | ESJResource,
            size: [32, 32],
            anchor: [0.5, 1],
            offset: [0, 0],
        }),
        // 文本样式
        textShow: true as boolean,
        textStyle: reactJson<ESJTextStyle>({
            textProperty: "",
            defaultText: "默认标注",
            color: [1, 1, 1, 1],
            backgroundColor: undefined,
            fontFamily: "Arial" as string,
            fontSize: 16 as number,
            fontStyle: 'normal' as string,
            fontWeight: 'normal' as string,
            anchor: [0, 1],
            offset: [16, -8]
        }),
        minFeatureVisibleDistance: 0 as number,
        maxFeatureVisibleDistance: 0 as number,
        flyInParam: reactJsonWithUndefined<ESJFlyInParam>(undefined),
        heightReference: "NONE" as "NONE" | "RELATIVE_TO_GROUND" | "CLAMP_TO_GROUND",
    });
}
extendClassProps(ESGeoJson.prototype, ESGeoJson.createDefaultProps);
export interface ESGeoJson extends UniteChanged<ReturnType<typeof ESGeoJson.createDefaultProps>> { }
