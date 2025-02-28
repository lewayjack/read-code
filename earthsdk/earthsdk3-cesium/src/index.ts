import { PositionsEditing } from './CzmObjects';
import extensionESSceneObjectID from './ESCesiumViewer/extensionESSceneObjectID';

import { copyright } from './copyright';
try {
    //@ts-ignore
    window.g_earthsdk_copyright_print = window.g_earthsdk_copyright_print ?? true;
    //@ts-ignore
    window.g_earthsdk_copyright_print && copyright.print();
} catch (error) {
    //打包后不会影响，运行时会报错正常
    console.warn('版本信息输出有误！');
}

export * from './ESCesiumViewer';
export * from './CzmObjects';
export * from './ESObjects';
export * from './utils';
extensionESSceneObjectID()
{//设置此项目的编辑配置
    PositionsEditing.defaultConfig = { // 多点编辑
        "editor": { // 编辑状态的配置
            "showCoordinates": true, // 是否显示坐标架
            "showCircle": true, // 是否显示辅助圈
            "disableX": false, // 是否取消X轴向的平移
            "disableY": false, // 是否取消Y轴向的平移
            "disableXY": false, // 是否取消XY平面上的平移操作
            "disableZ": false, // 是否取消Z轴上的平移操作
            "disableZAxis": false // 是否取消Z轴上的旋转操作，注意是旋转操作
        },
        "picker": { // 拾取状态的配置
            "clickEnabled": true, // 单击拾取点
            "dbClickEnabled": true // 双击拾取点
        },
        "noModifingAfterAdding": false, // 新增结束以后不进入修改状态
        "hideCursorInfo": true, // 关闭鼠标提示
    }
}