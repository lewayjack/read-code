import { ESSceneObject } from "../../ESObjects";


export function defaultInitSceneObjectOnCreatingFunc(sceneObject: ESSceneObject) {
    const noEditingObjTypes = ['Czm3DTiles', 'View', 'ESCameraView', 'OlView', 'GeoCameraController'];

    if (!noEditingObjTypes.includes(sceneObject.typeName)) {
        if (Reflect.has(sceneObject, 'editing')) {
            // @ts-ignore
            sceneObject.editing = true;
        } else if (Reflect.has(sceneObject, 'positionEditing')) {
            // @ts-ignore
            sceneObject.positionEditing = true;
        }
    }

    // @ts-ignore
    if (typeof sceneObject['execOnCreating'] === 'function') {
        // @ts-ignore
        sceneObject.execOnCreating();
    }
}
