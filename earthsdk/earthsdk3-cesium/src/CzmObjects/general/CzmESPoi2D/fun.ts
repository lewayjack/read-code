import { ESSceneObject } from "earthsdk3";
import { ImageBaseInfo, imgUrlToBase64 } from "../../../utils";

// 获取ESPoi2D中的图片
export async function getModeImage(mode: string) {
    const excludeIcon = ["Flag01", "Flag02", 'Linear02', 'ManAbnormal', 'ManNormal', 'P3D02', 'P3D03', 'P3D04', 'P3D05', 'P3D06', 'P3D07', 'Stranger', 'WomanAbnormal', 'WomanNormal']
    const excludeAnchor = ['CircularV05', 'Diamond01'];
    const excludeIconBox = ['Flag01', 'Flag02', 'Linear02', 'Linear03', 'ManAbnormal', 'ManNormal', 'P3D02', 'P3D03', 'P3D04', 'P3D05', 'P3D06', 'P3D07', 'Stranger', 'WomanAbnormal', 'WomanNormal'];
    let TempTextBox: (ImageBaseInfo | undefined)[] = [];
    const basePath = "${earthsdk3-assets-script-dir}/assets/img/ESPoi2D/";
    const icon = excludeIcon.includes(mode) ? undefined : await imgUrlToBase64(ESSceneObject.context.getStrFromEnv(basePath + `/${mode}/icon.png`));
    const anchor = excludeAnchor.includes(mode) ? undefined : await imgUrlToBase64(ESSceneObject.context.getStrFromEnv(basePath + `/${mode}/anchor.png`));
    for (let i = 1; i <= (modeTextBoxCount[mode] ?? 3); i++) {
        TempTextBox.push(await imgUrlToBase64(ESSceneObject.context.getStrFromEnv(basePath + `/${mode}/textBox_0${i}.png`)));
    }
    const iconBox = excludeIconBox.includes(mode) ? undefined : await imgUrlToBase64(ESSceneObject.context.getStrFromEnv(basePath + `/${mode}/iconBox.png`));
    const textBox = TempTextBox.filter(item => item != undefined) as ImageBaseInfo[];
    return { icon, anchor, iconBox, textBox };
}
// 创建ESPoi2D中的div面板
export function getESPoi2DDiv(mode: string, contentName: any, textBox: ImageBaseInfo[], iconBox: ImageBaseInfo | undefined, icon: ImageBaseInfo | undefined, anchor: ImageBaseInfo | undefined) {
    const Images = { iconBox, icon, anchor };
    const div = document.createElement("div");
    div.classList.add("czmPoi2dDiv");
    const isTransverseArr = ["SquareH", "CircularH", "Flag", "Linear01"];
    if (isTransverseArr.some((item) => {
        return mode.includes(item)
    })) {
        div.innerHTML = getTransverseDiv(mode, Images, contentName);
    } else {
        div.innerHTML = getVerticalDiv(mode, Images, contentName);
    }
    const { textDiv, height } = createTextDiv(textBox)
    let iconDiv: HTMLImageElement | undefined = undefined;
    if (mode == "Linear03" && icon) {
        iconDiv = document.createElement("img");
        iconDiv.classList.add(`${mode}-icon`);
        iconDiv.src = icon.url;
        iconDiv.style.width = `${icon.width}px`;
        iconDiv.style.height = `${icon.height}px`;
        iconDiv.style.position = "absolute";
        iconDiv.style.top = `2px`;
    }
    const textDivBox = div.querySelector(".textDiv");
    if (textDivBox && textDivBox.nextElementSibling) {
        do {
            const style = textDivBox.nextElementSibling.lastElementChild?.getAttribute('style');
            if (iconDiv) {
                textDivBox.nextElementSibling.insertAdjacentElement('afterbegin', iconDiv)
                textDivBox.nextElementSibling.lastElementChild?.setAttribute("style", style + `;margin-left: ${icon?.width}px;`);
                break;
            }
            if (['Stranger', 'Man', 'Woman'].some((item) => {
                return mode.includes(item)
            })) {
                textDivBox.nextElementSibling.lastElementChild?.setAttribute("style", style + `;margin-left: 50px;`);
                break;
            }
        } while (false);
    };
    if (textDivBox) textDivBox.innerHTML = textDiv;
    const { poi2DCss, poi2DCssObj } = getESPoi2DCss(mode, anchor, iconBox, height);
    return { div, styleObj: poi2DCssObj };
}
// 创建ESPoi2D中的CSS样式
export function getESPoi2DCss(mode: string, _anchor: ImageBaseInfo | undefined, _iconBox: ImageBaseInfo | undefined, height: number) {
    const divHeight = getESPoi2DDivHeight(mode, _anchor, _iconBox);
    const poi2DCssObj = {
        img: `display:inline-block !important;`,
        icon: `top: ${(_iconBox?.height ?? 0) * (mode == "CircularV05" ? 0.4 : 0.5)}px !important;`,
        //太恶心了，不知道为什么bottom和transform用在anchor上面使用html2canvas转换后，布局会乱
        anchor: `top:${_iconBox?.height ? _iconBox.height + (["Diamond02", "Linear01"].includes(mode) ? 0 : (_anchor?.height ?? 0)) : 0}px !important;
                left: calc(50% - ${(_anchor?.width ?? 0) / 2}px)!important;`,
        textBoxTransverseParent: `height:${divHeight}px !important;`,
        textBoxTransverse: `
                            margin-left:${_anchor && !["Flag02", "Linear01", "CircularH02", "CircularH01"].includes(mode)
                ? mode.includes("Flag01")
                    ? -_anchor.width / 2 + 2
                    : _anchor.height
                : (mode == "CircularH01"
                    ? 15
                    : mode == "CircularH02"
                        ? -2
                        : 2)}px !important;
                            line-height: ${mode == "CircularH01"
                ? height + 5
                : mode == "Linear01"
                    ? _iconBox?.height
                    : height}px !important;
                            margin-top:${_anchor && !mode.includes("Flag") && !mode.includes("SquareH") && !mode.includes("Linear01")
                ? _iconBox != undefined
                    ? (_iconBox.height - height) * 0.5 - (mode == "CircularH01"
                        ? 5
                        : 0)
                    : _anchor.height
                : 0}px !important;`,
        textBoxVertical: `height:${height}px !important;
                                    line-height: ${["SquareV01", "SquareV02", "SquareV03"].includes(mode)
                ? height - 5
                : height}px !important;
                                    margin-bottom: ${mode.includes("SquareV")
                ? 8
                : mode == "P3D03"
                    ? 5
                    : mode == "P3D02"
                        ? 24
                        : ["Diamond01", "P3D01"].includes(mode)
                            ? 11
                            : mode.includes("CircularV") || mode.includes("P3D") || ["Diamond02"].includes(mode)
                                ? 15
                                : 0}px !important;`,
        textBoxVerticalBrother: `height: ${divHeight}px !important;`

    }
    const poi2DCss = `
        .czmPoi2dDiv .textDiv img {${poi2DCssObj.img}}
        .czmPoi2dDiv .${mode}-icon {${poi2DCssObj.icon}}
        .czmPoi2dDiv .${mode}-anchor {${poi2DCssObj.anchor}}
        .czmPoi2dDiv > div:has(.${mode}-textBoxTransverse) {${poi2DCssObj.textBoxTransverseParent}}
        .czmPoi2dDiv .${mode}-textBoxTransverse {${poi2DCssObj.textBoxTransverse}}
        .czmPoi2dDiv .${mode}-textBoxVertical {${poi2DCssObj.textBoxVertical}}
        .czmPoi2dDiv .${mode}-textBoxVertical+div {${poi2DCssObj.textBoxVerticalBrother}}
        `;
    return { poi2DCss, poi2DCssObj }
}
export function getESPoi2DDivHeight(mode: string, _anchor: ImageBaseInfo | undefined, _iconBox: ImageBaseInfo | undefined) {
    // 高度是整个图片高度，还要加上边距，边距之前设置的是anchor的50%
    if (_iconBox == undefined) {
        return _anchor?.height;
    } else if (_anchor == undefined) {
        return _iconBox.height;
    } else {
        return _iconBox.height + _anchor.height * (["Diamond02", "Linear01", "Linear02", "Linear03"].includes(mode) ? 1 : 2);
    }
}
// 创建横向标注
export function getTransverseDiv(className: string, Images: any, contentName: any) {
    const { iconBox, icon, anchor } = Images;
    let iconDiv = ``;
    if (iconBox && icon) {
        iconDiv += `<img src="${iconBox.url}" class="${className}-iconBox" style="text-align:center !important"/>
                    <img src="${icon.url}" class="${className}-icon"
                        style="{{icon}} position:absolute !important;
                               top: ${iconBox.height * 0.5}px !important;
                               left: ${iconBox.width * 0.5}px !important;
                               transform: translate(-50%, -50%); !important"
                    />`;
    }
    if (anchor) {
        iconDiv += `<img src="${anchor.url}" class="${className}-anchor" 
                        style="{{anchor}} width:${anchor.width}px !important;
                                height:${anchor.height}px !important;
                                position:absolute !important;"
                    />`
    }
    return `
    <div style="{{textBoxTransverseParent}}
        color: #fff !important;
        display: flex !important;">
            <div style="width: ${iconBox?.width ?? anchor?.width ?? 0}px !important;position: relative !important;">
                ${iconDiv}
            </div>
            <div class="${className}-textBoxTransverse" style="{{textBoxTransverse}}
                    text-align:center !important;
                    position: relative !important;
                    min-width: 100px !important;
                    ">
                <div class="textDiv" style="position:absolute !important;left:0 !important;width:100% !important;z-index:-1 !important;">
                </div>
                <div style = "padding:0 5px !important;">
                    <span style="text-wrap:nowrap !important">
                        ${contentName}
                    </span>
                </div>
            </div>
    </div>`
}
//创建竖向标注
export function getVerticalDiv(className: string, images: any, contentName: any) {
    const { iconBox, icon, anchor } = images;
    let iconDiv = ``;
    if (iconBox != undefined && icon != undefined) {
        iconDiv += `<img src="${iconBox.url}" class="${className}-iconBox" style="width:${iconBox.width}px !important;height:${iconBox.height}px !important;text-align:center !important"/>
                    <img class="${className}-icon" src="${icon.url}"
                        style="{{icon}} width:${icon.width}px !important;
                                height:${icon.height}px !important;
                                position:absolute !important;
                                left: 50% !important;
                                transform: translate(-50%, -50%) !important;"
                    />`;
    }
    if (anchor != undefined) {
        iconDiv += `<img src="${anchor.url}" class="${className}-anchor" 
                        style="{{anchor}} width:${anchor.width}px !important;
                            height:${anchor.height}px !important;
                            position:absolute !important;"
                    />`
    }
    return `
    <div style=" 
        color: #fff !important;
        text-align: center !important;">
            <div class="${className}-textBoxVertical" style="{{textBoxVertical}}
            min-width: 100px !important;
            text-align:center !important;
            position: relative !important;">
                <div class="textDiv" style="position:absolute !important;left:0 !important;width:100% !important;z-index:-1 !important;">
                </div>
                <div style="padding:0 5px !important;">
                    <span style="text-wrap:nowrap !important">
                    ${contentName}
                    </span>
                </div>
            </div>
            <div style="{{textBoxVerticalBrother}} position: relative !important;">
               ${iconDiv}
            </div>
    </div>`
}
// 创建文本框
export function createTextDiv(textBox: ImageBaseInfo[]) {
    let textDiv: string = ``;
    let height = 0;
    let tempWidth = 0;
    // 找到需要固定的宽度总计
    for (let i = 0; i < textBox.length; i += 2) {
        tempWidth += textBox[i].width;
    }
    // 一张图直接拉伸，多张图奇数固定宽度，偶数拉伸宽度
    for (let i = 0; i < textBox.length; i++) {
        if (textBox.length == 1) {
            textDiv += `<img src="${textBox[i].url}" style="{{img}} width: 100% !important;height: ${textBox[i].height}px !important;vertical-align: top !important"/>`
        } else if (i % 2 == 1) {
            textDiv += `<img src="${textBox[i].url}" style="{{img}}
                            width: calc(${100 / Math.floor(textBox.length / 2)}% - ${tempWidth / Math.floor(textBox.length / 2)}px) !important;
                            height: ${textBox[i].height}px !important;
                            vertical-align: top !important"
                        />`
        } else {
            textDiv += `<img src="${textBox[i].url}" style="{{img}} width: ${textBox[i].width}px !important;height: ${textBox[i].height}px !important;vertical-align: top !important"/>`
        }
        height = height > textBox[i].height ? height : textBox[i].height;
    }
    return { textDiv, height };
}
// 替换Poi2D中预留样式
export function replaceStr(template: string, poi2DCssObj: { [xx: string]: any }, noReplace?: boolean) {
    for (let key in poi2DCssObj) {
        const reg = new RegExp("\\{\\{" + key + "\\}\\}", "g")
        template = template.replace(reg, noReplace ? poi2DCssObj[key] : poi2DCssObj[key]);
        // template = template.replace(reg, noReplace ? "" : poi2DCssObj[key]);
    }
    return template;
}
// 每个ESPoi2D类型文本框组成数量
const modeTextBoxCount = {
    "SquareH01": 1,
    "SquareH02": 3,
    "SquareV01": 5,
    "SquareV02": 5,
    "SquareV03": 5,
    "SquareV04": 3,
    "Flag01": 3,
    "Flag02": 3,
    "Linear01": 0,
    "Linear02": 3,
    "Linear03": 3,
    "CircularH01": 3,
    "CircularH02": 3,
    "CircularV01": 1,
    "CircularV02": 3,
    "CircularV03": 3,
    "CircularV04": 3,
    "CircularV05": 2,
    "P3D01": 3,
    "P3D02": 3,
    "P3D03": 1,
    "P3D04": 3,
    "P3D05": 1,
    "P3D06": 1,
    "P3D07": 1,
    "Diamond01": 3,
    "Diamond02": 3
} as { [xx: string]: number }
