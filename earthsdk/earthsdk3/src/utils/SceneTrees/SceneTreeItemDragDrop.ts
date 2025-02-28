import { createTimeoutWithStartValues, MoveToPositionMode, Tree, TreeItem } from "xbsj-base";
import { TreeItemDragDrop } from "../base";
import { SceneTreeItem } from "./SceneTreeItem";

function getDragMode<TreeItemType extends TreeItem>(treeItem: TreeItemType, dragEvent: DragEvent, itemDivHeight: number) {
    let { offsetY } = dragEvent;
    // @ts-ignore
    // console.log(`offsetY: ${offsetY} clientTop: ${dragEvent.target.clientTop}`, dragEvent);
    if (!dragEvent.target) {
        return 'none';
    }
    if (!('clientTop' in dragEvent.target)) {
        return 'none';
    }
    offsetY += 2; // 假如 height是24，那么draw的offsetY的范围是(-1~23)
    // @ts-ignore
    offsetY += dragEvent.target.clientTop; // 加入border有值，那么需要加上！
    // target
    let mode: MoveToPositionMode = 'none';

    if (treeItem.children) {
        if (offsetY <= itemDivHeight * .3) {
            mode = 'before';
        } else if (offsetY >= itemDivHeight * .7) {
            if (!treeItem.uiTreeObject.collapsed && treeItem.children.length > 0) {
                // 如果treeItem展开了，而且还有元素，此时最好不要有after，因为这样会加到所有子元素的后面，可能和客户预想的结果不一致！
                mode = 'inner';
            } else {
                mode = 'after';
            }
        } else {
            mode = 'inner';
        }
    } else {
        if (offsetY <= itemDivHeight * .5) {
            mode = 'before';
        } else {
            mode = 'after';
        }
    }

    return mode;
};

export class SceneTreeItemDragDrop extends TreeItemDragDrop {
    constructor(
        private _treeItem: SceneTreeItem,
    ) {
        super();

        const { dragStartDataManager } = this._treeItem.sceneTree;

        let lastDragMode: MoveToPositionMode = 'none';
        // delaySetDragMode 是为了避免闪烁
        const delaySetDragMode = this.disposeVar(createTimeoutWithStartValues(() => {
            this._treeItem.uiTreeObject.moveToPositionMode = lastDragMode;
            console.log(`uiTreeObject.moveToPositionMode = lastDragMode(${lastDragMode});`);
        }, 200));
        function setDragMode(dragMode: MoveToPositionMode) {
            if (lastDragMode !== dragMode) {
                lastDragMode = dragMode;
                delaySetDragMode.restart();
            }
        }

        this.dispose(this._dragStartEvent.disposableOn(dragEvent => {
            dragStartDataManager.data = {
                type: "UITreeA",
                value: this._treeItem,
            };
        }));

        this.dispose(this._dragOverEvent.disposableOn(dragEvent => {
            if (!dragEvent.dataTransfer) {
                return;
            }
            dragEvent.preventDefault();
            do {
                const ddm = dragStartDataManager;
                if (ddm.data && ddm.data.type === 'UITreeA' && ddm.data.value !== undefined) {
                    // do nothing
                } else {
                    break;
                }

                const draggedTreeItem = ddm.data.value as SceneTreeItem;

                const currentTreeItem = this._treeItem;
                const { tree } = currentTreeItem;

                if (!tree) {
                    break;
                }
                const selectedSceneTreeItems = [...tree.selectedItems];
                if (!~selectedSceneTreeItems.indexOf(draggedTreeItem)) {
                    selectedSceneTreeItems.push(draggedTreeItem);
                }

                const dragMode = getDragMode(currentTreeItem, dragEvent, tree.itemDivHeight);

                if (dragMode === 'none') {
                    break;
                }

                if (!Tree.canMoveToTreeItems(selectedSceneTreeItems, currentTreeItem, dragMode)) {
                    break;
                }

                dragEvent.dataTransfer.dropEffect = 'move';
                setDragMode(dragMode);
                return;
            } while (false);
            dragEvent.dataTransfer.dropEffect = 'none';
            setDragMode('none');
        }));

        this.dispose(this._dropEvent.disposableOn(dragEvent => {
            const ddm = dragStartDataManager;
            if (ddm.data && ddm.data.type === 'UITreeA' && ddm.data.value !== undefined) {
            } else {
                return;
            }

            const draggedTreeItem = ddm.data.value as SceneTreeItem;
            const currentTreeItem = this._treeItem;
            const { tree } = currentTreeItem;

            if (!tree) {
                return;
            }

            const selectedSceneTreeItems = [...tree.selectedItems];
            if (!~selectedSceneTreeItems.indexOf(draggedTreeItem)) {
                selectedSceneTreeItems.push(draggedTreeItem);
            }

            const dragMode = getDragMode(currentTreeItem, dragEvent, tree.itemDivHeight);

            if (dragMode === 'none') {
                return;
            }

            if (!Tree.canMoveToTreeItems(selectedSceneTreeItems, currentTreeItem, dragMode)) {
                return;
            }

            Tree.moveToTreeItems(selectedSceneTreeItems, currentTreeItem, dragMode);

            ddm.data = undefined;
            setDragMode('none');
        }));

        this.dispose(this._dragLeaveEvent.disposableOn(() => {
            // uiTreeObject.moveToPositionMode = 'none';
            lastDragMode = 'none';
            delaySetDragMode.restart();
        }));
    }
}
