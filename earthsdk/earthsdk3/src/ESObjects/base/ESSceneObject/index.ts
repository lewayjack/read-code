import { Destroyable, Event, JsonValue, ObjResettingWithEvent, ObservableSet, Processing, ReactiveVariable, UniteChanged, createAnimateFrame, createGuid, extendClassProps, react, reactArrayWithUndefined, reactJson } from "xbsj-base";
import { ESViewer } from "../../../ESViewer";
import { ESObjectsContext } from "./ESObjectsContext";
import { ESPropertiesType, GroupProperty, JsonProperty, NonreactiveJsonStringProperty, Property, StringProperty } from "@sdkSrc/ESJTypes";

export abstract class ESSceneObject extends Destroyable {
    static readonly context = new ESObjectsContext();// 对象上下文
    static readonly register = ESSceneObject.context.register.bind(ESSceneObject.context); // 注册对象
    static readonly create = ESSceneObject.context.createSceneObject.bind(ESSceneObject.context);
    static readonly createFromClass = ESSceneObject.context.createSceneObjectFromClass.bind(ESSceneObject.context);
    static readonly createFromJson = ESSceneObject.context.createSceneObjectFromJson.bind(ESSceneObject.context);
    static readonly destroySceneObject = ESSceneObject.context.destroySceneObject.bind(ESSceneObject.context);
    static getSceneObjById = ESSceneObject.context.getSceneObjectById.bind(ESSceneObject.context);
    static getEnv = ESSceneObject.context.getEnv.bind(ESSceneObject.context);
    static setEnv = ESSceneObject.context.setEnv.bind(ESSceneObject.context);
    static get envs() { return ESSceneObject.context.environmentVariables };
    static getStrFromEnv = ESSceneObject.context.getStrFromEnv.bind(ESSceneObject.context);
    static get $refs() { return ESSceneObject.context.refsManager.refs; }

    // 对象组件集合
    private _components = this.dv(new ObservableSet<ESSceneObject>());
    get components() { return this._components; }

    // 对象创建在哪个视口上的事件
    private _viewerAttached = this.dv(new Event<[ESViewer]>());
    get viewerAttached() { return this._viewerAttached; }
    // 对象从哪个视口上移除的事件
    private _viewerDetached = this.dv(new Event<[ESViewer]>());
    get viewerDetached() { return this._viewerDetached; }
    private _attachedViewers = (() => {
        const viewers = new Set<ESViewer>();
        this.d(this._viewerAttached.don(viewer => {
            viewers.add(viewer);
        }));
        this.d(this._viewerDetached.don(viewer => {
            viewers.delete(viewer)
        }));
        return viewers;
    })();
    //对象存在于哪些视口上
    get attachedViewers() { return this._attachedViewers; }

    removefromViewer(viewer: ESViewer) {
        if (!this.attachedViewers.has(viewer)) return;
        viewer.delete(this);
    }
    addToViewer(viewer: ESViewer) {
        if (this.attachedViewers.has(viewer)) return;
        viewer.add(this);
    }

    registerAttachedObject(createViewerPropSceneObject: (viewer: ESViewer) => Destroyable | undefined) {
        const viewerPropSceneObjects = new Map<ESViewer, Destroyable>();
        this.d(() => {
            if (viewerPropSceneObjects.size > 0) {
                console.warn(`viewerPropSceneObjects.size > 0`);
            }
        });
        this.d(this._viewerAttached.don(viewer => {
            const viewerObj = createViewerPropSceneObject(viewer);
            viewerObj && viewerPropSceneObjects.set(viewer, viewerObj);
        }));

        this.d(this._viewerDetached.don(viewer => {
            if (!viewerPropSceneObjects.has(viewer)) return;
            const viewerObj = viewerPropSceneObjects.get(viewer);
            if (!viewerObj) return;
            viewerObj.destroy();
            viewerPropSceneObjects.delete(viewer);
        }));
    }
    createAttachedObject(createViewerPropSceneObject: (viewer: ESViewer) => Destroyable | undefined) {
        const viewerPropSceneObjects = new Map<ESViewer, Destroyable>();
        const d0 = (() => {
            for (let [viewer, obj] of viewerPropSceneObjects.entries()) {
                obj.destroy();
            }
            viewerPropSceneObjects.clear();
        });
        const addViewerFunc = (viewer: ESViewer) => {
            const viewerObj = createViewerPropSceneObject(viewer);
            viewerObj && viewerPropSceneObjects.set(viewer, viewerObj);
        }
        for (let viewer of this.attachedViewers) {
            addViewerFunc(viewer);
        }
        const d1 = (this._viewerAttached.don(addViewerFunc));
        const d2 = (this._viewerDetached.don(viewer => {
            if (!viewerPropSceneObjects.has(viewer)) return;
            const viewerObj = viewerPropSceneObjects.get(viewer);
            if (!viewerObj) return;
            viewerObj.destroy();
            viewerPropSceneObjects.delete(viewer);
        }));
        return () => { d2(); d1(); d0(); };
    }
    registerAttachedObjectForContainer(createContainerPropSceneObject: (viewer: ESViewer, container: HTMLDivElement) => Destroyable | undefined) {
        this.registerAttachedObject((viewer: ESViewer) => new ViewerPropSceneObject(viewer, createContainerPropSceneObject));
    }

    static readonly getSceneObjectById = ESSceneObject.context.getSceneObjectById.bind(ESSceneObject.context); // 根据id获取对象
    private _createdEvent = this.dv(new Event());
    /**
     * 对象创建事件,由实现类决定何时触发
     */
    get createdEvent() { return this._createdEvent; };

    private _flushEvent = this.dv(new Event());
    get flushEvent() { return this._flushEvent; };
    /**
     * 刷新对象
     */
    flush() { this.flushEvent.emit(); }

    private _id: string;
    get id() { return this._id; }

    abstract get typeName(): string;
    private _initName() {
        this.name = `${this.typeName}_${('' + this.id).slice(-4)}`;
    }

    get defaultProps() { return ESSceneObject.createDefaultProps(); };// 默认属性
    static defaults = {}; // 默认属性值

    protected _innerGetJson(ignoreDefaults = true) {
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

    protected _innerSetJson(value: JsonValue, filterKeys?: string[], partialSetting?: boolean) {
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

    get json() { return this._innerGetJson(); }
    set json(value: JsonValue) { this._innerSetJson(value) }

    get _jsonStr() { return JSON.stringify(this.json, null, 4); }
    set _jsonStr(value: string) { this._innerSetJson(JSON.parse(value)); }

    private _updateFuncReact = this.dv(react<((sceneObject: ESSceneObject, timeStamp: number) => void) | undefined>(undefined));
    get updateFunc() { return this._updateFuncReact.value; }
    set updateFunc(value: ((sceneObject: ESSceneObject, timeStamp: number) => void) | undefined) { this._updateFuncReact.value = value; }
    get updateFuncChanged() { return this._updateFuncReact.changed; }

    private _toDestroyFuncReact = this.dv(react<((sceneObject: ESSceneObject) => void) | undefined>(undefined));
    get toDestroyFunc() { return this._toDestroyFuncReact.value; }
    set toDestroyFunc(value: ((sceneObject: ESSceneObject) => void) | undefined) { this._toDestroyFuncReact.value = value; }
    get toDestroyFuncChanged() { return this._toDestroyFuncReact.changed; }


    constructor(id?: string) {
        super();
        if (id !== undefined) {
            if (typeof id !== 'string') {
                console.warn(`对象id必须是字符串类型,当前id的类型是${typeof id},值为${id}`);
            } else if (id.trim() === '') {
                console.warn(`场景对象创建时的id不能是空字符串!`);
            } else if (id.trim() !== id) {
                console.warn(`id前后有空字符串!id: ${id}`);
            }
        }
        this._id = id ?? createGuid();
        this._initName();

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

    getProperties(language?: string) {
        return [
            new GroupProperty('ESSceneObject', 'ESSceneObject', [
                new StringProperty('对象类型', '类型(type)', false, true, [this, 'typeName']),
                new StringProperty('对象id', '唯一标识符(id)', false, true, [this, 'id']),
                new StringProperty('对象名称', '名称(name)', false, false, [this, 'name']),
                new StringProperty('ref', '标识(ref),可通过 ESSceneObject.$refs.xxx快速获取到对象', true, false, [this, 'ref']),
                new JsonProperty('extras', '扩展属性，必须整体赋值(extras)', true, false, [this, 'extras']),
                new NonreactiveJsonStringProperty('JSON', '对象JSON数据动态更改导入导出。', false, false, () => this._jsonStr, (value: string | undefined) => value && (this._jsonStr = value)),
            ]),
        ] as Property[];
    }

    getESProperties() {
        return {
            defaultMenu: 'basic',
            basic: [],
            general: [],
            dataSource: [],
            location: [],
            coordinate: [],
            style: [],
        } as ESPropertiesType;
    };
}

export namespace ESSceneObject {
    export const createDefaultProps = () => ({
        name: '未命名场景对象',
        ref: undefined as string | undefined,
        extras: reactJson<JsonValue>(undefined),
        devTags: reactArrayWithUndefined<string[]>(undefined),
        execOnceFuncStr: undefined as string | undefined,
        updateFuncStr: undefined as string | undefined,
        toDestroyFuncStr: undefined as string | undefined,
    });
}
extendClassProps(ESSceneObject.prototype, ESSceneObject.createDefaultProps);
export interface ESSceneObject extends UniteChanged<ReturnType<typeof ESSceneObject.createDefaultProps>> { }


class ViewerPropSceneObject extends Destroyable {
    constructor(viewer: ESViewer, createFunc: (viewer: ESViewer, continaer: HTMLDivElement) => Destroyable | undefined) {
        super();
        this.dv(new ObjResettingWithEvent(viewer.subContainerChanged, () => {
            if (!viewer.subContainer) return undefined;
            return createFunc(viewer, viewer.subContainer);
        }));
    }
}
