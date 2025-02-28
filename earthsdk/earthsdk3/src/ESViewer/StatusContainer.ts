
import { ESCustomDiv, ESSceneObject } from "../ESObjects";
import { createNextAnimateFrameEvent, Destroyable, track } from "xbsj-base";
import { ESViewer } from "./index";

const load = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/status/loading.gif');
const success = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/status/success.png');
const warn = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/status/warn.png');

export class StatusContainer extends Destroyable {
    static defaults = { load, succeed: success, failure: warn };
    constructor(viewer: ESViewer) {
        super();
        const viewerCreatedFn = () => {
            // 创建状态窗口    
            const customDiv = this.dv(new ESCustomDiv());
            this.d(track([customDiv, 'show'], [viewer, 'useDefaultStatusDiv']));
            {
                const update = () => {
                    customDiv.show = (viewer.useDefaultStatusDiv ?? true) && (viewer.status !== 'Created');
                };
                update();
                this.d(viewer.useDefaultStatusDivChanged.don(update));
                this.d(viewer.statusChanged.don(update));

                customDiv.cssText = `width:100%;height:100%;position:absolute;left:0px;top:0px;`
            }

            viewer.add(customDiv);
            this.d(() => viewer.delete(customDiv));

            customDiv.instanceClass = class MyDiv extends Destroyable {
                private _div = document.createElement('div');
                // subContainer是外部视口的div容器，可以在这里创建自己需要的DOM元素
                // customDiv指向当前的CustomDiv场景对象
                // viewer指定当前的视口
                constructor(private _subContainer: HTMLDivElement, customDiv: ESCustomDiv, viewer?: ESViewer | undefined) {
                    super();
                    if (!viewer) return;
                    this._subContainer.appendChild(this._div);
                    this.d(() => this._subContainer.removeChild(this._div));
                    {
                        const update = () => {
                            if (!customDiv.show) {
                                this._div.style.opacity = '0'
                            } else {
                                this._div.style.opacity = '1'
                            }
                        };
                        update();
                        this.d(customDiv.showChanged.don(update));
                    }

                    let vessel: HTMLDivElement
                    let up: HTMLImageElement
                    let bottom: HTMLDivElement
                    let status: HTMLDivElement
                    let log: HTMLDivElement

                    {
                        this._div.style.pointerEvents = 'none'
                        this._div.style.position = 'absolute'
                        this._div.style.width = '100%'
                        this._div.style.height = '100%'
                        this._div.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'
                        this._div.style.zIndex = '100'
                        this._div.style.transition = 'opacity 2s'

                        vessel = document.createElement('div');
                        this._div.appendChild(vessel)
                        vessel.style.width = 'auto';
                        vessel.style.position = 'absolute';
                        vessel.style.left = '50%';
                        vessel.style.top = '50%';
                        vessel.style.transform = 'translate(-50%,-50%)';
                        vessel.style.background = 'rgba(120, 120, 0, 0.7)';
                        vessel.style.color = 'white';
                        vessel.style.fontSize = '10px';
                        vessel.style.background = 'none';
                        vessel.style.display = "flex";
                        vessel.style.flexFlow = 'column'
                        vessel.style.alignItems = 'center';
                        // vessel.style.zIndex = '100';

                        up = document.createElement('img');
                        vessel.appendChild(up)
                        up.style.pointerEvents = 'none'
                        up.style.display = 'block';
                        up.style.width = '50px';
                        up.src = `${StatusContainer.defaults.load}`;
                        up.style.filter = 'drop-shadow(0px 0px 1px black)';

                        bottom = document.createElement('div');
                        vessel.appendChild(bottom);
                        bottom.style.pointerEvents = 'none'
                        bottom.style.marginTop = '15px'
                        bottom.style.display = "flex";
                        bottom.style.flexFlow = 'column'
                        bottom.style.maxWidth = '300px'

                        status = document.createElement('div');
                        bottom.appendChild(status)
                        status.style.fontSize = '14px';
                        status.style.fontWeight = '800';
                        status.style.marginBottom = '5px'
                        status.style.textShadow = '0 0 2px black'

                        log = document.createElement('div');
                        bottom.appendChild(log)
                        log.style.fontWeight = '400';
                        log.style.textShadow = '0 0 2px black'
                    }

                    {
                        const update = () => {
                            // 视口状态，'Raw'表示初始状态，'Creating'表示正在创建, 'Created'表示创建完成, 'Error'表示创建失败
                            let viewStatus: string = 'Raw'
                            if (viewer.status === 'Raw') {
                                viewStatus = '初始状态'
                            } else if (viewer.status === 'Creating') {
                                viewStatus = '正在创建'
                            } else if (viewer.status === 'Created') {
                                viewStatus = '创建完成'
                            } else if (viewer.status === 'Error') {
                                viewStatus = '创建失败'
                            } else if (viewer.status === 'Reconnecting') {
                                viewStatus = '重新连接'
                            }

                            status.innerText = `${viewStatus}(${viewer.status})`;
                            log.innerText = `${viewer.statusLog}`;
                            if (viewer.status === 'Creating' || viewer.status === "Reconnecting") {
                                up.style.width = '40px';
                                up.src = `${StatusContainer.defaults.load}`
                            }
                            if (viewer.status === 'Created') {
                                up.style.width = '40px';
                                up.src = `${StatusContainer.defaults.succeed}`
                            }

                            if (viewer.status === 'Error') {
                                up.style.width = '40px';
                                up.src = `${StatusContainer.defaults.failure}`
                            }

                        };
                        update();
                        const event = this.dv(createNextAnimateFrameEvent(viewer.statusLogChanged, viewer.statusChanged));
                        this.d(event.don(update));
                    }
                }

                // 随机背景颜色，仅用于测试外部强制更新，此函数非必需
                update() {
                    const r = (255 * Math.random()) | 0;
                    const g = (255 * Math.random()) | 0;
                    const b = (255 * Math.random()) | 0;
                    this._div.style.background = `rgba(${r}, ${g}, ${b}, 0.8)`;
                }
            }
        };
        this.d(viewer.containerChanged.don(() => { viewerCreatedFn(); }));
    }
}
