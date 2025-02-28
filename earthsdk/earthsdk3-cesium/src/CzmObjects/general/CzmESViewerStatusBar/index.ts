import { EngineObject, ESCustomDiv, ESViewer, ESViewerStatusBar } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createAnimateFrameWithStartValues, Destroyable } from "xbsj-base";
import * as Cesium from "cesium";

async function copyClipboard(text: string) {//复制
    navigator.clipboard.writeText(text)
        .then(function () {
            console.log('复制成功');
        }, function (e) {
            console.log('复制失败');
        });
}

export class CzmESViewerStatusBar extends EngineObject<ESViewerStatusBar> {
    static readonly type = this.register("ESCesiumViewer", ESViewerStatusBar.type, this);
    private _customDiv;
    get customDiv() { return this._customDiv; }

    constructor(sceneObject: ESViewerStatusBar, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._customDiv = this.disposeVar(new ESCustomDiv(sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const customDiv = this._customDiv;
        czmViewer.add(customDiv);
        // console.log(customDiv);

        this.dispose(() => czmViewer.delete(customDiv))
        customDiv.instanceClass = class MyDiv extends Destroyable {
            constructor(private _subContainer: HTMLDivElement, customDiv: ESCustomDiv<{ destroy(): undefined; }>, viewer?: ESViewer | undefined) {
                super()
                if (!viewer) return;

                if (!(viewer instanceof ESCesiumViewer)) return;
                //@ts-ignore
                viewer.extensions.cursorPositionInfo.enabled = true

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
                            div.style.background = `rgba(${sceneObject.bgColor[0] * 255},${sceneObject.bgColor[1] * 255},${sceneObject.bgColor[2] * 255},${sceneObject.bgColor[3]})`
                        } else {
                            div.style.background = `rgba(${ESViewerStatusBar.defaults.bgColor[0]},${ESViewerStatusBar.defaults.bgColor[1]},${ESViewerStatusBar.defaults.bgColor[2]},${ESViewerStatusBar.defaults.bgColor[3]})`
                        }
                    }
                    this.dispose(sceneObject.bgColorChanged.disposableOn(update));
                    update()
                }
                {
                    //@ts-ignore
                    span.innerText = `Cesium 版本 : ${Cesium.VERSION} `;
                    let animateFrame: any
                    const update = () => {
                        if (sceneObject.show) {
                            div.style.display = 'flex';
                            animateFrame = this.disposeVar(createAnimateFrameWithStartValues(() => {
                                let leftInnerText = ''
                                let rightInnerText = ''
                                const cameraInfo = viewer.getCameraInfo()
                                if (cameraInfo) {
                                    const tf = (index: number, f: number) => cameraInfo.position[index].toFixed(f)
                                    const trf = (index: number, f: number) => cameraInfo.rotation[index].toFixed(f)
                                    leftInnerText = `帧率:${viewer.getFPS()}FPS 经度: ${tf(0, 5)}° 纬度: ${tf(1, 5)}° 高度: ${tf(2, 2)}米 偏航角: ${trf(0, 2)}° 俯仰角: ${trf(1, 2)}° 翻滚角:${trf(2, 2)}° `
                                }
                                spanLeft.innerText = leftInnerText;
                                const mousePosition = viewer.extensions?.cursorPositionInfo.cursorPosition
                                if (mousePosition) {
                                    const tf = (index: number, f: number) => mousePosition[index].toFixed(f)
                                    rightInnerText = `鼠标位置:${tf(0, 5)}° ${tf(1, 5)}° ${tf(2, 2)}m`
                                } else {
                                    rightInnerText = `暂时无法获取鼠标位置...`
                                }
                                spanRight.innerText = rightInnerText;
                            }
                            ));
                            animateFrame.start();

                        } else {
                            div.style.display = 'none'
                            animateFrame.destroy();
                        }
                    }
                    this.dispose(sceneObject.showChanged.disposableOn(update));
                    update()
                }
            }

        };
    }
}
