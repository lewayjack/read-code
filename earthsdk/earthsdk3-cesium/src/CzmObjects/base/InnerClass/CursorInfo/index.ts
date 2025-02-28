import { Destroyable, DivPoi, FloatDivClass, getDomEventCurrentTargetPos, PosFloatDiv, react } from "xbsj-base";

// TODO(vtxf): 以后需要移动到xr-utils中去！
export class CursorFloatDiv extends PosFloatDiv {
    constructor() {
        super()

        this.contentDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.contentDiv.style.borderRadius = '3px';
        this.contentDiv.style.color = 'rgb(255, 255, 255)';
        this.contentDiv.style.padding = '1px 5px 1px 5px';
        this.contentDiv.style.fontSize = '12px';
        this.contentDiv.style.whiteSpace = 'nowrap';

        this.contentDiv.innerText = `未定义光标信息！`;
        this.originRatioX = 0;
        this.originRatioY = 0;
        this.originOffsetX = -16;
    }
}

/**
 * 用来创建跟随光标运动的div，可以任意填充内容
 * 
 * @example
 * // 默认使用的是CursorFloatDiv，代码可以简写如下：  
 * const cursorInfo = new CursorInfo(div, CursorFloatDiv);  
 * // 以上代码相当于：  
 * // 用户可以定义自己的类，类似CursorFloatDiv
 * class CursorFloatDiv extends PosFloatDiv {  
 *     constructor() {  
 *         super()  
 *   
 *         this.contentDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';  
 *         this.contentDiv.style.borderRadius = '3px';  
 *         this.contentDiv.style.color = 'rgb(255, 255, 255)';  
 *         this.contentDiv.style.padding = '1px 5px 1px 5px';  
 *         this.contentDiv.style.fontSize = '12px';  
 *         this.contentDiv.style.whiteSpace = 'nowrap';  
 *   
 *         this.contentDiv.innerText = `未定义光标信息！`;  
 *         this.originRatioX = 0;  
 *         this.originRatioY = 0;  
 *         this.originOffsetX = -16;  
 *     }  
 * }  
 * const cursorInfo = new CursorInfo<CursorFloatDiv>(div, CursorFloatDiv);
 */
export class CursorInfo<DivClass extends PosFloatDiv> extends Destroyable {
    private _cursorDiv: DivPoi<DivClass>;
    private _pointerOut = this.disposeVar(react(true));
    private _show = this.disposeVar(react(true));
    set show(value: boolean) { this._show.value = value; }
    get show() { return this._show.value; }
    get showChanged() { return this._show.changed; }

    reset() { this._pointerOut.value = true; }

    constructor(container: HTMLDivElement, divClass: FloatDivClass<DivClass>) {
        super();

        this._cursorDiv = new DivPoi(divClass, container);
        this.dispose(() => this._cursorDiv.destroy());

        const mousemoveFunc = (e: MouseEvent) => {
            const [x, y] = getDomEventCurrentTargetPos(e);
            this._cursorDiv.floatDiv.winPos = [x, y];
            this._pointerOut.value = false;
        };
        container.addEventListener('pointermove', mousemoveFunc);
        this.dispose(() => container.removeEventListener('pointermove', mousemoveFunc));
        const pointeroutFunc = (e: PointerEvent) => {
            this._pointerOut.value = true;
        };
        container.addEventListener('pointerout', pointeroutFunc);
        this.dispose(() => container.removeEventListener('pointerout', pointeroutFunc));
        container.addEventListener('pointerleave', pointeroutFunc);
        this.dispose(() => container.removeEventListener('pointerleave', pointeroutFunc));
        container.addEventListener('pointercancel', pointeroutFunc);
        this.dispose(() => container.removeEventListener('pointercancel', pointeroutFunc));

        const updateDivShow = () => {
            this._cursorDiv.show = this.show && !this._pointerOut.value;
        };
        updateDivShow();
        this.dispose(this.showChanged.disposableOn(updateDivShow));
        this.dispose(this._pointerOut.changed.disposableOn(updateDivShow));
    }

    get cursorDiv() {
        return this._cursorDiv;
    }

    set text(value: string) {
        this._cursorDiv.floatDiv.contentDiv.innerText = value;
    }

    get text() {
        return this._cursorDiv.floatDiv.contentDiv.innerText;
    }
}

