import { Destroyable } from "xbsj-base";
import { SceneObjectsManager } from "./SceneObjectsManager";
import { ESSceneObject } from "../ESObjects";

export type CreateSceneObjectListeningFuncType = (sceneObject: ESSceneObject) => { destroy: () => void } | undefined;

export class SceneObjectsListening extends Destroyable {
    private _listeningSceneObjects = new Map<ESSceneObject, { destroy: () => void }>();
    get listeningSceneObjects() { return this._listeningSceneObjects; }

    get createSceneObjectListeningFunc() { return this._createSceneObjectListeningFunc; }

    constructor(
        private _sceneObjectsMananger: SceneObjectsManager,
        private _createSceneObjectListeningFunc: CreateSceneObjectListeningFuncType,
    ) {
        super();

        const listeningSceneObjects = this._listeningSceneObjects;
        const updateSceneObjects = (toDels?: Iterable<ESSceneObject>, toAdds?: Iterable<ESSceneObject>) => {
            if (toDels) {
                for (let sceneObject of toDels) {
                    const listeningSceneObject = listeningSceneObjects.get(sceneObject);
                    if (listeningSceneObject) {
                        listeningSceneObject.destroy();
                        listeningSceneObjects.delete(sceneObject);
                    }
                }
            }

            if (toAdds) {
                for (let sceneObject of toAdds) {
                    const listeningSceneObject = listeningSceneObjects.get(sceneObject);
                    if (listeningSceneObject) {
                        console.warn(`listeningSceneObjects已存在某对象：${sceneObject.name}`, sceneObject);
                        debugger;
                    }

                    const sol = this.createSceneObjectListeningFunc(sceneObject);
                    if (sol) {
                        listeningSceneObjects.set(sceneObject, sol);
                    }
                }
            }
        };

        updateSceneObjects(undefined, this._sceneObjectsMananger.sceneObjects);
        this.dispose(this._sceneObjectsMananger.sceneObjectsToChange.disposableOn(updateSceneObjects));

        this.dispose(() => {
            for (let sceneObjectListening of this._listeningSceneObjects.values()) {
                sceneObjectListening.destroy();
            }
            this._listeningSceneObjects.clear();
        });
    }
}