import * as Cesium from 'cesium';
import { Destroyable, react } from 'xbsj-base';

export abstract class CzmBasePrimitive extends Destroyable {
    private _show = this.disposeVar(react(true));
    get show() { return this._show.value; }
    set show(value: boolean) { this._show.value = value; }
    get showChanged() { return this._show.changed; }
    //@ts-ignore
    abstract update(frameState: Cesium.FrameState): void;
}