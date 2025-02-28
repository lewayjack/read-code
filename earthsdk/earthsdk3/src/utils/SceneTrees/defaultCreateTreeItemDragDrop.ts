import { TreeItem } from "xbsj-base";
import { SceneTreeItem } from "./SceneTreeItem";
import { SceneTreeItemDragDrop } from "./SceneTreeItemDragDrop";
import { TreeItemDragDrop } from "../base";

export function defaultCreateTreeItemDragDrop(treeItem: TreeItem) {
    if (!(treeItem instanceof SceneTreeItem)) {
        throw new Error(`defaultCreateTreeItemDragDrop !(treeItem instanceof SceneTreeItem)`);
    }
    return new SceneTreeItemDragDrop(treeItem) as TreeItemDragDrop;
}
