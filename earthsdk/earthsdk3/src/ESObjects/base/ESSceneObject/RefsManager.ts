import { Destroyable, Event, Listener } from "xbsj-base";
import { ESSceneObject } from "./index";
import { ESObjectsContext } from "./ESObjectsContext";

export class RefsManager extends Destroyable {
    private _sceneObjRefs: Map<string, ESSceneObject[]> = new Map();
    get sceneObjRefs() { return this._sceneObjRefs; }
    private _refs: { [k: string]: ESSceneObject | undefined } = {};
    get refs() { return this._refs; }
    private _refsChagned = this.dv(new Event<[ESSceneObject | undefined, ESSceneObject | undefined]>());
    get refsChanged() { return this._refsChagned as Listener<[ESSceneObject | undefined, ESSceneObject | undefined]>; }

    getLastSceneObject(ref: string) {
        const sceneObjects = this.getSceneObjects(ref);
        if (!sceneObjects) {
            return undefined;
        }
        return sceneObjects[sceneObjects.length - 1];
    }

    getSceneObjects(ref: string) {
        const sceneObjects = this._sceneObjRefs.get(ref);
        if (!sceneObjects || sceneObjects.length === 0) {
            return undefined;
        }
        return sceneObjects;
    }

    constructor(context: ESObjectsContext) {
        super();

        const updateSceneObjectRef = (sceneObject: ESSceneObject, ref: string | undefined, oldRef: string | undefined) => {
            if (oldRef) {
                const oldSceneObject = this.getLastSceneObject(oldRef);

                const sceneObjs = this._sceneObjRefs.get(oldRef);
                if (!sceneObjs) {
                    console.warn(`this._sceneObjRefs中不存在ref(${oldRef}), 可能系统存在逻辑问题`);
                } else {
                    const index = sceneObjs.indexOf(sceneObject);
                    if (index === -1) {
                        console.warn(`this._sceneObjRefs中不存在当前对象(id: ${sceneObject.id} type: ${sceneObject.typeName})！可能系统存在逻辑问题`);
                    } else {
                        sceneObjs.splice(index, 1);
                        if (sceneObjs.length === 0) {
                            this._sceneObjRefs.delete(oldRef);
                        }
                    }
                }

                const newSceneObject = this.getLastSceneObject(oldRef);
                this._refs[oldRef] = newSceneObject;
                this._refsChagned.emit(newSceneObject, oldSceneObject);
            }

            if (ref) {
                const oldSceneObject = this.getLastSceneObject(ref);

                const sceneObjs = this._sceneObjRefs.get(ref);
                if (sceneObjs) {
                    sceneObjs.push(sceneObject);
                    if (sceneObjs.length > 0) {
                        console.warn(`同时存在多个ref${ref}相同的场景对象！\n${sceneObjs.map(e => `${e.id} ${e.typeName}\n`).join(' ')}`);
                    }
                } else {
                    this._sceneObjRefs.set(ref, [sceneObject]);
                }

                const newSceneObject = this.getLastSceneObject(ref);
                this._refs[ref] = newSceneObject;
                this._refsChagned.emit(newSceneObject, oldSceneObject);
            }
        }

        this.d(context.sceneObjCreatedEvent.don(sceneObject => {
            const updateRef = (ref: string | undefined, oldRef: string | undefined) => updateSceneObjectRef(sceneObject, ref, oldRef);
            sceneObject.ref && updateRef(sceneObject.ref, undefined);
            sceneObject.refChanged.don(updateRef);
        }));

        this.d(context.sceneObjToDestroyEvent.don(sceneObject => {
            sceneObject.ref && updateSceneObjectRef(sceneObject, undefined, sceneObject.ref);
        }));
    }
}
