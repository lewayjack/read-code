import { GroupProperty, Property } from "../../ESJTypes";
import { ObservableArray, Tree, TreeItem } from "xbsj-base";
import { PropTree } from "./PropTree";

export class BasePropTreeItem extends TreeItem {
    constructor(tree: PropTree, hasChildren: boolean, private _property: Property) {
        super(tree as unknown as Tree<TreeItem>, hasChildren)
    }

    get property() { return this._property; }
}

export class LeafPropTreeItem extends BasePropTreeItem {
    constructor(tree: PropTree, property: Property) {
        super(tree, false, property);
    }
}

export class GroupPropTreeItem extends BasePropTreeItem {
    constructor(tree: PropTree, groupProperty: GroupProperty) {
        super(tree, true, groupProperty);
    }

    get groupChildren() {
        return this.children as ObservableArray<TreeItem>;
    }
}
