import { EngineObject, ESCustomDiv, ESNavigator, ESViewer } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createAnimateFrameWithStartValues, Destroyable } from "xbsj-base";
import { flyTo } from "../../../utils";

export class CzmESNavigator extends EngineObject<ESNavigator> {
    static readonly type = this.register("ESCesiumViewer", ESNavigator.type, this);
    private _customDiv;
    get customDiv() { return this._customDiv; }
    constructor(sceneObject: ESNavigator, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._customDiv = this.disposeVar(new ESCustomDiv(sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const customDiv = this._customDiv;
        czmViewer.add(customDiv);
        this.dispose(() => czmViewer.delete(customDiv))
        // this.dispose(bind([customDiv, 'show'], [sceneObject, 'show']));
        customDiv.instanceClass = class MyDiv extends Destroyable {
            // subContainer是外部视口的div容器，可以在这里创建自己需要的DOM元素
            // customDiv指向当前的CustomDiv场景对象
            // viewer指定当前的视口
            constructor(private _subContainer: HTMLDivElement, customDiv: ESCustomDiv, viewer?: ESViewer | undefined) {
                super();
                const div = document.createElement('div');
                this._subContainer.appendChild(div);
                this.dispose(() => this._subContainer.removeChild(div));
                {
                    const a = () => {
                        const res = czmViewer.getCameraInfo()
                        const position = res?.position as [number, number, number]
                        const rotation = res?.rotation as [number, number, number]
                        const a = [...rotation] as [number, number, number]
                        a[0] = 360
                        flyTo(czmViewer.viewer, position, undefined, a)
                    }
                    div.addEventListener('click', a);
                    div.style.cursor = 'pointer'
                    this.dispose(() => div.removeEventListener('click', a));
                }
                {
                    const update = () => {
                        div.style.display = (sceneObject.show ?? ESNavigator.defaults.show) ? 'block' : 'none';
                    }
                    update()
                    sceneObject.dispose(sceneObject.showChanged.disposableOn(update))
                }
                {
                    const update = () => {
                        div.style.width = `${sceneObject.cssSize ? sceneObject.cssSize : ESNavigator.defaults.cssSize}px`;
                        div.style.height = `${sceneObject.cssSize ? sceneObject.cssSize : ESNavigator.defaults.cssSize}px`;
                    }
                    update()
                    sceneObject.dispose(sceneObject.cssSizeChanged.disposableOn(update))
                }

                div.style.position = 'fixed';
                {
                    const update = () => {
                        div.style.top = `${sceneObject.cssPosition ? sceneObject.cssPosition[0] : ESNavigator.defaults.cssPosition[0]}px`;
                        div.style.right = `${sceneObject.cssPosition ? sceneObject.cssPosition[1] : ESNavigator.defaults.cssPosition[1]}px`;
                    }
                    update()
                    sceneObject.dispose(sceneObject.cssPositionChanged.disposableOn(update))
                }
                div.style.transition = ' right 0.4s linear';
                div.style.transition = ' right 0.4s linear';
                div.style.cursor = 'pointer';
                const box = document.createElement('div');
                div.appendChild(box);
                this.dispose(() => div.removeChild(box));
                box.style.width = '100%';
                box.style.height = '100%';
                box.style.position = 'relative';
                const rbox = document.createElement('img');
                box.appendChild(rbox);
                this.dispose(() => box.removeChild(rbox));
                rbox.style.width = '100%';
                rbox.style.height = '100%';
                rbox.style.border = 'none';
                {
                    const update = () => rbox.src = sceneObject.imgUrl;
                    update()
                    sceneObject.dispose(sceneObject.imgUrlChanged.disposableOn(update))
                }
                const animateFrame = createAnimateFrameWithStartValues(() => {
                    const res = czmViewer.getCameraInfo()
                    const rotation = res?.rotation[0]
                    rbox.style.transform = `rotate(-${rotation}deg)`;
                });
                animateFrame.start();
                this.dispose(() => animateFrame.destroy());
                rbox.style.transformOrigin = '50% 50%';
            }
        }

    }
}
