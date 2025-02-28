import { EngineObject, ESCustomDiv, ESScale, ESViewer } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable } from "xbsj-base";

export class CzmESScale extends EngineObject<ESScale> {
    static readonly type = this.register("ESCesiumViewer", ESScale.type, this);
    private _customDiv;
    get customDiv() { return this._customDiv; }
    constructor(sceneObject: ESScale, czmViewer: ESCesiumViewer) {
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
                    const update = () => {
                        div.style.display = (sceneObject.show ?? ESScale.defaults.show) ? 'block' : 'none';
                    }
                    update()
                    sceneObject.dispose(sceneObject.showChanged.disposableOn(update))
                }
                div.style.position = 'fixed';
                div.style.width = '125px';
                div.style.height = '30px'
                div.style.border = '1px solid rgba(49,50,56,.8)'
                div.style.padding = '0 5px';
                div.style.backgroundColor = 'rgba(37,38,42,.8)';
                div.style.borderRadius = '15px';
                div.style.pointerEvents = 'auto';
                div.style.transition = ' right 0.4s linear';

                {
                    const update = () => {
                        div.style.bottom = `${sceneObject.cssPosition ? sceneObject.cssPosition[0] : ESScale.defaults.cssPosition[0]}px`;
                        if (sceneObject.screenPosition === 'left') {
                            div.style.right = 'auto';
                            div.style.left = `${sceneObject.cssPosition ? sceneObject.cssPosition[1] : ESScale.defaults.cssPosition[1]}px`;
                        } else {
                            div.style.left = 'auto';
                            div.style.right = `${sceneObject.cssPosition ? sceneObject.cssPosition[1] : ESScale.defaults.cssPosition[1]}px`;
                        }
                    }
                    const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                        sceneObject.cssPositionChanged,
                        sceneObject.screenPositionChanged,
                    ));
                    update()
                    this.dispose(updateEvent.disposableOn(() => update()));
                }

                const box = document.createElement('div');
                div.appendChild(box);
                this.dispose(() => div.removeChild(box));

                box.style.width = '125px';
                box.style.display = 'inline-block';
                box.style.textAlign = 'center';
                box.style.fontSize = '14px';
                box.style.fontWeight = 'lighter';
                box.style.lineHeight = '30px';
                box.style.color = '#fff';
                box.innerHTML = '1000km'


                const rbox = document.createElement('div');
                div.appendChild(rbox);
                this.dispose(() => div.removeChild(rbox));
                rbox.style.borderRight = '1px solid #fff';
                rbox.style.borderLeft = '1px solid #fff';
                rbox.style.borderBottom = '1px solid #fff';
                rbox.style.position = 'absolute';
                rbox.style.height = '10px';
                rbox.style.top = '15px';
                rbox.style.width = '75px';
                rbox.style.left = `${(135 - 75) / 2}px`;

                const a = () => {
                    const computedLengthInMeters = czmViewer.viewerLegend.legend.computedLengthInMeters
                    if (sceneObject.show === false || (computedLengthInMeters && computedLengthInMeters > 1000000)) {
                        div.style.display = 'none';
                    } else {
                        div.style.display = 'block';
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
            }
        }

    }
}
