import {
    Config, Flags, Logger, NumericParameters, PixelStreaming,
    PixelStreamingEvent
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.4';

import { createGuid, Destroyable, Event } from "xbsj-base";
import { createMsgInput, getContainer } from './createMsgInput';

// @ts-ignore
window.g_emitDescriptor_maxBytes = 30000;
console.log('全局可设置消息体最大字节, window.g_emitDescriptor_maxBytes 默认 30000 。');
let lastSendId = -1;
//越小，输出的信息越少
Logger.SetLoggerVerbosity(1);

export class WebRtcManager extends Destroyable {
    public debug = false;

    private _error = this.dv(new Event<['webRtcDisconnected' | 'webRtcFailed' | 'webSocketClose' | 'webSocketError']>());
    get error() { return this._error; }

    private _connected = this.dv(new Event<['videoInitialized' | 'webRtcConnected' | 'webSocketOpen']>());
    get connected() { return this._connected; }

    private _ueevent = this.dv(new Event<[string]>());
    get ueevent() { return this._ueevent; }

    get container() { return getContainer(this._container) }

    private _pixelStream: PixelStreaming;
    get pixelStream() { return this._pixelStream; }

    get webSocketReady() { return this.pixelStream.webSocketController.webSocket.readyState === 1; }
    //处理ue返回的数据
    processResponse(text: string) {
        if (this.debug ?? false) {
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

        // 如果成功处理调用回调
        if (this.resolveCallback(text)) return;
        // 没有处理成功，直接发送普通的response 事件
        this.ueevent.emit(text)
    }

    //大数据拆分
    emitUIInteractionForBigData(descriptor: { [k: string]: any }, callback: any) {
        if (typeof callback == 'function') {
            descriptor.callid = createGuid();
            this.uiInteractionCallbacks.set(descriptor.callid, callback);
        }
        const descriptorAsString = JSON.stringify(descriptor);
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
            const info = {
                type: "earthsdk", time: new Date().getTime(), params: `${currentSendId}-0/1-` + descriptorAsString
            };
            this.sendData(JSON.stringify(info));
            return
        }
        // 否则就分拆后再发送
        const n = Math.ceil(l / maxBytes) | 0
        const ds = [...new Array(n).keys()].map(i => descriptorAsString.slice(i * maxBytes, (i + 1) * maxBytes))
        ds.forEach((e, i) => {
            const info = { type: "earthsdk", time: new Date().getTime(), params: `${currentSendId}-${i}/${n}-` + e };
            this.sendData(JSON.stringify(info));
        })
    }

    sendData(descriptorAsString: string) {
        this.pixelStream.webSocketController.webSocket.send(descriptorAsString);
    }

    constructor(
        private _container: HTMLDivElement | string,
        private _option: { ws: string, esmsg?: string }) {
        super();

        const config = new Config({
            initialSettings: {
                HoveringMouse: true,
                AutoPlayVideo: true,
                AutoConnect: true,
                StartVideoMuted: true,
                WaitForStreamer: true,
                SuppressBrowserKeys: false,
                ss: this._option.ws,
            }
        })
        config.setFlagEnabled(Flags.BrowserSendOffer, false);
        config.setFlagEnabled(Flags.HoveringMouseMode, true);
        config.setFlagEnabled(Flags.MatchViewportResolution, true);
        //这个重复次数，有可能服务端的streamer还未连接
        config.setNumericSetting(NumericParameters.MaxReconnectAttempts, 0);
        this._pixelStream = new PixelStreaming(config, { videoElementParent: this.container });

        //input事件覆盖
        {
            // const setSendData = () => {
            const webSocket = this.pixelStream.webSocketController.webSocket;
            //@ts-ignore
            const originSendData = this._pixelStream._webRtcController.sendMessageController.dataChannelSender.sendData;
            //@ts-ignore
            this._pixelStream._webRtcController.sendMessageController.dataChannelSender.constructor.prototype.sendData = function (data: ArrayBuffer) {
                // try {
                if (webSocket) {
                    webSocket.send(createMsgInput(data));
                } else {
                    originSendData.call(this, data);
                }
                // webSocket && webSocket.send(createMsgInput(data));
                // } catch (error) {
                //     // 如果需要，调用原始的sendData方法
                //     originSendData.call(this, data);
                //     console.error('Error in sendData:', error);
                // }
            };
            // }
        }

        {
            //https://github.com/EpicGamesExt/PixelStreamingInfrastructure/issues/10
            //TODO:'解决ue像素流双击鼠标会锁定鼠标视角跟随的问题,关注后续官方如果解决再同步'
            const handleMouseUp = (mouseEvent: MouseEvent) => {
                //@ts-ignore
                const mouseController = this._pixelStream._webRtcController.mouseController;
                setTimeout(() => {
                    const coord = mouseController.coordinateConverter.normalizeAndQuantizeUnsigned(mouseEvent.offsetX, mouseEvent.offsetY);
                    const toStreamerHandlers = mouseController.toStreamerMessagesProvider.toStreamerHandlers;
                    const mouseUp = toStreamerHandlers.get('MouseUp');
                    mouseUp && mouseUp([mouseEvent.button, coord.x, coord.y]);
                    mouseEvent.preventDefault();
                });
            };
            this.container.addEventListener('dblclick', handleMouseUp);
            this.d(() => { this.container.removeEventListener('dblclick', handleMouseUp); });

        }

        {
            const events = ['error', 'close', 'open'] as const;
            events.forEach((eventName) => {
                const func = () => {
                    if (this.isDestroyed()) return;
                    if (eventName === 'open') {
                        this.connected.emit('webSocketOpen')
                    } else if (eventName === 'close') {
                        this.error.emit('webSocketClose')
                    } else if (eventName === 'error') {
                        this.error.emit('webSocketError')
                    }
                }
                this.pixelStream.webSocketController.webSocket.addEventListener(eventName, func);
                this.d(() => { this.pixelStream.webSocketController.webSocket.removeEventListener(eventName, func) })
            })
        }
        //基础事件监听
        {
            const eventNames = ['videoInitialized', 'webRtcConnected', 'webRtcDisconnected', 'webRtcFailed'] as PixelStreamingEvent['type'][];
            eventNames.forEach((eventName) => {
                const func = () => {
                    if (this.isDestroyed()) return;
                    if (eventName === 'webRtcConnected' || eventName === 'videoInitialized') {
                        this.connected.emit(eventName)
                    } else if (eventName === 'webRtcDisconnected' || eventName === 'webRtcFailed') {
                        this.error.emit(eventName);
                        this.pixelStream.disconnect();
                    }
                }
                this.pixelStream.addEventListener(eventName, func)
                this.d(() => { this.pixelStream.removeEventListener(eventName, func) })
            })
        }

        //处理ue事件
        {
            this.pixelStream.addResponseEventListener("handle_responses", (decodedString) => {
                this.processResponse(decodedString);
            });
            this.d(() => { this.pixelStream.removeResponseEventListener('handle_responses'); });

            // //处理ue事件
            // this.pixelStream.addResponseEventListener('esueviewer', (response) => {
            //     console.warn("接收到消息 esueviewer", response);
            // });
            // this.pixelStream.addResponseEventListener("RecivedVueData", (val) => {
            //     console.log('接收到消息 RecivedVueData', val);
            // });
        }
    }

    //发送时记录消息,回调函数中对应消息后再删除
    private uiInteractionCallbacks = new Map<string, any>();
    //处理回调函数
    resolveCallback(text: string) {
        //1， 解析text失败，直接返回
        let retObj = {}
        try {
            retObj = JSON.parse(text)
        } catch (error) {
            return false
        }
        //2, 获取 调用id
        // @ts-ignore
        let callid = retObj.callid as string;
        if (typeof callid !== 'string') return false;
        //3，寻找resolve方法，如果没有，那么也返回false
        if (!this.uiInteractionCallbacks.has(callid)) return false;
        //类型不对，返回false
        let callback = this.uiInteractionCallbacks.get(callid);
        if (typeof callback !== 'function') return false;
        // 成功调用，返回true
        callback(retObj);
        this.uiInteractionCallbacks.delete(callid);
        return true
    }

    getVideoSize() {
        //@ts-ignore
        const ve = this._pixelStream._webRtcController.videoPlayer.getVideoElement();
        return { width: ve.videoWidth, height: ve.videoHeight };
    }
    //像素流命令
    emitCommand(descriptor: object) {
        this.pixelStream.emitCommand(descriptor);
    }
    resizeUEVideo(x: number, y: number) {
        const descriptor = {
            Resolution: {
                Width: x,
                Height: y
            }
        };
        console.log(`resizeUEVideo emitCommand ${x} ${y} begin`);
        this.emitCommand(descriptor);
    }
}
