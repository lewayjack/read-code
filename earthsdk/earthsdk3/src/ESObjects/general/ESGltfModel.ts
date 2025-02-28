import { react, Event, SceneObjectKey, reactArray, extendClassProps, ReactivePropsToNativePropsAndChanged } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { ColorProperty, ESJColor, ESJResource, ESJVector3D, FunctionProperty, GroupProperty, JsonProperty, NumberProperty } from "../../ESJTypes";

const defaultModelNodeTransformation = {
    translationX: 0,
    translationY: 0,
    translationZ: 0,
    rotationHeading: 0,
    rotationPitch: 0,
    rotationRoll: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
}

type ModelNodeTransformation = {
    translationX: number;
    translationY: number;
    translationZ: number;
    rotationHeading: number;
    rotationPitch: number;
    rotationRoll: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
};

/**
 * https://www.wolai.com/earthsdk/sJisEK7X7WgurSVJK6kXTe
 */

export class ESGltfModel extends ESObjectWithLocation {
    static readonly type = this.register('ESGltfModel', this, { chsName: '模型', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "gltf模型" });
    override get typeName() { return 'ESGltfModel'; }
    override get defaultProps() { return ESGltfModel.createDefaultProps(); }

    private _nodeTransformations = this.dv(react<{ [key: string]: ModelNodeTransformation } | undefined>(undefined));
    get nodeTransformations() { return this._nodeTransformations.value; }
    set nodeTransformations(value: { [key: string]: ModelNodeTransformation } | undefined) { this._nodeTransformations.value = value; }
    get nodeTransformationsChanged() { return this._nodeTransformations.changed; }

    private _czmModelReadyEvent = this.dv(new Event<[model: any]>());
    get czmModelReadyEvent() { return this._czmModelReadyEvent; }

    deleteNodeTransformation(nodeName: string) {
        if (!this.nodeTransformations) return;
        if (!this.nodeTransformations[nodeName]) return;
        const nodeTransformations = { ...this.nodeTransformations };
        delete nodeTransformations[nodeName];
        this.nodeTransformations = nodeTransformations;
    }

    private _setNodePositionEvent = this.dv(new Event<[string, ESJVector3D]>());
    get setNodePositionEvent() { return this._setNodePositionEvent; }
    setNodePosition(nodeName: string, nodePosition: ESJVector3D) {
        this._setNodePositionEvent.emit(nodeName, nodePosition);

        if (!this._nodeTransformations.value) {
            this._nodeTransformations.value = {};
        }
        const transformation = this._nodeTransformations.value[nodeName] ?? { ...defaultModelNodeTransformation };
        if (nodePosition.some(e => !Number.isFinite(e))) {
            console.error(`setNodePosition error: ${nodeName} ${nodePosition}`);
            return;
        }
        this._nodeTransformations.value = {
            ...this.nodeTransformations,
            [nodeName]: {
                ...transformation,
                translationX: nodePosition[0],
                translationY: nodePosition[1],
                translationZ: nodePosition[2],
            },
        };

    }

    private _setNodeRotationEvent = this.dv(new Event<[string, ESJVector3D]>());
    get setNodeRotationEvent() { return this._setNodeRotationEvent; }
    setNodeRotation(nodeName: string, nodeRotation: ESJVector3D) {
        this._setNodeRotationEvent.emit(nodeName, nodeRotation);
        if (!this._nodeTransformations.value) {
            this._nodeTransformations.value = {};
        }
        const transformation = this._nodeTransformations.value[nodeName] ?? { ...defaultModelNodeTransformation };
        if (nodeRotation.some(e => !Number.isFinite(e))) {
            console.error(`setNodeRotation error: ${nodeName} ${nodeRotation}`);
            return;
        }
        this._nodeTransformations.value = {
            ...this.nodeTransformations,
            [nodeName]: {
                ...transformation,
                rotationHeading: nodeRotation[0],
                rotationPitch: nodeRotation[1],
                rotationRoll: nodeRotation[2],
            },
        };
    }

    private _setNodeScaleEvent = this.dv(new Event<[string, ESJVector3D]>());
    get setNodeScaleEvent() { return this._setNodeScaleEvent; }
    setNodeScale(nodeName: string, nodeScale: ESJVector3D) {
        this._setNodeScaleEvent.emit(nodeName, nodeScale);

        if (!this._nodeTransformations.value) {
            this._nodeTransformations.value = {};
        }
        const transformation = this._nodeTransformations.value[nodeName] ?? { ...defaultModelNodeTransformation };
        if (nodeScale.some(e => !Number.isFinite(e) || e < 0)) {
            console.error(`setNodeScale error: !Number.isFinite(e) || e < 0 ${nodeName} ${nodeScale}`);
            return;
        }
        this._nodeTransformations.value = {
            ...this.nodeTransformations,
            [nodeName]: {
                ...transformation,
                scaleX: nodeScale[0],
                scaleY: nodeScale[1],
                scaleZ: nodeScale[2],
            },
        };
    }

    getNodePosition(nodeName: string) {
        if (!this.nodeTransformations) return undefined;
        const nodeTransform = this.nodeTransformations[nodeName];
        if (!nodeTransform) return undefined;
        return [nodeTransform.translationX, nodeTransform.translationY, nodeTransform.translationZ] as ESJVector3D;
    }

    getNodeRotation(nodeName: string) {
        if (!this.nodeTransformations) return undefined;
        const nodeTransform = this.nodeTransformations[nodeName];
        if (!nodeTransform) return undefined;
        return [nodeTransform.rotationHeading, nodeTransform.rotationPitch, nodeTransform.rotationRoll] as ESJVector3D;
    }
    getNodeScale(nodeName: string) {
        if (!this.nodeTransformations) return undefined;
        const nodeTransform = this.nodeTransformations[nodeName];
        if (!nodeTransform) return undefined;
        return [nodeTransform.scaleX, nodeTransform.scaleY, nodeTransform.scaleZ] as ESJVector3D;
    }

    private _printDebugInfoEvent = this.dv(new Event());
    get printDebugInfoEvent() { return this._printDebugInfoEvent; }
    printDebugInfo() { this._printDebugInfoEvent.emit(); }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        url: '${earthsdk3-assets-script-dir}/assets/glb/building.glb',
    }

    // static override noNeedUeUpdateProps = [
    //     ...ESObjectWithLocation.noNeedUeUpdateProps,
    //     'url',
    // ];

    constructor(id?: SceneObjectKey) {
        super(id);
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'dataSource',
            dataSource: [
                ...properties.dataSource,
                new JsonProperty("模型路径", "模型路径地址", true, false, [this, 'url'], ESGltfModel.defaults.url),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty("模型路径", "模型路径地址", false, false, [this, 'url']),
                new GroupProperty('czm', 'czm', [
                    new FunctionProperty('控制台输出模型信息', '控制台输出模型信息', [], () => this.printDebugInfo(), []),
                    new NumberProperty('最大缩放比例', '最大缩放值', true, false, [this, 'czmMaximumScale']),
                    new NumberProperty('统一缩放值', '统一缩放值', false, false, [this, 'czmNativeScale']),
                    new NumberProperty('最小像素尺寸', '最小像素尺寸，若为0表示不使用最小像素尺寸。', false, false, [this, 'czmMinimumPixelSize']),
                    new ColorProperty('颜色', ' A Property specifying the color.', false, false, [this, 'czmColor']),
                ]),
            ]),
        ];
    }
}

export namespace ESGltfModel {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        url: ESGltfModel.defaults.url as string | ESJResource,
        czmMaximumScale: undefined as number | undefined,
        czmMinimumPixelSize: 0,
        czmNativeScale: 1,
        czmColor: reactArray<ESJColor>([1, 1, 1, 1]),
        allowPicking: true,
    });
}
extendClassProps(ESGltfModel.prototype, ESGltfModel.createDefaultProps);
export interface ESGltfModel extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESGltfModel.createDefaultProps>> { }
