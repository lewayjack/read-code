import { createGuid, Destroyable, JsonValue, Event, Listener, setExtProp, getExtProp, ReactParamsType } from "xbsj-base";
import { ESSceneObject } from "./index";
import { RefsManager } from "./RefsManager";
import { createEnvEvalStrReact } from "./funcs/createEnvEvalStrReact";
import { replaceStrWithEnv } from "./funcs/replaceStrWithEnv";

/**
 * ESObjectsContext
 * ESObjects的上下文，用于管理ESObjects的注册/创建/销毁
 */
export class ESObjectsContext extends Destroyable {
    private _esObjConstructors: Map<string, new (id?: string) => ESSceneObject> = new Map();
    get typeNames() { return this._esObjConstructors.keys(); }

    private _sceneObjs: Map<string, ESSceneObject> = new Map();
    get sceneObjs() { return this._sceneObjs.values(); }

    private _sceneObjCreatedEvent = new Event<[ESSceneObject]>();
    get sceneObjCreatedEvent() { return this._sceneObjCreatedEvent as Listener<[ESSceneObject]>; }

    private _sceneObjToDestroyEvent = new Event<[ESSceneObject]>();
    get sceneObjToDestroyEvent() { return this._sceneObjToDestroyEvent as Listener<[ESSceneObject]>; }

    private _refsManager = this.dv(new RefsManager(this));
    get refsManager() { return this._refsManager; }
    get $refs() { return this._refsManager.refs; }

    constructor() { super(); }

    register<T extends ESSceneObject>(sceneObjectType: string, sceneObjConstructor: new () => T, extraInfo?: { [k: string]: any; }) {
        if (this._esObjConstructors.has(sceneObjectType)) {
            console.warn(`register warn: ${sceneObjectType} has registered ! will be override!`);
        }
        this._esObjConstructors.set(sceneObjectType, sceneObjConstructor);
        extraInfo && setExtProp(sceneObjConstructor, '__sceneObjExtraInfo', extraInfo);
        return sceneObjectType;
    }

    private _addSceneObject(sceneObject: ESSceneObject) {
        this._sceneObjs.set(sceneObject.id, sceneObject);
        this._sceneObjCreatedEvent.emit(sceneObject);
        sceneObject.d(() => this._deleteSceneObject(sceneObject));
    }

    private _deleteSceneObject(sceneObject: ESSceneObject) {
        this._sceneObjToDestroyEvent.emit(sceneObject);
        this._sceneObjs.delete(sceneObject.id);
    }

    createSceneObjectFromClass<T extends ESSceneObject>(sceneObjConstructor: new (id?: string) => T, id?: string) {
        if (!id || this._sceneObjs.has(id)) {
            const newId = createGuid();
            if (id) console.warn(`已存在相同id的对象!id自动变更!${id} -> ${newId} 请注意:id变更可能导致引用失效!`);
            id = newId;
        }
        if (!id) throw new Error(`id不能为空!`);
        const sceneObj = new sceneObjConstructor(id);
        if (sceneObj.id !== id) {
            console.warn(`sceneObj.id(${sceneObj.id}) !== id(${id}) sceneObjectType: ${sceneObj.typeName}`);
            console.warn(`出现这种问题有可能是自定义的场景对象,没有在构造函数中传递id参数!示例如下：`);
            console.warn(`class XXX extends XXX { constructor(id) { super(id); } }`);
        }
        this._addSceneObject(sceneObj);
        return sceneObj;
    }

    createSceneObject<T extends ESSceneObject>(sceneObjectType: string | (new (id?: string) => T), id?: string): T | undefined {
        if (typeof sceneObjectType === 'string') {
            // @ts-ignore
            const sceneObjConstructor = this._getSceneObjConstructor<T>(sceneObjectType) as (new (id?: string) => T);
            if (!sceneObjConstructor) {
                console.warn(`Cannot find SceneObjectType: ${sceneObjectType}`);
                return undefined;
            }
            return this.createSceneObjectFromClass(sceneObjConstructor, id);
        } else {
            return this.createSceneObjectFromClass(sceneObjectType, id);
        }
    }

    createSceneObjectFromJson<T extends ESSceneObject>(sceneObjectJson: JsonValue & { type: string;[k: string]: any; }): T | undefined {
        const sceneObject = this.createSceneObject<T>(sceneObjectJson.type, sceneObjectJson.id);
        sceneObject && (sceneObject.json = sceneObjectJson);
        return sceneObject;
    }

    destroySceneObject(sceneObject: ESSceneObject) {
        this._deleteSceneObject(sceneObject);
        sceneObject.destroy();
        return sceneObject.isDestroyed();
    }

    getSceneObjectById(id: string) {
        return this._sceneObjs.get(id);
    }

    private _getSceneObjConstructor<T extends ESSceneObject>(sceneObjectType: string) {
        const sceneObjConstructor = this._esObjConstructors.get(sceneObjectType);
        if (!sceneObjConstructor) {
            return undefined;
        } else {
            return sceneObjConstructor as unknown as (new (id?: string) => T);
        }
    }

    getProps(typeName: string) {
        const sceneObjConstructor = this._getSceneObjConstructor(typeName);
        if (!sceneObjConstructor) {
            console.warn(`cannot get constructor from type: ${typeName}`);
            return undefined;
        }
        return getExtProp<{ [k: string]: any; }>(sceneObjConstructor, '__sceneObjExtraInfo');
    }

    setProps(typeName: string, props: { [k: string]: any; }) {
        const sceneObjConstructor = this._getSceneObjConstructor(typeName);
        if (!sceneObjConstructor) {
            console.warn(`cannot get constructor from type: ${typeName}`);
            return;
        }
        let sceneObjExtraInfo = getExtProp<{ [k: string]: any; }>(sceneObjConstructor, '__sceneObjExtraInfo');
        if (!sceneObjExtraInfo) {
            sceneObjExtraInfo = {};
            setExtProp(sceneObjConstructor, '__sceneObjExtraInfo', sceneObjExtraInfo);
        }

        Object.assign(sceneObjExtraInfo, props);
    }

    getProp<T>(typeName: string, propName: string) {
        const sceneObjExtraInfo = this.getProps(typeName);
        return sceneObjExtraInfo && sceneObjExtraInfo[propName] as (T | undefined);
    }

    setProp<T = any>(typeName: string, propName: string, value: T) {
        this.setProps(typeName, { [propName]: value });
    }

    //@ts-ignore
    private _environmentVariables: { [k: string]: string | undefined; } = window.ESSDK_ENV || {};

    get environmentVariables() { return this._environmentVariables; }
    set environmentVariables(value: { [k: string]: string | undefined }) {
        for (let [k, v] of Object.entries(value)) {
            this.setEnv(k, v);
        }
    }

    private _environmentVariablesChanged = this.dv(new Event<[varName: string, value: string | undefined, oldValue: string | undefined]>());
    get environmentVariablesChanged() { return this._environmentVariablesChanged as Listener<[varName: string, value: string | undefined, oldValue: string | undefined]>; }

    /**
     * 设置环境变量
     * @param varName 环境变量名
     * @param value 环境变量值
     */
    setEnv(varName: string, value: string | undefined) {
        if (this._environmentVariables[varName] !== value) {
            const oldVale = this._environmentVariables[varName];
            this._environmentVariables[varName] = value;
            this._environmentVariablesChanged.emit(varName, value, oldVale);
        }
        //@ts-ignore
        window.ESSDK_ENV = { ...this._environmentVariables };
    }

    /**
     * 获取环境变量
     * @param varName 环境变量名
     * @returns  环境变量值
     */

    getEnv(varName: string) {
        return this._environmentVariables[varName];
    }

    /**
     * 根据含有环境变量的url获取真实路径
     * @param str 字符串 内部必须包含`${xxx-xxx}/xxx/abc.png` 环境变量名
     * @returns  转换为真实路径后的字符串
     */
    getStrFromEnv(str: string) { return replaceStrWithEnv(str); }

    /**
     * 创建一个经过env替换后的响应式变量
     * @param reactVar 
     * @example
     * const reactUrl = this.dv(ESSceneObject.context.createEnvStrReact([sceneObject, 'uri']));
     * this.d(reactUrl.changed.don(update));
     */
    createEnvStrReact(reactVar: ReactParamsType<string | undefined>, defaultValue?: string) { return createEnvEvalStrReact(reactVar, defaultValue); }

    /**
     * @deprecated 请使用createEnvStrReact
     */
    createEvnStrReact(reactVar: ReactParamsType<string | undefined>, defaultValue?: string) { return createEnvEvalStrReact(reactVar, defaultValue); }
}
