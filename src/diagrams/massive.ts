const count = 1000000;
export const GetNodes = function () {
    let x = 0, y = 0, z = 0;
    const iterable = (function* () {
        for (let i = 0; i < count; i++) {
            yield x - 50;
            yield y - 50;
            yield z - 50;
            x++;
            if (x > 99) {
                x = 0; y++;
                if (y > 99) {
                    y = 0; z++;
                }
            }
        }
    })();
    const nodes = new Float32Array(iterable);
    console.log(nodes.length);
    return nodes;
}
export const GetLinks = function () {
    const links = new Uint32Array([

    ]);

    return links;
}
export const GetNodeColors = function () {
    let r = 1, g = 0, b = 0, t;
    const iterable = (function* () {
        for (let i = 0; i < count; i++) {
            yield r;
            yield g;
            yield b;
            t = g;
            g = r;
            r = b;
            b = t;
        }
    })();
    const colors = new Float32Array(iterable);
    console.log(colors.length);
    return colors;
}