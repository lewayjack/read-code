import { createNextAnimateFrameEvent, Destroyable, Event, ObjResettingWithEvent, pluckProperty, SceneObjectKey } from "xbsj-base";
import { SceneObjectFromId } from "../ESSceneObjectWithId";
import { ESSceneObject } from "../../../ESObjects";

export type WatchObjectType = {
    debug?: boolean;
    evalMode?: 'NextAnimateFrame' | 'Immediate';
    evalOnlyWhenObjsAllExist?: boolean;
}

class PropChangedEvent extends Destroyable {
    constructor(sceneObjectFromId: SceneObjectFromId, propChangedName: string, doEvalEvent: Event, watcher: WatchObjectType) {
        super();

        this.disposeVar(new ObjResettingWithEvent(sceneObjectFromId.sceneObjectChanged, () => {
            let propChangedEvent: Event | undefined;
            watcher.debug && console.log(`正在获取Event事件...`);
            do {
                const obj = sceneObjectFromId.sceneObject;
                if (!obj) {
                    break;
                }

                if (!propChangedName) {
                    break;
                }

                const propNames = propChangedName.split('.');

                if (propNames.length === 0) {
                    watcher.debug && console.warn(`propNames.length === 0`);
                    break;
                }

                let event = pluckProperty(obj, false, ...propNames);
                if (!event || !(event instanceof Event)) {
                    // event未能获取，那么将属性名的最后一项加上Changed再试试！
                    propNames[propNames.length - 1] = propNames[propNames.length - 1] + 'Changed';
                    watcher.debug && console.warn(`event未能获取，那么将属性名的最后一项加上Changed(${propNames[propNames.length - 1]})再试试！`);
                    event = pluckProperty(obj, false, ...propNames);
                    watcher.debug && event && console.warn(`event仍然获取不到！`);
                }

                if (!event) {
                    watcher.debug && console.warn(`cannot get changed from ${obj.id}-${obj.name}-${obj.ref}-${propChangedName}`);
                    break;
                }

                if (!(event instanceof Event)) {
                    watcher.debug && console.warn(`the prop is not event from ${obj.id}-${obj.name}-${obj.ref}-${propChangedName}`)
                    break;
                }

                propChangedEvent = event;

                watcher.debug && console.log(`Event获取成功 propChangedName: ${propChangedName}`, propChangedEvent);
            } while (false);

            if (propChangedEvent) {
                const disposer = new Destroyable();
                disposer.dispose(propChangedEvent.dwon(() => doEvalEvent.emit()));
                return disposer;
            } else {
                watcher.debug && console.log(`未获取到Event！propChangedName: ${propChangedName}`);
                return undefined;
            }
        }));
    }
}

export class WatcherObjects extends Destroyable {
    private _doEvalEvent = this.dv(new Event());

    /**
     * 强制执行
     */
    forceExecute() {
        this._doEvalEvent.emit();
    }

    constructor(objIdAndPropChangedNames: [SceneObjectKey, string][], watcher: WatchObjectType, evalFunc: (sceneObjects: (ESSceneObject | undefined)[]) => void) {
        super();

        // const doEvalEvent = this.disposeVar(new Event());
        const doEvalEvent = this._doEvalEvent;
        const nextAnimateFrameEvent = this.disposeVar(createNextAnimateFrameEvent(doEvalEvent));
        const sceneObjectFromIdAndPropChangedEvents: [SceneObjectFromId, PropChangedEvent | undefined][] = objIdAndPropChangedNames.map(([id, propChangedName]) => {
            const sceneObjectFromId = new SceneObjectFromId(id);
            const propChangedEvent = propChangedName && new PropChangedEvent(sceneObjectFromId, propChangedName, doEvalEvent, watcher) || undefined;
            return [sceneObjectFromId, propChangedEvent];
        });

        this.dispose(() => {
            sceneObjectFromIdAndPropChangedEvents.forEach(([sceneObjectFromId, propChangedEvent]) => {
                propChangedEvent?.destroy();
                sceneObjectFromId.destroy();
            });
            sceneObjectFromIdAndPropChangedEvents.length = 0;
        });
        this.dispose(doEvalEvent.disposableOn(() => {
            const { evalMode = 'NextAnimateFrame', evalOnlyWhenObjsAllExist = true } = watcher;
            if (evalMode === 'Immediate') {
                const sceneObjects = sceneObjectFromIdAndPropChangedEvents.map(([sceneObjectFromId]) => sceneObjectFromId.sceneObject);
                if (!evalOnlyWhenObjsAllExist || sceneObjects.every(e => e !== undefined)) {
                    evalFunc(sceneObjects);
                }
            }
        }));
        this.dispose(nextAnimateFrameEvent.disposableOn(() => {
            const { evalMode = 'NextAnimateFrame', evalOnlyWhenObjsAllExist = true } = watcher;
            if (evalMode === 'NextAnimateFrame') {
                const sceneObjects = sceneObjectFromIdAndPropChangedEvents.map(([sceneObjectFromId]) => sceneObjectFromId.sceneObject);
                if (!evalOnlyWhenObjsAllExist || sceneObjects.every(e => e !== undefined)) {
                    evalFunc(sceneObjects);
                }
            }
        }));
    }
}
