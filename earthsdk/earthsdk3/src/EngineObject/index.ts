import { ESSceneObject } from "../ESObjects";
import { ESViewer } from "../ESViewer";
import { Destroyable, Event } from "xbsj-base";
import { EngineObjectsContext } from "./EngineObjectsContext";

export class EngineObject<T extends ESSceneObject = ESSceneObject, V extends ESViewer = ESViewer> extends Destroyable {
    static readonly context = new EngineObjectsContext();
    static readonly register = this.context.register.bind(this.context);

    private _createdEvent = this.dv(new Event());
    get createdEvent() { return this._createdEvent; }

    get sceneObject() { return this._sceneObject; }
    get viewer() { return this._viewer; }

    private static _accumId = -1;
    private _id = ++EngineObject._accumId;
    get id() { return this._id; }

    constructor(private _sceneObject: T, private _viewer: V) {
        super();
        {
            // compnents管理
            const updateComponents = (toDels: Iterable<ESSceneObject>, toAdds: Iterable<ESSceneObject>) => {
                for (let e of toDels) { this._viewer.delete(e); }
                for (let e of toAdds) { this._viewer.add(e); }
            };
            updateComponents([], this._sceneObject.components.values());
            this.d(this._sceneObject.components.toChange.don(updateComponents));
            this.d(() => updateComponents(this._sceneObject.components.values(), []));
        }
    }
}
