import { Tree, UiTree } from "xbsj-base";
import { GroupPropTreeItem, LeafPropTreeItem } from "./PropTreeItem";

export class PropTree extends Tree<LeafPropTreeItem | GroupPropTreeItem> {
    constructor(itemDivHeight: number) {
        super(itemDivHeight);
    }

    get propUiTree() {
        return this.uiTree as unknown as UiTree<LeafPropTreeItem | GroupPropTreeItem, PropTree>;
    }
}
