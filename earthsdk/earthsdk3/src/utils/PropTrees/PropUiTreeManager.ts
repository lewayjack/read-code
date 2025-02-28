import { GroupProperty } from "../../ESJTypes";
import { ESSceneObject } from "../../ESObjects";
import { Destroyable, extendClassProps, ObjResettingWithEvent, react, UniteChanged } from "xbsj-base";
import { PropTree } from "./PropTree";
import { GroupPropTreeItem, LeafPropTreeItem } from "./PropTreeItem";

export function createPropTreeFromSceneObject(sceneObject: ESSceneObject, itemDivHeight: number) {
    const propTree = new PropTree(itemDivHeight);
    const props = sceneObject.getProperties('chinese');
    const todos = [] as GroupPropTreeItem[];
    for (let child of props) {
        if (child instanceof GroupProperty) {
            const groupItem = new GroupPropTreeItem(propTree, child);
            groupItem.dispose(() => child.destroy());
            propTree.children.push(groupItem);
            todos.push(groupItem);
        } else {
            const leafTreeItem = new LeafPropTreeItem(propTree, child);
            propTree.children.push(leafTreeItem);
            leafTreeItem.dispose(() => child.destroy());
        }
    }

    while (todos.length > 0) {
        const todo = todos.pop();
        if (!todo) {
            throw new Error(`should not be here!`);
        }
        const treeItem = todo;

        if (!(treeItem.property instanceof GroupProperty)) {
            throw new Error(`!(treeItem.property instanceof GroupProperty)`);
        }

        for (let child of treeItem.property.children) {
            if (child instanceof GroupProperty) {
                const groupItem = new GroupPropTreeItem(propTree, child);
                groupItem.dispose(() => child.destroy());
                treeItem.groupChildren.push(groupItem);
                todos.push(groupItem);
            } else {
                const leafTreeItem = new LeafPropTreeItem(propTree, child);
                treeItem.groupChildren.push(leafTreeItem);
                leafTreeItem.dispose(() => child.destroy());
            }
        }
    }

    {
        propTree.dispose(() => {
            propTree.itemChildrenChanged.reset();
            propTree.itemChildrenToChange.reset();

            // console.log(propTree);
            const propTreeItems = [...propTree.getDescendants()];

            propTreeItems.forEach(e => {
                e.children && (e.children.length = 0);
                e.destroy();
            });
            propTreeItems.length = 0;
        });
    }

    return propTree;
}

export class PropUiTreeManager extends Destroyable {
    private _propTreeReact = this.disposeVar(react<PropTree | undefined>(undefined));
    get propTree() { return this._propTreeReact.value; }
    get propTreeChanged() { return this._propTreeReact.changed; }

    constructor(itemDivHeight: number) {
        super();

        this.dispose(() => this._propTreeReact.value = undefined);

        this.disposeVar(new ObjResettingWithEvent(this.sceneObjectChanged, sceneObject => {
            if (!sceneObject) return undefined;
            const disposer = new Destroyable();
            disposer.dispose(sceneObject.toDestroyEvent.disposableOn(() => {
                this.sceneObject = undefined;
            }));
            return disposer;
        }));

        this.dispose(this.sceneObjectChanged.disposableOn(sceneObject => {
            this._propTreeReact.value = undefined;
            if (!sceneObject || !(sceneObject instanceof ESSceneObject)) return;
            this._propTreeReact.value = createPropTreeFromSceneObject(sceneObject, itemDivHeight);
        }));
    }
}

export namespace PropUiTreeManager {
    export const createDefaultProps = () => ({
        sceneObject: undefined as ESSceneObject | undefined,
    });
}

extendClassProps(PropUiTreeManager.prototype, PropUiTreeManager.createDefaultProps);
export interface PropUiTreeManager extends UniteChanged<ReturnType<typeof PropUiTreeManager.createDefaultProps>> { }
