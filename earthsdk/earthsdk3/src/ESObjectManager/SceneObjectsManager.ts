import { ESSceneObject } from "../ESObjects";
import { Destroyable, Event, JsonValue, length, Listener } from "xbsj-base";

export class SceneObjectsManager extends Destroyable {
    private _sceneObjects = new Set<ESSceneObject>();
    get sceneObjects() { return this._sceneObjects; }

    private _sceneObjectsToChange = this.dv(new Event<[toDels: ESSceneObject[], toAdds: ESSceneObject[]]>());
    get sceneObjectsToChange() { return this._sceneObjectsToChange as Listener<[toDels: ESSceneObject[], toAdds: ESSceneObject[]]>; }

    constructor() {
        super();
        this.d(() => {
            const l = length(this._sceneObjects);
            if (l !== 0) console.warn(`场景对象管理器销毁时仍然管理着${l}个场景对象！`);
        });
    }

    addSceneObject<T extends ESSceneObject>(sceneObject: T) {
        if (this._sceneObjects.has(sceneObject)) {
            console.warn(`创建失败:对象${sceneObject}已经存在于场景对象管理器中！}`);
            return false;
        }
        do {
            this._sceneObjectsToChange.emit([], [sceneObject]);
            this._sceneObjects.add(sceneObject);
        } while (false);
        return true;
    }

    deleteSceneObject<T extends ESSceneObject>(sceneObject: T) {
        if (!this._sceneObjects.has(sceneObject)) {
            console.warn(`删除失败:对象${sceneObject}不存在于场景对象管理器中！}`);
            return false;
        }
        do {
            this._sceneObjectsToChange.emit([sceneObject], []);
            this._sceneObjects.delete(sceneObject);
        } while (false);
        return true;
    }

    createSceneObject<T extends ESSceneObject>(sceneObjectType: string | (new (id?: string) => T), id?: string) {
        const sceneObject = ESSceneObject.context.createSceneObject(sceneObjectType, id);
        sceneObject && this.addSceneObject(sceneObject);
        return sceneObject;
    }

    createSceneObjectFromClass<T extends ESSceneObject>(sceneObjConstructor: new (id?: string) => T, id?: string) {
        const sceneObject = ESSceneObject.context.createSceneObjectFromClass(sceneObjConstructor, id);
        sceneObject && this.addSceneObject(sceneObject);
        return sceneObject;
    }

    createSceneObjectFromJson<T extends ESSceneObject>(sceneObjectJson: JsonValue & { type: string;[k: string]: any; }) {
        const sceneObject = ESSceneObject.context.createSceneObjectFromJson(sceneObjectJson) as T | undefined;
        sceneObject && this.addSceneObject(sceneObject);
        return sceneObject;
    }

}
