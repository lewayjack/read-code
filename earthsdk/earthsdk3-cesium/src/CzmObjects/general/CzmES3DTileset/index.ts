import * as Cesium from 'cesium';
import { bind, Destroyable, JsonValue, react, track } from 'xbsj-base';
import { Czm3DTiles } from './Czm3DTiles';
import { ES3DTileset, ESJFeatureStyleConditionItemType, ESJFeatureStyleType, ESSceneObject, FeatureColorJsonType, FeatureVisableJsonType } from "earthsdk3";
import { CzmESVisualObject } from '../../base';
import { CzmFlattenedPlane } from '../CzmESPolygonFlattenedPlane';
import { CzmClippingPlanes } from '../CzmESClippingPlane';
import { ColorStyleConditionItem, getColor, getShow, quColor, ShowStyleConditionItem } from './utils';
import { ESCesiumViewer } from '@czmSrc/ESCesiumViewer';
export * from './Czm3DTiles';

let baseColor: [number, number, number] = [1, 1, 1];
class CityShaderInstance extends Destroyable {
    constructor(sceneObject: Czm3DTiles, czmViewer: ESCesiumViewer) {
        super();
        // Use the checkerboard red channel as a mask
        const shader = new Cesium.CustomShader({
            uniforms: {
                u_baseColor: {
                    type: Cesium.UniformType.VEC3,
                    value: Cesium.Cartesian3.fromArray(baseColor)
                }
            },
            //lightingModel: Cesium.LightingModel.UNLIT,
            fragmentShaderText: `
              // Color tiles by distance to the camera
              void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
              {
            // 可以修改的参数
            // 注意shader中写浮点数是，一定要带小数点，否则会报错，比如0需要写成0.0，1要写成1.0
            float _baseHeight = 0.0; // 物体的基础高度，需要修改成一个合适的建筑基础高度
            float _heightRange = 100.0; // 高亮的范围(_baseHeight ~ _baseHeight + _heightRange) 默认是 0-60米
            float _glowRange = 300.0; // 光环的移动范围(高度)

            // 建筑基础色
            float vtxf_height = fsInput.attributes.positionMC.z - _baseHeight;
            float vtxf_a11 = fract(czm_frameNumber / 120.0) * 3.14159265 * 2.0;
            float vtxf_a12 = vtxf_height / _heightRange + sin(vtxf_a11) * 0.1;
            material.diffuse *= vec3(vtxf_a12, vtxf_a12, vtxf_a12);
            material.diffuse *= u_baseColor;

            // 动态光环
            float vtxf_a13 = fract(czm_frameNumber / 360.0);
            float vtxf_h = clamp(vtxf_height / _glowRange, 0.0, 1.0);
            vtxf_a13 = abs(vtxf_a13 - 0.5) * 2.0;
            float vtxf_diff = step(0.005, abs(vtxf_h - vtxf_a13));
            material.diffuse += material.diffuse * (1.0 - vtxf_diff);

                  //material.diffuse = vec3(0.0, 0.0, 1.0);
                  //material.diffuse.g = -fsInput.attributes.positionEC.z / 1.0e4;
              }
              `,
        });
        this._customShader = shader;
    }
    update() {
        alert('暂未实现!');
    }
    private _customShader
    get customShader() {
        return this._customShader;
    }
}
/**
 * 
 * @param lbh 第一个坐标
 * @param lbhOffset 以经纬度为单位的偏移量
 * @returns 以米未单位的偏移量
 */
const diffInMeters = (lbh: [number, number, number], lbhOffset: [number, number, number]) => {
    if (!lbh) return;
    const db = 6378137 * Math.PI / 180; // 米/度
    const [l, b, h] = lbh;
    const dl = db * Math.cos(b * Math.PI / 180); // 经度上的米单位所放量
    const dl_1 = 1 / dl; // 经度上的度单位所放量

    const inMeters = [lbhOffset[0] / dl_1, lbhOffset[1] / dl_1, lbhOffset[2]]

    return inMeters
}

/**
 * 
 * @param lbh 以度和米为单位的经纬度表示
 * @param diffInMeters 以米未单位的偏移量，分别表示朝东、北、上的偏移量
 * @returns 第二个点位的经纬度
 */
const lbhAddInMeters = (lbh: [number, number, number], diffInMeters: [number, number, number]) => {
    const db = 6378137 * Math.PI / 180; // 米/度
    const [l, b, h] = lbh;
    const df = diffInMeters;
    const dl = db * Math.cos(b * Math.PI / 180); // 经度上的米单位所放量
    const dl_1 = 1 / dl; // 经度上的度单位所放量
    return [l + dl_1 * df[0], b + dl_1 * df[1], h + df[2]] as [number, number, number]
}

function toRgbaString(rgba: [number, number, number, number]) {
    //0到1转为0到255
    return `rgba(${rgba[0] * 255},${rgba[1] * 255},${rgba[2] * 255},${rgba[3]})`;
}

function getColorSymbol(item: FeatureColorJsonType, featureName: string) {
    /**
     * 判断符号:value存在为=;minValue存在为>=;maxValue存在为<=
     */
    const flag = Reflect.has(item, 'value');
    const flag1 = Reflect.has(item, 'minValue');
    const flag2 = Reflect.has(item, 'maxValue');
    try {
        const value = (typeof item.value === 'string') ? (`'${item.value}'`) : item.value;
        if (flag) return [`\${${featureName}} === ` + value, toRgbaString(item.rgba)];
        if (flag1 && flag2) return [`\${${featureName}} >= ${item.minValue} && \${${featureName}} <= ${item.maxValue}`, toRgbaString(item.rgba)];
        if (flag1) return [`\${${featureName}} >= ${item.minValue}`, toRgbaString(item.rgba)];
        if (flag2) return [`\${${featureName}} <= ${item.maxValue}`, toRgbaString(item.rgba)];
        if (!flag && !flag1 && !flag2) throw new Error(`Feature Color JSON错误,${item}中至少应该有一个属性,value|minValue|maxValue, rgba值为0~1且必须存在!`);
    } catch (error) {
        throw new Error(`Feature Color JSON错误,${item}中至少应该有一个属性,value|minValue|maxValue, rgba值为0~1且必须存在! ${error}`);
    }
}
function getVisableSymbol(item: FeatureVisableJsonType, featureName: string) {
    /**
     * 判断符号:value存在为=;minValue存在为>=;maxValue存在为<=
     */
    const flag = Reflect.has(item, 'value');
    const flag1 = Reflect.has(item, 'minValue');
    const flag2 = Reflect.has(item, 'maxValue');
    try {
        const value = (typeof item.value === 'string') ? (`'${item.value}'`) : item.value;
        if (flag) return [`\${${featureName}} === ` + value, item.visable.toString()];
        if (flag1 && flag2) return [`\${${featureName}} >= ${item.minValue} && \${${featureName}} <= ${item.maxValue}`, item.visable.toString()];
        if (flag1) return [`\${${featureName}} >= ${item.minValue}`, item.visable.toString()];
        if (flag2) return [`\${${featureName}} <= ${item.maxValue}`, item.visable.toString()];
        if (!flag && !flag1 && !flag2) throw new Error(`Feature Visable JSON错误,${item}中至少应该有一个属性,value|minValue|maxValue, visable必须存在!`);
    } catch (error) {
        throw new Error(`Feature Visable JSON错误,${item}中至少应该有一个属性,value|minValue|maxValue, visable必须存在! ${error}`);
    }
}

// export class CzmES3DTileset extends CzmESVisualObject<ES3DTileset> {
export class CzmES3DTileset<T extends ES3DTileset = ES3DTileset> extends CzmESVisualObject<T> {
    // static readonly type = this.register(ES3DTileset.type, this);
    static readonly type = this.register<ES3DTileset, ESCesiumViewer>("ESCesiumViewer", ES3DTileset.type, this);
    private _czm3DTiles: Czm3DTiles;
    get czm3DTiles() { return this._czm3DTiles }

    private _clippingPlanes;
    get clippingPlanes() { return this._clippingPlanes; }

    private _flattenedPlane;
    get flattenedPlane() { return this._flattenedPlane; }

    private _styleColor = this.dv(react<[string, string][] | undefined>(undefined));
    get styleColor() { return this._styleColor.value; }
    set styleColor(value: [string, string][] | undefined) { this._styleColor.value = value; }

    private _highlightStyleColor = this.dv(react<[string, string] | undefined>(undefined));
    get highlightStyleColor() { return this._highlightStyleColor.value; }
    set highlightStyleColor(value: [string, string] | undefined) { this._highlightStyleColor.value = value; }

    private _styleVisable = this.dv(react<[string, string][] | undefined>(undefined));
    get styleVisable() { return this._styleVisable.value; }
    set styleVisable(value: [string, string][] | undefined) { this._styleVisable.value = value; }

    highlightFeature(id: string | number, color?: string) {
        const rgba = color ?? `rgba(255,0,0,1)`
        const ids = (typeof id === 'string') ? (`'${id}'`) : id;
        const key = "id";
        const condition = [`\${${key}} === ` + ids, rgba] as [string, string];
        let style: JsonValue = {};
        const conditions = this.styleColor ? [condition, ...this.styleColor] : [condition];
        if (this.styleVisable) {
            style = {
                "show": { "conditions": [...this.styleVisable] },
                "color": { "conditions": [...conditions] }
            };
        } else {
            style = { "color": { "conditions": [...conditions] } };
        }
        console.log('style', style)
        this._czm3DTiles.styleJson = style;
        this.highlightStyleColor = [...condition];
    }
    /**
     * 注意：先恢复成初始样式再设置
     * 1.反转来避免区间重复判断不生效问题
     * 2.组织成conditions数组
     * 3.组织成json设置styleJson
     */
    setFeatureColor(conditionss: [string, string][]) {
        const highlightColor = this.highlightStyleColor
        const conditions = this.styleColor ? [...conditionss, ...this.styleColor] : [...conditionss]
        let style: JsonValue = {};
        if (this.styleVisable) {
            if (highlightColor) {
                style = {
                    "show": { "conditions": [...this.styleVisable] },
                    "color": { "conditions": [...conditions, highlightColor] }
                };
            } else {
                style = {
                    "show": { "conditions": [...this.styleVisable] },
                    "color": { "conditions": [...conditions] }
                };
            }
        } else {
            if (highlightColor) {
                style = {
                    "color": { "conditions": [...conditions, highlightColor] }
                };
            } else {
                style = {
                    "color": { "conditions": [...conditions] }
                };
            }
        }
        console.log('style', style)
        this._czm3DTiles.styleJson = style;
        this.styleColor = [...conditions];
    }

    setFeatureVisable(conditionss: [string, string][]) {
        let style: JsonValue = {};
        const highlightColor = this.highlightStyleColor
        const conditions = this.styleVisable ? [...conditionss, ...this.styleVisable] : [...conditionss]
        if (this.styleColor) {
            if (highlightColor) {
                style = {
                    "show": { "conditions": [...conditions] },
                    "color": { "conditions": [highlightColor, ...this.styleColor] }
                };
            } else {
                style = {
                    "show": { "conditions": [...conditions] },
                    "color": { "conditions": [...this.styleColor] }
                };
            }
        } else {
            if (highlightColor) {
                style = {
                    "show": { "conditions": [...conditions] },
                    "color": { "conditions": [highlightColor] }
                };
            } else {
                style = {
                    "show": { "conditions": [...conditions] },
                };
            }
        }
        console.log('style', style)
        this._czm3DTiles.styleJson = style;
        this.styleVisable = [...conditions];
    }
    resetFeatureStyle() {
        this.czm3DTiles.styleJson = undefined;
        this.styleColor = undefined;
        this.highlightStyleColor = undefined;
        this.styleVisable = undefined;
    }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._flattenedPlane = this.dv(new CzmFlattenedPlane(czmViewer, sceneObject.id))
        this._czm3DTiles = this.dv(new Czm3DTiles(czmViewer, this, sceneObject.id));
        this._clippingPlanes = this.dv(new CzmClippingPlanes(czmViewer, sceneObject.id))
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czm3DTiles = this._czm3DTiles

        {
            // czm3DTiles.setPositionAsOrigin()
            const update = () => {
                if (!czm3DTiles.position) return;
                const lbhOffset = czm3DTiles.position.map((e, i) => {
                    if (!czm3DTiles.origin) return;
                    return e - czm3DTiles.origin[i]
                }) as [number, number, number]
                if (!czm3DTiles.origin) return;
                sceneObject.offset = diffInMeters(czm3DTiles.origin, lbhOffset) as [number, number, number]
            }
            update()
            this.d(czm3DTiles.positionChanged.don(update))
        }

        // ES3DTileset offset 修改
        {
            const update = () => {
                if (!czm3DTiles.origin) return;
                if (!sceneObject.offset) {
                    czm3DTiles.position = undefined
                    return;
                }
                czm3DTiles.position = lbhAddInMeters(czm3DTiles.origin, sceneObject.offset)
            }
            update()
            this.d(sceneObject.offsetChanged.don(update))
            this.d(czm3DTiles.originChanged.don(update))
        }
        // Czm3DTiles position 修改

        const clippingPlanes = this._clippingPlanes
        const flattenedPlane = this._flattenedPlane

        //ysp
        {
            /**
             * 控制style
             */
            this.d(sceneObject.setFeatureColorEvent.don((name, json) => {
                const reverseJson = json.reverse()
                const conditions = reverseJson.map(item => {
                    return getColorSymbol(item, name) as [string, string]
                })
                this.setFeatureColor(conditions)
            }));
            this.d(sceneObject.setFeatureVisableEvent.don((name, json) => {
                const reverseJson = json.reverse()
                const conditions = reverseJson.map(item => {
                    return getVisableSymbol(item, name) as [string, string]
                })
                this.setFeatureVisable(conditions)
            }));
            this.d(sceneObject.resetFeatureStyleEvent.don(() => { this.resetFeatureStyle() }));

            this.d(sceneObject.highlightFeatureEvent.don((id, color) => { this.highlightFeature(id, color); }))

            this.d(sceneObject.highlightFeatureAndFlyToEvent.don((id, sphere, color, duration) => {
                color && this.highlightFeature(id, color);
                const center = new Cesium.Cartesian3(sphere[0], sphere[1], sphere[2]);
                const boundingSphere = new Cesium.BoundingSphere(center, sphere[3]);
                viewer.camera.flyToBoundingSphere(boundingSphere, { duration: duration ?? 1 });
            }))

            //setFeatureStyle getFeatureTable
            {
                this.d(czm3DTiles.czmTilesetReadyEvent.don((tileset) => {
                    /**
                     * 1.ESJFeatureStyleConditionItemType转换成ESJStyleConditionItemType,拍平数组
                     * 2.根据ESJStyleConditionItemType生成Cesium3DTileStyle
                     * 3.设置Cesium3DTileStyle
                     */
                    const updateStyle = (json: ESJFeatureStyleType) => {
                        tileset.style = undefined;//重置样式
                        if (json.length === 0) return;
                        const conditions = [...json];
                        //排序
                        // const sortConditions = [...conditions].reverse()
                        const colorStyleConditionItemList: ColorStyleConditionItem[] = [];
                        const showStyleConditionItemList: ShowStyleConditionItem[] = [];
                        let style: Cesium.Cesium3DTileStyle;
                        //1.拍平数组
                        {
                            conditions.forEach((item: ESJFeatureStyleConditionItemType) => {
                                if (!Array.isArray(item.condition)) {
                                    colorStyleConditionItemList.push({ condition: [item.condition], color: item.color ?? [1, 1, 1, 1] });
                                    showStyleConditionItemList.push({ condition: [item.condition], show: item.show ?? true });
                                } else {
                                    colorStyleConditionItemList.push({ condition: item.condition, color: item.color ?? [1, 1, 1, 1] });
                                    showStyleConditionItemList.push({ condition: item.condition, show: item.show ?? true });
                                }
                            })
                        }
                        //2.生成Cesium3DTileStyle
                        {
                            /**
                             * 1.筛选出针对该feature的所有condition
                             * 2.根据condition生成Cesium.Color
                             * 3.取第一个符合条件的Cesium.Color
                             */
                            const evaluateColor = (feature: Cesium.Cesium3DTileFeature, result: Cesium.Color | undefined) => {
                                try {
                                    let tileColor: Cesium.Color | undefined = undefined;
                                    colorStyleConditionItemList.forEach((item) => {
                                        if (tileColor === undefined) {
                                            const flags = getColor(item, feature);
                                            if (flags.length > 0 && !flags.includes(false)) {
                                                //只取第一条
                                                tileColor = quColor(item.color, result);
                                            }
                                        }
                                    });
                                    if (tileColor) {
                                        return tileColor;
                                    } else {
                                        return Cesium.Color.clone(Cesium.Color.WHITE, result);
                                    }
                                } catch (error) {
                                    return Cesium.Color.clone(Cesium.Color.WHITE, result);
                                }
                            };

                            /**
                             * 1.筛选出针对该feature的所有condition
                             * 2.根据condition生成boolean
                             * 3.取第一个符合条件的boolean
                             */
                            const evaluateShow = (feature: Cesium.Cesium3DTileFeature) => {
                                try {
                                    let tileShow: boolean | undefined = undefined;
                                    showStyleConditionItemList.forEach((item) => {
                                        if (tileShow === undefined) {
                                            const flags = getShow(item, feature);
                                            if (flags.length > 0 && (!flags.includes(false))) {
                                                tileShow = item.show;
                                            }
                                        }
                                    });
                                    if (tileShow !== undefined) {
                                        return tileShow;
                                    } else {
                                        return true;
                                    }
                                } catch (error) {
                                    return true;
                                }
                            };

                            //生成Cesium3DTileStyle
                            style = new Cesium.Cesium3DTileStyle({
                                color: {
                                    evaluateColor: function (feature: Cesium.Cesium3DTileFeature, result?: Cesium.Color) {
                                        return evaluateColor(feature, result);
                                    },
                                },
                                show: {
                                    evaluate: function (feature: Cesium.Cesium3DTileFeature) {
                                        return evaluateShow(feature);
                                    },
                                },
                            });
                        }
                        // 3.设置Cesium3DTileStyle
                        {
                            tileset.style = style;
                        }
                    }
                    this.d(sceneObject.setFeatureStyleEvent.don((json) => { updateStyle(json) }));
                    this.d(sceneObject.resetFeatureStyleEvent.don(() => { tileset.style = undefined; }));

                    {//getFeatureTable
                        const that = this;
                        const featureTable: { key: string, type: string | number }[] = [];
                        const don = tileset.tileLoad.addEventListener(function (tile) {
                            try {
                                const content = tile.content;
                                const feature = content.getFeature(0);
                                const ids = feature.getPropertyIds() as string[];
                                const table = ids.map((id: string) => {
                                    const value = feature.getProperty(id);
                                    return { key: id, type: typeof value } as { key: string, type: string | number };
                                })
                                //如果存在属性，则不添加
                                const keys = featureTable.map((item) => item.key);
                                const newTable = table.filter((item) => !keys.includes(item.key));
                                featureTable.push(...newTable);
                            } catch (error) {

                            }
                        })
                        this.d(() => { don() });
                        const getFeatureTable = async () => {
                            try {
                                if (featureTable.length > 0) {
                                    sceneObject._featureTableResultEvent.emit(featureTable);
                                } else {
                                    sceneObject._featureTableResultEvent.emit(undefined);
                                }
                            } catch (error) {
                                console.warn(`CzmES3DTileset GetFeatureTable: ${error}`);
                                sceneObject._featureTableResultEvent.emit(undefined);
                            }
                        };
                        that.d(sceneObject.getFeatureTableEvent.don(() => { getFeatureTable() }));
                    }
                }))
            }
        }

        {
            //加载完成
            this.d(czm3DTiles.czmTilesetReadyEvent.don((tileset, czmObj) => {
                sceneObject.supportEdit = czm3DTiles.supportEdit;
                sceneObject.tilesetReady.emit(tileset)
            }))
        }

        // cxy
        {
            czm3DTiles.absoluteClippingPlanes = true
            // Czm3DTiles czmFlattenedPlaneId 与CzmFlattenedPlane id绑定
            czm3DTiles.czmFlattenedPlaneId = this.flattenedPlane.id;
            // 赋值，方便CzmESPolygonFlattenedPlane 那边取
            sceneObject.flattenedPlaneId = this.flattenedPlane.id
            czm3DTiles.clippingPlanesId = this.clippingPlanes.id;

            this.d(track([flattenedPlane, 'enabled'], [sceneObject, 'flattenedPlaneEnabled']));
            this.d(track([clippingPlanes, 'enabled'], [sceneObject, 'clippingPlaneEnabled']));
            this.d(track([clippingPlanes, 'planeIds'], [sceneObject, 'clippingPlaneIds']));
            this.d(track([clippingPlanes, 'unionClippingRegions'], [sceneObject, 'unionClippingRegions']));
            this.d(track([clippingPlanes, 'edgeColor'], [sceneObject, 'clippingPlaneEdgeColor']));
            this.d(track([clippingPlanes, 'edgeWidth'], [sceneObject, 'clippingPlaneEdgeWidth']));

            this.d(sceneObject.clippingPlaneIdChanged.don(() => {
                czm3DTiles.clippingPlanesId = sceneObject.clippingPlaneId
            }))
            this.d(sceneObject.excavateIdChanged.don(() => {
                czm3DTiles.clippingPolygonsId = sceneObject.excavateId;
            }))
        }
        {
            const update = () => {
                if (typeof sceneObject.url == 'string') {
                    sceneObject.url = ESSceneObject.context.getStrFromEnv(sceneObject.url);
                } else if (sceneObject.url) {
                    sceneObject.url.url = ESSceneObject.context.getStrFromEnv(sceneObject.url.url);
                }
                czm3DTiles.url = sceneObject.url;
            };
            update();
            this.d(sceneObject.urlChanged.don(update));
        }
        this.d(track([czm3DTiles, 'show'], [sceneObject, 'show']));
        // this.d(track([czm3DTiles, 'colorBlendMode'], [sceneObject, 'czmColorBlendMode']));
        this.d(track([czm3DTiles, 'colorBlendMode'], [sceneObject, 'colorBlendMode']));
        // this.d(track([czm3DTiles, 'cacheBytes'], [sceneObject, 'czmCacheBytes']));
        // this.d(track([czm3DTiles, 'maximumCacheOverflowBytes'], [sceneObject, 'czmMaximumCacheOverflowBytes']));
        this.d(track([czm3DTiles, 'cacheBytes'], [sceneObject, 'cacheBytes']));
        this.d(track([czm3DTiles, 'maximumCacheOverflowBytes'], [sceneObject, 'cacheBytes']));
        this.d(track([czm3DTiles, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.d(track([czm3DTiles, 'imageBasedLightingFactor'], [sceneObject, 'czmImageBasedLightingFactor']));
        this.d(track([czm3DTiles, 'luminanceAtZenith'], [sceneObject, 'czmLuminanceAtZenith']));
        this.d(track([czm3DTiles, 'maximumScreenSpaceError'], [sceneObject, 'maximumScreenSpaceError']));
        this.d(track([czm3DTiles, 'maximumMemoryUsage'], [sceneObject, 'czmMaximumMemoryUsage']));
        this.d(track([czm3DTiles, 'classificationType'], [sceneObject, 'czmClassificationType']));
        this.d(track([czm3DTiles, 'styleJson'], [sceneObject, 'czmStyleJson']));
        this.d(bind([czm3DTiles, 'positionEditing'], [sceneObject, 'editing']));
        this.d(bind([czm3DTiles, 'rotationEditing'], [sceneObject, 'rotationEditing']));
        this.d(bind([czm3DTiles, 'rotation'], [sceneObject, 'rotation']));
        this.d(track([czm3DTiles, 'backFaceCulling'], [sceneObject, 'czmBackFaceCulling']));
        this.d(track([czm3DTiles, 'debugShowBoundingVolume'], [sceneObject, 'czmDebugShowBoundingVolume']));
        this.d(track([czm3DTiles, 'debugShowContentBoundingVolume'], [sceneObject, 'czmDebugShowContentBoundingVolume']));
        this.d(track([czm3DTiles, 'skipLevelOfDetail'], [sceneObject, 'czmSkipLevelOfDetail']));
        {
            const updateMode = () => {
                const mode = sceneObject.materialMode ?? ES3DTileset.defaults.materialMode
                baseColor = sceneObject.materialParams.baseColor ?? [1, 1, 1];
                if (mode === "normal") {
                    czm3DTiles.customShaderInstanceClass = undefined
                } else if (mode === "technology") {
                    czm3DTiles.customShaderInstanceClass = undefined;//恢复一次才能再次生效
                    czm3DTiles.customShaderInstanceClass = CityShaderInstance
                }
            }
            this.d(sceneObject.materialModeChanged.don((m) => {
                updateMode()
            }));
            this.d(sceneObject.materialParamsChanged.don(() => {
                updateMode()
            }));
            updateMode()
        }
    }
    // 重写flyTo方法,基类监听flyToEvent后飞行执行此方法
    override flyTo(duration: number | undefined, id: number) {
        const { sceneObject, czmViewer, czm3DTiles } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            czm3DTiles.flyTo(duration && duration * 1000);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czm3DTiles } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            czm3DTiles.flyTo(duration && duration * 1000);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
