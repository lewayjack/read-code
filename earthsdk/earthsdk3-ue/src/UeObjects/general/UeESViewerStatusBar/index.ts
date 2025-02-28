import { EngineObject, ESCustomDiv, ESViewer, ESViewerStatusBar } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { Destroyable } from "xbsj-base";

async function copyClipboard(text: string) {//复制
    navigator.clipboard.writeText(text)
        .then(function () {
            console.log('复制成功');
        }, function (e) {
            console.log('复制失败');
        });
}
export class UeESViewerStatusBar extends EngineObject<ESViewerStatusBar> {
    static readonly type = this.register("ESUeViewer", ESViewerStatusBar.type, this);
    constructor(sceneObject: ESViewerStatusBar, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const customDiv = this.disposeVar(new ESCustomDiv());
        ueViewer.add(customDiv);

        this.dispose(() => ueViewer.delete(customDiv))
        customDiv.instanceClass = class MyDiv extends Destroyable {
            constructor(private _subContainer: HTMLDivElement, customDiv: ESCustomDiv<{ destroy(): undefined; }>, viewer?: ESViewer | undefined) {
                super()
                if (!viewer) return;
                if (!(viewer instanceof ESUeViewer)) return;

                const div = document.createElement('div');
                this._subContainer.appendChild(div);
                this.dispose(() => this._subContainer.removeChild(div));
                div.style.width = '100%';
                div.style.position = 'absolute';
                div.style.height = `${ESViewerStatusBar.defaults.height}px`;
                div.style.left = '0';
                div.style.bottom = '0';
                div.style.color = '#fff';
                div.style.padding = '0 20px 0 0';
                div.style.boxSizing = 'border-box';
                div.style.lineHeight = `${ESViewerStatusBar.defaults.height}px`;
                div.style.zIndex = '100'; // 特别重要，不能丢！很可能导致保存后打开看不到！
                div.style.alignContent = 'center';
                div.style.justifyContent = 'space-between';

                const spanl = document.createElement('span');
                div.appendChild(spanl);
                this.dispose(() => div.removeChild(spanl));

                const spanLeft = document.createElement('span');
                spanl.appendChild(spanLeft);
                this.dispose(() => spanl.removeChild(spanLeft));

                const spanRight = document.createElement('span');
                spanl.appendChild(spanRight);
                spanRight.addEventListener('dblclick', function () {
                    let innerHTML = spanRight.innerHTML
                    if (innerHTML.startsWith('鼠标位置')) {
                        innerHTML = innerHTML.slice(5)
                    }
                    copyClipboard(innerHTML)
                });
                spanRight.style.cursor = 'pointer'
                this.dispose(() => spanl.removeChild(spanRight));

                const span = document.createElement('span');
                div.appendChild(span);
                this.dispose(() => div.removeChild(span));

                {
                    const update = () => {
                        div.style.height = (sceneObject.height ?? ESViewerStatusBar.defaults.height) + 'px';
                        div.style.lineHeight = (sceneObject.height ?? ESViewerStatusBar.defaults.height) + 'px';
                    }
                    this.dispose(sceneObject.heightChanged.disposableOn(update));
                    update()
                }
                {
                    const update = () => {
                        div.style.fontSize = (sceneObject.fontSize ?? ESViewerStatusBar.defaults.fontSize) + 'px';
                    }
                    this.dispose(sceneObject.fontSizeChanged.disposableOn(update));
                    update()
                }
                {
                    const update = () => {
                        if (sceneObject.bgColor) {
                            // console.log('sceneObject.bgColor', sceneObject.bgColor);

                            div.style.background = `rgba(${sceneObject.bgColor[0] * 255},${sceneObject.bgColor[1] * 255},${sceneObject.bgColor[2] * 255},${sceneObject.bgColor[3]})`
                        } else {
                            div.style.background = `rgba(${ESViewerStatusBar.defaults.bgColor[0]},${ESViewerStatusBar.defaults.bgColor[1]},${ESViewerStatusBar.defaults.bgColor[2]},${ESViewerStatusBar.defaults.bgColor[3]})`
                        }
                    }
                    this.dispose(sceneObject.bgColorChanged.disposableOn(update));
                    update()
                }
                {
                    viewer.getVersion().then(res => {
                        if (res) {
                            span.innerText = `Ue 版本 : ${res[0]} `;
                        }
                    }).catch(error => {
                        console.log(error);
                    })
                }
                {
                    const aaa = () => {
                        let leftInnerText = '';
                        let rightInnerText = ''
                        leftInnerText += `帧率:${viewer.getFPS().toFixed(0)}FPS`
                        spanLeft.innerText = leftInnerText;
                        const res = ueViewer.getCurrentCameraInfo();
                        leftInnerText += ` 经度: ${res.position[0].toFixed(5)}° 纬度: ${res.position[1].toFixed(5)}° 高度: ${res.position[2].toFixed(2)}米 偏航角: ${res.rotation[0].toFixed(2)}° 俯仰角: ${res.rotation[1].toFixed(2)}° 翻滚角:${res.rotation[2].toFixed(2)}° `
                        spanLeft.innerText = leftInnerText;

                        ueViewer.pick().then(res => {
                            if (res) {
                                const { pickResult } = res;
                                if (pickResult && pickResult.position) {
                                    const { position } = pickResult
                                    rightInnerText += `鼠标位置:${position[0].toFixed(5)}° ${position[1].toFixed(5)}° ${position[2].toFixed(2)}m`
                                } else {
                                    rightInnerText += `暂时无法获取鼠标位置...`
                                }
                                spanRight.innerText = rightInnerText;
                            }
                        }).catch(error => {
                            console.log(error);
                        })
                    }
                    let timer: any
                    const update = async () => {
                        aaa()
                        if (sceneObject.show) {
                            div.style.display = 'flex';
                            timer = setInterval(() => {
                                aaa()
                            }, 1000)

                        } else {
                            div.style.display = 'none'
                            clearInterval(timer);
                        }
                    }
                    this.dispose(sceneObject.showChanged.disposableOn(update));
                    update()
                    this.dispose(() => clearInterval(timer));
                }
            }

        };

    }
}
