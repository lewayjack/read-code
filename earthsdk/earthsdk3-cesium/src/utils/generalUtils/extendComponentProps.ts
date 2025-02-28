export function extendComponentProps<T extends { [k: string]: {
    defaultValue: any;
    componentName: string;
    originPropName?: string;
} }>(owner: Object, componentProps: T) {
    for (let [propName, { defaultValue, componentName, originPropName = propName }] of Object.entries(componentProps)) {
        if (!Reflect.has(owner, propName)) {
            Object.defineProperties(owner, {
                [propName]: {
                    get() {
                        return this[componentName][originPropName];
                    },
                    set(value: typeof defaultValue) {
                        this[componentName][originPropName] = value;
                    },
                },
                [`${propName}Changed`]: {
                    get() {
                        return this[componentName][`${originPropName}Changed`];
                    }
                }
            });
        } else {
            console.error(`Prop(${propName}) conflicts!`);
        }
    }
}

export function getDefaultComponentProps<T extends { [k: string]: { defaultValue: any, componentName: string, originPropName?: string} }>(componentConfigs: T) {
    const props = {} as { [k in keyof T]: T[k]['defaultValue'] };
    for (let [k, { defaultValue }] of Object.entries(componentConfigs)) {
        // @ts-ignore
        props[k] = defaultValue;
    };
    return props;
}