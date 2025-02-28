import { extendClassProps, reactJson, UniteChanged } from "xbsj-base";
import { BooleanProperty, ColorProperty, EnumProperty, GroupProperty, JsonProperty, NumberProperty } from "../../ESJTypes";
import { ESSceneObject } from "../base";
import { ESGeoPolygon } from "./ESGeoPolygon";


export type ESJTexture = {
    url: string,
    uDis: number,
    vDis: number,
}

export class ESPit extends ESGeoPolygon {
    static override readonly type = this.register('ESPit', this, { chsName: '坑', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: '坑' });
    override get typeName() { return 'ESPit'; }
    override get defaultProps() { return ESPit.createDefaultProps(); }

    constructor(id?: string) {
        super(id);
        this.collision = false;
        this.allowPicking = false;
        this.filled = true;
    }
    // depth:100（米，设置坑深度），
    // sideImage:侧面图片地址、图片uv距离
    // bottomImage:底面图片地址、图片uv距离
    // opacity:透明度
    static override defaults = {
        ...ESGeoPolygon.defaults,
        depth: 100,
        sideImage: { url: ESSceneObject.context.getStrFromEnv("${earthsdk3-assets-script-dir}/assets/img/ESPit/side.jpg"), uDis: 50, vDis: 50 } as ESJTexture,
        bottomImage: { url: ESSceneObject.context.getStrFromEnv("${earthsdk3-assets-script-dir}/assets/img/ESPit/bottom.jpg"), uDis: 50, vDis: 50 } as ESJTexture,
        opacity: 1,
        interpolation: 50,
    }

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new NumberProperty('深度', '坑深度（米）', false, false, [this, 'depth'], ESPit.defaults.depth),
                new NumberProperty('插值', '插值距离（米）', false, false, [this, 'interpolation'], ESPit.defaults.interpolation),
                new NumberProperty('透明度', '透明度', false, false, [this, 'opacity'], ESPit.defaults.opacity),
                new JsonProperty('侧面图片', '侧面图片', false, false, [this, 'sideImage'], ESPit.defaults.sideImage),
                new JsonProperty('底面图片', '底面图片', false, false, [this, 'bottomImage'], ESPit.defaults.bottomImage),
            ],
            style: [
                new GroupProperty('点样式', '点样式集合', []),
                new BooleanProperty('开启', '开启点样式', false, false, [this, 'pointed'], false),
                new NumberProperty('点大小', '点大小(pointSize)', false, false, [this, 'pointSize'], 1),
                new EnumProperty('点类型', '点类型(pointSizeType)', false, false, [this, 'pointSizeType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('点颜色', '点颜色(pointColor)', false, false, [this, 'pointColor'], [1, 1, 1, 1]),
                new GroupProperty('线样式', '线样式集合', []),
                new BooleanProperty('开启', '开启线样式', false, false, [this, 'stroked'], true),
                new NumberProperty('线宽', '线宽(strokeWidth)', false, false, [this, 'strokeWidth'], 1),
                new EnumProperty('线类型', '线类型(strokeWidthType)', false, false, [this, 'strokeWidthType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('线颜色', '线颜色(strokeColor)', false, false, [this, 'strokeColor'], [1, 1, 1, 1]),
                new BooleanProperty('是否贴地', '是否贴地(线)', false, false, [this, 'strokeGround'], false),
                new GroupProperty('面样式', '面样式集合', []),
                new BooleanProperty('开启', '开启填充样式', false, false, [this, 'filled'], true),
                new ColorProperty('填充颜色', '填充颜色(fillColor)', false, false, [this, 'fillColor'], [1, 1, 1, 1]),
                new BooleanProperty('是否贴地', '是否贴地', false, false, [this, 'fillGround'], false),
            ],
        }
    }
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('深度', '坑深度（米）', false, false, [this, 'depth'], ESPit.defaults.depth),
                new NumberProperty('插值', '插值距离（米）', false, false, [this, 'interpolation'], ESPit.defaults.interpolation),
                new JsonProperty('侧面图片', '侧面图片', false, false, [this, 'sideImage'], ESPit.defaults.sideImage),
                new JsonProperty('底面图片', '底面图片', false, false, [this, 'bottomImage'], ESPit.defaults.bottomImage),
                new NumberProperty('opacity', '透明度', false, false, [this, 'opacity'], ESPit.defaults.opacity),
            ]),
        ];
    }
}

export namespace ESPit {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        depth: 100,
        sideImage: reactJson<ESJTexture>(ESPit.defaults.sideImage),
        bottomImage: reactJson<ESJTexture>(ESPit.defaults.bottomImage),
        opacity: 1,
        interpolation: 50,
    })
}

extendClassProps(ESPit.prototype, ESPit.createDefaultProps);
export interface ESPit extends UniteChanged<ReturnType<typeof ESPit.createDefaultProps>> { }
