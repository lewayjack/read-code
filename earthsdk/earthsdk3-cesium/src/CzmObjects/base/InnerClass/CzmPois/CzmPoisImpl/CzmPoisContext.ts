import { Destroyable, Event, CanvasPoi, CanvasPrimitive, CanvasPrimitivesContext, DomElementEvent, getDomEventCurrentTargetPos, PointerClick, PointerHover } from 'xbsj-base';
import * as Cesium from 'cesium';
import { CzmCameraChanged } from '../../../../../utils';

/**
 * Cesium下使用海量POI的环境，注意需要配置事件响应！具体参见示例代码！
 * 
 * @example
 * const mkzyPoisContext = new CzmPoisContext(earth.czm.viewer);
 * this.dispose(() => mkzyPoisContext.destroy());
 * 
 * const pointerClick = new PointerClick(earth.czm.scene.canvas.parentElement as HTMLDivElement);
 * this.dispose(() => pointerClick.destroy());
 * this.dispose(pointerClick.clickEvent.disposableOn((left, top, pointerEvent) => {
 *     mkzyPoisContext.pointerClick(left, top, pointerEvent);
 * }));
 * this.dispose(pointerClick.dbclickEvent.disposableOn((left, top, pointerEvent) => {
 *     mkzyPoisContext.pointerDbclick(left, top, pointerEvent);
 * }));
 * this.dispose(pointerClick.downEvent.disposableOn((left, top, pointerEvent) => {
 *     mkzyPoisContext.pointerDown(left, top, pointerEvent);
 * }));
 * this.dispose(pointerClick.upEvent.disposableOn((left, top, pointerEvent) => {
 *     mkzyPoisContext.pointerUp(left, top, pointerEvent);
 * }));
 * this.dispose(pointerClick.moveEvent.disposableOn((left, top, pointerEvent) => {
 *     mkzyPoisContext.pointerMove(left, top, pointerEvent);
 * }));
 * 
 */
export class CzmPoisContext extends Destroyable {
    private _divContainer: HTMLDivElement;
    private _canvasPrimitivesContext: CanvasPrimitivesContext;
    // private _tooltipDiv: ToolTipDiv;
    private _isPointOccludedByEarth: (cartesian: Cesium.Cartesian3) => boolean;
    private _poiClickedEvent?: Event<[boolean]>;
    private _clickEvent: Event<[number, number, PointerEvent]> = this.disposeVar(new Event());
    private _dbclickEvent: Event<[number, number, PointerEvent]> = this.disposeVar(new Event());
    private _downEvent: Event<[number, number, PointerEvent]> = this.disposeVar(new Event());
    private _upEvent: Event<[number, number, PointerEvent]> = this.disposeVar(new Event());
    private _moveEvent: Event<[number, number, PointerEvent]> = this.disposeVar(new Event());
    private _outEvent: Event<[number, number, PointerEvent]> = this.disposeVar(new Event());
    private _cameraChanged: CzmCameraChanged;

    /**
     * 
     * @param _viewer 
     * @param _useInnerInteraction 
     */
    constructor(public _viewer: Cesium.Viewer, private _useInnerInteraction: boolean = true) {
        super();

        this._cameraChanged = new CzmCameraChanged(this._viewer.scene);

        const canvasParent = this._viewer.canvas.parentElement as HTMLDivElement;
        this._divContainer = canvasParent;

        const canvasContainer = document.createElement('div');
        canvasContainer.style.position = 'absolute';
        canvasContainer.style.left = '0px';
        canvasContainer.style.top = '0px';
        canvasContainer.style.width = '100%';
        canvasContainer.style.height = '100%';
        canvasContainer.style.pointerEvents = 'none';
        canvasParent.appendChild(canvasContainer);
        this.dispose(() => {
            canvasParent.removeChild(canvasContainer);
        });

        const canvasPrimitivesContext = new CanvasPrimitivesContext();
        this._canvasPrimitivesContext = canvasPrimitivesContext;
        this.dispose(() => {
            this._canvasPrimitivesContext.destroy();
        });

        canvasContainer.appendChild(canvasPrimitivesContext.element);

        {
            // _isPointOccludedByEarth
            // @ts-ignore
            const cameraEarthOccluder = new Cesium.EllipsoidalOccluder(Cesium.Ellipsoid.WGS84, new Cesium.Cartesian3());
            const czmCameraChanged = new CzmCameraChanged(this._viewer.scene);
            this.dispose(() => czmCameraChanged.destroy());
            const updateCameraPosition = () => (cameraEarthOccluder.cameraPosition = this._viewer.camera.positionWC);
            this.dispose(czmCameraChanged.changed.disposableOn(updateCameraPosition));
            updateCameraPosition();

            const isPointOccludedByEarth = (cartesian: Cesium.Cartesian3): boolean => {
                return !cameraEarthOccluder.isPointVisible(cartesian);
            }
            this._isPointOccludedByEarth = isPointOccludedByEarth;
        }

        // const pointerClick = new PointerClick(canvasParent);

        this.dispose(this._clickEvent.disposableOn((left, top, pointerEvent) => {
            const prs = canvasPrimitivesContext.pick(left, top, 1, 1);
            if (prs.length > 0) {
                this._poiClickedEvent && this._poiClickedEvent.emit(true);
                const { poi: clickedPoi, tag } = prs[0];
                for (let poi of canvasPrimitivesContext.pois) {
                    if (poi === clickedPoi) {
                        poi.hasClickEvent() && poi.clickEvent.emit(left, top, tag, poi, pointerEvent);
                    } else {
                        poi.hasClickOutEvent() && poi.clickOutEvent.emit(left, top, '', poi, pointerEvent);
                    }
                }
            } else {
                this._poiClickedEvent && this._poiClickedEvent.emit(false);
                for (let poi of canvasPrimitivesContext.pois) {
                    poi.hasClickOutEvent() && poi.clickOutEvent.emit(left, top, '', poi, pointerEvent);
                }
            }
        }));

        this.dispose(this._dbclickEvent.disposableOn((left, top, pointerEvent) => {
            // const prs = canvasPrimitivesContext.pick(left, top, 1, 1);
            // if (prs.length > 0) {
            //     this._poiClickedEvent && this._poiClickedEvent.emit(true);
            //     const { poi, tag } = prs[0];
            //     if (poi instanceof CanvasPoi) {
            //         poi.hasDbclickEvent() && poi.dbclickEvent.emit(left, top, tag, poi, pointerEvent);
            //     } else {
            //         poi.hasDbclickOutEvent() && poi.dbclickOutEvent.emit(left, top, tag, poi, pointerEvent);
            //     }
            // } else {
            //     this._poiClickedEvent && this._poiClickedEvent.emit(false);
            // }
            const prs = canvasPrimitivesContext.pick(left, top, 1, 1);
            if (prs.length > 0) {
                this._poiClickedEvent && this._poiClickedEvent.emit(true);
                const { poi: clickedPoi, tag } = prs[0];
                for (let poi of canvasPrimitivesContext.pois) {
                    if (poi === clickedPoi) {
                        poi.hasDbclickEvent() && poi.dbclickEvent.emit(left, top, tag, poi, pointerEvent);
                    } else {
                        poi.hasDbclickOutEvent() && poi.dbclickOutEvent.emit(left, top, '', poi, pointerEvent);
                    }
                }
            } else {
                this._poiClickedEvent && this._poiClickedEvent.emit(false);
                for (let poi of canvasPrimitivesContext.pois) {
                    poi.hasDbclickOutEvent() && poi.dbclickOutEvent.emit(left, top, '', poi, pointerEvent);
                }
            }
        }));

        let lastActivedPoi: CanvasPrimitive | undefined;
        this.dispose(this._downEvent.disposableOn((left, top) => {
            if (lastActivedPoi) {
                lastActivedPoi.actived = false;
            }

            const prs = canvasPrimitivesContext.pick(left, top, 1, 1);
            if (prs.length > 0) {
                const { poi, tag } = prs[0];
                if (poi instanceof CanvasPoi) {
                    poi.actived = true;
                    lastActivedPoi = poi;
                }
            }
        }));
        this.dispose(this._upEvent.disposableOn(() => {
            if (lastActivedPoi) {
                lastActivedPoi.actived = false;
                lastActivedPoi = undefined;
            }
        }));

        let lastHoveredPoi: CanvasPrimitive | undefined;
        function setLastHoverPoi(poi: CanvasPrimitive | undefined) {
            if (lastHoveredPoi !== poi) {
                lastHoveredPoi && (lastHoveredPoi.hovered = false);
                lastHoveredPoi = poi;
                lastHoveredPoi && (lastHoveredPoi.hovered = true);
            }
        }

        // const pointerMove = new PointerMove(canvasParent);
        const disposeMove = this._moveEvent.disposableOn((left, top) => {
            let hoverPoi: CanvasPrimitive | undefined;
            const prs = canvasPrimitivesContext.pick(left, top, 1, 1);
            if (prs.length > 0) {
                const poi = prs[0].poi;
                if (poi instanceof CanvasPrimitive) {
                    hoverPoi = poi;
                }
            }
            setLastHoverPoi(hoverPoi);
        });
        this.dispose(disposeMove);

        this.dispose(this._outEvent.disposableOn((left, top, PointerEvent) => {
            setLastHoverPoi(undefined);
        }));


        // let lastHoveredPoi: CanvasPrimitive | undefined;
        // const pointerHover = new PointerHover(canvasParent);
        // const disposeHover = pointerHover.hoverEvent.disposableOn(pointerStatus => {
        //     if (lastHoveredPoi) {
        //         lastHoveredPoi.hovered = false;
        //     }

        //     const { left, top } = pointerStatus;
        //     const prs = canvasPrimitivesContext.pick(left, top, 1, 1);
        //     if (prs.length > 0) {
        //         // alert(`pos: ${prs[0].tag}`);
        //         const poi = prs[0].poi;
        //         if (poi instanceof CanvasPrimitive) {
        //             lastHoveredPoi = poi;
        //             lastHoveredPoi.hovered = true;
        //         }
        //     }
        // });
        // this.dispose(disposeHover);

        // this._tooltipDiv = new ToolTipDiv();
        // this._divContainer.appendChild(this._tooltipDiv.element);
        // this.dispose(() => this._tooltipDiv.destroy());

        if (this._useInnerInteraction) {
            // const pointerClick = this.disposeVar(new PointerClickDeprecated(this._viewer.canvas.parentElement as HTMLDivElement));
            // const pointerHover = this.disposeVar(new PointerHoverDeprecated(this._viewer.canvas.parentElement as HTMLDivElement, 500));
            const dom = this._viewer.canvas.parentElement as HTMLDivElement;
            const pointerDownEvent = this.disposeVar(DomElementEvent.create(dom, 'pointerdown'));
            const pointerMoveEvent = this.disposeVar(DomElementEvent.create(dom, 'pointermove'));
            const pointerUpEvent = this.disposeVar(DomElementEvent.create(dom, 'pointerup'));
            const pointerOutEvent = this.disposeVar(DomElementEvent.create(dom, 'pointerout'));
            const pointerClick = this.disposeVar(new PointerClick());
            const pointerHover = this.disposeVar(new PointerHover());
            this.dispose(pointerDownEvent.disposableOn(pointerEvent => pointerClick.pointerDown(pointerEvent)));
            this.dispose(pointerMoveEvent.disposableOn(pointerEvent => pointerClick.pointerMove(pointerEvent)));
            this.dispose(pointerUpEvent.disposableOn(pointerEvent => pointerClick.pointerUp(pointerEvent)));
            this.dispose(pointerOutEvent.disposableOn(pointerEvent => pointerClick.pointerOut(pointerEvent)));
            this.dispose(pointerDownEvent.disposableOn(pointerEvent => pointerHover.pointerDown(pointerEvent)));
            this.dispose(pointerMoveEvent.disposableOn(pointerEvent => pointerHover.pointerMove(pointerEvent)));
            this.dispose(pointerUpEvent.disposableOn(pointerEvent => pointerHover.pointerUp(pointerEvent)));
            this.dispose(pointerOutEvent.disposableOn(pointerEvent => pointerHover.pointerOut(pointerEvent)));

            this.dispose(pointerClick.clickEvent.disposableOn(pointerEvent => {
                const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
                if (pointerEvent.button === 0) { // 鼠标左键按下
                    this._clickEvent.emit(left, top, pointerEvent);
                } else if (pointerEvent.button === 2) { // 鼠标右键按下
                    this._clickEvent.emit(left, top, pointerEvent);
                }
            }));
            this.dispose(pointerClick.dbclickEvent.disposableOn(pointerEvent => {
                const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
                if (pointerEvent.button === 0) { // 鼠标左键按下
                    this._dbclickEvent.emit(left, top, pointerEvent);
                }
            }));
            this.dispose(pointerDownEvent.disposableOn(pointerEvent => {
                const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
                if (pointerEvent.button === 0) { // 鼠标左键按下
                    this._downEvent.emit(left, top, pointerEvent);
                }
            }));
            this.dispose(pointerUpEvent.disposableOn(pointerEvent => {
                const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
                if (pointerEvent.button === 0) { // 鼠标左键按下
                    this._upEvent.emit(left, top, pointerEvent);
                }
            }));
            this.dispose(pointerMoveEvent.disposableOn(pointerEvent => {
                const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
                this._moveEvent.emit(left, top, pointerEvent);
            }));
            this.dispose(pointerOutEvent.disposableOn(pointerEvent => {
                const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
                this._outEvent.emit(left, top, pointerEvent);
            }));
        }
    }

    /**
     * 是否使用内部的交互操作，此值为只读属性，需要在构造时确定好
     * 如果不使用内部的交互操作，需要自行补上交互操作
     */
    get useInnerInteraction() {
        return this._useInnerInteraction;
    }

    get divContainer() {
        return this._divContainer;
    }

    get canvasPrimitivesContext() {
        return this._canvasPrimitivesContext;
    }

    // get tooltipDiv() {
    //     return this._tooltipDiv;
    // }

    get viewer() {
        return this._viewer;
    }

    /**
     * 相机状态变化时，会触发此事件
     */
    get cameraChanged() {
        return this._cameraChanged;
    }

    /**
     * 是否被地球遮挡
     * @param cartesian 
     * @returns 
     */
    isPointOccludedByEarth(cartesian: Cesium.Cartesian3) {
        return this._isPointOccludedByEarth(cartesian);
    }

    /**
     * 当某个poi被点击时此处此事件
     */
    get poiClickedEvent() {
        if (!this._poiClickedEvent) {
            this._poiClickedEvent = new Event();
        }
        return this._poiClickedEvent;
    }

    pointerClick(this: CzmPoisContext, ...args: Parameters<typeof this._clickEvent.emit>) {
        if (this._useInnerInteraction) {
            console.warn(`当前使用内置交互(useInnerInteraction为true)，此函数无效！`);
        } else {
            this._clickEvent.emit(...args);
        }
    }

    pointerDbclick(this: CzmPoisContext, ...args: Parameters<typeof this._dbclickEvent.emit>) {
        if (this._useInnerInteraction) {
            console.warn(`当前使用内置交互(useInnerInteraction为true)，此函数无效！`);
        } else {
            this._dbclickEvent.emit(...args);
        }
    }

    pointerDown(this: CzmPoisContext, ...args: Parameters<typeof this._downEvent.emit>) {
        if (this._useInnerInteraction) {
            console.warn(`当前使用内置交互(useInnerInteraction为true)，此函数无效！`);
        } else {

            this._downEvent.emit(...args);
        }
    }

    pointerUp(this: CzmPoisContext, ...args: Parameters<typeof this._upEvent.emit>) {
        if (this._useInnerInteraction) {
            console.warn(`当前使用内置交互(useInnerInteraction为true)，此函数无效！`);
        } else {
            this._upEvent.emit(...args);
        }
    }

    pointerMove(this: CzmPoisContext, ...args: Parameters<typeof this._moveEvent.emit>) {
        if (this._useInnerInteraction) {
            console.warn(`当前使用内置交互(useInnerInteraction为true)，此函数无效！`);
        } else {
            this._moveEvent.emit(...args);
        }
    }

    // get clickEvent() {
    //     return this._clickEvent;
    // }

    // get dbclickEvent() {
    //     return this._dbclickEvent;
    // }

    // get downEvent() {
    //     return this._downEvent;
    // }

    // get upEvent() {
    //     return this._upEvent;
    // }

    // get moveEvent() {
    //     return this._moveEvent;
    // }
}