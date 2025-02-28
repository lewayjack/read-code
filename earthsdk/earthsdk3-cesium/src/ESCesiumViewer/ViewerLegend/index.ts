import { createNextAnimateFrameEvent, createProcessingFromAsyncFunc, Destroyable, react, sleep } from "xbsj-base";
import { ESCesiumViewer } from "../index";
import { getCenterResolution, getZoomFromResolution } from "./resolutionAndZoom";
import { Legend } from "./Legend";

export class ViewerLegend extends Destroyable {
    private _enabled = this.dv(react<boolean>(true));
    get enabled() { return this._enabled.value; }
    set enabled(value: boolean) { this._enabled.value = value; }
    get enabledChanged() { return this._enabled.changed; }

    private _resolution = this.dv(react<number | undefined>(undefined));
    get resolution() { return this._resolution.value; }
    set resolution(value: number | undefined) { this._resolution.value = value; }
    get resolutionChanged() { return this._resolution.changed; }

    private _center = this.dv(react<[number, number, number] | undefined>(undefined));
    get center() { return this._center.value; }
    get centerChanged() { return this._center.changed; }

    private _zoom = this.dv(react<number | undefined>(undefined));
    get zoom() { return this._zoom.value; }
    get zoomChanged() { return this._zoom.changed; }

    private _legend = this.dv(new Legend());
    get legend() { return this._legend; }

    get length() {
        const length = (this.legend.computedLengthInMeters ?? -1) / (this.legend.computedLengthInPixels ?? 1)
        return length;
    }

    constructor(private _czmViewer: ESCesiumViewer) {
        super();

        {
            const processing = this.dv(createProcessingFromAsyncFunc(async cancelsManager => {
                let resolution = undefined;
                let zoom = undefined;
                let center = undefined;

                do {
                    try {
                        await cancelsManager.promise(sleep(1000));
                        const result = await cancelsManager.promise(getCenterResolution(this._czmViewer));
                        if (!result) break;
                        const [r, c] = result;
                        resolution = r;
                        zoom = getZoomFromResolution(r);
                        center = c;
                    } catch (error) {
                        break;
                    }
                } while (false);

                this._resolution.value = resolution;
                this._zoom.value = zoom;
                this._center.value = center;
            }));
            processing.restart();

            {
                const update = () => {
                    if (this.enabled) processing.restart();
                    else processing.cancel();
                };
                update();
                const event = this.dv(createNextAnimateFrameEvent(this._czmViewer.cameraChanged, this.enabledChanged));
                this.dispose(event.disposableOn(update));
            }
        }

        {
            const update = () => { this._legend.resolution = this.resolution; };
            update();
            this.dispose(this.resolutionChanged.disposableOn(update));
        }
    }
}
