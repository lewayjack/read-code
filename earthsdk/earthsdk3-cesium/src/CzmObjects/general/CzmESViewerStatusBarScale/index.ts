import { EngineObject, ESCustomDiv, ESViewer, ESViewerStatusBarScale } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createAnimateFrameWithStartValues, Destroyable, track } from "xbsj-base";

export class CzmESViewerStatusBarScale extends EngineObject<ESViewerStatusBarScale> {
    static readonly type = this.register("ESCesiumViewer", ESViewerStatusBarScale.type, this);
    private _customDiv;
    get customDiv() { return this._customDiv; }

    constructor(sceneObject: ESViewerStatusBarScale, czmViewer: ESCesiumViewer) {
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
        this.dispose(track([customDiv, 'show'], [sceneObject, 'show']));

        customDiv.instanceClass = class MyDiv extends Destroyable {
            constructor(private _subContainer: HTMLDivElement, customDiv: ESCustomDiv<{ destroy(): undefined; }>, viewer?: ESViewer | undefined) {
                super()
                if (!viewer) return;

                if (!(viewer instanceof ESCesiumViewer)) return;
                //@ts-ignore
                viewer.extensions.cursorPositionInfo.enabled = true

                const vessel = document.createElement('div');
                this._subContainer.appendChild(vessel);
                this.dispose(() => this._subContainer.removeChild(vessel));

                const div = document.createElement('div');
                vessel.appendChild(div);

                //总div
                div.style.width = '100%';
                div.className = 'ESViewerStatusBarScale';
                div.style.position = 'absolute';
                div.style.display = 'flex';
                div.style.height = `${ESViewerStatusBarScale.defaults.height}px`;
                div.style.left = '0';
                div.style.bottom = '0';
                div.style.color = '#fff';
                div.style.padding = '0 20px 0 0';
                div.style.boxSizing = 'border-box';
                div.style.lineHeight = `${ESViewerStatusBarScale.defaults.height}px`;
                div.style.zIndex = '100'; // 特别重要，不能丢！很可能导致保存后打开看不到！
                div.style.alignContent = 'center';
                div.style.justifyContent = 'space-between';

                // earthSDKdiv
                const EarthSDKdiv = document.createElement('div');
                div.appendChild(EarthSDKdiv);
                // this.dispose(() => this._subContainer.removeChild(EarthSDKdiv));

                //earthSDK文字图标
                const EarthSDKlogodiv = document.createElement('div');
                EarthSDKdiv.appendChild(EarthSDKlogodiv);
                // this.dispose(() => this._subContainer.removeChild(EarthSDKlogodiv));

                //earthSDK广告蚊子
                const EarthSDKtextdiv = document.createElement('div');
                EarthSDKdiv.appendChild(EarthSDKtextdiv);
                // this.dispose(() => this._subContainer.removeChild(EarthSDKtextdiv));

                //比例尺和详情总div
                const Scalespandiv = document.createElement('div');
                div.appendChild(Scalespandiv);
                // this.dispose(() => this._subContainer.removeChild(Scalespandiv));

                //比例尺DIV
                const Scalediv = document.createElement('div');
                Scalespandiv.appendChild(Scalediv);
                // this.dispose(() => this._subContainer.removeChild(Scalediv));
                //字DIV
                const box = document.createElement('div');
                Scalediv.appendChild(box);
                // this.dispose(() => Scalediv.removeChild(box));
                //比例div
                const rbox = document.createElement('div');
                Scalediv.appendChild(rbox);
                // this.dispose(() => Scalediv.removeChild(rbox));

                //帧率等文字div
                const spanl = document.createElement('span');
                Scalespandiv.appendChild(spanl);
                // this.dispose(() => div.removeChild(spanl));


                {
                    const update = () => {
                        div.style.height = (sceneObject.height ?? ESViewerStatusBarScale.defaults.height) + 'px';
                        div.style.lineHeight = (sceneObject.height ?? ESViewerStatusBarScale.defaults.height) + 'px';
                    }
                    this.dispose(sceneObject.heightChanged.disposableOn(update));
                    update()
                }
                {
                    const update = () => {
                        div.style.fontSize = (sceneObject.fontSize ?? ESViewerStatusBarScale.defaults.fontSize) + 'px';
                    }
                    this.dispose(sceneObject.fontSizeChanged.disposableOn(update));
                    update()
                }
                {
                    const update = () => {
                        if (sceneObject.bgColor) {
                            div.style.background = `rgba(${sceneObject.bgColor[0] * 255},${sceneObject.bgColor[1] * 255},${sceneObject.bgColor[2] * 255},${sceneObject.bgColor[3]})`
                        } else {
                            div.style.background = `rgba(${ESViewerStatusBarScale.defaults.bgColor[0]},${ESViewerStatusBarScale.defaults.bgColor[1]},${ESViewerStatusBarScale.defaults.bgColor[2]},${ESViewerStatusBarScale.defaults.bgColor[3]})`
                        }
                    }
                    this.dispose(sceneObject.bgColorChanged.disposableOn(update));
                    update()
                }

                //左侧earthSDK总DIV
                EarthSDKdiv.style.display = 'flex';
                //earthsdk的图标
                EarthSDKlogodiv.style.fontWeight = 'bold';
                EarthSDKlogodiv.style.padding = '0 0 0 25px';
                let innerText = 'EarthSDK'
                EarthSDKlogodiv.innerText = innerText;

                EarthSDKtextdiv.style.fontWeight = '';
                let innerText2 = '——免费开源地球可视化开发包'
                EarthSDKtextdiv.innerText = innerText2;

                //比例尺和详情父级div
                Scalespandiv.style.width = '550px';
                //比例尺样式
                Scalediv.style.position = 'fixed';
                Scalediv.style.width = '125px';
                Scalediv.style.height = '30px'
                Scalediv.style.padding = '0 5px';
                Scalediv.style.display = 'flex';
                Scalediv.style.justifyContent = 'flex-end';
                Scalediv.style.pointerEvents = 'auto';
                Scalediv.style.zIndex = '101'; // 特别重要，不能丢！很可能导致保存后打开看不到！

                //比例文字
                box.style.width = '125px';
                box.style.display = 'inline-block';
                box.style.textAlign = 'center';
                box.style.fontSize = '14px';
                box.style.fontWeight = 'lighter';
                box.style.lineHeight = '30px';
                box.style.color = '#fff';
                box.innerHTML = '1000km'
                //比例盒子
                rbox.style.borderRight = '1px solid #fff';
                rbox.style.borderLeft = '1px solid #fff';
                rbox.style.borderBottom = '1px solid #fff';
                rbox.style.position = 'absolute';
                rbox.style.height = '10px';
                rbox.style.top = '15px';
                rbox.style.width = '75px';
                rbox.style.right = `${(135 - 75) / 2}px`;

                //状态详情
                spanl.style.display = 'flex';
                spanl.style.zIndex = '101'; // 特别重要，不能丢！很可能导致保存后打开看不到！
                spanl.style.justifyContent = 'flex-end';
                spanl.style.right = '0';

                //比例尺
                const a = () => {
                    const computedLengthInMeters = czmViewer.viewerLegend.legend.computedLengthInMeters
                    if (sceneObject.show === false || (computedLengthInMeters && computedLengthInMeters > 1000000)) {
                        Scalediv.style.display = 'none';
                    } else {
                        Scalediv.style.display = 'block';
                        const computedLengthInStr = czmViewer.viewerLegend.legend.computedLengthInStr
                        if (computedLengthInStr) {
                            box.innerHTML = computedLengthInStr
                        }
                        const computedLengthInPixels = czmViewer.viewerLegend.legend.computedLengthInPixels
                        if (computedLengthInPixels) {
                            rbox.style.width = `${computedLengthInPixels}px`;
                            const l = (135 - computedLengthInPixels) / 2;
                            rbox.style.left = `${l}px`;
                        }
                    }
                }
                a()
                const timer = setInterval(() => {
                    a()
                }, 200)
                this.dispose(() => clearInterval(timer));

                //帧率等信息
                {
                    //@ts-ignore
                    let animateFrame: any
                    const update = () => {
                        if (sceneObject.show) {
                            // div.style.display = 'flex';
                            vessel.style.display = 'block'
                            animateFrame = this.disposeVar(createAnimateFrameWithStartValues(() => {
                                let innerText = ''
                                const cameraInfo = viewer.getCameraInfo()
                                if (cameraInfo) {
                                    const tf = (index: number, f: number) => cameraInfo.position[index].toFixed(f)
                                    const trf = (index: number, f: number) => cameraInfo.rotation[index].toFixed(f)
                                    innerText += `帧率:${viewer.getFPS()}FPS  相机: ${tf(2, 2)}米 `
                                }
                                const mousePosition = viewer.extensions?.cursorPositionInfo.cursorPosition
                                if (mousePosition) {
                                    const tf = (index: number, f: number) => mousePosition[index].toFixed(f)
                                    innerText += `位置:${tf(0, 5)}° ${tf(1, 5)}° ${tf(2, 2)}米`
                                } else {
                                    innerText += `暂时无法获取鼠标位置...`
                                }
                                spanl.innerText = innerText;
                            }
                            ));
                            animateFrame.start();

                        } else {
                            vessel.style.display = 'none'
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
