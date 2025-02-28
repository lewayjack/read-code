import { bind, Destroyable, every, extendClassProps, JsonValue, ObjResettingWithEvent, react, ReactivePropsToNativePropsAndChanged, reactJsonWithUndefined, Tree, TreeItem, TreeItemInsertFlag } from "xbsj-base";
import { TreeItemDragDrop } from "../base";
import { SceneTree } from "./SceneTree";
import { ESSceneObject } from "../../ESObjects";

export type SceneTreeItemJsonValue = {
    name?: string;
    show?: boolean; // 默认true
    collapsed?: boolean; // 默认false
    sceneObj?: JsonValue;
    children?: SceneTreeItemJsonValue[];
    extras?: JsonValue;
};

export type SceneTreeItemType = 'Folder' | string;

export type SceneTreeItemInsertFlag = TreeItemInsertFlag | 'FolderInnerOrAfter' | 'FolderInnerOrBefore' | 'FolderInner';

// 根据子节点的可见性，来判断当前节点的可见性
function getSceneTreeItemShowFromChildren(sceneTreeItem: SceneTreeItem) {
    const allChildrenHidden = sceneTreeItem.children && every(sceneTreeItem.children, treeItem => {
        if (!(treeItem instanceof SceneTreeItem)) {
            throw new Error(`!(treeItem instanceof SceneTreeItem)`);
        }
        return !treeItem.show;
    }) || false;

    const parentSelfShow = sceneTreeItem.sceneTree.getSceneObjectShowFunc(sceneTreeItem.sceneObject);

    return !allChildrenHidden || parentSelfShow;
}

// export type SceneTreeItemInsertFlag = 'InnerOrBefore' | 'InnerOrAfter' | 'Inner' | 'Before' | 'After';

export class SceneTreeItem extends TreeItem {
    private _dragDrop?: TreeItemDragDrop;
    get dragDrop() {
        if (!this._dragDrop) {
            this._dragDrop = this.dv(this.sceneTree.createTreeItemDragDropFunc(this));
        }
        return this._dragDrop as TreeItemDragDrop;
    }

    private _showChangedNotAffectChildren = false; // show的改变不要影响子节点！内部使用
    private _showChangedNotAffectParent = false; // show的改变不要影响父节点！内部使用

    private _type = this.dv(react('Unknown'));
    get type() { return this._type.value; }
    get typeChanged() { return this._type.changed; }

    private _isExport = this.dv(react(true));
    get isExport() { return this._isExport.value; }
    get isExportChanged() { return this._isExport.changed; }
    set isExport(value: boolean) { this._isExport.value = value; }

    get sceneTree() {
        return this.tree as unknown as SceneTree;
    }

    constructor(tree: SceneTree, hasChildren: boolean = false, id?: string, extras?: JsonValue, isExport: boolean = true) {
        super(tree as unknown as Tree<TreeItem>, hasChildren, id);
        const emitTreeChanged = () => this.tree && this.tree.itemsChanged.emit([this]);
        this.dispose(this.nameChanged.disposableOn(emitTreeChanged));

        this.name = `未命名条目(${this.id})`;
        this.extras = extras;
        this._isExport.value = isExport;

        let nameUnBind: ReturnType<typeof bind> | undefined;
        const resetNameUnbind = () => { if (nameUnBind) { nameUnBind(); nameUnBind = undefined; } }
        this.dispose(resetNameUnbind);
        this.dispose(this.sceneObjectChanged.disposableOn(sceneObject => {
            resetNameUnbind();
            if (sceneObject) {
                nameUnBind = bind([this as SceneTreeItem, 'name'], [sceneObject, 'name']);
            }
        }));

        {
            // 对子节点的操作
            this.dispose(this.showChanged.disposableOn(show => {
                // 对自身的操作
                tree.setSceneObjectShowFunc(this.sceneObject, show);
                this.tree && this.tree.forceRedraw();

                // 对子节点的操作
                if (this.children && !this._showChangedNotAffectChildren) {
                    for (let child of this.children) {
                        if (child instanceof SceneTreeItem) {
                            child._showChangedNotAffectParent = true;
                            child.show = show;
                            child._showChangedNotAffectParent = false;
                        }
                    }
                }

                // 对父节点的操作
                if (this.parent && this.parent instanceof SceneTreeItem && !this._showChangedNotAffectParent) {
                    this.parent._showChangedNotAffectChildren = true;
                    this.parent.show = getSceneTreeItemShowFromChildren(this.parent);
                    this.parent._showChangedNotAffectChildren = false;
                }
            }));

            this.dv(new ObjResettingWithEvent(this.sceneObjectChanged, () => {
                if (!this.sceneObject) return undefined;

                const disposer = new Destroyable();
                // @ts-ignore
                if ('show' in this.sceneObject && 'showChanged' in this.sceneObject && this.sceneObject.showChanged instanceof Event) {
                    const update = () => {
                        this.show = tree.getSceneObjectShowFunc(this.sceneObject);
                    }
                    update();
                    // @ts-ignore
                    disposer.dispose(this.sceneObject.showChanged.disposableOn(update));
                    // @ts-ignore
                } else if ('enabled' in this.sceneObject && 'enabledChanged' in this.sceneObject && this.sceneObject.enabledChanged instanceof Event) {
                    const update = () => {
                        this.show = tree.getSceneObjectShowFunc(this.sceneObject);
                    }
                    update();
                    // @ts-ignore
                    disposer.dispose(this.sceneObject.enabledChanged.disposableOn(update));
                }
                return disposer;
            }));

            this.childrenChangedEvent.disposableOn(() => {
                const show = getSceneTreeItemShowFromChildren(this);
                {
                    this._showChangedNotAffectChildren = true;
                    this.show = show;
                    this._showChangedNotAffectChildren = false;
                }
            });
        }

        {
            const updateType = () => {
                let type = 'Unknown';
                if (this.sceneObject) {
                    type = this.sceneObject.typeName;
                } else if (this.children) {
                    type = 'Folder';
                }
                this._type.value = type;
            };

            // type
            this.dispose(this.sceneObjectChanged.disposableOn(updateType));
            this.dispose(this.childrenResetedEvent.disposableOn(updateType));
            updateType();
        }
    }

    get jsonStr() { return JSON.stringify(this.json, undefined, '    '); }
    set jsonStr(value: string) {
        try {
            this.json = JSON.parse(value);
        } catch (error) {
            console.error(`sceneTreeItem.jsonStr error ${error}`, error);
        }
    }

    get json(): SceneTreeItemJsonValue {
        const children = this.children && [...this.children].filter(e => { return (e as SceneTreeItem).isExport }).map(e => (e as SceneTreeItem).json)
        return {
            name: this.name,
            show: this.show ? undefined : false,
            collapsed: this.uiTreeObject.collapsed ? true : undefined,
            sceneObj: this.sceneObject && this.sceneObject.json,
            children: children,
            extras: this.extras,
        } as SceneTreeItemJsonValue;
    }

    set json(value: SceneTreeItemJsonValue) {
        if (value.name !== undefined) {
            this.name = value.name;
        }

        this._showChangedNotAffectChildren = true;
        this._showChangedNotAffectParent = true;
        this.show = value.show ?? true;
        this._showChangedNotAffectChildren = false;
        this._showChangedNotAffectParent = false;

        this.uiTreeObject.collapsed = value.collapsed ?? false;

        this.sceneObject = undefined;
        if (value.sceneObj) {
            this.sceneObject = this.sceneTree.createSceneObjectFunc(value.sceneObj, this);
        }

        if (!value.children) {
            // this.resetChildren(true);
            return;
        }

        this.resetChildren(true);
        if (!this.children) {
            throw new Error(`resetChildren(true) cannot get children!`);
        }
        for (let child of value.children) {
            const sceneTreeItem = new SceneTreeItem(this.tree as unknown as SceneTree, true);
            sceneTreeItem.json = child;
            this.children.push(sceneTreeItem);
        }
    }

    clone() {
        try {
            const newTreeItem = new SceneTreeItem(this.sceneTree, !!this.children, undefined, this.extras, this.isExport);
            newTreeItem.json = this.json;
            newTreeItem.name = this.sceneTree.getSceneTreeItemCloneNameFunc(this);
            // this.parent?.children?.push(newTreeItem)
            return newTreeItem;
        } catch (error) {
            console.error(`SceneTreeItem.clone error: ${error}`, error);
        }
    }

    override insertNewTreeItem(flag: SceneTreeItemInsertFlag, newTreeItem?: TreeItem | undefined): boolean {
        if (flag === 'FolderInnerOrAfter' || flag === 'FolderInnerOrBefore' || flag === 'FolderInner') {
            if (newTreeItem) {
                if (newTreeItem.tree !== this.tree) {
                    console.warn(`newTreeItem.tree !== this.tree`);
                    return false;
                }
            }

            // 尝试FolderInner，加入到文件夹中
            do {
                // 没有子节点，不可能加入文件夹
                if (!this.children) break;

                // 存在或选项，那么有sceneObject的就不能加到文件夹
                if (flag.includes('Or') && this.sceneObject) break;

                newTreeItem && this.children.push(newTreeItem);
                return true;
            } while (false);

            if (flag === 'FolderInner') {
                return false;
            }

            if (flag === 'FolderInnerOrAfter') {
                return super.insertNewTreeItem('After', newTreeItem);
            } else if (flag === 'FolderInnerOrBefore') {
                return super.insertNewTreeItem('Before', newTreeItem);
            } else {
                throw new Error(`should not be here!`);
            }
        } else {
            return super.insertNewTreeItem(flag, newTreeItem);
        }
    }
}

export namespace SceneTreeItem {
    export const createDefaultProps = () => ({
        name: '未命名条目',
        nameEditing: false,
        sceneObject: undefined as ESSceneObject | undefined,
        show: true,
        extras: reactJsonWithUndefined<JsonValue | undefined>(undefined),
    });
}
extendClassProps(SceneTreeItem.prototype, SceneTreeItem.createDefaultProps);
export interface SceneTreeItem extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof SceneTreeItem.createDefaultProps>> { }
