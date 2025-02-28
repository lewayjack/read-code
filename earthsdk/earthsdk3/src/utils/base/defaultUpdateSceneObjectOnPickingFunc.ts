import { ESSceneObject } from "../../ESObjects";
import { ESViewer } from "../../ESViewer";

export function defaultUpdateSceneObjectOnPickingFunc(viewer: ESViewer, sceneObject: ESSceneObject | undefined) {
    if (!sceneObject) {
        return;
    }

    if (Reflect.has(sceneObject, 'editing')) {
        // @ts-ignore
        sceneObject.editing = true;
    } else if (Reflect.has(sceneObject, 'positionEditing')) {
        // @ts-ignore
        sceneObject.positionEditing = true;
    }
}
