import { flyTo, getFuncFromStr } from "../../../../utils";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, Event, createProcessingFromAsyncFunc, Destroyable, extendClassProps, Listener, react, reactArray, ReactivePropsToNativePropsAndChanged, reactJson, reactPositionsSet, ObjResettingWithEvent, SceneObjectKey, createGuid } from "xbsj-base";
import { getSTCRoutePathsFromGeoJson } from "./parseGeoJson";
import { ESSceneObject, PickedInfo, Player } from "earthsdk3";
import { getSharedTexturePool, ResourceHandler } from "../../../../CzmObjects";
import { SignalTransmissionCollectionPrimitive } from "./SignalTransmissionCollectionPrimitive";
import * as Cesium from 'cesium';
export type STCRoutPathBaseType = {
    startTime?: number;
    transmissionTime?: number;
    repeat?: number;
    color?: [number, number, number, number];
    bgColor?: [number, number, number, number];
    bidirectional?: 0 | 1 | 2 | 3;
    extra?: any;
}

export type STCRoutePathType = ({
    // [k: string]: any;
    positions: ([number, number] | [number, number, number])[];
    width: number;
} | {
    // [k: string]: any;
    startPos: [number, number, number];
    endPos: [number, number, number];
    heightRatio: number;
    width: number;
}) & STCRoutPathBaseType;

export const whiteGradientImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAABCAYAAABubagXAAAATUlEQVQYlaXLOQqEUBQF0SMmojgvpfe/JiccEvlNwwuM24IK7oXKUkof7ylQoUGHHsPDMf4WNcpociTcuHBgx4oFczg9/O0tPKP7D3wBky8UMt76XnoAAAAASUVORK5CYII='
//@ts-ignore
export type CzmSignalTransmissionCollectionRoutePathCallbackType = (this: CzmSignalTransmissionCollection, result: XbsjPositionCallbackResultType, instanceIndex: number, frameState: Cesium.FrameState | undefined) => XbsjPositionCallbackResultType | undefined;

const routePathCallbackStrMd = `\
默认示例代码  
\`\`\`
// result 最后的结果
// this 是当前的信号传输器集合
// instanceIndex 当前的信号传输器集合的实例索引
// frameState 当前的帧状态
// 返回值如果是undefined，则相当于此函数不起作用。
function (result, this, instanceIndex, frameState) {
    const r = instanceIndex / 50;
    const c = r - Math.floor(r);
    result.color = [c*.5+.5, (1.0 - c)*.5+.5, 0.5, 1];
    result.bgColor = [c*.5+.5, (1.0 - c)*.5+.5, 0.5, 0.3];
    return result;
}\
\`\`\`
`;

export type XbsjPositionCallbackResultType = {
    timeRatio: number;
    repeat: number;
    color: [number, number, number, number];
    bgColor: [number, number, number, number];
    bidirectional: 0 | 1 | 2 | 3; // 0/1表示单向，2表示双向, 3表示无信号
};

export class CzmSignalTransmissionCollection extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _player;
    get player() { return this._player; }

    get ratio() { return this._player.ratio; }
    set ratio(value: number) { this._player.ratio = value; }
    get ratioChanged() { return this._player.ratioChanged; }

    private _finalImageUrlReact = this.disposeVar(ESSceneObject.context.createEnvStrReact([this, 'imageUrl']));
    get finalImageUrlReact() { return this._finalImageUrlReact; }

    private _routePaths = this.disposeVar(react<STCRoutePathType[] | undefined>(undefined));
    get routePaths() { return this._routePaths.value; }
    set routePaths(value: STCRoutePathType[] | undefined) { this._routePaths.value = value; }
    get routePathsChanged() { return this._routePaths.changed; }

    static whiteGradientImageBase64 = whiteGradientImageBase64;

    routePathCallback?: CzmSignalTransmissionCollectionRoutePathCallbackType;
    //@ts-ignore
    static defaultRoutePathCallback = function (this: CzmSignalTransmissionCollection, result: XbsjPositionCallbackResultType, instanceIndex: number, frameState: Cesium.FrameState | undefined) {
        const r = instanceIndex / 50;
        const c = r - Math.floor(r);
        result.color = [c * .5 + .5, (1.0 - c) * .5 + .5, 0.5, 1];
        result.bgColor = [c * .5 + .5, (1.0 - c) * .5 + .5, 0.5, 0.3];
        return result;
    };

    static routePathCallbackStrMd = routePathCallbackStrMd;

    // 操作说明:1 输入变量名 2 输入类型信息 3 输入默认值  tab进入下一个输入项
    // import { react } from "xbsj-base";
    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this._id.value = id);
        this._player = this.disposeVar(new Player());
        {
            const d = CzmSignalTransmissionCollection.defaults;
            this.dispose(bind([this._player, 'loop'], [this, 'loop'], b => b ?? d.loop, a => a ?? d.loop));
            this.dispose(bind([this._player, 'currentTime'], [this, 'currentTime'], b => b ?? d.currentTime, a => a ?? d.currentTime));
            this.dispose(bind([this._player, 'duration'], [this, 'duration'], b => b ?? d.duration, a => a ?? d.duration));
            this.dispose(bind([this._player, 'playing'], [this, 'playing'], b => b ?? d.playing, a => a ?? d.playing));
            this.dispose(bind([this._player, 'speed'], [this, 'speed'], b => b ?? d.speed, a => a ?? d.speed));
        }

        const finalGeoJsonUrl = this.disposeVar(ESSceneObject.context.createEnvStrReact([this, 'geoJsonUrl']));
        const processing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
            // 0 先置空
            this.routePaths = undefined;

            // 1 先检查geojson的url是否有效
            const url = finalGeoJsonUrl.value;
            if (url) {
                try {
                    const response = await fetch(url);
                    const json = await response.json();
                    this.routePaths = getSTCRoutePathsFromGeoJson(json, this.width, this.repeatLength);
                    return;
                } catch (error) {
                    console.error(`geojson加载解析出错！${error}`);
                    console.error(error);
                }
            }

            // 2 data是否有效
            if (this.data) {
                this.routePaths = [...this.data];
                return;
            }

            // 3 positionsSet是否有效
            if (this.positionsSet) {
                const positions = this.positionsSet;
                if (positions) {
                    this.routePaths = positions.map(e => ({ positions: e, width: this.width }));
                    return;
                }
            }
        }));

        {
            const update = () => {
                processing.restart();
            };
            update();
            const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
                finalGeoJsonUrl.changed,
                this.positionsSetChanged,
                this.dataChanged,
                this.finalImageUrlReact.changed,
                this.widthChanged,
                this.repeatLengthChanged,
                this.arcTypeChanged,
                this.brighteningChanged,
                this.depthTestChanged,
            ));
            this.dispose(recreateEvent.disposableOn(update));
        }

        {
            const update = () => {
                const routePathCallback = getFuncFromStr<CzmSignalTransmissionCollectionRoutePathCallbackType>(this.routePathCallbackStr, [
                    'result', 'this', 'instanceIndex', 'frameState',
                ]);
                routePathCallback && (this.routePathCallback = routePathCallback);
            };
            update();
            this.dispose(this.routePathCallbackStrChanged.disposableOn(update));
        }
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        // const player = this.disposeVar(new Player());
        // this.dispose(bind([player, 'loop', 'loopChangedEvent'], [this, 'loop']));
        // this.dispose(bind([player, 'currentTime', 'currentTimeChangedEvent'], [this, 'currentTime']));
        // this.dispose(bind([player, 'duration', 'durationChangedEvent'], [this, 'duration']));
        // this.dispose(bind([player, 'playing', 'playingChangedEvent'], [this, 'playing']));

        // const imageUrlReact = this.disposeVar(SceneObject.context.createEvnStrReact([this, 'imageUrl']));
        const imageUrlReact = this.finalImageUrlReact;
        //@ts-ignore
        const textureHandler = this.disposeVar(new ResourceHandler<Cesium.Texture>());

        const textureProcessing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
            if (!imageUrlReact.value) {
                return;
            }
            //@ts-ignore
            const textureHandlerOrPromise = getSharedTexturePool(viewer.scene.context).getTextureHandler(imageUrlReact.value);
            if (textureHandlerOrPromise instanceof ResourceHandler) {
                textureHandler.reset(textureHandlerOrPromise);
            } else {
                const result = await cancelsManager.promise(textureHandlerOrPromise);
                textureHandler.reset(result);
            }
        }));

        const getTexutreFunc = () => {
            //@ts-ignore
            return textureHandler.valid ? (textureHandler.raw as Cesium.Texture) : viewer.scene.context.defaultTexture;
        };

        const updateTexture = () => textureProcessing.restart();
        updateTexture();
        this.dispose(imageUrlReact.changed.disposableOn(updateTexture));

        // const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
        //     this.positionsSetChanged,
        //     imageUrlReact.changed,
        //     this.widthChanged,
        //     this.arcTypeChanged,
        //     this.brighteningChanged,
        //     this.depthTestChanged,
        // ));

        // const resettingPrimitive = this.disposeVar(new ObjResettingWithEvent(recreateEvent, () => {
        //     if (!this.positionsSet) {
        //         return undefined;
        //     }
        //     const signalTransmissionPrimitive = new SignalTransmissionCollectionPrimitive(
        //         viewer,
        //         this,
        //         imageUrlReact.value && getTexutreFunc || undefined,
        //     );
        //     return signalTransmissionPrimitive;
        // }));

        const resettingPrimitive = this.disposeVar(new ObjResettingWithEvent(this.routePathsChanged, () => {
            if (!this.routePaths) {
                return undefined;
            }
            const signalTransmissionPrimitive = new SignalTransmissionCollectionPrimitive(
                viewer,
                this,
                imageUrlReact.value && getTexutreFunc || undefined,
            );
            return signalTransmissionPrimitive;
        }));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!this.routePaths || this.routePaths.length === 0) {
                return;
            }
            if (this.routePaths.length === 1) {
                if (!Object.prototype.hasOwnProperty.call(this.routePaths[0], "positions")) {
                    //@ts-ignore
                    flyTo(viewer, this.routePaths[0].startPos, viewer.camera.positionCartographic.height, undefined, duration);
                } else {
                    // @ts-ignore
                    const bs = computeBoundingSphere(this.routePaths[0].positions);
                    if (!bs) {
                        return;
                    }
                    const [center, radius] = bs;
                    flyTo(viewer, center, radius * 3, undefined, duration);
                }
            }
        }));
    }

    static defaults = {
        loop: true,
        startTime: 0,
        currentTime: 0,
        playerCurrentTime: 0,
        duration: 3000,
        speed: 1,
        playing: true,
        transmissionTime: 3000,
    }

    static defaultImageUri = '${earthsdk3-assets-script-dir}/assets/img/signal.png';
}

export namespace CzmSignalTransmissionCollection {
    export const createDefaultProps = () => ({
        show: true,
        imageUrl: undefined as string | undefined,
        repeat: 1,
        bidirectional: 0 as 0 | 1 | 2 | 3,
        startTime: 0,
        transmissionTime: undefined as number | undefined,
        color: reactArray<[number, number, number, number]>([0, 1, 0, 1]),
        bgColor: reactArray<[number, number, number, number]>([0, 1, 0, 0.2]),
        width: 3,
        repeatLength: 10000,
        arcType: 'GEODESIC' as 'NONE' | 'GEODESIC' | 'RHUMB',
        brightening: false,
        depthTest: true,
        positionsSet: reactPositionsSet(undefined),
        data: reactJson<STCRoutePathType[] | undefined>(undefined),
        geoJsonUrl: '',
        // heightRatio: undefined as number | undefined,
        allowPicking: false,
        // editing: false,
        routePathCallbackStr: '',

        loop: undefined as boolean | undefined,
        currentTime: undefined as number | undefined,
        duration: undefined as number | undefined,
        speed: undefined as number | undefined,
        playing: undefined as boolean | undefined,
    });
}
extendClassProps(CzmSignalTransmissionCollection.prototype, CzmSignalTransmissionCollection.createDefaultProps);
export interface CzmSignalTransmissionCollection extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmSignalTransmissionCollection.createDefaultProps>> { }
