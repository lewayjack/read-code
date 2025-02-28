import { Destroyable, reactArrayWithUndefined } from "xbsj-base";
import { ESSceneObject } from "..";
/**
 * 
 * @param sceneObject 
 * @param editingPropName 'editing' | 'positionEditing'
 * @param editing 
 * @param sceneObjectEditingManager 
 */
function updateActiveEditing(sceneObject: ESSceneObject, editingPropName: string, editing: boolean, sceneObjectEditingManager: SceneObjectEditingManager) {
    if (!editing) {
        if (sceneObjectEditingManager.currentActiveEditing) {
            const [so, ep] = sceneObjectEditingManager.currentActiveEditing;
            if (so === sceneObject && ep === editingPropName) {
                // 如果被跟踪的对象的editing置为false，那么currentActiveEditing也需要相应地变化！
                if (!editing) {
                    sceneObjectEditingManager.currentActiveEditing = undefined;
                }
            }
        }
    } else {
        // 如果其他对象，或者同对象的其他编辑属性变为true，那么也需要修改currentActiveEditing
        sceneObjectEditingManager.currentActiveEditing = [sceneObject, editingPropName];
    }
}

const editingProps = ['editing', 'positionEditing', 'locationEditing', 'pointEditing', 'rotationEditing'];

export class SceneObjectEditing extends Destroyable {
    get sceneObject() { return this._sceneObject; }
    constructor(private _sceneObject: ESSceneObject, sceneObjectEditingManager: SceneObjectEditingManager) {
        super();

        const sceneObject = this._sceneObject;

        for (let editingPropName of editingProps) {
            const editingPropChangedName = editingPropName + 'Changed';
            // @ts-ignore
            const changed = sceneObject[editingPropChangedName] as Event<[editing: boolean]>;
            if (changed) {
                {
                    // @ts-ignore
                    const editing = sceneObject[editingPropName] as boolean;
                    updateActiveEditing(sceneObject, editingPropName, editing, sceneObjectEditingManager);
                }
                this.dispose(changed.disposableOn(((editing: boolean) => updateActiveEditing(sceneObject, editingPropName, editing, sceneObjectEditingManager))));
            }
        }
    }
}

export type ActiveEditingInfoType = [sceneObject: ESSceneObject, editingPropName: string];
export class SceneObjectEditingManager extends Destroyable {
    private _currentActiveEditing = this.disposeVar(reactArrayWithUndefined<ActiveEditingInfoType | undefined>(undefined));
    get currentActiveEditing() { return this._currentActiveEditing.value; }
    set currentActiveEditing(value: ActiveEditingInfoType | undefined) { this._currentActiveEditing.value = value; }
    get currentActiveEditingChanged() { return this._currentActiveEditing.changed; }
    private _currentActiveEditingLastChangedTime = 0;
    get currentActiveEditingLastChangedTime() { return this._currentActiveEditingLastChangedTime; }
    constructor() {
        super();
        this.dispose(this._currentActiveEditing.changed.disposableOn((aei, oldAei) => {
            this._currentActiveEditingLastChangedTime = Date.now();
            if (oldAei) {
                const [so, ep] = oldAei;
                // @ts-ignore
                if (so[ep] === true) {
                    // @ts-ignore
                    so[ep] = false;
                }
            }
            if (aei) {
                const [so, ep] = aei;
                // @ts-ignore
                so[ep] = true;
            }
        }));
        ESSceneObject.context.sceneObjCreatedEvent.don((sceneObject) => {
            sceneObject.dv(new SceneObjectEditing(sceneObject, this));
        })
    }
}
