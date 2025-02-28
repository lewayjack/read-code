import { Destroyable } from "xbsj-base";
import { SceneTree } from "./SceneTree";
import { SceneTreeItem } from "./SceneTreeItem";
import { ESObjectsManager } from "../../ESObjectManager";

export type MenuContentType = {
    text: string;
    keys: string;
    func: () => void;
} | {
    type: "divider",
}


export type TreeItemContexMenuCallbackType = (contextMenuItems: MenuContentType[], item: SceneTreeItem | undefined, sceneTree: SceneTree, projectManager: ESObjectsManager) => void;

export class SceneTreeContextMenu extends Destroyable {
    get sceneTree() { return this._sceneTree; }

    treeItemContexMenuCallback: TreeItemContexMenuCallbackType | undefined;

    constructor(private _sceneTree: SceneTree, private _projectManager: ESObjectsManager) {
        super();
    }
}
