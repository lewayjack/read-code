import { JsonValue, react, Tree, TreeItem, TreeItemInsertFlag, UiTree } from "xbsj-base";
import { SceneTreeItem, SceneTreeItemInsertFlag, SceneTreeItemJsonValue } from "./SceneTreeItem";
import { SceneTreeJsonLoading } from "./SceneTreeJsonLoading";
import { defaultCreateSceneObject, } from "./defaultCreateSceneObject";
import { getSceneObjectShow as defaultGetSceneObjectShow, setSceneObjectShow as defaultSetSceneObjectShow } from "./defaultShowSceneObject";
import { defaultCreateTreeItemDragDrop } from "./defaultCreateTreeItemDragDrop";
import { preload } from "./preload";
import { SceneTreeContextMenu } from "./SceneTreeContextMenu";
import { ESObjectsManager } from "../../ESObjectManager";
import { DragStartDataManager } from "../base";
import { setSceneObjectTreeItem } from "../base";
import { ESSceneObject } from "../../ESObjects";

export type SceneTreeJsonValue = {
    root: SceneTreeItemJsonValue;
}

function defaultGetSceneTreeItemCloneName(originSceneTreeItem: SceneTreeItem) {
    return originSceneTreeItem.name + '_clone';
}

function insertNewTreeItem(currentTreeItemInner: SceneTreeItem | TreeItem, flag: SceneTreeItemInsertFlag, newTreeItem?: SceneTreeItem | undefined) {
    if (currentTreeItemInner instanceof SceneTreeItem) {
        return currentTreeItemInner.insertNewTreeItem(flag, newTreeItem);
    } else {
        const map = {
            "FolderInnerOrAfter": "InnerOrAfter",
            "FolderInnerOrBefore": "InnerOrBefore",
            "FolderInner": "Inner",
            "InnerOrAfter": "InnerOrAfter",
            "InnerOrBefore": "InnerOrBefore",
            "Inner": "Inner",
            "After": "After",
            "Before": "Before",
        } as {
                [k in SceneTreeItemInsertFlag]: TreeItemInsertFlag;
            };
        return currentTreeItemInner.insertNewTreeItem(map[flag], newTreeItem);
    }
}

function destroyTreeItemsWithAllDescendants(treeItem: TreeItem) {
    [treeItem, ...treeItem.getDescendants()].forEach(e => e.destroy());
}

export class SceneTree extends Tree<SceneTreeItem> {
    private _jsonLoading = this.disposeVar(new SceneTreeJsonLoading(this));
    get json() { return this._jsonLoading.json; }
    set json(value: SceneTreeJsonValue) { this._jsonLoading.json = value; }
    get jsonStr() { return this._jsonLoading.jsonStr; }
    set jsonStr(value: string) { this._jsonLoading.jsonStr = value; }
    get jsonLoadingEvent() { return this._jsonLoading.jsonLoadingEvent; }
    get name() { return this._name; }

    static defaultCreateSceneObjectFunc = defaultCreateSceneObject;
    createSceneObjectFunc = SceneTree.defaultCreateSceneObjectFunc;

    static defaultCreateTreeItemDragDropFunc = defaultCreateTreeItemDragDrop;
    createTreeItemDragDropFunc = SceneTree.defaultCreateTreeItemDragDropFunc;

    static defaultPreload = preload;
    preloadFunc = SceneTree.defaultPreload;

    static defaultGetSceneObjectShow = defaultGetSceneObjectShow;
    getSceneObjectShowFunc = SceneTree.defaultGetSceneObjectShow;

    static defaultSetSceneObjectShow = defaultSetSceneObjectShow;
    setSceneObjectShowFunc = SceneTree.defaultSetSceneObjectShow;

    static defaultGetSceneTreeItemCloneNameFunc = defaultGetSceneTreeItemCloneName;
    getSceneTreeItemCloneNameFunc = SceneTree.defaultGetSceneTreeItemCloneNameFunc;

    debug = false;

    get projectManager() { return this._projectManager; }
    private _contextMenu = this.disposeVar(new SceneTreeContextMenu(this, this.projectManager));
    get contextMenu() { return this._contextMenu; }

    private _showPropUiOnSelecting = this.disposeVar(react<boolean>(true));
    get showPropUiOnSelecting() { return this._showPropUiOnSelecting.value; }
    set showPropUiOnSelecting(value: boolean) { this._showPropUiOnSelecting.value = value; }
    get showPropUiOnSelectingChanged() { return this._showPropUiOnSelecting.changed; }

    constructor(
        private _name: string,
        private _dragStartDataManager: DragStartDataManager,
        itemDivHeight: number,
        private _projectManager: ESObjectsManager,
    ) {
        super(itemDivHeight);

        // 增加全局变量，方便调试
        this.dispose(this.selectedItems.changedEvent.disposableOn(() => {
            // @ts-ignore
            window.lssn = this.lastSelectedItem;
            // @ts-ignore
            window.lsso = this.lastSelectedItem?.sceneObject;
            this.debug && console.log(this.lastSelectedItem?.sceneObject ?? 'select null');
        }));

        const { sceneObjectsManager } = this._projectManager;
        {
            this.dispose(this.itemsDeleted.disposableOn(deleted => {
                for (let item of deleted) {
                    const sceneTreeItem = item as SceneTreeItem;
                    const { sceneObject } = sceneTreeItem;
                    sceneObject && sceneObjectsManager.deleteSceneObject(sceneObject) && sceneObject.destroy() && setSceneObjectTreeItem(sceneObject, undefined);

                    for (let item of sceneTreeItem.getDescendants()) {
                        const { sceneObject } = item as SceneTreeItem;
                        sceneObject && sceneObjectsManager.deleteSceneObject(sceneObject) && sceneObject.destroy() && setSceneObjectTreeItem(sceneObject, undefined);
                    }

                    destroyTreeItemsWithAllDescendants(item);
                }
            }));

            this.dispose(this.itemsAdded.disposableOn(addeds => {
                for (let item of addeds) {
                    const sceneTreeItem = item as SceneTreeItem;
                    sceneTreeItem.sceneObject && sceneObjectsManager.addSceneObject(sceneTreeItem.sceneObject) && setSceneObjectTreeItem(sceneTreeItem.sceneObject, sceneTreeItem);

                    for (let item of sceneTreeItem.getDescendants()) {
                        const sceneTreeItem = item as SceneTreeItem;
                        sceneTreeItem.sceneObject && sceneObjectsManager.addSceneObject(sceneTreeItem.sceneObject) && setSceneObjectTreeItem(sceneTreeItem.sceneObject, sceneTreeItem);
                    }
                }
            }));
        }

        this.dispose(this.selectedItems.changedEvent.disposableOn(() => {
            if (!this.showPropUiOnSelecting) return;
            this._projectManager.propUiTreeManager.sceneObject = undefined;
            const { lastSelectedItem } = this;
            if (lastSelectedItem) {
                this._projectManager.propUiTreeManager.sceneObject = lastSelectedItem.sceneObject;
            }
        }));
    }

    get sceneUiTree() {
        return this.uiTree as unknown as UiTree<SceneTreeItem, SceneTree>;
    }

    getTreeItemFromSceneObjId(id: string) {
        const list = this.getDescendants() as Generator<SceneTreeItem, void, unknown>
        let item = undefined;
        for (let e of list) {
            if (e.sceneObject && e.sceneObject.id === id) {
                item = e;
                break;
            }
        }
        return item;
    }

    get dragStartDataManager() { return this._dragStartDataManager; }

    /**
     * 获取当前树结构的Json数据
     * @returns SceneTreeItem的isExport为true的Json数据
     */
    getJson() {
        return {
            root: {
                children: [...this.children].filter(e => { return e.isExport }).map(e => e.json),
            },
        };
    }

    setJson(value: SceneTreeJsonValue) {
        value.root = value.root || {};
        // @ts-ignore
        const children = value.root.children ?? [];
        this.root.resetChildren(true);
        for (let child of children) {
            const sceneTreeItem = new SceneTreeItem(this, true);
            sceneTreeItem.json = child;
            this.root.children?.push(sceneTreeItem);
        }
    }

    /**
     * 监测addNewTreeItem是否可以添加项
     * @deprecated 请勿使用，未来将废弃！
     * @param currentTreeItem 
     * @param flag 
     * @returns 
     */
    testAddNewTreeItem(currentTreeItem: SceneTreeItem | undefined, flag: SceneTreeItemInsertFlag) {
        const currentTreeItemInner = currentTreeItem || this.lastSelectedItem || this.root;
        if (!currentTreeItemInner) {
            return false;
        }

        return insertNewTreeItem(currentTreeItemInner, flag);
    }

    /**
     * @deprecated 请勿使用，未来将废弃！
     * @param currentTreeItem 
     * @param flag 
     * @param isGroup 
     * @param sceneObject 
     * @returns 
     */
    addNewTreeItem(currentTreeItem: SceneTreeItem | undefined, flag: SceneTreeItemInsertFlag, isGroup: boolean, sceneObject?: ESSceneObject) {
        const currentTreeItemInner = currentTreeItem || this.lastSelectedItem || this.root as SceneTreeItem;
        if (currentTreeItemInner && insertNewTreeItem(currentTreeItemInner, flag)) {
            const treeItem = new SceneTreeItem(this, isGroup);
            treeItem.sceneObject = sceneObject;
            if (!insertNewTreeItem(currentTreeItemInner, flag, treeItem)) {
                throw new Error(`currentTreeItem.insertNewTreeItem return false!`);
            }
            return treeItem;
        }
        return undefined;
    }


    createSceneObjectTreeItem<T extends ESSceneObject>(sceneObjectType: string | (new (id?: string | undefined) => T), id?: string, currentTreeItem?: SceneTreeItem, flag?: SceneTreeItemInsertFlag) {
        const f = flag ?? 'FolderInnerOrAfter';
        if (!this.testAddNewTreeItem(currentTreeItem, f)) {
            console.warn(`cannot addNewTreeItem! currentTreeItem(${currentTreeItem ? currentTreeItem.id : 'root'})`);
            return undefined;
        }

        const sceneObject = ESSceneObject.create(sceneObjectType, id) as T;
        if (!sceneObject) {
            return undefined;
        }
        const newTreeItem = this.addNewTreeItem(currentTreeItem, flag ?? 'FolderInnerOrAfter', true, sceneObject);
        return newTreeItem;
    }

    /**
     * 创建一个组节点
     * @param id 
     * @param currentTreeItem 
     * @param flag 
     * @returns 
     */
    createGroupTreeItem(name?: string, id?: string, currentTreeItem?: SceneTreeItem, flag?: SceneTreeItemInsertFlag) {
        const f = flag ?? 'FolderInnerOrAfter';
        if (!this.testAddNewTreeItem(currentTreeItem, f)) {
            console.warn(`cannot addNewTreeItem! currentTreeItem(${currentTreeItem ? currentTreeItem.id : 'root'})`);
            return undefined;
        }
        const newTreeItem = this.addNewTreeItem(currentTreeItem, flag ?? 'FolderInnerOrAfter', true);
        if (!newTreeItem) {
            console.warn(`addNewTreeItem error!`);
            return undefined;
        }
        newTreeItem.name = name ?? '未命名组节点';
        return newTreeItem;
    }

    createSceneObjectTreeItemFromClass<T extends ESSceneObject>(sceneObjConstructor: new (id?: string | undefined) => T, id?: string, currentTreeItem?: SceneTreeItem, flag?: SceneTreeItemInsertFlag) {
        const f = flag ?? 'FolderInnerOrAfter';
        if (!this.testAddNewTreeItem(currentTreeItem, f)) {
            return undefined;
        }

        const sceneObject = ESSceneObject.createFromClass(sceneObjConstructor, id) as T;
        if (!sceneObject) {
            return undefined;
        }
        const newTreeItem = this.addNewTreeItem(currentTreeItem, f, true, sceneObject);
        // setSceneObjectTreeItem(sceneObject, newTreeItem);
        return newTreeItem;
    }


    createSceneObjectTreeItemFromJson<T extends ESSceneObject>(sceneObjectJson: JsonValue & { [k: string]: any; type: string; }, currentTreeItem?: SceneTreeItem, flag?: SceneTreeItemInsertFlag) {
        const f = flag ?? 'FolderInnerOrAfter';
        if (!this.testAddNewTreeItem(currentTreeItem, f)) {
            return undefined;
        }

        const sceneObject = ESSceneObject.createFromJson(sceneObjectJson) as T;
        if (!sceneObject) {
            return undefined;
        }
        const newTreeItem = this.addNewTreeItem(currentTreeItem, flag ?? 'FolderInnerOrAfter', true, sceneObject);
        return newTreeItem;
    }

    /**
     * 销毁一个场景对象节点
     * @param sceneTreeItem 
     */
    destroySceneObjectTreeItem(sceneTreeItem: SceneTreeItem) {
        if (sceneTreeItem === this.root) {
            console.warn(`cannot destroy root! please use function destroyAllSceneObjectTreeItems!`);
            return;
        }
        sceneTreeItem.detachFromParent();
    }

    /**
     * 销毁用户添加的所有场景节点
     * @returns 
     */
    destroyAllSceneObjectTreeItems() {
        if (!this.root.children) {
            return;
        }
        const children = [...this.root.children];
        for (let treeItem of children) {
            this.destroySceneObjectTreeItem(treeItem as SceneTreeItem);
        }
    }
}
