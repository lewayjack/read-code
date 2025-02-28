export function getDefaultValue<T>(value: T | (() => T)) {
    if (value instanceof Function) {
        return value();
    } else {
        return value;
    }
}