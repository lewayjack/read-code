import { ESSceneObject } from "../../ESObjects";
import { Destroyable, ObjResettingWithEvent, react, SceneObjectKey } from "xbsj-base";

/**
 * 这个类是为了解决有了ID，但是场景对象还未出现的问题。
 */
export class SceneObjectFromId<T extends ESSceneObject = ESSceneObject> extends Destroyable {
    private _sceneObject = this.disposeVar(react<T | undefined>(undefined));
    get sceneObject() { return this._sceneObject.value; }
    get sceneObjectChanged() { return this._sceneObject.changed; }
    get id() { return this._id; }
    constructor(private _id: SceneObjectKey) {
        super();

        this.dispose(() => {
            this._sceneObject.value = undefined;
        });

        // 创建时检查一下能否获得场景对象
        const sceneObject = ESSceneObject.getSceneObjById(this._id) as T | undefined;
        if (sceneObject) {
            this._sceneObject.value = sceneObject;
        }

        // 否则场景对象创建时跟踪一下
        this.dispose(ESSceneObject.context.sceneObjCreatedEvent.disposableOn(sceneObject => {
            if (sceneObject.id === this._id) {
                this._sceneObject.value = sceneObject as T | undefined;
            }
        }));

        // 场景对象销毁时，一同销毁
        this.dispose(ESSceneObject.context.sceneObjToDestroyEvent.disposableOn(sceneObject => {
            if (sceneObject.id === this._id) {
                this._sceneObject.value = undefined;
            }
        }));
    }
}
/**
 * ESSceneObjectWithId是给ESSceneObjectWithId内部使用的
 */
class SceneObjectFromIdWrapper<T extends ESSceneObject> extends Destroyable {
    private _sofi;
    constructor(private _id: string, ESSceneObjectWithId: ESSceneObjectWithId<T>) {
        super();
        this._sofi = this.disposeVar(new SceneObjectFromId<T>(this._id));
        {
            const update = () => { ESSceneObjectWithId.sceneObject = this._sofi.sceneObject; }
            update();
            this.dispose(this._sofi.sceneObjectChanged.disposableOn(update));
        }
    }
};

/**
 * id可以任意设置
 */
export class ESSceneObjectWithId<T extends ESSceneObject> extends Destroyable {
    private _id = this.disposeVar(react<string | undefined>(undefined));
    get id() { return this._id.value; }
    get idChanged() { return this._id.changed; }
    set id(value: string | undefined) { this._id.value = value; }

    private _sceneObject = this.disposeVar(react<T | undefined>(undefined));
    get sceneObject() { return this._sceneObject.value; }
    get sceneObjectChanged() { return this._sceneObject.changed; }
    set sceneObject(value: T | undefined) { this._sceneObject.value = value; }

    private _resetting = this.disposeVar(new ObjResettingWithEvent(this.idChanged, () => {
        const { id } = this;
        if (id === undefined || id === '') {
            this.sceneObject = undefined;
            return undefined;
        }
        return new SceneObjectFromIdWrapper(id, this);
    }));

    get resetting() { return this._resetting; }

    constructor() {
        super();
    }
}
