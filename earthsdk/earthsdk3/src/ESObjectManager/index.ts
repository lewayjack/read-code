import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, JsonValue, react, UniteChanged } from "xbsj-base";
import { ESJSwitchToCesiumViewerOptionType, ESJSwitchToUEViewerOptionType, ESJSwitchToUEViewerUrlOptionType, ESJSwitchToUEViewerWsOptionType, ESJVector3D, ESObjectsManagerJsonType, ESVOption, ESVOptionCzm, ESVOptionUe } from "../ESJTypes";
import { ESCameraViewCollection, ESSceneObject } from "../ESObjects";
import { ESViewer } from "../ESViewer";
import { getContainer } from "../ESViewer/getContainer";
import { DragStartDataManager, PropUiTreeManager, SceneTree } from "../utils";
import { ESPlyarAndPathTime } from "./ESPlyarAndPathTime";
import { PathAnimationManager } from "./PathAnimationManager";
import { propTreeCallback, propTreeCallbackParamsType } from "./propTreeCallback";
import { SceneObjectsManager } from "./SceneObjectsManager";
import { handleCameraInfo, syncOnceOtherViewer } from "./utils";
import { ViewersManager } from "./ViewersManager";
import { SceneObjectEditingManager } from "./SceneObjectEditingManager";

export class ESObjectsManager extends Destroyable {
    static getSceneObjById = ESSceneObject.context.getSceneObjectById.bind(ESSceneObject.context);
    static getEnv = ESSceneObject.context.getEnv.bind(ESSceneObject.context);
    static setEnv = ESSceneObject.context.setEnv.bind(ESSceneObject.context);
    static get envs() { return ESSceneObject.context.environmentVariables };
    getSceneObjectById(id: string) { return ESSceneObject.getSceneObjectById(id); }
    get $refs() { return ESSceneObject.$refs; }

    private _drgm = this.dv(new DragStartDataManager());
    get dragstartDataMananger() { return this._drgm; }

    private _sobjm = this.dv(new SceneObjectsManager());//所有对象
    private _vrm = this.dv(new ViewersManager(this._sobjm));//所有视口
    get sceneObjectsManager() { return this._sobjm; }
    get viewers() { return this._vrm.viewers; }
    getViewers() { return this._vrm.getViewers(); }

    private _sceneObjectEditingManager = this.disposeVar(new SceneObjectEditingManager());
    get sceneObjectEditingManager() { return this._sceneObjectEditingManager; }

    //视口以及视口同步————————————————————————————————————————————————————————————————s
    private _activeViewer = this.dv(react<ESViewer | undefined>(undefined));
    get activeViewer() { return this._activeViewer.value; }
    set activeViewer(value: ESViewer | undefined) { this._activeViewer.value = value; }
    get activeViewerChanged() { return this._activeViewer.changed; }

    //开启调用每个Viewer的syncOtherViewer(Viewer)把当前的activedViewer传进去
    private _syncOtherViewersToActived = this.dv(react<boolean>(false));
    get syncOtherViewersToActived() { return this._syncOtherViewersToActived.value; }
    set syncOtherViewersToActived(value: boolean) { this._syncOtherViewersToActived.value = value; }
    get syncOtherViewersToActivedChanged() { return this._syncOtherViewersToActived.changed; }

    //视口以及视口同步————————————————————————————————————————————————————————————————e
    private _cmrvm = this.createSceneObjectFromClass(ESCameraViewCollection);
    private _cmrvmdon = this.d(() => this._cmrvm && this.destroySceneObject(this._cmrvm));
    get cameraViewsManager() { return this._cmrvm; }

    private _asset = {
        type: 'ESObjectsManager',
        version: '0.1.0',
        createdTime: '',
        modifiedTime: '',
        name: '未命名项目'
    }

    get json() {
        const createdTime = this._asset.createdTime || new Date().toISOString();
        const modifiedTime = new Date().toISOString();
        const name = this._asset.name || '未命名项目';
        const version = this._asset.version || '0.1.0';
        const asset = { type: 'ESObjectsManager', version, createdTime, modifiedTime, name }
        const sceneTree = this.sceneTree.json
        const viewCollection = this._cmrvm.views;
        const viewers: JsonValue[] = [...this._vrm.viewers].map(viewer => viewer.json)
        const lastView = this.activeViewer?.getCurrentCameraInfo()
        return { asset, viewers, sceneTree, viewCollection, lastView };
    }
    set json(value: ESObjectsManagerJsonType) {
        try {
            if (!value.asset) return;
            if (!value.asset.type || value.asset.type !== "ESObjectsManager") {
                console.warn("json装配失败! asset.type 不存在或者不是'ESObjectsManager'");
                return;
            }
            this._asset.createdTime = value.asset && value.asset.createdTime || new Date().toISOString();
            this._asset.modifiedTime = value.asset && value.asset.modifiedTime || '';
            this._asset.name = value.asset && value.asset.name || '未命名项目';
            this._asset.version = value.asset && value.asset.version || '0.1.0';
            value.sceneTree && (this.sceneTree.json = value.sceneTree);
            value.viewCollection && (this._cmrvm.views = value.viewCollection);
            if (!value.viewers || !Array.isArray(value.viewers)) {
                console.warn('viewers is not an array or does not exist !');
                return;
            };
            if (this._vrm.viewers.size === 0 || value.viewers.length === 0) {
                console.warn('viewers is empty !');
                return;
            };
            this._vrm.viewers.forEach(v => {
                //@ts-ignore
                const vjson = value.viewers.find(v2 => v2.id === v.id);
                //@ts-ignore
                vjson && (v.json = vjson);
            })
        } catch (e) {
            console.error(`ESObjectsManager解析json数据时发生错误! error: ${e}`);
        }
    }

    private _sceneTree = this.dv(new SceneTree('default', this.dragstartDataMananger, 24, this));
    get sceneTree() { return this._sceneTree; };
    get jsonLoadingEvent() { return this._sceneTree.jsonLoadingEvent; }
    private _propUiTreeManager = this.dv(new PropUiTreeManager(24));
    get propUiTreeManager() { return this._propUiTreeManager; }
    propTreeCallback(params: propTreeCallbackParamsType) { return propTreeCallback(this, params); };

    private _sceneTreeMap = new Map<string, SceneTree>();
    getSceneTrees() { return [...this._sceneTreeMap.values()]; }
    getSceneTree(id: string = 'default') {
        if (id === 'default') return this._sceneTree;
        if (!this._sceneTreeMap.has(id)) {
            console.warn(`id为${id}的SceneTree不存在!`);
            return undefined;
        }
        return this._sceneTreeMap.get(id) as SceneTree;
    }

    createSceneTree(id: string, itemDivHeight: number = 24) {
        if (!this._sceneTreeMap.has(id) || id === 'default') {
            console.warn(`id为${id}的SceneTree已存在!`);
        } else {
            const sceneTree = this.dv(new SceneTree(id, this.dragstartDataMananger, itemDivHeight, this));
            this._sceneTreeMap.set(id, sceneTree);
        }
        return this.getSceneTree(id);
    }

    private _viewerCreatedEvent = this.dv(new Event<[ESViewer]>());
    get viewerCreatedEvent() { return this._viewerCreatedEvent; }

    createViewer(option: ESVOption) {
        const viewer = this._vrm.createViewer(option);
        if (!this.activeViewer) { this.activeViewer = viewer; }
        //触发viewerCreatedEvent
        const disposse = this.d(viewer.viewerChanged.don((e) => {
            if (!e) return;
            this._viewerCreatedEvent.emit(viewer);
            disposse()
        }))
        return viewer;
    };
    destroyViewer<T extends ESViewer>(viewer: T) {
        (this._activeViewer.value === viewer) && (this._activeViewer.value = undefined);
        return this._vrm.destroyViewer(viewer);
    };

    /**
     * 内部同步视口相机信息，外部勿用
     */
    _lastCameraInfo: { position: ESJVector3D; rotation: ESJVector3D; } | undefined

    switchViewer<T extends ESViewer>(option: ESVOption, viewSync: boolean = true, attributeSync: boolean = true, destroy: boolean = true) {
        this.activeViewer && (this.activeViewer.getNavigationMode() !== 'Map') && this.activeViewer.changeToMap();
        const existViewer = [...this.getViewers()].find((v) => v.typeName === option.type);
        if (!this._lastCameraInfo && viewSync) {
            this._lastCameraInfo = this.activeViewer?.getCurrentCameraInfo();
        }
        if (existViewer && !destroy) {
            viewSync && handleCameraInfo(this, existViewer);
            this.activeViewer && attributeSync && syncOnceOtherViewer(existViewer, this.activeViewer)
            if (existViewer.container === getContainer(option.container)) {
                existViewer.containerOrId = option.container;
                existViewer.forceRecreate();
            } else {
                existViewer.containerOrId = option.container;
            }
            destroy && this.activeViewer && this.destroyViewer(this.activeViewer);
            this.activeViewer = existViewer;
            return existViewer as T;
        } else {
            console.warn('No ESViewer exists or destroy is true, will be created');
            const newViewer = this.createViewer(option);
            if (newViewer) {
                viewSync && handleCameraInfo(this, newViewer);
                this.activeViewer && attributeSync && syncOnceOtherViewer(newViewer, this.activeViewer)
            }
            destroy && this.activeViewer && this.destroyViewer(this.activeViewer);
            this.activeViewer = newViewer;
            return newViewer as T;
        }
    }
    switchToCesiumViewer<T extends ESViewer>(option: ESJSwitchToCesiumViewerOptionType): T;
    switchToCesiumViewer<T extends ESViewer>(container: HTMLDivElement | string, viewSync?: boolean, attributeSync?: boolean, destroy?: boolean): T;
    switchToCesiumViewer<T extends ESViewer>(...args: any[]) {
        if (typeof args[0] === 'object' && !(args[0] instanceof HTMLDivElement)) {
            const { container, viewSync, attributeSync, destroy } = args[0];
            return this.switchViewer<T>({ type: 'ESCesiumViewer', container }, viewSync ?? true, attributeSync ?? true, destroy ?? true);
        } else if (typeof args[0] === 'string' || args[0] instanceof HTMLDivElement) {
            const option = { container: args[0], viewSync: args[1] ?? true, attributeSync: args[2] ?? true, destroy: args[3] ?? true };
            const { container, viewSync, attributeSync, destroy } = option;
            return this.switchViewer<T>({ type: 'ESCesiumViewer', container }, viewSync, attributeSync, destroy);
        }
    }

    switchToUEViewer<T extends ESViewer>(options: ESJSwitchToUEViewerOptionType): T;
    switchToUEViewer<T extends ESViewer>(container: HTMLDivElement | string, uri: string, app: string, token?: string, viewSync?: boolean, attributeSync?: boolean, destroy?: boolean): T;
    switchToUEViewer<T extends ESViewer>(container: HTMLDivElement | string, ws: string, esmsg?: string, viewSync?: boolean, attributeSync?: boolean, destroy?: boolean): T;
    switchToUEViewer<T extends ESViewer>(...args: any[]) {
        let opt: ESVOptionUe | undefined = undefined;
        let params = { viewSync: true, attributeSync: true, destroy: true };
        if (typeof args[0] === 'object' && !(args[0] instanceof HTMLDivElement) && args[0].has("uri")) {
            const { container, uri, app, token, viewSync, attributeSync, destroy } = args[0] as ESJSwitchToUEViewerUrlOptionType;
            opt = { type: "ESUeViewer", container, options: { uri, app, token } };
            params = { viewSync: viewSync ?? true, attributeSync: attributeSync ?? true, destroy: destroy ?? true };
        } else if (typeof args[0] === 'object' && !(args[0] instanceof HTMLDivElement) && args[0].has("ws")) {
            const { container, ws, esmsg, viewSync, attributeSync, destroy } = args[0] as ESJSwitchToUEViewerWsOptionType;
            opt = { type: "ESUeViewer", container, options: { ws, esmsg } };
            params = { viewSync: viewSync ?? true, attributeSync: attributeSync ?? true, destroy: destroy ?? true }
        } else if (typeof args[0] === 'string' || args[0] instanceof HTMLDivElement) {
            if (typeof args[1] === 'string' && args[1].startsWith("ws")) {
                opt = { type: "ESUeViewer", container: args[0], options: { ws: args[1], esmsg: args[2] ?? undefined } };
                params = { viewSync: args[3] ?? true, attributeSync: args[4] ?? true, destroy: args[5] ?? true };
            } else {
                opt = { type: "ESUeViewer", container: args[0], options: { uri: args[1], app: args[2], token: args[3] ?? undefined } };
                params = { viewSync: args[4] ?? true, attributeSync: args[5] ?? true, destroy: args[6] ?? true };
            }
        }
        if (!opt) throw new Error("参数错误");
        const { viewSync, attributeSync, destroy } = params;
        return this.switchViewer<T>(opt, viewSync, attributeSync, destroy);
    }

    readonly syncEvent = this.dv(createNextAnimateFrameEvent(this.activeViewerChanged, this.syncOtherViewersToActivedChanged));
    private _syncEventDon = this.d(this.syncEvent.don(() => {
        const enable = this.syncOtherViewersToActived;
        //全局不同步或者自身是activeViewer，则不需要同步视口,新创建的视口需要同步
        this.viewers.forEach(viewer => {
            if (!enable) {
                viewer.syncOtherViewer(undefined);
            } else {
                viewer.syncOtherViewer(this.activeViewer);
            }
        })
    }))

    createCesiumViewer<T extends ESViewer>(params: ESVOptionCzm): T;
    createCesiumViewer<T extends ESViewer>(container: HTMLDivElement | string, options?: JsonValue, id?: string): T;
    createCesiumViewer<T extends ESViewer>(...args: any[]) {
        let opt: ESVOptionCzm | undefined = undefined;
        if (typeof args[0] === 'object' && !(args[0] instanceof HTMLDivElement)) {
            opt = { ...args[0], type: "ESCesiumViewer" };
        } else if (typeof args[0] === 'string' || args[0] instanceof HTMLDivElement) {
            opt = { container: args[0], options: args[1] ?? undefined, id: args[2] ?? undefined, type: "ESCesiumViewer" };
        }
        if (!opt) throw new Error("参数错误");
        return this.createViewer(opt) as T;
    }

    createUeViewer<T extends ESViewer>(params: ESVOptionUe): T;
    createUeViewer<T extends ESViewer>(container: HTMLDivElement | string, uri: string, app: string, token?: string, id?: string): T;
    createUeViewer<T extends ESViewer>(container: HTMLDivElement | string, ws: string, esmsg?: string, id?: string): T;
    createUeViewer<T extends ESViewer>(...args: any[]) {
        let opt: ESVOptionUe | undefined = undefined;
        if (typeof args[0] === 'object' && !(args[0] instanceof HTMLDivElement)) {
            opt = { ...args[0], type: "ESUeViewer" };
        } else if (typeof args[0] === 'string' || args[0] instanceof HTMLDivElement) {
            if (typeof args[1] === 'string' && args[1].startsWith("ws")) {
                opt = { type: "ESUeViewer", container: args[0], id: args[3] ?? undefined, options: { ws: args[1], esmsg: args[2] ?? undefined } };
            } else {
                opt = { type: "ESUeViewer", container: args[0], id: args[4] ?? undefined, options: { uri: args[1], app: args[2], token: args[3] ?? undefined } };
            }
        }
        if (!opt) throw new Error("参数错误");
        return this.createViewer(opt) as T;
    }

    createSceneObject<T extends ESSceneObject>(sceneObjectType: string | (new (id?: string) => T), id?: string) {
        const sceneObject = this._sobjm.createSceneObject(sceneObjectType, id);
        return sceneObject;
    }
    createSceneObjectFromClass<T extends ESSceneObject>(sceneObjConstructor: new (id?: string) => T, id?: string) {
        const sceneObject = this._sobjm.createSceneObjectFromClass(sceneObjConstructor, id);
        return sceneObject;
    }
    createSceneObjectFromJson<T extends ESSceneObject>(sceneObjectJson: JsonValue & { type: string;[k: string]: any; }) {
        const sceneObject = this._sobjm.createSceneObjectFromJson(sceneObjectJson) as T | undefined;
        return sceneObject;
    }

    destroySceneObject<T extends ESSceneObject>(sceneObject: T) {
        const flag = this._sobjm.deleteSceneObject(sceneObject);
        sceneObject.destroy();
        return flag;
    }

    destroyAllSceneObjects() {
        const toDels = [...this._sobjm.sceneObjects];
        for (let sceneObject of toDels) {
            this.destroySceneObject(sceneObject);
        }
    }
    private _esPlyarAndPathTime = this.dv(new ESPlyarAndPathTime(this));
    //路径动画管理器
    private _pathAnimationManager = this.dv(new PathAnimationManager(this));
    /**
     * 路径动画管理器
     * 1.channels : { pathId: string, sceneObjectIds: string[] }[]；
     * 2.player : ESPlayer；
     * 3.指定的id的sceneObject必须拥有position和rotation属性,path类型为 ESPath；
     */
    get pathAnimationManager() { return this._pathAnimationManager };
    constructor(...args: any[]) {
        super();
    }

}

export namespace ESObjectsManager {
    export const createDefaultProps = () => ({

    });
}
extendClassProps(ESObjectsManager.prototype, ESObjectsManager.createDefaultProps);
export interface ESObjectsManager extends UniteChanged<ReturnType<typeof ESObjectsManager.createDefaultProps>> { }
