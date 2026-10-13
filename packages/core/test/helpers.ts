/**
 * jsdom 未实现 SVGElement#transform（baseVal），d3-interpolate 解析 transform 过渡即崩。
 * 补一个只支持 translate(x,y) 的最小 consolidate（本仓库 transform 均为该形式），
 * 让位移过渡在 jsdom 里真实运行；仅影响当前 jsdom 实例。
 * 分隔符 [, ]+ 兼容两种格式：chart 直写的逗号分隔与 d3-interpolate 写回的「逗号+空格」
 * （上一过渡的输出会成为下一过渡的输入，单字符匹配会在链式过渡时静默回退原点）。
 */
export function polyfillSvgTransform(): void {
  if ('transform' in SVGElement.prototype) return
  Object.defineProperty(SVGElement.prototype, 'transform', {
    configurable: true,
    get() {
      return {
        baseVal: {
          consolidate: () => {
            const m = /translate\(([-\d.eE+]+)[, ]+([-\d.eE+]+)\)/.exec(
              this.getAttribute('transform') ?? '',
            )
            const [, xs, ys] = m ?? []
            return { matrix: { a: 1, b: 0, c: 0, d: 1, e: Number(xs ?? 0), f: Number(ys ?? 0) } }
          },
        },
      }
    },
  })
}
