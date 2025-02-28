// 使用html5的viewer
import { ESSceneObject } from "earthsdk3";
import { Destroyable, Event } from "xbsj-base";
import { ESUeViewer } from "../ESUeViewer";
import { addScriptToDom, formatBytes, resourcesDownload } from "./utils";
export class DownloadViewer extends Destroyable {
    private _onRuntimeInitialized = this.dv(new Event());
    get onRuntimeInitialized() { return this._onRuntimeInitialized; }

    private _module: any = {
        // 状态管理
        infoPrinted: false,
        lastcurrentDownloadedSize: 0,
        totalDependencies: 0,

        //自定义shader
        precompiledShaders: null,
        precompiledPrograms: null,
        preinitializedWebGLContext: null,
        glIDCounter: null,
        precompiledUniforms: null,

        assetDownloadProgress: {},

        onRuntimeInitialized: () => {
            this._onRuntimeInitialized.emit();
        },

        UE4_keyEvent: function (eventType: any, key: any, virtualKeyCode: any, domPhysicalKeyCode: any, keyEventStruct: any) { return 0; },
        UE4_mouseEvent: function (eventType: any, x: any, y: any, button: any, buttons: any, mouseEventStruct: any) { return 0; },
        UE4_wheelEvent: function (eventType: any, x: any, y: any, button: any, buttons: any, deltaX: any, deltaY: any, wheelEventStruct: any) { return 0; },

        UE4_fullscreenScaleMode: 1,
        UE4_fullscreenCanvasResizeMode: 1,
        UE4_fullscreenFilteringMode: 0,

        getPreloadedPackage: (remotePackageName: any, remotePackageSize: any) => {
            return this._module['preloadedPackages'] ? this._module['preloadedPackages'][remotePackageName] : null;
        }
    };

    constructor(container: HTMLDivElement, project: string, baseUrl: string, private _ueViewer: ESUeViewer) {
        super();
        const ueViewer = this._ueViewer;
        //@ts-ignore
        window.Module = this._module;

        this._module['instantiateWasm'] = (info: any, receiveInstance: any) => {
            this._module['wasmDownloadAction'].then(async (downloadResults: any) => {
                ueViewer.setStatus('Creating');
                ueViewer.setStatusLog(`WebAssembly 编译中...`);
                const wasmInstantiate = WebAssembly.instantiate(new Uint8Array(downloadResults.wasmBytes), info);
                return wasmInstantiate.then((output: any) => {
                    const instance = output.instance || output;
                    const module = output.module;
                    ueViewer.setStatus('Creating');
                    ueViewer.setStatusLog(`WebAssembly 编译中...`);
                    this._module['wasmInstantiateActionResolve'](instance);
                    receiveInstance(instance, module);
                });
            }).catch((error: any) => {
                ueViewer.setStatus('Error');
                ueViewer.setStatusLog(`WebAssembly 编译失败：<br> ${JSON.stringify(error)}`);
            });
            return {};
        }

        this.d(() => {
            this._module = null;
            //@ts-ignore
            window.Module = null;
        })

        const canvas = document.createElement('canvas');
        {//canvas
            canvas.id = 'canvas';
            const containerv = container.getBoundingClientRect();
            canvas.width = containerv.width;
            canvas.height = containerv.height;
            canvas.style.width = containerv.width + 'px';
            canvas.style.height = containerv.height + 'px';
            canvas.style.display = 'none';
            canvas.tabIndex = 0;
            canvas.oncontextmenu = (event: any) => { event.preventDefault(); };
            container.appendChild(canvas);
            this.d(() => { canvas && container.removeChild(canvas); })
            this._module['canvas'] = canvas;
        }
        {//resize
            const resizeCanvas = () => {
                const containerRect = container.getBoundingClientRect();
                canvas.width = containerRect.width;
                canvas.height = containerRect.height;
                canvas.style.width = containerRect.width + 'px';
                canvas.style.height = containerRect.height + 'px';
                //@ts-ignore
                if (window.UE_JSlib && window.UE_JSlib.UE_CanvasSizeChanged) window.UE_JSlib.UE_CanvasSizeChanged();
            }

            this._module['UE4_resizeCanvas'] = resizeCanvas;

            const postRunEmscripten = () => {
                // 配置画布的大小并显示它。
                resizeCanvas();
                this._module['canvas'].style.display = 'block';
                // 每当浏览器窗口大小发生变化时，重新布局页面上的画布大小。
                window.addEventListener('resize', resizeCanvas, false);
                window.addEventListener('orientationchange', resizeCanvas, false);
                // 如果游戏在 iframe 中，则需要以下内容 - 主窗口已经获得焦点...
                window.focus();
            }
            this._module.postRun = [postRunEmscripten];
        }

        const wasmUrl = ESSceneObject.getStrFromEnv(baseUrl + `/${project}.wasm`);
        const earthsdkUrl = ESSceneObject.getStrFromEnv(baseUrl + `/${project}.js`);
        const earthsdkDataJsUrl = ESSceneObject.getStrFromEnv(baseUrl + `/${project}.data.js`);
        const utilityUrl = ESSceneObject.getStrFromEnv(baseUrl + `/Utility.js`);
        const earthsdkDataUrl = ESSceneObject.getStrFromEnv(baseUrl + `/${project}.data`);


        //广播下载进度
        const reProgress = (url: string, downloadedBytes: number, totalBytes: number, finished: boolean) => {
            this._module['assetDownloadProgress'][url] = {
                current: downloadedBytes,
                total: totalBytes,
                finished: finished
            };
            const aggregated = { current: 0, total: 0, finished: true };
            for (let i in this._module['assetDownloadProgress']) {
                aggregated.current += this._module['assetDownloadProgress'][i].current;
                aggregated.total += this._module['assetDownloadProgress'][i].total;
                aggregated.finished = aggregated.finished && this._module['assetDownloadProgress'][i].finished;
            }
            const allCurrentBytes = formatBytes(aggregated.current);
            const allTotalBytes = formatBytes(aggregated.total);
            const allProgress = ((aggregated.current / aggregated.total) * 100).toFixed(0) + '%';

            this._ueViewer.setStatus('Creating');
            this._ueViewer.setStatusLog(`下载进度: ${allCurrentBytes}/${allTotalBytes} ${allProgress}`);
        }

        const createProcess = () => {
            // ----------------------------------------
            // WASM
            const mainCompiledCode = resourcesDownload(wasmUrl, 'arraybuffer', reProgress).then((wasmBytes) => {
                return { wasmBytes: wasmBytes as ArrayBuffer };
            });

            this._module['wasmDownloadAction'] = mainCompiledCode;
            const compiledCodeInstantiateAction = new Promise((resolve, reject) => {
                this._module['wasmInstantiateActionResolve'] = resolve;
                this._module['wasmInstantiateActionReject'] = reject;
            });



            // ----------------------------------------
            // 主 JS
            const mainJsDownload = resourcesDownload(earthsdkUrl, 'blob', reProgress).then(async (data) => {
                this._module['mainScriptUrlOrBlob'] = data;
                return addScriptToDom(data as Blob).then((domScript) => {
                    //@ts-ignore
                    window.addRunDependency && window.addRunDependency('wait-for-compiled-code');
                    // this.d(() => {
                    //     if (domScript && domScript instanceof HTMLScriptElement) {
                    //         document.body.removeChild(domScript);
                    //     }
                    // })
                });
            });

            // ----------------------------------------
            // 工具 JS
            const utilityJsDownload = resourcesDownload(utilityUrl, 'blob', reProgress).then(data => {
                return addScriptToDom(data as Blob).then((domScript) => {
                    // this.d(() => {
                    //     if (domScript && domScript instanceof HTMLScriptElement) {
                    //         document.body.removeChild(domScript);
                    //     }
                    // })
                });
            });

            // ----------------------------------------
            // 数据 JS
            const earthsdkDataJsDownload = resourcesDownload(earthsdkDataJsUrl, 'blob', reProgress)
            // ----------------------------------------
            // 数据
            const dataDownload = resourcesDownload(earthsdkDataUrl, 'arraybuffer', reProgress).then(async (dataArrayBuffer) => {
                this._module['preloadedPackages'] = {};
                this._module['preloadedPackages'][`${project}.data`] = dataArrayBuffer;
                return earthsdkDataJsDownload.then((data) => {
                    return addScriptToDom(data as Blob).then((domScript) => {
                        // this.d(() => {
                        //     if (domScript && domScript instanceof HTMLScriptElement) {
                        //         document.body.removeChild(domScript);
                        //     }
                        // })
                    });
                });
            });

            Promise.all([
                mainCompiledCode,
                mainJsDownload,
                utilityJsDownload,
                dataDownload,
                compiledCodeInstantiateAction,
            ]).then(() => {
                //@ts-ignore
                window.removeRunDependency && window.removeRunDependency('wait-for-compiled-code');
                ueViewer.setStatus("Created");
                ueViewer.setStatusLog(`创建完成`);

            }).catch(err => {
                console.error(err);
                ueViewer.setStatus("Error");
                ueViewer.setStatusLog(`创建失败: ${JSON.stringify(err)}`);
            })
        }
        createProcess();
    }
}
