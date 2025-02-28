import { createGuid, createInterval, Event } from "xbsj-base";
import { UeCloudViewerBase } from "../uemsg/UeCloudViewerBase";
import { UeCallResultType, UeCallType, UeEventResultType, UeFuncResultWithIdType, UeFuncType, UeFuncWithIdType } from "../uemsg/UeMessage";
import { ESUeViewer } from "../index";
import { UeEventsType } from "../uemsg/UeEventsType";
let lastSendId = -1;

/**
 * 本地UEViewer
 */
export class UeLocalViewer extends UeCloudViewerBase {
    private _ueFuncResultWithIdsEvent = this.dv(new Event<[ueFuncResultWithIds: UeFuncResultWithIdType[]]>());

    private _ueFuncWithIdAndResultCallbacks: [ueFuncWithId: UeFuncWithIdType, resultCallback: (result: any) => void][] = [];
    private _waitingUeFuncIdAndResultCallbacks: Map<string, (result: any) => void> = new Map();

    private _waitingUeCalls: Set<UeCallType> = new Set();

    private _ueEvent = this.dv(new Event<[ueEvent: UeEventResultType]>());

    constructor(container: HTMLDivElement, private _ueViewer: ESUeViewer) {
        super();

        const ueViewer = this._ueViewer;

        let ready = false;

        const param = {
            eventType: 'init',
            params: {},
        }

        // @ts-ignore
        // window.ue.es.oncommand(JSON.stringify(param));
        ready = true;

        // @ts-ignore
        window.calljs = (eventName: string, eventDetailStr: string) => {
            if (ueViewer.debug) {
                console.log(`calljs eventName:${eventName} eventDetailStr:${eventDetailStr}`);
            }
            if (eventName === 'ueevent' || eventName === 'commanFinish') {
                try {
                    // @ts-ignore
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
                } catch (error) {
                    console.error(error);
                }
            }
        };

        this.dispose(this._ueFuncResultWithIdsEvent.disposableOn(ueFuncResultWithIds => {
            for (const ueFuncResultWithId of ueFuncResultWithIds) {
                const resultCallback = this._waitingUeFuncIdAndResultCallbacks.get(ueFuncResultWithId.fid);
                if (!resultCallback) {
                    continue;
                }
                this._waitingUeFuncIdAndResultCallbacks.delete(ueFuncResultWithId.fid);
                resultCallback(ueFuncResultWithId.r);
            }
        }));

        let ueCallLastNum = 0;
        const processMessage = () => {
            if (!ready) return;
            if (this._ueFuncWithIdAndResultCallbacks.length === 0) return;

            const fs = this._ueFuncWithIdAndResultCallbacks.map((([e]) => e));
            const ueCall: UeCallType = {
                n: ueCallLastNum++,
                tt: Date.now(),
                t: 'c',
                fs,
            };

            for (const [ueFuncWithId, resultCallback] of this._ueFuncWithIdAndResultCallbacks) {
                this._waitingUeFuncIdAndResultCallbacks.set(ueFuncWithId.fid, resultCallback);
            }
            this._ueFuncWithIdAndResultCallbacks.length = 0;

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
            const currentSendId = ++lastSendId;

            // @ts-ignore
            window.ue.es.oncommand(`${currentSendId}-0/1-` + JSON.stringify(ueCall)).then(() => {
                this._waitingUeCalls.delete(ueCall);
            });
        };

        const interalProcessing = this.dv(createInterval());
        interalProcessing.start(processMessage, 50);
    }

    callUeFunc<ResultType>(ueFunc: UeFuncType) {
        return new Promise<ResultType>(resolve => {
            const fid = createGuid();
            const ueFuncWithId: UeFuncWithIdType = { fid, ...ueFunc };
            this._ueFuncWithIdAndResultCallbacks.push([ueFuncWithId, resolve]);
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

        const d = this._ueEvent.disposableOn(ueEvent => {
            if (ueEvent.et === type && ueEvent.eid === eid) {
                if (this._ueViewer.debug ?? false) {
                    console.log(`callback, type:${type} eid:${eid} ueEvent:${JSON.stringify(ueEvent)}`);
                }
                callback(ueEvent as UeEventsType[EventType]);
            }
        });

        return () => {
            d();
            remove();
        };
    }
}
