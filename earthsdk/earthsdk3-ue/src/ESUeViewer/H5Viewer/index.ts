import { createGuid, createInterval, Event } from "xbsj-base";
import { ESUeViewer } from "../index";
import { UeCloudViewerBase } from "../uemsg/UeCloudViewerBase";
import { UeEventsType } from "../uemsg/UeEventsType";
import { UeCallResultType, UeEventResultType, UeFuncResultWithIdType, UeFuncType, UeFuncWithIdType } from "../uemsg/UeMessage";
import { DLViewer } from "./DLViewer";
import { UTF8ArrayToString, UTF8ToString } from "../ESH5Viewer/utils";
let lastSendId = -1;

export type UeH5CallType = {
    t: 'c';
    n: number;
    tt: number;
    fs: UeFuncWithIdType[];
} & {
    callid: string;
}
/**
 * H5 UEViewer
 * 1.所有js发的消息通过callUeFunc存储在 数组_ueFuncWithIdAndResultCallbacks中等待轮询调用
 * 2._waitingUeFuncIdAndResultCallbacks 存储等待回调的函数，即发送了未收到回调的函数
 * 3.通过 window.ue.es.oncommand发送消息，多个消息可以拼接在一起发，一起发的消息存在_waitingUeCalls中，回调后移除
 * 4.通过 window.calljs 接收消息，收到消息_waitingUeFuncIdAndResultCallbacks对比，回调后移除
 * 5.区分对象和事件
 */
const _baseUrl = "${earthsdk3-ue-h5-assets-script-dir}";
export class H5Viewer extends UeCloudViewerBase {
    private _ueFuncResultWithIdsEvent = this.dv(new Event<[ueFuncResultWithIds: UeFuncResultWithIdType[]]>());

    private _ueFuncWithIdAndResultCallbacks: [ueFuncWithId: UeFuncWithIdType, resultCallback: (result: any) => void][] = [];
    private _waitingUeFuncIdAndResultCallbacks: Map<string, (result: any) => void> = new Map();

    //发送时记录消息,回调函数中对应消息后再删除
    private _waitingUeCalls = new Map<string, UeH5CallType>();

    private _ueEvent = this.dv(new Event<[ueEvent: UeEventResultType]>());

    constructor(container: HTMLDivElement, project: string, baseUrl: string = _baseUrl, private _ueViewer: ESUeViewer) {
        super();
        const ueViewer = this._ueViewer;
        const dlViewer = this.dv(new DLViewer(container, project, baseUrl, ueViewer));

        let ready = false;
        let iframeWindow: Window | null = null;

        this.d(dlViewer.onRuntimeInitialized.don(() => {
            ready = true;
            if (dlViewer?.vIframe?.contentWindow) {
                iframeWindow = dlViewer.vIframe.contentWindow;
            } else {
                console.error("iframeWindow is null");
                return;
            }

            // @ts-ignore
            if (iframeWindow.UE_JSHTML5Communication) {
                //@ts-ignore
                iframeWindow.UE_JSHTML5Communication.UESendMessageToJS = (str: any) => {
                    try {
                        //@ts-ignore
                        const jsonStr = UTF8ArrayToString(iframeWindow.HEAPU8, str)
                        const detailJson = JSON.parse(jsonStr);
                        if (ueViewer.debug) {
                            console.group(
                                "%cUE => JS",
                                " background-color:#006EFF;color:#ffffff;font-weight:bold;padding:4px;border-radius:5px;"
                            );
                            console.log(
                                `%c${JSON.stringify(detailJson, undefined, '')}`,
                                " border:1px dashed #006EFF;border-radius:5px;padding:10px;line-height:25px;color:#006EFF;"
                            );
                            console.groupEnd();
                        }
                        if (detailJson.t === 'cr') {
                            const ueCallResult = detailJson as UeCallResultType;
                            ueCallResult.frs && this._ueFuncResultWithIdsEvent.emit(ueCallResult.frs);
                            if (ueCallResult.ers) {
                                for (let er of ueCallResult.ers) {
                                    this._ueEvent.emit(er);
                                }
                            }
                        }
                        if (detailJson.callid && this._waitingUeCalls.has(detailJson.callid)) {
                            this._waitingUeCalls.delete(detailJson.callid);
                            console.log(`waitingUeCalls.delete:${detailJson.callid} end`);
                        }

                    } catch (error) {
                        console.error('UE_JSHTML5Communication.UESendMessageToJS error:', error);
                    }
                }
            } else {
                console.error('UE_JSHTML5Communication UESendMessageToJS not found');
            }
        }));

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
            if (!iframeWindow) return;
            //@ts-ignore
            if (!iframeWindow.UE_JSHTML5Communication || !iframeWindow.UE_JSHTML5Communication.JSSendMessageToUE) return;
            if (this._ueFuncWithIdAndResultCallbacks.length === 0) return;
            const fs = this._ueFuncWithIdAndResultCallbacks.map((([e]) => e));
            const ueCall: UeH5CallType = { n: ueCallLastNum++, tt: Date.now(), t: 'c', fs, callid: createGuid() };
            for (const [ueFuncWithId, resultCallback] of this._ueFuncWithIdAndResultCallbacks) {
                this._waitingUeFuncIdAndResultCallbacks.set(ueFuncWithId.fid, resultCallback);
            }
            this._ueFuncWithIdAndResultCallbacks.length = 0;
            this._waitingUeCalls.set(ueCall.callid, ueCall);
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
            const descriptorAsString = JSON.stringify(ueCall);
            // @ts-ignore
            const maxBytes = (window.g_emitDescriptor_maxBytes ?? 30000) as number;
            const l = descriptorAsString.length
            const currentSendId = ++lastSendId;
            /**
             *`${currentSendId}-${i}/${n}-` 解释
             * currentSendId: 当前发送的消息序号, 从 0 开始
             * i: 当前发送的包的序号是第几份,从 0 开始，配合n可以知道当前是第几份
             * n: 消息拆分为几份，为 1 时表示没拆分
             */
            if (l < maxBytes) {
                const infoStr = `${currentSendId}-0/1-` + descriptorAsString;
                //@ts-ignore
                iframeWindow.UE_JSHTML5Communication.JSSendMessageToUE(infoStr);
                return
            }
            // 否则就分拆后再发送
            const n = Math.ceil(l / maxBytes) | 0
            const ds = [...new Array(n).keys()].map(i => descriptorAsString.slice(i * maxBytes, (i + 1) * maxBytes))
            ds.forEach((e, i) => {
                const infoStr = `${currentSendId}-${i}/${n}-` + e;
                //@ts-ignore
                iframeWindow.UE_JSHTML5Communication.JSSendMessageToUE(infoStr);
            })
        };

        const interalProcessing = this.dv(createInterval());
        interalProcessing.start(processMessage, 50);


    }

    processResponse(text: string) {
        if (this._ueViewer.debug ?? false) {
            try {
                const json = JSON.parse(text);
                console.group(
                    "%cUE => JS",
                    " background-color:#006EFF;color:#ffffff;font-weight:bold;padding:4px;border-radius:5px;"
                );
                console.log(
                    `%c${JSON.stringify(json, undefined, '')}`,
                    " border:1px dashed #006EFF;border-radius:5px;padding:10px;line-height:25px;color:#006EFF;"
                );
                console.groupEnd();
            } catch (error) {
                console.error(`processResponse(${text}) error: ${error}`, error);
            }
        }
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
