import { ESSceneObject } from "../../ESObjects";
import { SceneTreeItem } from "../SceneTrees";
import { getExtProp, setExtProp } from "xbsj-base";

export function setSceneObjectTreeItem(sceneObject: ESSceneObject, treeItem: SceneTreeItem | undefined) {
    if (getExtProp(sceneObject, '__treeItem')) {
        console.error(`setSceneObjectTreeItem error!`);
    }
    setExtProp(sceneObject, '__treeItem', treeItem);
}

export function getSceneObjectTreeItem(sceneObject: ESSceneObject) {
    const sceneTreeItem = getExtProp<SceneTreeItem>(sceneObject, '__treeItem');
    return sceneTreeItem;
}
