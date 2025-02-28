
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

export * from './EngineObject';
export * from './ESJTypes';
export * from './ESObjectManager';
export * from './ESObjects';
export * from './ESViewer';
export * from './utils';
// const packageJson = require('../package.json');
// const { version, name } = packageJson;
// console.log(name, version);
