import { extendClassProps, JsonValue, reactJson, UniteChanged } from "xbsj-base";
import {
    BooleanProperty, ColorProperty, EnumProperty, ESJFillStyle, ESJPointStyle, ESJRenderType,
    ESJStrokeStyle, GroupProperty, JsonProperty, NumberProperty, StringProperty
} from "../../ESJTypes";
import { ESObjectWithLocation } from "./ESObjectWithLocation";
/**
 * https://www.wolai.com/earthsdk/8ZYnmuDDkpCLCGrvtFyuDv
 */
export abstract class ESLocalVector extends ESObjectWithLocation {

    // TODO 这俩函数涉及UE,暂时不实现
    // async getStrokeMaterialParamInfo<V extends ESViewer>(viewer: V) {
    //     return await viewer.getStrokeMaterialParamInfo(this.id)
    // }

    // async getFillMaterialParamInfo<V extends ESViewer>(viewer: V) {
    //     return await viewer.getFillMaterialParamInfo(this.id)
    // }

    // TODO 这俩函数涉及Cesium,暂时不实现
    // positionsToLocalPositions(options: {
    //     originPosition?: [number, number, number];
    //     originRotation?: [number, number, number];
    //     initialRotationMode?: "XForwardZUp" | "YForwardZUp";
    //     originScale?: [number, number, number];
    // }, positions: [number, number, number][]) {
    //     return positionsToLocalPositions(options, positions)
    // }

    // localPositionsToPositions(options: {
    //     originPosition?: [number, number, number];
    //     originRotation?: [number, number, number];
    //     initialRotationMode?: "XForwardZUp" | "YForwardZUp";
    //     originScale?: [number, number, number];
    // }, localPositons: [number, number, number][]) {
    //     return localPositionsToPositions(options, localPositons)
    // }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        pointStyle: {
            size: 1,
            sizeType: 'screen',
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {}
        } as ESJPointStyle,
        strokeStyle: {
            width: 1,
            widthType: 'screen',
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {},
            ground: false
        } as ESJStrokeStyle,
        fillStyle: {
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {},
            ground: false
        } as ESJFillStyle,
        pointed: false,
        stroked: false,
        filled: false
    };

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            style: [
                ...properties.style,
                new GroupProperty('点样式', '点样式集合', []),
                new BooleanProperty('开启点样式', '开启点样式', false, false, [this, 'pointed'], false),
                new NumberProperty('点大小', '点大小(pointSize)', false, false, [this, 'pointSize'], 1),
                new EnumProperty('点类型', '点类型(pointSizeType)', false, false, [this, 'pointSizeType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('点颜色', '点颜色(pointColor)', false, false, [this, 'pointColor'], [1, 1, 1, 1]),
                new GroupProperty('线样式', '线样式集合', []),
                new BooleanProperty('开启线样式', '开启线样式', false, false, [this, 'stroked'], false),
                new BooleanProperty('是否贴地(线)', '是否贴地(线)', false, false, [this, 'strokeGround'], false),
                new NumberProperty('线宽', '线宽(strokeWidth)', false, false, [this, 'strokeWidth'], 1),
                new EnumProperty('线类型', '线类型(strokeWidthType)', false, false, [this, 'strokeWidthType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('线颜色', '线颜色(strokeColor)', false, false, [this, 'strokeColor'], [1, 1, 1, 1]),
                new GroupProperty('面样式', '面样式集合', []),
                new BooleanProperty('开启填充样式', '开启填充样式', false, false, [this, 'filled'], false),
                new BooleanProperty('是否贴地', '是否贴地', false, false, [this, 'fillGround'], false),
                new ColorProperty('填充颜色', '填充颜色(fillColor)', false, false, [this, 'fillColor'], [1, 1, 1, 1]),
            ]
        }
    };
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESLocalVector', 'ESLocalVector', [

                new JsonProperty('点样式', '点样式(pointMaterialParams)', false, false, [this, 'pointStyle']),
                new JsonProperty('线样式', '线样式(strokeMaterialParams)', false, false, [this, 'strokeStyle']),
                new JsonProperty('填充样式', '填充样式(fillMaterialParams)', false, false, [this, 'fillStyle']),

                new GroupProperty('点样式', '点样式', [
                    new BooleanProperty('开启点样式', '开启点样式', false, false, [this, 'pointed']),
                    new NumberProperty('点大小', '点大小(pointSize)', false, false, [this, 'pointSize']),
                    new EnumProperty('点类型', '点类型(pointSizeType)', false, false, [this, 'pointSizeType'], [['screen', 'screen'], ['world', 'world']]),
                    new ColorProperty('点颜色', '点颜色(pointColor)', false, false, [this, 'pointColor']),
                    new StringProperty('点材质', '点材质(pointMaterial)', false, false, [this, 'pointMaterial']),
                    new JsonProperty('点材质参数', '点材质参数(pointMaterialParams)', false, false, [this, 'pointMaterialParams']),
                ]),
                new GroupProperty('线样式', '线样式', [
                    new BooleanProperty('开启线样式', '开启线样式', false, false, [this, 'stroked']),
                    new NumberProperty('线宽', '线宽(strokeWidth)', false, false, [this, 'strokeWidth']),
                    new EnumProperty('线类型', '线类型(strokeWidthType)', false, false, [this, 'strokeWidthType'], [['screen', 'screen'], ['world', 'world']]),
                    new ColorProperty('线颜色', '线颜色(strokeColor)', false, false, [this, 'strokeColor']),
                    new StringProperty('线材质', '线材质(strokeMaterial)', false, false, [this, 'strokeMaterial']),
                    new JsonProperty('线材质参数', '线材质参数(strokeMaterialParams)', false, false, [this, 'strokeMaterialParams']),
                    new BooleanProperty('是否贴地(线)', '是否贴地(线)', false, false, [this, 'strokeGround'], false),
                ]),
                new GroupProperty('填充样式', '填充样式', [
                    new BooleanProperty('开启填充样式', '开启填充样式', false, false, [this, 'filled']),
                    new ColorProperty('填充颜色', '填充颜色(fillColor)', false, false, [this, 'fillColor']),
                    new StringProperty('面材质', '面材质(fillMaterial)', false, false, [this, 'fillMaterial']),
                    new JsonProperty('面材质参数', '面材质参数(fillMaterialParams)', false, false, [this, 'fillMaterialParams']),
                    new BooleanProperty('是否贴地', '是否贴地', false, false, [this, 'fillGround']),
                ]),
            ]),
        ];
    }

    get pointSize() { return this.pointStyle.size; }
    set pointSize(value: number) { this.pointStyle = { ...this.pointStyle, size: value } }
    get pointSizeChanged() { return this.pointStyleChanged; }

    get pointSizeType() { return this.pointStyle.sizeType }
    set pointSizeType(value: ESJRenderType) { this.pointStyle = { ...this.pointStyle, sizeType: value } }
    get pointSizeTypeChanged() { return this.pointStyleChanged; }

    get pointColor() { return this.pointStyle.color }
    set pointColor(value: [number, number, number, number]) { this.pointStyle = { ...this.pointStyle, color: [...value] } }
    get pointColorChanged() { return this.pointStyleChanged; }

    get pointMaterial() { return this.pointStyle.material; }
    set pointMaterial(value: string) { this.pointStyle = { ...this.pointStyle, material: value } }
    get pointMaterialChanged() { return this.pointStyleChanged; }

    get pointMaterialParams() { return this.pointStyle.materialParams; }
    set pointMaterialParams(value: JsonValue) { this.pointStyle = { ...this.pointStyle, materialParams: value } }
    get pointMaterialParamsChanged() { return this.pointStyleChanged; }

    get strokeWidth() { return this.strokeStyle.width; }
    set strokeWidth(value: number) { this.strokeStyle = { ...this.strokeStyle, width: value } }
    get strokeWidthChanged() { return this.strokeStyleChanged; }

    get strokeWidthType() { return this.strokeStyle.widthType; }
    set strokeWidthType(value: ESJRenderType) { this.strokeStyle = { ...this.strokeStyle, widthType: value } }
    get strokeWidthTypeChanged() { return this.strokeStyleChanged; }

    get strokeColor() { return this.strokeStyle.color; }
    set strokeColor(value: [number, number, number, number]) { this.strokeStyle = { ...this.strokeStyle, color: [...value] } }
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
    set fillColor(value: [number, number, number, number]) { this.fillStyle = { ...this.fillStyle, color: [...value] } }
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
}

export namespace ESLocalVector {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        pointed: false,
        pointStyle: reactJson<ESJPointStyle>(ESLocalVector.defaults.pointStyle),
        stroked: false,
        strokeStyle: reactJson<ESJStrokeStyle>(ESLocalVector.defaults.strokeStyle),
        filled: false,
        fillStyle: reactJson<ESJFillStyle>(ESLocalVector.defaults.fillStyle),
    });
}
extendClassProps(ESLocalVector.prototype, ESLocalVector.createDefaultProps);
export interface ESLocalVector extends UniteChanged<ReturnType<typeof ESLocalVector.createDefaultProps>> { }
