import { ESSceneObject } from "../../ESObjects";

export function getSceneObjectShow(sceneObject: ESSceneObject | undefined) {
    let show = false;

    do {
        if (!sceneObject) break;
        if ('show' in sceneObject) {
            // @ts-ignore
            show = sceneObject.show as (boolean | undefined) ?? true;
        } else if ('enabled' in sceneObject) {
            // @ts-ignore
            show = sceneObject.enabled as (boolean | undefined) ?? true;
        }
    } while (false);

    return show;
}

export function setSceneObjectShow(sceneObject: ESSceneObject | undefined, show: boolean | undefined) {
    if (!sceneObject) return;

    if ('show' in sceneObject) {
        // @ts-ignore
        sceneObject.show = show;
    } else if ('enabled' in sceneObject) {
        // @ts-ignore
        sceneObject.enabled = show;
    }
}
