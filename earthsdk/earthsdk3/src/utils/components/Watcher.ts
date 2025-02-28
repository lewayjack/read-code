import { Destroyable, Event, extendClassProps, JsonValue, ObjResettingWithEvent, react, reactArrayWithUndefined, reactDeepArray, reactJson, SceneObjectKey, UniteChanged } from "xbsj-base";
import { ESSceneObject } from "../../ESObjects";
import { WatcherTools } from "./WatcherTools";

const { WatcherObjects } = WatcherTools;

export type WatcherEvalFuncType = (sceneObjects: (ESSceneObject | undefined)[]) => void;

export class Watcher extends Destroyable {
    private _evalFunc?: WatcherEvalFuncType;
    get evalFunc() {
        return this._evalFunc;
    }
    set evalFunc(value: WatcherEvalFuncType | undefined) {
        this._evalFunc = value;
    }
    private _forceExecute = new Event();
    /**
     * 强制执行
     */
    forceExecute() {
        this._forceExecute.emit();
    }

    constructor() {
        super();

        const evalFuncReact = this.dv(react<WatcherEvalFuncType | undefined>(undefined));
        const updateEvalFunc = () => {
            try {
                evalFuncReact.value = this.evalFuncStr && Function('"use strict";return (' + this.evalFuncStr + ')')();
                this.debug && console.log(`evalFunc成功构建`, evalFuncReact.value);
            } catch (error) {
                console.error(`evalFunc get error! ${error}`);
                evalFuncReact.value = undefined;
            }
        };
        updateEvalFunc();
        this.dispose(this.evalFuncStrChanged.disposableOn(updateEvalFunc));

        const evalFunc = (sceneObjects: (ESSceneObject | undefined)[]) => {
            if (this.enabled) {
                // evalFuncReact.value(sceneObjects.map(e => [e]));
                this.debug && console.log(`执行evalFunc...`);
                this._evalFunc && this._evalFunc(sceneObjects);
                evalFuncReact.value && evalFuncReact.value(sceneObjects);
            }
        };
        const watcherResetting = this.disposeVar(new ObjResettingWithEvent(this.objIdAndPropChangedNamesChanged, () => {
            if (this.objIdAndPropChangedNames.length > 0) {
                this.debug && console.log(`监视对象发生变化，重新创建WatcherObjects`);
                return new WatcherObjects(this.objIdAndPropChangedNames, this, evalFunc);
            } else {
                return undefined;
            }
        }));

        this.dispose(this._forceExecute.disposableOn(() => {
            watcherResetting.obj?.forceExecute();
        }));
    }

}

export type EvalModelType = 'Immediate' | 'NextAnimateFrame';

export namespace Watcher {
    export const createDefaultProps = () => ({
        enabled: false,
        objIdAndPropChangedNames: reactDeepArray<[id: SceneObjectKey, propChangedName: string]>([], (a, b) => a[0] === b[0] && a[1] === b[1], s => [s[0], s[1]]),
        evalFuncStr: '',
        evalMode: 'NextAnimateFrame' as EvalModelType, // 事件出发后，是即时执行，还是下一帧再执行，即使执行性能损耗大，下一帧执行损耗小
        evalOnlyWhenObjsAllExist: true, // 默认 true，只有在所有场景对象都存在时才执行
        debug: false,

        name: '未命名场景对象',
        ref: undefined as string | undefined,
        extras: reactJson<JsonValue>(undefined),
        devTags: reactArrayWithUndefined<string[]>(undefined),
        execOnceFuncStr: undefined as string | undefined,
        updateFuncStr: undefined as string | undefined,
        toDestroyFuncStr: undefined as string | undefined,
    });
}
extendClassProps(Watcher.prototype, Watcher.createDefaultProps);
export interface Watcher extends UniteChanged<ReturnType<typeof Watcher.createDefaultProps>> { }
