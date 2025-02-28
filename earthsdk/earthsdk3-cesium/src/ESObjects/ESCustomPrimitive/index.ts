import { BooleanProperty, EnumProperty, ESJNativeNumber16, ESObjectWithLocation, EvalStringProperty, FunctionProperty, GroupProperty, JsonProperty, Number3Property, Number4Property, NumberProperty, PositionProperty, RotationProperty } from "earthsdk3";
import { defaultAttribute, defaultBoundingVolume, defaultFragmentShaderSource, defaultIndexTypedArray, defaultRenderState, defaultUniformMap, defaultVertexShaderSource } from "./defaults";
import { attributesJsonToAttributes, attributesToAttributesJson, indexJsonToIndex, indexToIndexJson } from "./funcs";
import { CzmAttributesType, CzmIndexType } from "../../ESJTypesCzm";
import { extendClassProps, getMinMaxPosition, JsonValue, react, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactJson, SceneObjectKey } from "xbsj-base";
import { AttributesJsonType, BoundingVolumeJsonType, CzmCustomPrimitiveUniformMapType, CzmPassType, CzmPrimitiveType, IndexJsonType, passEnums, primitiveTypeEnums } from "./types";
import { attributesReadMe, boundingVolumeReadMe, fragmentShaderSourceReadMe, indexTypeArrayReadMe, renderStateReadMe, uniformMapReadMe, vertexShaderSourceReadMe } from "./readme";

/**
 * https://www.wolai.com/earthsdk/o97QLCu4MuaXekD4B5DZ9r
 */
export class ESCustomPrimitive extends ESObjectWithLocation {
    static readonly type = this.register('ESCustomPrimitive', this, { chsName: 'ES自定义图元', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ES自定义图元" });
    get typeName() { return 'ESCustomPrimitive'; }
    override get defaultProps() { return ESCustomPrimitive.createDefaultProps(); }

    static readonly defaultRenderState = defaultRenderState;
    static readonly defaultVertexShaderSource = defaultVertexShaderSource;
    static readonly defaultFragmentShaderSource = defaultFragmentShaderSource;
    static readonly defaultUniformMap = defaultUniformMap;
    static readonly defaultBoundingVolume = defaultBoundingVolume;
    static readonly defaultAttribute = defaultAttribute;
    static readonly defaultIndexTypedArray = defaultIndexTypedArray;

    get attributesJson() {
        return this.attributes && attributesToAttributesJson(this.attributes);
    }

    set attributesJson(value: AttributesJsonType | undefined) {
        const oldJsonStr = JSON.stringify(this.attributesJson);
        const newJsonStr = JSON.stringify(value);
        if (oldJsonStr !== newJsonStr) {
            this.attributes = value && attributesJsonToAttributes(value);
        }
    }

    get attributesJsonChanged() {
        return this.attributesChanged;
    }

    get indexTypedArrayJson() {
        return this.indexTypedArray && indexToIndexJson(this.indexTypedArray);
    }

    set indexTypedArrayJson(value: IndexJsonType | undefined) {
        const oldJsonStr = JSON.stringify(this.indexTypedArrayJson);
        const newJsonStr = JSON.stringify(value);
        if (oldJsonStr !== newJsonStr) {
            this.indexTypedArray = value && indexJsonToIndex(value);
        }
    }

    get indexTypedArrayJsonChanged() {
        return this.indexTypedArrayChanged;
    }

    private _attributes = this.disposeVar(react<CzmAttributesType | undefined>(undefined));
    get attributes() { return this._attributes.value; }
    set attributes(value: CzmAttributesType | undefined) { this._attributes.value = value; }
    get attributesChanged() { return this._attributes.changed; }

    private _indexTypedArray = this.disposeVar(react<CzmIndexType | undefined>(undefined));
    get indexTypedArray() { return this._indexTypedArray.value; }
    set indexTypedArray(value: CzmIndexType | undefined) { this._indexTypedArray.value = value; }
    get indexTypedArrayChanged() { return this._indexTypedArray.changed; }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        allowPicking: false,
        position: [116.39, 39.9, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        modelMatrix: [-0.8957893500750183, -0.4444788412198901, 0, 0, 0.28511078894078473, -0.5746037485691958, 0.7671651518152995, 0, -0.3409886777031455, 0.68721837274483, 0.6414496315691579, 0, -2177873.9967047274, 4389222.053178148, 4069473.6755001387, 1] as ESJNativeNumber16,
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
    };

    constructor(id?: SceneObjectKey) {
        super(id);
    }

    setUniformMap(value: CzmCustomPrimitiveUniformMapType) {
        if (Object.entries(value).some(([k, v]) => {
            console.warn(`setUniformMap error: key: ${k} value: ${v}`);
            return (v === null)
        })) {
            return;
        }

        const finalUniformMap = { ...(this.uniformMap ?? {}), ...value };
        this.uniformMap = finalUniformMap;
    }

    setLocalBoundingSphere(radius: number, center: [number, number, number] = [0, 0, 0]) {
        if (!Number.isFinite(radius) || radius <= 0) {
            console.warn(`!Number.isFinite(radius) || radius <= 0 radius: ${radius}`);
            return;
        }
        this.boundingVolume = {
            type: 'LocalBoundingSphere', // BoundingSphere表示世界坐标系下的包围球, center为[经度, 纬度, 高度], radius单位为米
            data: { center, radius }
        };
    }

    setLocalAxisedBoundingBox(min: [number, number, number], max: [number, number, number]) {
        if (min.some(e => !Number.isFinite(e)) || max.some(e => !Number.isFinite(e))) {
            console.warn(`setLocalAxisedBoundingBox error, min: ${min.toString()}, max: ${max.toString()}`);
            return;
        }

        this.boundingVolume = {
            type: 'LocalAxisedBoundingBox',
            data: {
                min,
                max,
            }
        };
    }

    static getMinMaxPosition = getMinMaxPosition;

    computeLocalAxisedBoundingBoxFromAttribute(attributeName: string = 'a_position') {
        if (!this.attributes || !this.attributes[attributeName]) {
            console.warn(`attributes[${attributeName}]不存在！无法获取！`);
            return undefined;
        }
        const posAttribute = this.attributes[attributeName];
        if (!('typedArray' in posAttribute) || !(posAttribute.typedArray instanceof Float32Array)) {
            console.warn(`!('typedArray' in posAttribute) || !(posAttribute.typedArray instanceof Float32Array) attributeName: ${attributeName}`);
            return undefined;
        }

        if (!('componentsPerAttribute' in posAttribute) || posAttribute.componentsPerAttribute !== 3) {
            console.warn(`!('componentsPerAttribute' in posAttribute) || posAttribute.componentsPerAttribute !== 3 attributeName: ${attributeName}`);
            return undefined;
        }

        const { min, max } = ESCustomPrimitive.getMinMaxPosition(posAttribute.typedArray as unknown as number[]);
        if (min.some(e => !Number.isFinite(e) || max.some(e => !Number.isFinite(e)))) {
            return undefined;
        }

        return { min, max };
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new Number4Property('可视范围控制', '可视范围控制[near0, near1, far1, far0]', true, false, [this, 'viewDistanceRange'], ESCustomPrimitive.defaults.viewDistanceRange),
                new BooleanProperty('可视距离调试', '可视距离调试', false, false, [this, 'viewDistanceDebug']),
            ]),
            new GroupProperty('屏幕像素', '屏幕像素', [
                new NumberProperty('最大缩放值', '最大缩放值，需要和屏幕像素(pixelSize)配合适用！', true, false, [this, 'maximumScale'], 3),
                new NumberProperty('最小缩放值', '最小缩放值，需要和屏幕像素(pixelSize)配合适用！', true, false, [this, 'minimumScale'], 1),
                new NumberProperty('屏幕像素', '注意物体的实际屏幕像素=pixelSize*物体的物理尺寸(m)，例如：一个20米长的房子，pixelSize设置为5，那么它在屏幕上的实际像素尺寸就是5*20=100px。根据物体在屏幕上的像素大小来决定缩放值，缩放值受maximumScale、minimumScale属性限制', true, false, [this, 'pixelSize'], 5),
                new BooleanProperty('显示缩放值', '每个视口都显示各自的缩放值', true, false, [this, 'showSceneScale'], false),
            ]),
            new GroupProperty('图元属性', '图元属性', [
                new JsonProperty('模型矩阵', '模型矩阵', true, false, [this, 'modelMatrix'], ESCustomPrimitive.defaults.modelMatrix),
                new BooleanProperty('是否拣选', '是否拣选', true, false, [this, 'cull']),
                new JsonProperty('包围体', '用来进行拣选，以剔除不再视野范围内的模型', true, false, [this, 'boundingVolume'], defaultBoundingVolume, boundingVolumeReadMe),
                new EnumProperty('渲染顺序', '渲染顺序', true, false, [this, 'pass'], passEnums, 'TRANSLUCENT'),
                new EnumProperty('图元类型', '图元类型', true, false, [this, 'primitiveType'], primitiveTypeEnums, 'TRIANGLES'),
                new JsonProperty('渲染状态', '渲染状态', true, false, [this, 'renderState'], defaultRenderState, renderStateReadMe),
                new EvalStringProperty('顶点着色器', '顶点着色器', true, false, [this, 'vertexShaderSource'], defaultVertexShaderSource, vertexShaderSourceReadMe),
                new EvalStringProperty('片元着色器', '片元着色器', true, false, [this, 'fragmentShaderSource'], defaultFragmentShaderSource, fragmentShaderSourceReadMe),
                new JsonProperty('一致性变量(uniform)', '一致性变量(uniform)', true, false, [this, 'uniformMap'], defaultUniformMap, uniformMapReadMe),
                new JsonProperty('顶点属性(attributes)', '顶点属性(attributes)', true, false, [this, 'attributesJson'], attributesToAttributesJson(defaultAttribute), attributesReadMe),
                new JsonProperty('索引(index)', '索引(index)', true, false, [this, 'indexTypedArrayJson'], indexToIndexJson(defaultIndexTypedArray), indexTypeArrayReadMe),
                new NumberProperty('count', 'count', true, false, [this, 'count'], 0),
                new NumberProperty('offset', 'offset', true, false, [this, 'offset'], 0),
                new NumberProperty('instanceCount', 'instanceCount', true, false, [this, 'instanceCount'], 0),
                new FunctionProperty('自动计算包围盒', '根据顶点位置属性，自动计算包围盒', ['string'], (posPropName: string) => {
                    const minMax = this.computeLocalAxisedBoundingBoxFromAttribute(posPropName);
                    if (!minMax) return;
                    const { min, max } = minMax;
                    this.setLocalAxisedBoundingBox(min, max);
                }, ['position'])
            ]),
            new GroupProperty('本地变换', '本地变换', [
                new PositionProperty('本地偏移', '本地偏移，不是经纬度！', true, false, [this, 'localPosition']),
                new RotationProperty('本地姿态', '本地姿态', true, false, [this, 'localRotation']),
                new Number3Property('本地缩放', '本地缩放', true, false, [this, 'localScale'], [1, 1, 1]),
                new JsonProperty('本地模型矩阵', '本地模型矩阵，如果该属性有值，那么localPosition、localRotation、localScale等属性将不起作用。', true, false, [this, 'localModelMatrix']),
            ]),
            new GroupProperty('调试', '调试', [
                new BooleanProperty('debugShowBoundingVolume', 'debugShowBoundingVolume', true, false, [this, 'debugShowBoundingVolume'], false),
                new NumberProperty('debugOverlappingFrustums', 'debugOverlappingFrustums', true, false, [this, 'debugOverlappingFrustums'], 0),
            ]),
            new GroupProperty('Czm特有', 'Czm特有', [
                new BooleanProperty('occlude', 'occlude', true, false, [this, 'occlude'], true),
                new BooleanProperty('castShadows', 'castShadows', true, false, [this, 'castShadows'], false),
                new BooleanProperty('receiveShadows', 'receiveShadows', true, false, [this, 'receiveShadows'], false),
                new BooleanProperty('executeInClosestFrustum', 'executeInClosestFrustum', true, false, [this, 'executeInClosestFrustum'], false),
                new BooleanProperty('pickOnly', 'pickOnly', true, false, [this, 'pickOnly'], false),
                new BooleanProperty('depthForTranslucentClassification', 'depthForTranslucentClassification', true, false, [this, 'depthForTranslucentClassification'], false),
            ]),
        ];
    }
}

export namespace ESCustomPrimitive {
    export const createDefaultProps = () => ({
        maximumScale: undefined as number | undefined,
        minimumScale: undefined as number | undefined,
        pixelSize: undefined as number | undefined,
        showSceneScale: undefined as boolean | undefined, // 显示每个窗口中的模型缩放值
        modelMatrix: reactArrayWithUndefined<ESJNativeNumber16 | undefined>(undefined),
        cull: react<boolean | undefined>(undefined),
        boundingVolume: reactJson<BoundingVolumeJsonType | undefined>(undefined),
        // TODO JSONValue => RenderStateOptions
        renderState: reactJson<JsonValue | undefined>(undefined),
        primitiveType: undefined as CzmPrimitiveType | undefined,
        pass: undefined as CzmPassType | undefined,
        vertexShaderSource: undefined as string | undefined,
        fragmentShaderSource: undefined as string | undefined,
        uniformMap: reactJson<CzmCustomPrimitiveUniformMapType | undefined>(undefined),
        localPosition: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 本地单位，不是经纬度！
        localRotation: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 本地旋转
        localScale: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 本地缩放
        localModelMatrix: reactArrayWithUndefined<ESJNativeNumber16 | undefined>(undefined), // 本地矩阵

        occlude: undefined as boolean | undefined, // true
        count: undefined as number | undefined,
        offset: undefined as number | undefined, // 0
        instanceCount: undefined as number | undefined, // 0
        castShadows: undefined as boolean | undefined, // false, 
        receiveShadows: undefined as boolean | undefined, // false,

        executeInClosestFrustum: undefined as boolean | undefined,
        debugShowBoundingVolume: undefined as boolean | undefined,
        debugOverlappingFrustums: undefined as number | undefined,
        pickOnly: undefined as boolean | undefined,
        depthForTranslucentClassification: undefined as boolean | undefined,

        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,
        ...ESObjectWithLocation.createDefaultProps(),
    });
}
extendClassProps(ESCustomPrimitive.prototype, ESCustomPrimitive.createDefaultProps);
export interface ESCustomPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESCustomPrimitive.createDefaultProps>> { }