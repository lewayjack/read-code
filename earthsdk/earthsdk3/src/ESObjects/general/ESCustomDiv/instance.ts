import { ESViewer } from "../../../ESViewer";
import { ESCustomDiv } from "./index";
import { createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent } from "xbsj-base";

export type DivInstanceClass<DivClass extends { destroy(): undefined } = { destroy(): undefined }> = (new (subContainer: HTMLDivElement, customDiv: ESCustomDiv<DivClass>, viewer?: ESViewer | undefined) => DivClass);

export class ViewerCustomDivInstance<DivClass extends { destroy(): undefined } = { destroy(): undefined }> extends Destroyable {
    constructor(subContainer: HTMLDivElement, customDiv: ESCustomDiv<DivClass>, viewer: ESViewer) {
        super();

        const div = document.createElement('div');
        div.setAttribute('xe2-div', `ESCustomDiv(${customDiv.id})(viewer: ${viewer.id}) container`);

        {
            const update = () => {
                const cssText = `\
${customDiv.cssText}
${customDiv.cssAllInitial ? 'all: initial;' : ''}
${customDiv.show ? '' : 'display: none'}
`;
                div.style.cssText = cssText;
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(
                customDiv.cssAllInitialChanged,
                customDiv.cssTextChanged,
                customDiv.showChanged,
            ));
            this.d(event.don(update));
        }

        {
            subContainer.appendChild(div);
            this.d(() => subContainer.removeChild(div));
        }

        const event = this.dv(createNextAnimateFrameEvent(customDiv.instanceClassChanged, customDiv.containerChanged, customDiv.shadowDomChanged))
        const objResetting = this.dv(new ObjResettingWithEvent<DivClass>(event, () => {
            const { instanceClass, container } = customDiv;
            if (!instanceClass) return undefined;
            if (container) return undefined;

            let instanceClassDiv = div;
            div.firstElementChild && div.removeChild(div.firstElementChild);
            if (customDiv.shadowDom) {
                const shadowDiv = div.appendChild(document.createElement("div"));
                shadowDiv.setAttribute('xe2-div', `ESCustomDiv(${customDiv.id})(viewer: ${viewer.id}) container shadowDiv`);
                const shadowRoot = shadowDiv.attachShadow({ mode: "open" });
                instanceClassDiv = shadowRoot.appendChild(document.createElement("div"));
                instanceClassDiv.setAttribute('xe2-div', `ESCustomDiv(${customDiv.id})(viewer: ${viewer.id}) container shadowDiv div`);
            }

            return new instanceClass(instanceClassDiv, customDiv, viewer);
        }));

        // @ts-ignore
        const { _updateEvent } = customDiv;
        this.d(_updateEvent.don((func: (divClass: DivClass, dom: ESCustomDiv<DivClass>, viewer: ESViewer) => void) => {
            if (objResetting.obj) {
                try {
                    func(objResetting.obj, customDiv, viewer);
                } catch (error) {
                    console.error(`ESCustomDiv update error! ${error}`);
                }
            }
        }));
    }
}

export const defaulInstanceClassStr = `class MyDiv extends XE2['xe2-base-utils'].Destroyable {
    // subContainer是外部视口的div容器，可以在这里创建自己需要的DOM元素
    // customDiv指向当前的CustomDiv场景对象
    // viewer指定当前的视口
    constructor(subContainer, customDiv, viewer) {   
        super();  

        this._subContainer = subContainer;
        const div = document.createElement('div');
        this._div = div;

        this._subContainer.appendChild(div);
        this.d(() => this._subContainer.removeChild(this._div));

        div.style.width = '300px';
        div.style.height = '50px';
        div.style.position = 'absolute';
        div.style.left = '10px';
        div.style.top = '10px';
        div.style.background = 'rgba(120, 120, 0, 0.7)';
        div.style.color = 'white';
        div.style.fontSize = '30px';
        div.style.lineHeight = '50px';
        div.style.border = '1px solid white';
        div.style.zIndex = '100'; // 特别重要，不能丢！很可能导致保存后打开看不到！
        div.innerText = 'Hello world!';

        // {
        //     // 控制显示隐藏
        //     const update = () => {
        //         div.style.display = (customDiv.show ?? true) ? 'flex' : 'none';
        //     };
        //     update();
        //     this.d(customDiv.showChanged.don(update));
        // }
    }

    // 随机背景颜色，仅用于测试外部强制更新，此函数非必需
    update() {
        const r = (255 * Math.random()) | 0;
        const g = (255 * Math.random()) | 0;
        const b = (255 * Math.random()) | 0;
        this._div.style.background = \`rgba(\${r}, \${g}, \${b}, 0.8)\`;
    }
}`;

export const defaulInstanceClassDocStr = `\
示例代码：
\`\`\`
${defaulInstanceClassStr}
\`\`\`
`;

