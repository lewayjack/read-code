import { createCancelablePromise, createNextAnimateFrameEvent, createProcessingFromAsyncFunc, Destroyable, getDomEventCurrentTargetPos, react } from "xbsj-base";
import { getViewerExtensions } from ".";
import * as Cesium from 'cesium';

export class CursorPositionInfo extends Destroyable {
    private _enabled = this.disposeVar(react(false));
    get enabled() { return this._enabled.value; }
    set enabled(value: boolean) { this._enabled.value = value; }
    get enabledChanged() { return this._enabled.changed; }

    private _cursorPosition = react<[number, number, number] | undefined>(undefined);
    get cursorPosition() { return this._cursorPosition.value; }
    get cursorPositionChanged() { return this._cursorPosition.changed; }

    quickPickPosition = true;

    constructor(viewer: Cesium.Viewer) {
        super();

        let disposer: Destroyable | undefined = new Destroyable();
        const resetDisposer = () => {
            if (disposer) {
                disposer.destroy();
                disposer = undefined;
            }
        }
        this.dispose(resetDisposer);

        const updateEnabled = () => {
            resetDisposer();

            if (!this._enabled.value) {
                return;
            }
            if (!viewer) return;

            const viewerExtensions = getViewerExtensions(viewer);
            if (!viewerExtensions) return;

            disposer = new Destroyable();
            const lastMovePosition = disposer.disposeVar(react<[number, number] | undefined>(undefined));
            const updateEvent = disposer.disposeVar(createNextAnimateFrameEvent(lastMovePosition.changed));
            disposer.dispose(viewerExtensions.czmViewer.pointerMoveEvent.disposableOn(pointerEvent => {
                if (pointerEvent.pointerEvent)
                    lastMovePosition.value = getDomEventCurrentTargetPos(pointerEvent.pointerEvent);
            }));
            const processing = disposer.disposeVar(createProcessingFromAsyncFunc(async (cancelsManager) => {
                if (!viewerExtensions.pickingManager) {
                    return;
                }
                if (lastMovePosition.value) {
                    if (this.quickPickPosition) {
                        const position = await cancelsManager.promise(createCancelablePromise(viewerExtensions.pickingManager.quickPickPosition(lastMovePosition.value)));
                        this._cursorPosition.value = position;
                    } else {
                        const position = await cancelsManager.promise(createCancelablePromise(viewerExtensions.pickingManager.pickPosition(lastMovePosition.value)));
                        this._cursorPosition.value = position;
                    }
                }
            }));
            disposer.dispose(updateEvent.disposableOn(() => {
                processing.restart();
            }));
        };
        updateEnabled();
        this.dispose(this._enabled.changed.disposableOn(updateEnabled));
    }
}