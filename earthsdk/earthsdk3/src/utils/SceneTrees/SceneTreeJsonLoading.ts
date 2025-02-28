import { CancelError, createProcessingFromAsyncFunc, Destroyable, Event } from "xbsj-base";
import { SceneTree, SceneTreeJsonValue } from "./SceneTree";

export class SceneTreeJsonLoading extends Destroyable {
    private _jsonLoadingEvent = this.disposeVar(new Event<[{ type: 'init' | 'loading' | 'loaded' } | { type: 'error', error?: string }]>());
    get jsonLoadingEvent() { return this._jsonLoadingEvent; }

    private _setJsonProcessing = this.disposeVar(createProcessingFromAsyncFunc<void, [SceneTreeJsonValue]>(async (cancelsManager, sceneTreeJson) => {
        this._jsonLoadingEvent.emit({ type: 'init' });
        this._jsonLoadingEvent.emit({ type: 'loading' });
        if (sceneTreeJson) {
            await cancelsManager.promise(this._sceneTree.preloadFunc(sceneTreeJson));
        }
        this._setJson(sceneTreeJson);
        this._jsonLoadingEvent.emit({ type: 'loaded' });
    }));

    constructor(
        private _sceneTree: SceneTree,
    ) {
        super();

        this._setJsonProcessing.errorFunc = error => {
            this._jsonLoadingEvent.emit({ type: 'error', error, });
        };
    }

    private _setJson(value: SceneTreeJsonValue) {
        try {
            this._sceneTree.setJson(value || {});
        } catch (error) {
            console.error(`json数据装配时发生错误！error: ${error}`);
        }
    }

    get json() {
        return this._sceneTree.getJson();
    }

    set json(value: SceneTreeJsonValue) {
        this._setJsonProcessing.restart(new CancelError(`JSON重新赋值！`), value);
    }

    get jsonStr() {
        return JSON.stringify(this.json, undefined, '    ');
    }

    set jsonStr(value: string) {
        this.json = JSON.parse(value);
    }
}


