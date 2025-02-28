import {
    Destroyable, DomElementEvent,
    getDomEventCurrentTargetPos,
    PointerClick, PointerHover
} from "xbsj-base";
import { ESViewer } from "./index";

/**
 * 视口上的自定义鼠标交互,从ESViewer.container上收集鼠标事件,并触发到ESViewer相关事件
 */
export class ViewerCustomInteraction extends Destroyable {
    constructor(private _viewer: ESViewer, dom: HTMLDivElement) {
        super();
        if (!dom) throw new Error("ViewerCustomInteraction: container is null");

        const pointerDownEvent = this.dv(DomElementEvent.create(dom, 'pointerdown'));
        const pointerMoveEvent = this.dv(DomElementEvent.create(dom, 'pointermove'));
        const pointerUpEvent = this.dv(DomElementEvent.create(dom, 'pointerup'));
        const pointerOutEvent = this.dv(DomElementEvent.create(dom, 'pointerout'));
        const pointerOverEvent = this.dv(DomElementEvent.create(dom, 'pointerover'));
        const pointerClick = this.dv(new PointerClick());
        const pointerHover = this.dv(new PointerHover());

        //默认viewer.hoverTime是2s,这里设置pointerHover的delayTime为2000ms
        const updateHover = () => {
            const hoverTime = this._viewer.hoverTime * 1000;
            pointerHover.delayTime = hoverTime;
        }
        this.d(this._viewer.hoverTimeChanged.don(() => { updateHover(); }));

        this.d(pointerDownEvent.don(pointerEvent => pointerClick.pointerDown(pointerEvent)));
        this.d(pointerMoveEvent.don(pointerEvent => pointerClick.pointerMove(pointerEvent)));
        this.d(pointerUpEvent.don(pointerEvent => pointerClick.pointerUp(pointerEvent)));
        this.d(pointerOutEvent.don(pointerEvent => pointerClick.pointerOut(pointerEvent)));

        this.d(pointerDownEvent.don(pointerEvent => pointerHover.pointerDown(pointerEvent)));
        this.d(pointerMoveEvent.don(pointerEvent => pointerHover.pointerMove(pointerEvent)));
        this.d(pointerUpEvent.don(pointerEvent => pointerHover.pointerUp(pointerEvent)));
        this.d(pointerOutEvent.don(pointerEvent => pointerHover.pointerOut(pointerEvent)));

        this.d(pointerHover.hoverEvent.don(pointerEvent => {
            const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
            this._viewer.hoverEvent.emit({ screenPosition: [left, top], pointerEvent });
        }));

        this.d(pointerClick.clickEvent.don(pointerEvent => {
            const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
            this._viewer.clickEvent.emit({ screenPosition: [left, top], pointerEvent });
        }));
        this.d(pointerClick.dbclickEvent.don(pointerEvent => {
            const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
            if (pointerEvent.button === 0) { // 鼠标左键按下
                this._viewer.dblclickEvent.emit({ screenPosition: [left, top], pointerEvent });
            }
        }));
        this.d(pointerDownEvent.don(pointerEvent => {
            const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
            if (pointerEvent.button === 0) { // 鼠标左键按下
                this._viewer.pointerDownEvent.emit({ screenPosition: [left, top], pointerEvent });
            }
        }));
        this.d(pointerUpEvent.don(pointerEvent => {
            const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
            if (pointerEvent.button === 0) { // 鼠标左键抬起
                this._viewer.pointerUpEvent.emit({ screenPosition: [left, top], pointerEvent });
            }
        }));
        this.d(pointerMoveEvent.don(pointerEvent => {
            const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
            this._viewer.pointerMoveEvent.emit({ screenPosition: [left, top], pointerEvent });
        }));

        this.d(pointerOverEvent.don(pointerEvent => {
            const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
            this._viewer.pointerOverEvent.emit({ screenPosition: [left, top], pointerEvent });
        }));

        this.d(pointerOutEvent.don(pointerEvent => {
            const [left, top] = getDomEventCurrentTargetPos(pointerEvent);
            this._viewer.pointerOutEvent.emit({ screenPosition: [left, top], pointerEvent });
        }));


        const keydownEvent = this.dv(DomElementEvent.create(dom, 'keydown'));
        this.d(keydownEvent.don(e => this._viewer.keyDownEvent.emit(e)));

        const keyupEvent = this.dv(DomElementEvent.create(dom, 'keyup'));
        this.d(keyupEvent.don(e => this._viewer.keyUpEvent.emit(e)));

        const wheelEvent = this.dv(DomElementEvent.create(dom, 'wheel'));
        this.d(wheelEvent.don(e => this._viewer.wheelEvent.emit(e)));

    }
}
