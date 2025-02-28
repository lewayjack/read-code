export function createInnerHtmlWithWhiteTextBlackBackground(text: string, height: number = 48) {
    const lines = text.split('\n');
    const lineHtmlStrs = lines.map(e => {
        return `
        <div style="height: 24px; line-height: 24px">
            ${e}
        </div>
        `
    });

    return `
        <div style="
            background: rgba(0, 0, 0, 0.6);
            color: white;
            border-radius: 5px;
            padding: 0 10px 0 10px;
            font-size: 14px;
            white-space: nowrap;
            pointer-events: all;
        ">
            ${lineHtmlStrs.join(' ')}
        </div>
        <div style="
            height: ${height}px;
            width: 2px;
            background: rgba(0, 0, 0, 0.6);
            margin: auto;
        ">
        </div>
    `
}