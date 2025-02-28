import { ESSceneObject } from "../../ESObjects";
import { JsonValue } from "xbsj-base";
import { SceneTreeItem } from "./SceneTreeItem";

export function defaultCreateSceneObject(sceneObjJson: JsonValue, sceneTreeItem: SceneTreeItem) {
    // @ts-ignore
    const { type, id } = sceneObjJson;
    if (type) {
        const sceneObject = ESSceneObject.create(type, id);
        if (sceneObject) {
            sceneObject.json = sceneObjJson;
            return sceneObject;
        } else {
            console.warn(`cannot create sceneObject from type(${type})`);
        }
    } else {
        console.warn(`cannot create sceneObject from type(${type})`);
    }

    return undefined;
}
