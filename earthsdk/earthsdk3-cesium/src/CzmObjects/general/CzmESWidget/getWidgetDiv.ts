import { ESWidget } from "earthsdk3";

// 创建ESWidget中div面板
export function getWidgetDiv(sceneObject: ESWidget, InfoItemRowBackGround: any, InfoBackGround: any) {
    const div = document.createElement('div');
    let title = undefined as undefined | string;
    let bodyDiv = ``;
    const infoKeys = Object.keys(sceneObject.info)
    for (let i = 0; i < infoKeys.length; i++) {
        if (infoKeys[i].toLowerCase() == 'title') {
            title = sceneObject.info[infoKeys[i]];
            continue;
        }
        bodyDiv += `<div style="
                display: flex;
                font-size: 10px;
                width: 100%;">
                    <div style="flex:1;position: relative;">
                        <img src="${InfoItemRowBackGround.url}" style="width:100%;height:100%;position:absolute;z-index:-1"/>
                        <span style="
                        display: inline-block;
                        box-sizing: border-box;
                        width: 100%;
                        padding: 5px;
                        ">${infoKeys[i]}</span>
                    </div>
                    <div style="flex:1;position: relative;">
                        <img src="${InfoItemRowBackGround.url}" style="width:100%;height:100%;position:absolute;z-index:-1"/>
                        <span style="
                        display: inline-block;
                        box-sizing: border-box;
                        width: 100%;
                        padding: 5px;
                        ">${sceneObject.info[infoKeys[i]]}</span>
                    </div>
                </div>`
    }
    div.innerHTML = `<div class="info" style=" 
            color: #fff;
            position: relative;
            box-sizing: border-box;
            width: ${InfoBackGround.width}px;
            height: ${InfoBackGround.height}px;
            background-repeat: round;
            background-size: cover;">
                <img src="${InfoBackGround.url}" style="width:100%;height:100%;position:absolute;z-index:-1"/>
                <div style="padding: 10px;height: 100%;width: 100%;box-sizing: border-box;">
                    <div class="top" style="
                    text-align: center;
                    font-size: 16px;
                    height: 30px;">
                        <span>${title}</span>
                    </div>
                    <div class="body" style="
                    overflow-y: auto;
                    height: calc(100% - 30px);">
                        ${bodyDiv}
                    </div>
                </div>
            </div>`;
    let styleNode = document.createElement("style");
    styleNode.setAttribute("type", "text/css");
    styleNode.innerHTML = style;
    div.appendChild(styleNode);
    return div;
}
// 滚动条样式
const style = `
        /*定义滚动条高宽及背景
        高宽分别对应横竖滚动条的尺寸*/
        .info ::-webkit-scrollbar,.body ::-webkit-scrollbar {
            width: 5px;
            height:5px;
            background-color: #F5F5F5;
            border-radius: 8px;
        }
    
        /*定义滚动条轨道
        内阴影+圆角*/
        .info ::-webkit-scrollbar-track,.body ::-webkit-scrollbar-track{
            -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            background-color: #F5F5F5;
        }
    
        /*定义滑块
        内阴影+圆角*/
        .info ::-webkit-scrollbar-thumb,.body ::-webkit-scrollbar-thumb{
            border-radius: 8px;
            -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .3);
            background-color: green;
        }`;
