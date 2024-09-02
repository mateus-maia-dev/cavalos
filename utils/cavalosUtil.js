/**
 * Sleep em milisegundos
 * @param {Int} ms milisegundos
 */
exports.msleep = function (ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}