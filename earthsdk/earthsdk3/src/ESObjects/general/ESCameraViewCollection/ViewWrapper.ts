import { createNextAnimateFrameEvent, Destroyable, nextAnimateFrame } from "xbsj-base";
import { ESJViewInfo } from "../../../ESJTypes";
import { ESCameraView } from "../ESCameraView";
import { ESCameraViewCollection } from "./index";

export type ViewOption = {
    size: [number, number],
    name: string
}

export class ViewWrapper extends Destroyable {
    private _view = this.dv(new ESCameraView());
    get view() { return this._view; }

    get viewInfo() {
        const e = this._view;
        return {
            duration: e.duration,
            position: e.position,
            rotation: e.rotation,
            thumbnail: e.thumbnail,
            name: e.name,
        } as ESJViewInfo;
    }

    constructor(sceneObject: ESCameraViewCollection, viewInfo?: ESJViewInfo, option?: ViewOption) {
        super();
        this.d(sceneObject.components.disposableAdd(this._view));
        this._view.name = option?.name ?? `视角${sceneObject.views.length + 1}`;

        if (viewInfo) {
            const v = this._view;
            const e = viewInfo;
            v.duration = e.duration ?? 1;
            v.position = e.position;
            v.rotation = e.rotation ?? [0, 0, 0];
            v.thumbnail = e.thumbnail ?? "";
            v.name = e.name as string;
        } else {
            const size = option?.size ?? [64, 64];
            this.d(nextAnimateFrame(() => {
                this._view.resetWithCurrentCamera();
                this._view.capture(size[0], size[1]);
            }));
        }

        const v = this._view;
        const event = this.dv(createNextAnimateFrameEvent(v.durationChanged, v.positionChanged, v.rotationChanged, v.thumbnailChanged, v.nameChanged));
        this.d(event.don(() => sceneObject.emitViewsWarpper()));
    }
}
