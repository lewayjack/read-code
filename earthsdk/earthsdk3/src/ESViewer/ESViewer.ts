import {
    createAnimateFrame, createGuid, createNextAnimateFrameEvent,
    Destroyable, Event, extendClassProps, JsonValue, ObjResettingWithEvent,
    Processing, react, reactArray, reactArrayWithUndefined, ReactiveVariable, reactJson, UniteChanged
} from "xbsj-base";
import { EngineObject } from "../EngineObject";
import {
    BooleanProperty, EnumProperty, ESJFlyToParam, ESJLonLatFormatType, ESJNavigationMode,
    ESJStatusInfoType, ESJVector2D, ESJVector2DArray, ESJVector3D,
    ESJVector4D, ESVOption, FunctionProperty, GroupProperty,
    JsonProperty,
    NumberProperty,
    PickedResult, Property, StringProperty, ViewerStatus
} from "../ESJTypes";
import { ESSceneObject } from "../ESObjects";
import { clearContainer, getContainer } from "./getContainer";
import { SyncEventResetting, TimeSyncEventResetting } from "./Resetting";
import { StatusContainer } from "./StatusContainer";
import { ViewerContainer } from "./ViewerContainer";
import { ViewerContext } from "./ViewerContext";
import { ViewerCustomInteraction } from "./ViewerCustomInteraction";

export abstract class ESViewer extends Destroyable {
    static readonly context = new ViewerContext();
    static readonly register = ESViewer.context.register.bind(ESViewer.context);

    private _forceRecreateEvent = this.dv(new Event());
    forceRecreate() { this._forceRecreateEvent.emit(); }

    protected _container = this.dv(react<HTMLDivElement | undefined>(undefined));
    get container() { return this._container.value };
    set container(value: HTMLDivElement | undefined) { this._container.value = value };
    set containerOrId(value: HTMLDivElement | string) {
        if (typeof value === 'string') {
            const container = document.getElementById(value);
            if (container && container instanceof HTMLDivElement) {
                this._container.value = clearContainer(container);
            } else {
                console.warn(`containerOrId warn: !(container instanceof HTMLDivElement)`);
            }
        } else if (value instanceof HTMLDivElement) {
            this._container.value = clearContainer(value);
        } else {
            console.warn(`containerOrId warn: setting container failed!`);
        }
    }
    get containerChanged() { return this._container.changed; }

    private _containerSize = this.dv(react<ESJVector2D | undefined>(undefined));
    get containerSize() { return this._containerSize.value; }
    set containerSize(value: ESJVector2D | undefined) { this._containerSize.value = value; }
    get containerSizeChanged() { return this._containerSize.changed; }

    private _status = this.dv(react<ViewerStatus>('Raw'));
    // 获取状态
    get status() { return this._status.value; }
    get statusChanged() { return this._status.changed; }
    setStatus(value: ViewerStatus) { this._status.value = value; }

    private _statusLog = this.dv(react<string>(''));
    get statusLog() { return this._statusLog.value; }
    get statusLogChanged() { return this._statusLog.changed; }
    setStatusLog(value: string) { this._statusLog.value = value; }

    private _statusContainer = this.dv(new StatusContainer(this));

    //鼠标自定义交互事件收集与控制ViewerCustomInteraction
    private _useCustomInteraction = this.dv(react<boolean>(true));
    get useCustomInteraction() { return this._useCustomInteraction.value };
    set useCustomInteraction(value: boolean) { this._useCustomInteraction.value = value; };
    private _resetInteractionEvent = this.dv(createNextAnimateFrameEvent(this.containerChanged, this._useCustomInteraction.changed, this._forceRecreateEvent));
    private _interactionResetting = this.dv(new ObjResettingWithEvent(this._resetInteractionEvent, () => {
        if (!this.container || !this._useCustomInteraction.value) return undefined;
        return new ViewerCustomInteraction(this, this.container);
    }));

    private _viewerChanged = this.dv(new Event<[innerViewer: any]>());
    get viewerChanged() { return this._viewerChanged; }

    private _containerResetEvent = this.dv(createNextAnimateFrameEvent(this.containerChanged, this._forceRecreateEvent));
    get containerResetEvent() { return this._containerResetEvent };
    private _containerResetting = this.dv(new ObjResettingWithEvent(this._containerResetEvent, () => {
        if (!this.container) return undefined;
        return new ViewerContainer(this.container, this)
    }));
    get subContainer() { return this._containerResetting.obj?.subContainer; }
    get subContainerChanged() { return this._containerResetting.objChanged; }
    get overlayContainer() { return this._containerResetting.obj?.overlayContainer; }
    get overlayContainerChanged() { return this._containerResetting.objChanged; }

    /**
       * 获取当前视口中的所有对象
       */
    private _sceneObjectsMap = new Map<ESSceneObject, EngineObject | undefined>();
    get sceneObjectsMap() { return this._sceneObjectsMap; }
    get sceneObjects() { return this._sceneObjectsMap.keys() }

    add<T extends ESSceneObject>(...sceneObjects: T[]) {
        for (let sceneObject of sceneObjects) {
            if (!this.has(sceneObject)) {
                const objConstructor = EngineObject.context.createEngineObject(sceneObject, this);
                objConstructor && this._sceneObjectsMap.set(sceneObject, objConstructor);
                sceneObject.viewerAttached.emit(this);
            }
        }
    }

    delete<T extends ESSceneObject>(...sceneObjects: T[]) {
        for (let sceneObject of sceneObjects) {
            if (this.has(sceneObject)) {
                const objConstructor = this._sceneObjectsMap.get(sceneObject);
                objConstructor && objConstructor.destroy();
                this._sceneObjectsMap.delete(sceneObject);
                sceneObject.viewerDetached.emit(this);
            }
        }
    }

    disposableAdd<T extends ESSceneObject>(...sceneObjects: T[]) {
        this.add(...sceneObjects);
        return () => this.delete(...sceneObjects);
    }

    disAdd<T extends ESSceneObject>(...sceneObjects: T[]) { return this.disposableAdd(...sceneObjects); }

    has<T extends ESSceneObject>(sceneObject: T) { return this._sceneObjectsMap.has(sceneObject); };

    clearAllSceneObjects() {
        for (let sceneObject of this.sceneObjects) { this.delete(sceneObject); }
    }

    private _id: string;
    get id() { return this._id; }
    set id(value: string) { console.warn(`ESViewer id is readonly`); }

    private _typeName: string;
    get typeName() { return this._typeName; }
    private _initName() { this.name = `${this.typeName}_${('' + this.id).slice(-4)}`; };

    get defaultProps() { return ESViewer.createDefaultProps(); };// 默认属性

    private _getJson(ignoreDefaults = true) {
        const json = {
            id: this.id,
            type: this.typeName,
        } as JsonValue;
        for (let k of Object.keys(this.defaultProps)) {
            if (ignoreDefaults) {
                let valueEqual;
                // @ts-ignore
                let v = this.defaultProps[k];
                if (v instanceof ReactiveVariable) {
                    // @ts-ignore
                    valueEqual = v.equals(this[k])
                } else {
                    // @ts-ignore
                    valueEqual = (v === this[k]);
                }
                // @ts-ignore
                if (!valueEqual) {
                    // @ts-ignore
                    json[k] = this[k];
                }
            } else {
                // @ts-ignore
                json[k] = this[k];
            }
        }
        return json;
    }

    private _setJson(value: JsonValue, filterKeys?: string[], partialSetting?: boolean) {
        // @ts-ignore
        if (!(value instanceof Object) || (value.type && value.type !== this.typeName)) {
            // @ts-ignore
            console.error(`value.type && value.type${value.type} !== this.typeName${this.typeName}`);
            return;
        }
        // @ts-ignore
        if (value.id && value.id !== this.id) {
            // @ts-ignore
            console.warn(`value.id === undefined || value.id${value.id} !== this.id(${this.id})`);
        }

        const finalFilterKeys = filterKeys || [];
        finalFilterKeys.push('id', 'type');

        const keys = Object.keys(this.defaultProps).filter(e => !finalFilterKeys.includes(e));
        for (let key of keys) {
            if (key in value) {
                // @ts-ignore
                this[key] = value[key] === null ? undefined : value[key];
            } else if (!(partialSetting ?? false)) {
                // @ts-ignore
                let v = this.defaultProps[key];
                if (v instanceof ReactiveVariable) {
                    v = v.value;
                }
                // @ts-ignore
                this[key] = v;
            }
        }
    }
    get json() { return this._getJson(); }
    set json(value: JsonValue) { this._setJson(value, ['devTags']) }


    private _updateFuncReact = this.dv(react<((sceneObject: ESViewer, timeStamp: number) => void) | undefined>(undefined));
    get updateFunc() { return this._updateFuncReact.value; }
    set updateFunc(value: ((sceneObject: ESViewer, timeStamp: number) => void) | undefined) { this._updateFuncReact.value = value; }
    get updateFuncChanged() { return this._updateFuncReact.changed; }

    private _toDestroyFuncReact = this.dv(react<((sceneObject: ESViewer) => void) | undefined>(undefined));
    get toDestroyFunc() { return this._toDestroyFuncReact.value; }
    set toDestroyFunc(value: ((sceneObject: ESViewer) => void) | undefined) { this._toDestroyFuncReact.value = value; }
    get toDestroyFuncChanged() { return this._toDestroyFuncReact.changed; }


    constructor(option: ESVOption) {
        super();
        this._id = option.id ?? createGuid();
        const container = getContainer(option.container) as HTMLDivElement | null;
        if (container) {
            //切换视口时清空容器内容
            this._container.value = clearContainer(container);
            // this._container.value = container;
            this._typeName = option.type;
            this._initName();
        } else {
            throw new Error('container is not defined');
        }
        //show
        {
            const showUpdate = () => {
                if (!container) return;
                if (this.show ?? true) {
                    container.style.display = 'block';
                } else {
                    container.style.display = 'none';
                }
            }
            showUpdate();
            this.d(this.showChanged.don(showUpdate))
        }

        {//对象创建和销毁
            const sceneObjectsMap = this._sceneObjectsMap;
            const createENObjects = () => {
                for (let [sceneObject, engineObject] of sceneObjectsMap.entries()) {
                    if (!engineObject && sceneObject) {
                        const objConstructor = EngineObject.context.createEngineObject(sceneObject, this);
                        objConstructor && (sceneObjectsMap.set(sceneObject, objConstructor));
                    }
                }
            }
            const destroyENObjects = () => {
                for (let [sceneObject, engineObject] of sceneObjectsMap.entries()) {
                    if (engineObject && !(engineObject.isDestroyed())) {
                        engineObject.destroy();
                    }
                    sceneObjectsMap.set(sceneObject, undefined);
                }
            }
            this.d(destroyENObjects);
            this.d(this.viewerChanged.don(viewer => {
                destroyENObjects();
                viewer && createENObjects();
            }));
        }

        {//创建，更新(每时每刻都在执行，注意性能影响)，销毁执行函数

            {
                const update = () => {
                    if (!this.execOnceFuncStr) return;
                    try {
                        const execOnceFunc = Function(`"use strict";return (${this.execOnceFuncStr})`)();
                        execOnceFunc(this);
                    } catch (error) {
                        console.warn(`execOnceFuncStr不能转成函数！或者函数执行时错误！id: ${this.id} ${this.typeName} error: ${error}`);
                    }
                };
                update();
                this.d(this.execOnceFuncStrChanged.don(update));
            }

            {
                const update = () => {
                    if (!this.updateFuncStr) return;
                    try {
                        this.updateFunc = Function(`"use strict";return (${this.updateFuncStr})`)();
                    } catch (error) {
                        console.warn(`updateFuncStr不能转成函数！或者函数执行时错误！id: ${this.id} ${this.typeName} error: ${error}`);
                    }
                };
                update();
                this.d(this.updateFuncStrChanged.don(update));

                let updateProcess: Processing<void, [func: (timeStamp: number) => void]> | undefined;
                this.d(() => updateProcess && updateProcess.destroy());
                this.d(this.updateFuncChanged.don(() => {
                    updateProcess && updateProcess.cancel();
                    if (!this.updateFunc) return;
                    updateProcess = updateProcess || createAnimateFrame();
                    updateProcess.restart(undefined, (timeStamp) => {
                        this.updateFunc && this.updateFunc(this, timeStamp);
                    });
                }));
            }

            {
                const update = () => {
                    try {
                        this.toDestroyFunc = this.toDestroyFuncStr && Function(`"use strict";return (${this.toDestroyFuncStr})`)() || undefined;
                    } catch (error) {
                        console.warn(`toDestroyFuncStr不能转成函数！或者函数执行时错误！id: ${this.id} ${this.typeName} error: ${error}`);
                        this.toDestroyFunc = undefined;
                    }
                };
                update();
                this.d(this.toDestroyFuncStrChanged.don(update));
                this.d(this.toDestroyEvent.don(() => { this.toDestroyFunc && this.toDestroyFunc(this); }));
            }
        }
    }

    static defaults = {
        show: true,
        debug: false,
        statusInfo: {
            fps: 0,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            length: 0,
        } as ESJStatusInfoType,
        terrainShader: {
            slope: {
                show: false
            },
            aspect: {
                show: false,
            },
            elevationRamp: {
                show: false,
            },
            elevationContour: {
                show: false,
                color: [1, 0, 0, 1] as ESJVector4D,
                spacing: 150,
                width: 2,
            }
        },
        globeShow: true,
    };

    protected _statusInfo = ESViewer.defaults.statusInfo;
    protected _navigationMode = this.dv(react<ESJNavigationMode>('Map'));
    get navigationMode() { return this._navigationMode.value; }
    get navigationModeChanged() { return this._navigationMode.changed; }
    getNavigationMode() { return this._navigationMode.value; }
    getEngineType() { return this._typeName; };
    //////////////////////////////////////////////////////////////////////////////
    private _syncViewer = this.dv(react<ESViewer | undefined>(undefined));
    get syncViewer() { return this._syncViewer.value; }
    set syncViewer(value) { this._syncViewer.value = value; }
    get syncViewerChanged() { return this._syncViewer.changed; }

    private _syncEventDon = this.dv(new ObjResettingWithEvent(this.syncViewerChanged, () => {
        const syncViewer = this.syncViewer;
        if (!syncViewer) return undefined;
        return new SyncEventResetting(this, syncViewer);
    }));

    //绑定同步两个视口的属性,undefined时解绑
    syncOtherViewer(viewer: ESViewer | undefined) {
        //被同步的视口不能同步其他视口
        if (viewer && viewer.syncViewer) viewer.syncViewer = undefined;
        if (viewer === this) {
            this._syncViewer.value = undefined;
        } else {
            this._syncViewer.value = viewer;
        }
    }

    private _timeSyncdon = this.dv(new ObjResettingWithEvent(this.timeSyncChanged, () => {
        if (!this.timeSync) return undefined;
        return new TimeSyncEventResetting(this);
    }));

    /**
     * 设置当前时间
     * @param value 时间戳(毫秒)数值或者时间格式字符串
     * 字符串格式 2024 06 26 12:34:56 或者 2023-09-29或者2023/09/29 12:34:56
     */
    setCurrentTime(value: number | string) {
        try {
            this.currentTime = (typeof value === 'string') ? Date.parse(value) : value;
        } catch (error) {
            console.warn(`时间格式不正确! value: ${value} error: ${error}`);
        }
    };

    //函数
    abstract pick(screenPosition: ESJVector2D, attachedInfo?: any, parentInfo?: boolean): Promise<PickedResult | undefined>;
    abstract pickPosition(screenPosition: ESJVector2D): Promise<ESJVector3D | undefined>;
    abstract flyIn(position: ESJVector3D, rotation?: ESJVector3D, duration?: number): void;
    abstract flyTo(flyToParam: ESJFlyToParam, position: ESJVector3D): void
    abstract flyToBoundingSphere(rectangle: ESJVector4D, distance?: number, duration?: number | undefined): void;
    abstract getCurrentCameraInfo(): { position: ESJVector3D, rotation: ESJVector3D } | undefined;
    abstract getLengthInPixel(): number | undefined;
    abstract changeToWalk(position: ESJVector3D): void;
    abstract changeToMap(): void;
    abstract changeToRotateGlobe(latitude?: number, height?: number, cycleTime?: number): void;
    abstract changeToLine(geoLineStringId: string, speed?: number, heightOffset?: number, loop?: boolean, turnRateDPS?: number, lineMode?: "auto" | "manual"): void;
    abstract changeToUserDefined(userDefinedPawn: string): void;
    abstract changeToRotatePoint(position: ESJVector3D, distance?: number, orbitPeriod?: number, heading?: number, pitch?: number): void;
    abstract changeToFollow(objectId: string, distance?: number, heading?: number, pitch?: number, relativeRotation?: boolean): void;
    abstract getFPS(): number;

    async getVersion() {
        //@ts-ignore
        const copyright = window.g_XE3CopyRights ?? {};
        return copyright;
    };

    abstract getHeightByLonLat(lon: number, lat: number, channel?: string): Promise<number | null>;
    abstract getHeightsByLonLats(lonLats: ESJVector2DArray, channel?: string): Promise<(number | null)[] | undefined>;
    abstract capture(resx?: number, resy?: number): Promise<string | undefined>;
    abstract lonLatAltToScreenPosition(position: ESJVector3D): Promise<ESJVector2D | undefined>;

    //事件开始——————————————————————————————————————————————————————————————————————事件开始

    /**
     * 鼠标悬停事件 悬停时长可由hoverTime属性控制
     */
    get hoverEvent() { return this._hoverEvent; }
    private _hoverEvent = this.dv(new Event<[{ screenPosition: ESJVector2D, pointerEvent?: PointerEvent }]>());

    private _pointerOverEvent = this.dv(new Event<[{ screenPosition: ESJVector2D, pointerEvent?: PointerEvent }]>());
    get pointerOverEvent() { return this._pointerOverEvent; }

    private _pointerMoveEvent = this.dv(new Event<[{ screenPosition: ESJVector2D, pointerEvent?: PointerEvent }]>());
    get pointerMoveEvent() { return this._pointerMoveEvent; }

    private _pointerDownEvent = this.dv(new Event<[{ screenPosition: ESJVector2D, pointerEvent?: PointerEvent }]>());
    get pointerDownEvent() { return this._pointerDownEvent; }

    private _pointerUpEvent = this.dv(new Event<[{ screenPosition: ESJVector2D, pointerEvent?: PointerEvent }]>());
    get pointerUpEvent() { return this._pointerUpEvent; }

    private _pointerOutEvent = this.dv(new Event<[{ screenPosition: ESJVector2D, pointerEvent?: PointerEvent }]>());
    get pointerOutEvent() { return this._pointerOutEvent; }

    //鼠标单击
    private _clickEvent = this.dv(new Event<[{ screenPosition?: ESJVector2D, pointerEvent?: PointerEvent }]>());
    get clickEvent() { return this._clickEvent; }

    //鼠标双击
    private _dblclickEvent = this.dv(new Event<[{ screenPosition?: ESJVector2D, pointerEvent?: PointerEvent }]>());
    get dblclickEvent() { return this._dblclickEvent; }

    ///键盘按下
    protected _keyDownEvent = this.dv(new Event<[KeyboardEvent]>());
    get keyDownEvent() { return this._keyDownEvent; }

    ///键盘up
    protected _keyUpEvent = this.dv(new Event<[KeyboardEvent]>());
    get keyUpEvent() { return this._keyUpEvent; }

    ///滚轮事件
    protected _wheelEvent = this.dv(new Event<[WheelEvent]>());
    get wheelEvent() { return this._wheelEvent; }

    //事件结束——————————————————————————————————————————————————————————————————————事件结束
    getProperties(language?: string) {
        return [
            new GroupProperty('ESViewer', 'ESViewer', [
                new FunctionProperty('强制刷新', '重载', [], () => this.forceRecreate(), []),
                new BooleanProperty('debug', 'debug', true, false, [this, 'debug'], ESViewer.defaults.debug),
                new BooleanProperty('是否可见', '是否可见', true, false, [this, 'show']),
                new EnumProperty('位置点单位', 'lonLatFormat', true, false, [this, 'lonLatFormat'], [["度", "DECIMAL_DEGREE"], ["度分", "DEGREES_DECIMAL_MINUTES"], ["度分秒", "SEXAGESIMAL_DEGREE"]]),
                new BooleanProperty('是否开启文字避让', 'textAvoidance', true, false, [this, 'textAvoidance'], false),
                new StringProperty('ionAccessToken', 'ionAccessToken', false, false, [this, 'ionAccessToken']),
                new NumberProperty('时钟', '时钟', false, false, [this, 'currentTime']),
                new BooleanProperty('globeShow', 'globeShow', true, false, [this, 'globeShow']),
                new BooleanProperty('atmosphere', 'atmosphere', false, false, [this, 'atmosphere']),
            ]),
            new NumberProperty('飞行像素范围', '默认飞行定位时对象包围球所占的屏幕像素大小', false, false, [this, 'flyToBoundingSize']),
            new NumberProperty('编辑高度偏移', '编辑时默认的高度偏移', false, false, [this, 'editingHeightOffset']),
            new GroupProperty("Globe", "Globe", [
                new JsonProperty("地形着色器", "可以设置地形全局坡度，坡向，高程带，等高线等", false, false, [this, 'terrainShader'])
            ])
        ] as Property[];
    }

    //该属性不能同步，所以提出来
    private _actived = this.dv(react<boolean>(false));
    get actived() { return this._actived.value; }
    set actived(value: boolean) { this._actived.value = value; }
    get activedChanged() { return this._actived.changed; }
}

export namespace ESViewer {
    //基础属性,不参与消息传递
    export const createBaseProps = () => ({
        name: '未命名场景对象',
        extras: reactJson<JsonValue>(undefined),
        devTags: reactArrayWithUndefined<string[]>(undefined),
        debug: undefined as boolean | undefined,
        show: undefined as boolean | undefined,
        opacity: undefined as number | undefined,
        zIndex: undefined as string | undefined,
        useDefaultStatusDiv: true,
        execOnceFuncStr: undefined as string | undefined,
        updateFuncStr: undefined as string | undefined,
        toDestroyFuncStr: undefined as string | undefined,
    })
    //公共属性，属性会传递到引擎上有功能实现
    export const createCommonProps = () => ({
        //基础
        globeShow: true,
        ionAccessToken: '' as string,

        //设置
        lonLatFormat: 'DECIMAL_DEGREE' as ESJLonLatFormatType,//经纬度格式
        fov: 60,//定义的相机视椎体夹角
        textAvoidance: false,//是否开启文字避让
        flyToBoundingSize: 256 as number | undefined,//默认飞行定位时对象包围球所占的屏幕像素大小
        editingHeightOffset: 0.1 as number | undefined,//编辑高度偏移

        //时间
        hoverTime: 2,//鼠标悬停时间,触发hover事件，单位秒
        currentTime: Date.now(),//当前时间，控制光照
        simulationTime: Date.now(),//仿真时间，控制场景动画
        timeSync: false,//时间同步，false 禁用，true 启用,控制两个时间的同步

        //环境
        rain: 0,//雨
        snow: 0,//雪
        cloud: 0,//云
        fog: 0,//雾
        depthOfField: 0,//景深
        atmosphere: true,//大气


        //编辑器样式
        editingPointSize: undefined as number | undefined,
        editingPointColor: reactArrayWithUndefined<ESJVector4D | undefined>(undefined),
        editingAuxiliaryPointColor: reactArrayWithUndefined<ESJVector4D | undefined>(undefined),
        editingLineWidth: undefined as number | undefined,
        editingLineColor: reactArrayWithUndefined<ESJVector4D | undefined>(undefined),
        editingAxisSize: undefined as number | undefined,
        editingAuxiliaryPointSize: undefined as number | undefined,

        terrainShader: ESViewer.defaults.terrainShader,
    })
    export const createDefaultProps = () => ({
        ...createBaseProps(),
        ...createCommonProps()
    });
}
extendClassProps(ESViewer.prototype, ESViewer.createDefaultProps);
export interface ESViewer extends UniteChanged<ReturnType<typeof ESViewer.createDefaultProps>> { }
