import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, Listener, Event, track, reactPositions, reactArray, extendClassProps, ReactivePropsToNativePropsAndChanged, createGuid, react } from "xbsj-base";

export class CzmPolygonClipping extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _id = this.disposeVar(react<string>(createGuid()));
    get id() { return this._id.value; }
    set id(value: string) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: string) {
        super();
        id && (this.id = id);
    }
}

export namespace CzmPolygonClipping {
    export const createDefaultProps = () => ({
        // 属性配置
        enabled: true,
        showHelper: true,
        editing: false,
        allowPicking: false,
        positions: reactPositions(undefined),
        reverse: false,
        edgeColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        edgeWidth: 2,
    });
}
extendClassProps(CzmPolygonClipping.prototype, CzmPolygonClipping.createDefaultProps);
export interface CzmPolygonClipping extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolygonClipping.createDefaultProps>> { }
