// 使用html5的viewer
import { ESSceneObject } from "earthsdk3";
import { Destroyable, Event } from "xbsj-base";
import { ESUeViewer } from "../ESUeViewer";
export class DLViewer extends Destroyable {
    private _onRuntimeInitialized = this.dv(new Event());
    get onRuntimeInitialized() { return this._onRuntimeInitialized; }
    private _vIframe: HTMLIFrameElement | null = null;
    get vIframe() { return this._vIframe; }

    constructor(container: HTMLDivElement, project: string, baseUrl: string, private _ueViewer: ESUeViewer) {
        super();
        const ueViewer = this._ueViewer;
        {
            const vIframe = document.createElement('iframe');
            this._vIframe = vIframe;
            const containerv = container.getBoundingClientRect();
            vIframe.style.width = containerv.width + 'px';
            vIframe.style.height = containerv.height + 'px';
            vIframe.style.border = 'none';
            vIframe.style.outline = 'none';
            container.appendChild(vIframe);
            this.d(() => { vIframe && container.removeChild(vIframe); });
            const baseSrc = ESSceneObject.getStrFromEnv(baseUrl + `/web/${project}.html`);
            vIframe.src = baseSrc;
            vIframe.onload = () => {
                const iframeWindow = vIframe.contentWindow;
                if (!iframeWindow) {
                    console.error('iframeWindow is null');
                    return;
                }
                //@ts-ignore
                console.log('iwindow.Module', iframeWindow.Module);
                //@ts-ignore
                iframeWindow.Module.onRuntimeInitialized = () => {
                    this._onRuntimeInitialized.emit();
                    ueViewer.setStatus('Created');
                    ueViewer.setStatusLog(`创建成功`);
                    //@ts-ignore
                    iframeWindow.console.log('创建成功__________________________________________')
                }
            }
        }



    }
}
