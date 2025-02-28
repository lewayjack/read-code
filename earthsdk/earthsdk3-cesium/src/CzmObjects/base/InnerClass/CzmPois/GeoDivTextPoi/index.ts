import { PickedInfo } from "earthsdk3";
import { GeoCustomDivPoi } from "../../../../../CzmObjects";
import { ESCesiumViewer } from ".././../../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, PointerClick, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";

class MyDivBase extends Destroyable {
    constructor(protected _container: HTMLDivElement, geoCustomDivPoi: GeoCustomDivPoi<MyDivBase>, viewer: ESCesiumViewer) {
        super()
    }
};

export class GeoDivTextPoi extends Destroyable {
    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    /**
     * @deprecated
     */
    private _divEvent = this.disposeVar(new Event<[boolean | undefined]>());
    get divEvent() { return this._divEvent; }

    private _divCreatedEvent = this.disposeVar(new Event<[HTMLDivElement]>());
    get divCreatedEvent() { return this._divCreatedEvent; }

    private _divToDestroyEvent = this.disposeVar(new Event<[HTMLDivElement]>());
    get divToDestroyEvent() { return this._divToDestroyEvent; }

    private _pc = this.disposeVar(new PointerClick());
    get pc() { return this._pc; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _customDivPoi;
    get customDivPoi() { return this._customDivPoi }

    // get sPositionEditing() { return this._customDivPoi.sPositionEditing; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._customDivPoi = this.disposeVar(new GeoCustomDivPoi<MyDivBase>(czmViewer, id));
        const sceneObject = this
        // 创建一个GeoCustomDiv场景对象
        const customDivPoi = this._customDivPoi
        // 如果想要这个场景对象在三维场景中能看到
        // this.dispose(this.components.disposableAdd(customDivPoi));
        this.dispose(this.flyToEvent.disposableOn(duration => {
            customDivPoi.flyTo(duration)
        }));



        this.dispose(bind([customDivPoi, 'show'], [this, 'show']));
        this.dispose(bind([customDivPoi, 'position'], [this, 'position']));
        this.dispose(bind([customDivPoi, 'originRatioAndOffset'], [this, 'originRatioAndOffset']));
        this.dispose(bind([customDivPoi, 'editing'], [this, 'positionEditing']));
        this.dispose(bind([customDivPoi, 'opacity'], [this, 'opacity']));
        this.dispose(bind([customDivPoi, 'viewDistanceRange'], [this, 'viewDistanceRange']));
        this.dispose(bind([customDivPoi, 'viewDistanceDebug'], [this, 'viewDistanceDebug']));
        this.dispose(bind([customDivPoi, 'shadowDom'], [this, 'shadowDom']));
        this.dispose(bind([customDivPoi, 'cssAllInitial'], [this, 'cssAllInitial']));
        this.dispose(bind([customDivPoi, 'allowPicking'], [this, 'pickOnClick']));
        this.d(bind([customDivPoi, 'zOrder'], [this, 'zOrder']));
        {
            class MyDiv extends MyDivBase {
                constructor(container: HTMLDivElement, geoCustomDivPoi: GeoCustomDivPoi<MyDivBase>, viewer: ESCesiumViewer) {
                    super(container, geoCustomDivPoi, viewer)

                    const div = document.createElement('div');
                    div.style.overflow = "hidden"
                    // 文字横向排列
                    div.style.whiteSpace = 'nowrap'


                    div.addEventListener("mouseover", () => {
                        sceneObject.divEvent.emit(true);

                    })
                    div.addEventListener("mouseout", () => {
                        sceneObject.divEvent.emit(false);

                    })
                    {
                        // 其他属性
                        {
                            const updateDiv = () => {
                                customDivPoi.show = sceneObject.show ?? true;

                                // 编辑状态开时，阻止默认行为
                                // if (sceneObject.editing ?? false) {
                                //     div.style.pointerEvents = 'none'
                                // } else {
                                //     // 双击编辑状态没开时，阻止默认行为
                                //     if (sceneObject.textEditing ?? false) {
                                //         div.style.pointerEvents = 'all'
                                //     } else {
                                //         div.style.pointerEvents = 'none'
                                //     }
                                // }
                                // if((sceneObject.editing ?? false) || !(sceneObject.textEditing?? false)){
                                //     div.style.pointerEvents = 'none'
                                // }else{
                                //     div.style.pointerEvents = 'all'
                                // }
                                div.style.pointerEvents = 'all'

                                // 如果没有给宽度，自适应
                                if (sceneObject.width === undefined) {
                                    div.style.width = "auto"
                                }
                                // 如果给了宽度（包括0），强制按照设置的宽度来
                                else {
                                    div.style.width = `${sceneObject.width}px`
                                }

                                // 如果没有给高度，自适应
                                if (sceneObject.height === undefined) {
                                    div.style.height = "auto"
                                }
                                // 如果给了高度（包括0），强制按照设置的高度来
                                else {
                                    div.style.height = `${sceneObject.height}px`
                                }

                                // 编辑框设置文字
                                if (sceneObject.text !== undefined) {
                                    div.innerHTML = `${sceneObject.text.replace(/\n/g, "<br/>") ?? '请输入文字'}`;
                                } else {
                                    div.innerHTML = '请输入文字'
                                }

                                div.style.fontSize = `${sceneObject.fontSize ?? 14}px`
                                div.style.fontFamily = `${sceneObject.fontFamily ?? GeoDivTextPoi.defaults.fontFamily}`


                                const radius = sceneObject.borderRadius ?? [6, 6, 6, 6];
                                div.style.borderRadius = `${radius[0]}px ${radius[1]}px ${radius[2]}px ${radius[3]}px`;

                                const defaultColor = sceneObject.color ?? [1, 1, 1, 1]
                                div.style.color = `rgba(${defaultColor[0] * 255},${defaultColor[1] * 255},${defaultColor[2] * 255},${defaultColor[3]})`

                                const defaultBackgroundColor = sceneObject.backgroundColor ?? [0, 0, 0, 0.8]
                                div.style.backgroundColor = `rgba(${defaultBackgroundColor[0] * 255},${defaultBackgroundColor[1] * 255},${defaultBackgroundColor[2] * 255},${defaultBackgroundColor[3]})`

                                const defaultPadding = sceneObject.padding ?? [5, 5, 5, 5]
                                div.style.padding = `${defaultPadding[0]}px ${defaultPadding[1]}px ${defaultPadding[2]}px ${defaultPadding[3]}px`

                                div.style.borderWidth = `${sceneObject.borderWidth ?? 0}px`

                                const defaultBorderColor = sceneObject.borderColor ?? [1, 1, 1, 1]
                                div.style.borderColor = `rgba(${defaultBorderColor[0] * 255},${defaultBorderColor[1] * 255},${defaultBorderColor[2] * 255},${defaultBorderColor[3]})`

                                div.style.borderStyle = `${sceneObject.borderStyle ?? "solid"}`

                                div.style.textAlign = `${sceneObject.textAlign ?? 'left'}`

                                div.style.transform = `scale(${sceneObject.scale[0] ?? 1},${sceneObject.scale[1] ?? 1})`
                            }
                            updateDiv()
                            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                                sceneObject.showChanged,
                                sceneObject.widthChanged,
                                sceneObject.heightChanged,
                                sceneObject.textChanged,
                                sceneObject.fontSizeChanged,
                                sceneObject.borderRadiusChanged,
                                sceneObject.colorChanged,
                                sceneObject.backgroundColorChanged,
                                sceneObject.paddingChanged,
                                sceneObject.borderWidthChanged,
                                sceneObject.borderColorChanged,
                                sceneObject.borderStyleChanged,
                                sceneObject.fontFamilyChanged,
                                sceneObject.textAlignChanged,
                                sceneObject.scaleChanged
                            ));
                            this.dispose(updateEvent.disposableOn(updateDiv));
                        }

                        // 文本编辑
                        {
                            const update = () => {
                                if (sceneObject.textEditing) {
                                    div.contentEditable = 'true'
                                    div.focus()
                                    // @ts-ignore
                                    document.execCommand('selectAll', false, null);
                                } else {
                                    div.contentEditable = 'false'
                                    // @ts-ignore
                                    document.execCommand('unselect', false, null);
                                }
                            }
                            update()
                            this.dispose(sceneObject.textEditingChanged.disposableOn(update));
                        }
                        // 位置编辑
                        {
                            const update = () => {
                                if (sceneObject.textEditingInteraction) return;
                                if (sceneObject.positionEditing ?? false) {
                                    div.style.pointerEvents = 'none'
                                } else {
                                    div.style.pointerEvents = 'all'
                                }
                            }
                            update()
                            this.dispose(sceneObject.positionEditingChanged.disposableOn(update));
                        }
                        // 交互事件
                        let timer: any = null
                        this.dispose(() => clearInterval(timer))
                        {
                            const update = () => {
                                div.ondblclick = () => {
                                    if (sceneObject.positionEditing) {
                                        sceneObject.positionEditing = false
                                    }
                                    if (!sceneObject.textEditingInteraction) return;
                                    sceneObject.textEditing = true
                                }
                                div.onblur = () => {
                                    sceneObject.text = div.innerText;
                                    if (!sceneObject.textEditingInteraction) return;
                                    if (timer) {
                                        clearTimeout(timer)
                                    }
                                    timer = setTimeout(() => {
                                        sceneObject.textEditing = false
                                    }, 100)
                                }
                                div.addEventListener('keydown', function (e) {
                                    if (!sceneObject.textEditingInteraction) return;

                                    // enter
                                    if (e.code === 'Enter' && !e.shiftKey) {
                                        div.blur()
                                    }
                                    // esc
                                    if (e.code === "Escape") {
                                        div.blur()
                                    }
                                    // console.log(e);
                                })
                            }
                            update()
                            this.dispose(sceneObject.textEditingInteractionChanged.disposableOn(update));
                        }
                    }
                    this._container.appendChild(div);

                    this.dispose(() => {
                        this._container.removeChild(div)
                    })

                    sceneObject._divCreatedEvent.emit(div);
                    this.dispose(() => sceneObject._divToDestroyEvent.emit(div));
                }
            };
            customDivPoi.instanceClass = MyDiv
        }

        // this.dispose(this.divCreatedEvent.disposableOn(div => {
        //     div.addEventListener('pointerdown', e => sceneObject.pc.pointerDown(e));
        //     div.addEventListener('pointermove', e => sceneObject.pc.pointerMove(e));
        //     div.addEventListener('pointerout', e => sceneObject.pc.pointerOut(e));
        //     div.addEventListener('pointerup', e => sceneObject.pc.pointerUp(e));
        // }));
        // this.dispose(sceneObject.pc.clickEvent.disposableWeakOn(e => {
        //     if (!sceneObject.pickOnClick) return;
        //     sceneObject.pickedEvent.emit(new SceneObjectPickedInfo(sceneObject, new AttachedPickedInfo({ type: 'viewerPicking', pointerEvent: e })));
        // }));
        this.dispose(customDivPoi.pickedEvent.don(pickedInfo => {
            if (customDivPoi.allowPicking ?? false) {
                sceneObject.pickedEvent.emit(pickedInfo);
            }
        }))
    }

    static defaults = {
        width: 80,
        height: 28,
        text: '请输入文字',
        borderStyle: "solid",
        fontFamily: "",
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
        scale: [1, 1] as [number, number],
        zOrder: 0,
    };
}

export namespace GeoDivTextPoi {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 必须是3的倍数！A Property specifying the array of Cartesian3 positions that define the line strip.
        text: undefined as string | undefined,
        width: undefined as number | undefined,
        height: undefined as number | undefined,
        fontFamily: undefined as string | undefined,
        positionEditing: false,
        textEditing: false,
        textEditingInteraction: false,
        originRatioAndOffset: reactArray<[leftRatio: number, topRatio: number, leftOffset: number, topOffset: number]>([0.5, 1, 0, 0]),
        opacity: 1,
        fontSize: 14,
        textAlign: 'left',
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        backgroundColor: reactArray<[number, number, number, number]>([0, 0, 0, 0.8]),
        padding: reactArray<[number, number, number, number]>([5, 5, 5, 5]),
        borderRadius: reactArray<[number, number, number, number]>([6, 6, 6, 6]),
        borderWidth: 0,
        borderColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        borderStyle: "solid",

        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,

        pickOnClick: false,
        shadowDom: false,
        cssAllInitial: false,
        scale: reactArray<[number, number]>([1, 1]),
        zOrder: 0,
    });
}
extendClassProps(GeoDivTextPoi.prototype, GeoDivTextPoi.createDefaultProps);
export interface GeoDivTextPoi extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoDivTextPoi.createDefaultProps>> { }
