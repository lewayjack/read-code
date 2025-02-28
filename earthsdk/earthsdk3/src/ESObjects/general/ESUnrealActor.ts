import { react, Event, extendClassProps, ReactivePropsToNativePropsAndChanged } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { ESViewer } from "../../ESViewer";
import { BooleanProperty, ESJVector3D, FunctionProperty, StringProperty } from "../../ESJTypes";

export type ActorStatusType = 'bound' | 'created' | 'null';

export class ESUnrealActor extends ESObjectWithLocation {
    static readonly type = this.register('ESUnrealActor', this, { chsName: 'UnrealActor', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "UnrealActor" });
    get typeName() { return 'ESUnrealActor'; }
    override get defaultProps() { return ESUnrealActor.createDefaultProps(); }

    private _callFunctionEvent = this.dv(new Event<[string, { [k: string]: any }]>());
    get callFunctionEvent() { return this._callFunctionEvent; }
    callFunction(fn: string, param: { [k: string]: any }) { this._callFunctionEvent.emit(fn, param); }

    getBoundSphereWithChildren(id: string): Promise<{
        center?: ESJVector3D;
        radius?: number;
        tips?: string;
    } | undefined> {
        return new Promise((resolve, reject) => {
            resolve(undefined)
        });
    };
    // async getBoundSphereWithChildren(viewer: ESViewer) {
    //     if (!(viewer instanceof ESUeViewer)) return undefined;
    //     return await viewer.getBoundSphereWithChildren(this.id)
    // }

    private _actorEvent = this.dv(new Event<[status: ActorStatusType, viewer: ESViewer]>());
    get actorEvent() { return this._actorEvent; }

    private _lastActorStatus = this.dv(react<ActorStatusType>('null'));
    get lastActorStatus() { return this._lastActorStatus.value; }
    set lastActorStatus(value: ActorStatusType) { this._lastActorStatus.value = value; }
    get lastActorStatusChanged() { return this._lastActorStatus.changed; }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new StringProperty("actorTag", "actorTag", false, false, [this, 'actorTag'], ''),
                new StringProperty("actorClass", "actorClass", false, false, [this, 'actorClass'], ''),
                new BooleanProperty('是否高亮', '是否高亮highlight.', false, false, [this, 'highlight'], false),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new FunctionProperty('callFunction', 'callFunction', ['string', 'string'], (fn, param) => this.callFunction(fn, JSON.parse(param)), ['', '']),
            new StringProperty("actorTag", "actorTag", false, false, [this, 'actorTag']),
            new StringProperty("actorClass", "actorClass", false, false, [this, 'actorClass']),
            new BooleanProperty('是否高亮', '是否高亮highlight.', false, false, [this, 'highlight']),
        ];
    }
}

export namespace ESUnrealActor {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        actorTag: "",
        actorClass: "",
        highlight: false,
        allowPicking: true,
    });
}
extendClassProps(ESUnrealActor.prototype, ESUnrealActor.createDefaultProps);
export interface ESUnrealActor extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESUnrealActor.createDefaultProps>> { }
