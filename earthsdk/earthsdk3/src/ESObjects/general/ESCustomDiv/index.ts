import {
    createNextAnimateFrameEvent, Destroyable, Event,
    extendClassProps, Listener, ObjResettingWithEvent, react, UniteChanged
} from "xbsj-base";
import { BooleanProperty, EvalStringProperty, FunctionProperty, GroupProperty, StringProperty } from "../../../ESJTypes";
import { ESViewer } from "../../../ESViewer";
import { ESSceneObject } from "../../base";
import { defaulInstanceClassDocStr, defaulInstanceClassStr, DivInstanceClass, ViewerCustomDivInstance } from "./instance";

export class ESCustomDiv<DivClass extends { destroy(): undefined } = { destroy(): undefined }> extends ESSceneObject {
    static readonly type = this.register('ESCustomDiv', this, { chsName: 'ESCustomDiv', tags: ['ESObjects'], description: "自定义div" });
    get typeName() { return 'ESCustomDiv'; }
    override get defaultProps() { return ESCustomDiv.createDefaultProps(); }

    private _updateEvent = this.dv(new Event<[(divClass: DivClass, dom: ESCustomDiv<DivClass>, viewer: ESViewer) => void]>());
    update(updateFunc: (divClass: DivClass, customDiv: ESCustomDiv<DivClass>, viewer: ESViewer) => void) {
        this._updateEvent.emit(updateFunc);
    }

    private _instanceClassReact = this.dv(react<DivInstanceClass<DivClass> | undefined>(undefined));
    get instanceClass() { return this._instanceClassReact.value; }
    set instanceClass(value: DivInstanceClass<DivClass> | undefined) { this._instanceClassReact.value = value; }
    get instanceClassChanged() { return this._instanceClassReact.changed; }

    private _innerHtmlMounted = this.dv(new Event<[contentDiv: HTMLDivElement, viewer: ESViewer]>());
    get innerHtmlMounted() { return this._innerHtmlMounted as Listener<[contentDiv: HTMLDivElement, viewer: ESViewer]>; }

    private _container = this.dv(react<HTMLElement | undefined>(undefined));
    get container() { return this._container.value; }
    get containerChanged() { return this._container.changed; }
    set container(value: HTMLElement | undefined) { this._container.value = value; }

    static override defaults = {
        ...ESSceneObject.defaults,
        show: true,
        containerId: '',
    }

    constructor(id?: string) {
        super(id);
        this.registerAttachedObjectForContainer((viewer, container) => new ViewerCustomDivInstance(container, this, viewer));

        {
            const update = () => {
                try {
                    this.instanceClass = this.instanceClassStr && Function(`"use strict";return (${this.instanceClassStr})`)();
                } catch (error) {
                    this.instanceClass = undefined;
                }
            };
            update();
            this.d(this.instanceClassStrChanged.don(update));
        }

        {
            const update = () => {
                if (this.innerHTML === undefined) {
                    this.instanceClassStr = undefined;
                    return;
                }

                const instanceClassStr = `class MyDiv extends XE2['xe2-base-utils'].Destroyable {
                    // subContainer是外部视口的div容器，可以在这里创建自己需要的DOM元素
                    // customDiv指向当前的CustomDiv场景对象
                    // viewer指定当前的视口
                    // z-index样式需要设置，否则可能导致看不到！
                    constructor(subContainer, customDiv, viewer) {     
                        super();  

                        const div = document.createElement('div');
                        this.d(() => subContainer.removeChild(div));

                        subContainer.appendChild(div);

                        div.innerHTML = \`${this.innerHTML}\`;
                        customDiv._innerHtmlMounted.emit(div, viewer);

                        // {
                        //     // 控制显示隐藏
                        //     const update = () => {
                        //         div.style.display = (customDiv.show ?? true) ? 'flex' : 'none';
                        //     };
                        //     update();
                        //     this.d(customDiv.showChanged.don(update));
                        // }
                    }
                }`;
                this.instanceClassStr = instanceClassStr;
            };
            update();
            this.d(this.innerHTMLChanged.don(update));
        }

        const div = document.createElement('div');
        div.setAttribute('xe2-div', `ESCustomDiv(${this.id}) container`);

        {
            const update = () => {
                // div.style.all = this.cssAllInitial ? 'initial' : 'unset';
                const cssText = `\
${this.cssText};
${this.cssAllInitial ? 'all: initial;' : ''}
${this.show ? '' : 'display: none;'}
`;
                div.style.cssText = cssText;
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(
                this.cssAllInitialChanged,
                this.cssTextChanged,
                this.showChanged,
            ));
            this.d(event.don(update));
        }

        {
            const update = () => {
                if (this.containerId === undefined || this.containerId === '') {
                    this.container = undefined;
                } else {
                    const e = document.getElementById(this.containerId);
                    if (e instanceof HTMLElement) {
                        this.container = e;
                    } else {
                        this.container = undefined;
                        console.warn(`Div from containerId(${this.containerId}) is not HTMLDivElement!`);
                    }
                }
            };
            update();
            this.d(this.containerIdChanged.don(update));
        }

        {
            class ContainerIdResetting extends Destroyable {
                constructor(container: HTMLElement) {
                    super();
                    container.appendChild(div);
                    this.d(() => container.removeChild(div));
                }
            }
            this.dv(new ObjResettingWithEvent(this.containerChanged, () => {
                if (!this.container) return undefined;
                return new ContainerIdResetting(this.container);
            }));
        }

        {
            const event = this.dv(createNextAnimateFrameEvent(
                this.containerChanged,
                this.instanceClassChanged,
                this.shadowDomChanged,
            ));
            this.dv(new ObjResettingWithEvent<DivClass>(event, () => {
                if (!this.container) return undefined;
                if (!this.instanceClass) return undefined;

                let instanceClassDiv = div;
                div.firstElementChild && div.removeChild(div.firstElementChild);
                if (this.shadowDom) {
                    const shadowDiv = div.appendChild(document.createElement("div"));
                    shadowDiv.setAttribute('xe2-div', 'ESCustomDiv container shadowDiv');
                    const shadowRoot = shadowDiv.attachShadow({ mode: "open" });
                    instanceClassDiv = shadowRoot.appendChild(document.createElement("div"));
                    instanceClassDiv.setAttribute('xe2-div', 'ESCustomDiv container shadowDiv div');
                }

                return new this.instanceClass(instanceClassDiv, this, undefined);
            }));
        }
    }

    static defaultInnerHTML = `\
<!-- z-index样式需要设置，否则可能导致看不到！-->
<div style="width: 300px; height: 50px; z-index: 100; position: absolute; left: 10px; top: 10px; background: rgba(120, 120, 0, 0.7); color: white; font-size: 30px; line-height: 50px; border: 1px solid white;">Hello world!</div>
`;

    static innerHTMLReadMe = `\
示例代码：  
\`\`\`
${ESCustomDiv.defaultInnerHTML}
\`\`\`
`;

    override getProperties(language?: string) {

        const updateEvalFunc = (evalFuncStr: string) => {
            if (!evalFuncStr) {
                alert(`evalFuncStr为空,无法执行!`);
            }
            try {
                const updateFunc = evalFuncStr && Function(`"use strict";return (${evalFuncStr})`)();
                this.update(updateFunc);
            } catch (error) {
                alert(`updateDivFunc error: ${error}`);
            }
        }

        return [
            ...super.getProperties(language),
            new GroupProperty('ESCustomDiv', 'ESCustomDiv', [
                new BooleanProperty('显示', '显示', false, false, [this, 'show']),
                new EvalStringProperty('实例类', '实例类', true, false, [this, 'instanceClassStr'], defaulInstanceClassStr, defaulInstanceClassDocStr),
                new EvalStringProperty('innerHTML', '注意设置此属性设置此属性会自动更新instanceClassStr变量', true, false, [this, 'innerHTML'], ESCustomDiv.defaultInnerHTML, ESCustomDiv.innerHTMLReadMe),
                new FunctionProperty('强制更新', '强制更新', ['string'], updateEvalFunc, [`(divClass, dom, viewer) => divClass.update && divClass.update()`]),
                new BooleanProperty('允许拾取', '是否允许拾取', true, false, [this, 'allowPicking']),
                new StringProperty('容器ID', '容器的ID，如果设置，CustomDiv将自动放入容器，否则放入各个视口中。', true, false, [this, 'containerId'], ESCustomDiv.defaults.containerId),
                new BooleanProperty('shadowDom', 'shadowDom', false, false, [this, 'shadowDom']),
                new BooleanProperty('cssAllInitial', 'cssAllInitial', false, false, [this, 'cssAllInitial']),
                new StringProperty('cssText', 'cssText', false, false, [this, 'cssText']),
            ]),
        ];
    }
}

export namespace ESCustomDiv {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        show: true,
        instanceClassStr: undefined as string | undefined,
        innerHTML: undefined as string | undefined,
        allowPicking: undefined as boolean | undefined,
        containerId: undefined as string | undefined,
        shadowDom: false,
        cssAllInitial: false,
        cssText: '',
    });
}
extendClassProps(ESCustomDiv.prototype, ESCustomDiv.createDefaultProps);
export interface ESCustomDiv<DivClass extends { destroy(): undefined } = { destroy(): undefined }> extends UniteChanged<ReturnType<typeof ESCustomDiv.createDefaultProps>> { }
