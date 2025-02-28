import { createAnimateFrame, createGuid, createInterval, createNextAnimateFrameEvent, Event, react } from "xbsj-base";
import { ESUeViewer } from "../index";
import { UeCloudViewerBase } from "../uemsg/UeCloudViewerBase";
import { UeEventsType } from "../uemsg/UeEventsType";
import { UeCallResultType, UeCallType, UeEventResultType, UeFuncResultWithIdType, UeFuncType, UeFuncWithIdType } from "../uemsg/UeMessage";
import { WebRtcManagerWrapper } from "./WebRtcManagerWrapper";

/**
 * UE5云渲染
 */
export class UeCloudViewer extends UeCloudViewerBase {

    private _videoInitialized = this.dv(react(false));
    get videoInitialized() { return this._videoInitialized.value; }
    private _webRtcConnected = this.dv(react(false));
    get webRtcConnected() { return this._webRtcConnected.value; }
    private _webSocketOpen = this.dv(react(false));
    get webSocketOpen() { return this._webSocketOpen.value; }

    private _ue5ViewerWrapper: WebRtcManagerWrapper;
    get ue5ViewerWrapper() { return this._ue5ViewerWrapper; }

    private _ueFuncResultWithIdsEvent = this.dv(new Event<[ueFuncResultWithIds: UeFuncResultWithIdType[]]>());

    private _ueFuncWithIdAndResultCallbacks: [ueFuncWithId: UeFuncWithIdType, rresultCallbackAndUeFunc: { timeStamp: number, ueFunc: UeFuncType, resultCallback: (result: any) => void }][] = [];
    private _waitingUeFuncIdAndResultCallbacks: Map<string, { timeStamp: number, ueFunc: UeFuncType, resultCallback: (result: any) => void }> = new Map();

    private _waitingUeCalls: Set<UeCallType> = new Set();

    private _ueEvent = this.dv(new Event<[ueEvent: UeEventResultType]>());

    private _errorEvent = this.dv(new Event<[string]>());
    get errorEvent() { return this._errorEvent; }

    private _readyEvent = this.dv(new Event());
    get readyEvent() { return this._readyEvent; }

    constructor(container: HTMLDivElement, wsUri: string, esmsgWsUri: string, private _ueViewer: ESUeViewer) {
        super();
        const ueViewer = this._ueViewer;
        const ue5ViewerWrapper = this.dv(new WebRtcManagerWrapper(container, wsUri, esmsgWsUri));

        this._ue5ViewerWrapper = ue5ViewerWrapper;

        {
            const update = () => ue5ViewerWrapper.debug = ueViewer.debug ?? false;
            update();
            this.d(ueViewer.debugChanged.don(update));
        }
        {
            let ready = false;
            const allReadyEvent = this.dv(createNextAnimateFrameEvent(
                this._videoInitialized.changed,
                this._webRtcConnected.changed,
                this._webSocketOpen.changed
            ));
            this.d(allReadyEvent.don(() => {
                if (ready) return;
                const webSocketReady = this._ue5ViewerWrapper.instance.webSocketReady;
                if (this.videoInitialized && this.webRtcConnected && webSocketReady) {
                    this._readyEvent.emit();
                    ready = true;
                    console.log(`%c[EarthSDK videoInitialized && webRtcConnected && webSocketReady]`, "background: #a6ec99; color: black");
                    const param = { eventType: 'init', params: {} };
                    this._ue5ViewerWrapper.emitUIInteractionForBigData(param);
                } else {
                    console.warn('webSocketReady', webSocketReady);
                    ready = false;
                }
            }));
        }

        //'videoInitialized', 'webRtcConnected', 'webRtcDisconnected', 
        //'webRtcFailed', 'webSocketError', 'webSocketClose', 'ueevent'
        this.d(ue5ViewerWrapper.event.don((eventName, eventDetailStr) => {
            if (eventName === 'errorEvent') {
                this._errorEvent.emit(eventDetailStr);
            } else if (eventName === 'videoInitialized') {
                this._videoInitialized.value = true;
            } else if (eventName === 'webRtcConnected') {
                this._webRtcConnected.value = true;
            } else if (eventName === 'webSocketOpen') {
                this._webSocketOpen.value = true;
            } else if (eventName === 'ueevent') {
                const detailJson = JSON.parse(eventDetailStr);
                if (detailJson.t === 'cr') {
                    const ueCallResult = detailJson as UeCallResultType;
                    ueCallResult.frs && this._ueFuncResultWithIdsEvent.emit(ueCallResult.frs);
                    if (ueCallResult.ers) {
                        for (let er of ueCallResult.ers) {
                            this._ueEvent.emit(er);
                        }
                    }
                }
            }
        }));

        {
            const animate = this.dv(createAnimateFrame());
            let lastWidth: number | undefined;
            let lastHeight: number | undefined;
            let ratio: number | undefined;
            animate.start(() => {
                if (!(lastWidth !== container.offsetWidth || lastHeight !== container.offsetHeight || ratio !== ueViewer.resolutionScale)) return;
                lastWidth = container.offsetWidth;
                lastHeight = container.offsetHeight;
                if (lastWidth === undefined || lastHeight === undefined || !Number.isFinite(lastWidth) || !Number.isFinite(lastHeight) || lastWidth < 0 || lastHeight < 0) {
                    console.warn(`lastWidth === undefined || lastHeight === undefined || !Number.isFinite(lastWidth) || !Number.isFinite(lastHeight) || lastWidth < 0 || lastHeight < 0 ${lastWidth} ${lastHeight}`);
                    return;
                }
                ratio = ueViewer.resolutionScale;
                //分辨率缩放比例
                ue5ViewerWrapper.resize(lastWidth / ratio, lastHeight / ratio);
            });
        }

        this.d(this._ueFuncResultWithIdsEvent.don(ueFuncResultWithIds => {
            for (const ueFuncResultWithId of ueFuncResultWithIds) {
                const resultCallbackAndUeFunc = this._waitingUeFuncIdAndResultCallbacks.get(ueFuncResultWithId.fid);
                if (!resultCallbackAndUeFunc) {
                    continue;
                }
                this._waitingUeFuncIdAndResultCallbacks.delete(ueFuncResultWithId.fid);
                resultCallbackAndUeFunc.resultCallback(ueFuncResultWithId.r);
            }
        }));

        let ueCallLastNum = 0;
        const processUnitMessage = (fs: UeFuncWithIdType[]) => {
            const ueCall: UeCallType = {
                n: ueCallLastNum++,
                tt: Date.now(),
                t: 'c',
                fs,
            };
            this._waitingUeCalls.add(ueCall);
            if (ueViewer.debug) {
                console.group(
                    "%cxe2 => ue",
                    " background-color:green;color:#ffffff;font-weight:bold;padding:4px;border-radius:5px;"
                );
                console.log(
                    `%c${JSON.stringify(ueCall, undefined, '')}`,
                    " border:1px dashed green;border-radius:5px;padding:10px;line-height:25px;color:green;"
                );
                console.groupEnd();
            }
            this._ue5ViewerWrapper.emitUIInteractionForBigData(ueCall, () => { this._waitingUeCalls.delete(ueCall); });
        }

        const processMessage = () => {
            const webSocketReady = this._ue5ViewerWrapper.instance.webSocketReady;
            if (!webSocketReady) return;
            if (this._ueFuncWithIdAndResultCallbacks.length === 0) return;
            const fs = this._ueFuncWithIdAndResultCallbacks.map((([e]) => e));
            for (const [ueFuncWithId, resultCallbackAndUeFunc] of this._ueFuncWithIdAndResultCallbacks) {
                this._waitingUeFuncIdAndResultCallbacks.set(ueFuncWithId.fid, resultCallbackAndUeFunc);
            }
            this._ueFuncWithIdAndResultCallbacks.length = 0;
            {
                // 消息发送机制改进，每个消息块不超过30000字节！
                // 64501
                // const maxBytes = 30000;
                // @ts-ignore;
                const maxBytes = window.g_emitDescriptor_maxBytes;
                const fsWithSize = fs.map(e => ({ f: e, s: JSON.stringify(e).length }));

                let l = fsWithSize.length;
                let i = 0;
                let currentSize = 0;
                let currentFs: UeFuncWithIdType[] = [];
                do {
                    do {
                        const { f, s } = fsWithSize[i];
                        // 消息体超大也要加
                        currentFs.push(f);
                        ++i;
                        if (currentSize + s > maxBytes || currentFs.length >= 20) {
                            break;
                        }
                    } while (i < l);

                    if (currentFs.length > 0) {
                        ueViewer.debug && console.log(`传送${currentFs.length}条消息...`)
                        processUnitMessage([...currentFs]);
                        currentFs.length = 0;
                        currentSize = 0;
                    }
                } while (i < l);
            }
        };

        const interalProcessing = this.dv(createInterval());
        interalProcessing.start(processMessage, 50);

        this.d(() => console.log(`UeCloudViewer正在销毁...`));
    }

    callUeFunc<ResultType>(ueFunc: UeFuncType) {
        return new Promise<ResultType>(resolve => {
            const fid = createGuid();
            const ueFuncWithId: UeFuncWithIdType = { fid, ...ueFunc };
            this._ueFuncWithIdAndResultCallbacks.push([ueFuncWithId, { timeStamp: Date.now(), ueFunc, resultCallback: resolve }]);
        });
    }

    disposableOnUeEvent<EventType extends keyof UeEventsType>(type: EventType, callback: (params: UeEventsType[EventType]) => void) {
        const eid = createGuid();
        this.callUeFunc({
            f: 'addEventListener',
            p: {
                et: type,
                eid,
            }
        });

        const remove = () => {
            this.callUeFunc({
                f: 'removeEventListener',
                p: {
                    eid,
                }
            });
        };

        const d = this._ueEvent.don(ueEvent => {
            if (ueEvent.et === type && ueEvent.eid === eid) {
                callback(ueEvent as UeEventsType[EventType]);
            }
        });

        return () => {
            d();
            remove();
        };
    }
}
