export function getFuncFromStr<T extends Function>(funcStr: string, args?: string[]) {
    const rawFuncStr = funcStr.trim();
    if (!rawFuncStr) return undefined;

    // 这种方式会导致函数中有//的字符串，会被删掉。。
    //         let finalFuncStr = rawFuncStr.replace(/\/\*[\s\S]*?\*\//g, '');
    //         finalFuncStr = finalFuncStr.replace(/\/\/.*/g, '');
    //         finalFuncStr = finalFuncStr.trim();
    //         if (!finalFuncStr.startsWith('function')) {
    //             finalFuncStr = `\
    // function (${(args ?? []).join(', ')}) { 
    // ${finalFuncStr};
    // }\
    //             `;
    //         }


    try {
        const firstTryFunc = Function('"use strict";return (' + rawFuncStr + ')')();
        if (typeof firstTryFunc === 'function') return firstTryFunc as T;
    } catch (error) {
        console.info(`firstTryFunc get error! ${error}`);
    }

    try {
        const secondFuncStr = `\
function (${(args ?? []).join(', ')}) { 
${rawFuncStr};
}`;
        const secondTryFunc = Function('"use strict";return (' + secondFuncStr + ')')();
        if (typeof secondTryFunc === 'function') return secondTryFunc as T;
        return undefined;
    } catch (error) {
        console.error(`optionStr get error! ${error}`);
        return undefined;
    }
}
