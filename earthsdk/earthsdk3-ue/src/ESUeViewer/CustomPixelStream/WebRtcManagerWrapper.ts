import { Destroyable, Event } from "xbsj-base";
import { WebRtcManager } from "./WebRtcManager";

export class WebRtcManagerWrapper extends Destroyable {
    private _instance: WebRtcManager;
    get instance() { return this._instance; }

    private _event = this.dv(new Event<[eventName: string, eventDetailStr: string]>());
    get event() { return this._event; }

    get debug() { return this._instance.debug; }
    set debug(value: boolean) { this._instance.debug = value; }
    constructor(private _container: HTMLDivElement, private _wsuri: string, private _esmsgWsUri?: string) {
        super();

        this._instance = this.dv(new WebRtcManager(this._container, { ws: this._wsuri }));
        {
            this.d(this._instance.connected.don((str) => {
                this._event.emit(str, str);
                console.log(`%c[EarthSDK ${str}]`, "background: #a6ec99; color: black");
            }));
            this.d(this._instance.error.don((str) => {
                this._event.emit('errorEvent', str);
                console.log(`%c[EarthSDK ${str}]`, "background: red; color: black");

            }));
            this.d(this._instance.ueevent.don((str) => {
                this._event.emit('ueevent', str)
            }));
        }

    }

    emitUIInteractionForBigData(params: any, callback?: (...params: any[]) => void) {
        return new Promise<any[]>((resolve, reject) => {
            const callbackWrapper = (...params: any[]) => {
                resolve(params);
                callback && callback(...params);
            };
            try {
                this._instance.emitUIInteractionForBigData(params, callbackWrapper);
            } catch (error) {
                console.warn(`emitUIInteraction发生错误:${error}`);
                reject(error);
            }
        });
    }

    getVideoSize() {
        return this._instance.getVideoSize();
    }

    resize(width: number, height: number) {
        this._instance.resizeUEVideo(width, height);
    }
}
