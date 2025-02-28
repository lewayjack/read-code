import { ESSceneObject } from "../index";
export function replaceStrWithEnv(str: string) {
    do {
        const newStr = str.replace(/\${(.*?)\}/, (substr, envName) => {
            const value = ESSceneObject.context.getEnv(envName);
            if (value === undefined) {
                console.warn(`环境变量(${envName})不存在，无法进行转换`);
                return '{env-error}';
            } else {
                return value;
            }
        });
        if (newStr === str) {
            break;
        }
        str = newStr;
    } while (true);
    return str;
}
