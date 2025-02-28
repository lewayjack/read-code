import { ESVOptionUe, ESVOptionUeHTML5, ESVOptionUeUri, ESVOptionUeWs } from "earthsdk3";
import { createProcessingFromAsyncFunc, Destroyable, Event } from "xbsj-base";
import { UeCloudViewer } from "../CustomPixelStream/UeCloudViewer";
import { ESUeViewer } from "../index";
import { UeLocalViewer } from "./UeLocalViewer";
import { ViewerInstance } from "./ViewerInstance";
import { ViewerLocalInstance } from "./ViewerLocalInstance";
import { ESH5Viewer } from "../ESH5Viewer";
import { H5Viewer } from "../H5Viewer";
export class ViewerCreating extends Destroyable {
    private _reconnectEvent = this.dv(new Event<[UeCloudViewer | undefined]>());

    constructor(container: HTMLDivElement, params: ESVOptionUe, ueViewer: ESUeViewer) {
        super();
        const hasPorp = (obj: Object, str: string) => { return obj.hasOwnProperty(str); }

        //重连时间间隔
        let intervalTime = 0;
        //定时器
        let timer: number | undefined;
        this.d(() => { timer && clearTimeout(timer) })

        // @ts-ignore 
        // if (window.ue && window.ue.es) {
        if (window.ue) {//大屏模式
            ueViewer.setStatus('Creating');
            ueViewer.setStatusLog(`开始创建本地视口...`);
            const viewer = this.dv(new UeLocalViewer(container, ueViewer));
            this.d(() => ueViewer.viewer = undefined);
            ueViewer.viewer = viewer;
            ueViewer.setStatus('Created');
            ueViewer.setStatusLog('本地视口创建成功!');
            this.dv(new ViewerLocalInstance(container, ueViewer, viewer));
        } else if (hasPorp(params.options, 'ws') || (hasPorp(params.options, 'uri') && hasPorp(params.options, 'app'))) {
            ueViewer.setStatus('Creating');
            ueViewer.setStatusLog(`开始创建云渲染视口...`);
            //为了重连时清空容器
            let videoContainer: HTMLDivElement | undefined;
            this.d(() => {
                ueViewer.setStatus('Raw');
                ueViewer.setStatusLog('');
                (container && videoContainer) && container.removeChild(videoContainer) && (videoContainer = undefined);
            });

            const createViewerProcessing = this.dv(createProcessingFromAsyncFunc<void>(async (cancelsManager) => {
                {
                    ueViewer.viewer && (!ueViewer.viewer.isDestroyed()) && ueViewer.viewer.destroy();
                    ueViewer.viewer = undefined;
                    videoContainer && container.removeChild(videoContainer) && (videoContainer = undefined);

                    videoContainer = document.createElement('div');
                    videoContainer.setAttribute('earthsdk3-ue', 'earthsdk3-ue-videoContainer');
                    videoContainer.style.cssText = `position:relative; height: 100%;width:100%;`;
                    container.appendChild(videoContainer);
                }

                let wsserver, wsesmsg;
                if (hasPorp(params.options, 'ws')) {
                    const { ws, esmsg } = (params as ESVOptionUeWs).options;
                    wsserver = ws;
                    wsesmsg = esmsg;
                }
                if (hasPorp(params.options, 'uri') && hasPorp(params.options, 'app')) {

                    //通过信令服务器获取ws地址
                    const { offsetWidth, offsetHeight } = videoContainer;
                    const { uri, app, token } = (params as ESVOptionUeUri).options;
                    const tokenStr = token ? `?essstoken=${token}` : '';
                    const resParam = `/${app}/${offsetWidth ?? 1920}/${offsetHeight ?? 1080}` + tokenStr;
                    console.log(`请求信令服务器: ${uri}instance${resParam}`);
                    const response = await cancelsManager.promise(fetch(`${uri}instance${resParam}`, { method: "GET", }));
                    const resultJson = await cancelsManager.promise(response.json());
                    if (resultJson && resultJson.status !== "ok") {
                        ueViewer.setStatus('Error');
                        ueViewer.setStatusLog(`信令服务器请求失败 ${resultJson.status}`);
                        this._reconnectEvent.emit(undefined);
                        return;
                    }

                    const { server, esmsg } = resultJson;
                    wsserver = server;
                    wsesmsg = esmsg;
                    console.log(`信令服务器请求成功! ${JSON.stringify(resultJson, undefined, '    ')}`);
                }
                const cloudViewer = this.dv(new UeCloudViewer(videoContainer, wsserver, wsesmsg, ueViewer));
                this.d(() => ueViewer.viewer = undefined);
                //监听cloudViewer事件
                this.d(cloudViewer.errorEvent.don((str) => {
                    const errorStr = `[${str}]:像素流连接错误!`;
                    ueViewer.setStatus('Error');
                    ueViewer.setStatusLog(errorStr);
                    this._reconnectEvent.emit(cloudViewer);
                }));

                await cancelsManager.promise(new Promise<void>(resolve => this.d(cloudViewer.readyEvent.donce(resolve))));

                ueViewer.setStatus('Created');
                ueViewer.setStatusLog('云渲染视口创建成功!');
                //连接成功时间间隔归零
                intervalTime = 0;
                timer && clearTimeout(timer);
                timer = undefined;

                //尺寸初始化
                const { offsetWidth, offsetHeight, } = videoContainer;
                cloudViewer.ue5ViewerWrapper.resize(offsetWidth, offsetHeight);

                ueViewer.viewer = cloudViewer;
                this.d(() => ueViewer.viewer = undefined);
                this.dv(new ViewerInstance(ueViewer, cloudViewer));
            }));

            createViewerProcessing.start();

            this.d(this._reconnectEvent.don((cviewer) => {
                if (timer !== undefined) return;
                cviewer && (!cviewer.isDestroyed()) && cviewer.destroy();
                ueViewer.viewer && (!ueViewer.viewer.isDestroyed()) && ueViewer.viewer.destroy();
                ueViewer.viewer = undefined;

                if (ueViewer.autoReconnect) {
                    ueViewer.setStatus('Reconnecting');
                    ueViewer.setStatusLog(`正在尝试重新连接...`);
                    intervalTime = (intervalTime + 5000) > 30000 ? 30000 : (intervalTime + 5000);
                    console.warn(`间隔：${intervalTime / 1000}s,正在尝试重新连接...`);

                    timer = window.setTimeout(() => {
                        createViewerProcessing.restart();
                    }, intervalTime);
                }
            }))

            this.d(createViewerProcessing.errorEvent.don(error => {
                ueViewer.setStatus('Error');
                ueViewer.setStatusLog(`云渲染视口创建失败！`);
                this._reconnectEvent.emit(undefined);
            }));

        } else if (hasPorp(params.options, 'project')) {
            const item = params as ESVOptionUeHTML5;
            const project = item.options.project;
            const baseUrl = item.options.baseUrl;
            const h5Viewer = this.dv(new ESH5Viewer(container, project, baseUrl, ueViewer));
            ueViewer.viewer = h5Viewer;
            this.d(() => ueViewer.viewer = undefined);
            this.dv(new ViewerInstance(ueViewer, h5Viewer));
        } else if (hasPorp(params.options, 'projectTest')) {
            // 测试 
            const item = params as any;
            const project = item.options.projectTest;
            const baseUrl = item.options.baseUrl;
            ueViewer.setStatus('Creating');
            ueViewer.setStatusLog(`开始创建...`);
            const h5Viewer = this.dv(new H5Viewer(container, project, baseUrl, ueViewer));
            ueViewer.viewer = h5Viewer;
            this.d(() => ueViewer.viewer = undefined);
            this.dv(new ViewerInstance(ueViewer, h5Viewer));
        } else {
            ueViewer.setStatus('Error');
            ueViewer.setStatusLog(`视口创建失败！`);
            console.warn(`视口创建失败: option的uri或者app不存在，window.ue和window.ue.es也不存在，ws和esmsg地址也不存在`);
        }
    }
}
