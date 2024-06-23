/**
 * Provides the `$` and `$ignore` properties which can be used to access signals
 * as subproperties by name.
 *
 * Note: it is recommended to patch this mixin onto a common base class for the
 * majority of your classes to avoid hunting down broken `this.$.*` references.
 *
 * ```js
 * qx.Class.define("com.example.Application", {
 * ...
 *   defer() {
 *     qx.Class.patch(qx.core.Object, signal.MQxObjectSignal)
 *   }
 * ...
 * })
 * ```
 *
 * A 'signal' in this context is defined as an qxObject who's name starts with a
 * `$` character.
 *
 * ```js
 * this.$.count       // this.getQxObject("$count").get()
 * this.$.count = 5   // this.getQxObject("$count").set(5)
 * this.$ignore.count // $ignore(this.getQxObject("$count").get())
 * ```
 */
qx.Mixin.define("signal.MQxObjectSignal", {
  construct() {
    const thiz = this
    this.__cache = {}
    this.__createQxObjectPromise = {}
    this.$ = new Proxy(this.__cache, {
      get(target, key) {
        if ({}[key]) {
          return target[key]
        }
        thiz.__ensureSignal(key)
        return target[key].get()
      },
      set(target, key, value) {
        thiz.__ensureSignal(key)
        target[key].set(value)
        return true
      },
    })
    this.$ignore = new Proxy(this.__cache, {
      get(target, key) {
        if ({}[key]) {
          return target[key]
        }
        thiz.__ensureSignal(key)
        return $ignore(target[key])
      },
    })
  },

  members: {
    /**
     * A proxy for accessing signals.
     *
     * A 'signal' in this context is defined as an qxObject who's name starts
     * with a `$` character.
     *
     * ```js
     * this.$.count       // this.getQxObject("$count").get()
     * this.$.count = 5   // this.getQxObject("$count").set(5)
     * ```
     *
     * @type {Record<string, { value: any }>}
     */
    $: {},

    /**
     * A proxy for accessing signals within an effect without binding the effect
     * to the signal.
     *
     * A 'signal' in this context is defined as an qxObject who's name starts
     * with a `$` character.
     *
     * ```js
     * this.$ignore.count // $ignore(this.getQxObject("$count").get())
     * ```
     *
     * @type {Record<string, { value: any }>}
     */
    $ignore: {},

    /**
     * A local cache of all signals
     * @type {Record<string, { value: any }>}
     */
    __cache: {},

    __ensureSignal(key) {
      if (typeof key === "symbol") {
        throw new Error("Symbol keys are not supported")
      }
      let resolve
      let lastPromiseBeforeEffect = signal.Signal.promiseBeforeEffect
      signal.Signal.promiseBeforeEffect = new Promise(r => (resolve = r))
      this.__cache[key] ??= this.getQxObject("$" + key)
      resolve()
      signal.Signal.promiseBeforeEffect = lastPromiseBeforeEffect
    },

    __createQxObjectPromise: null,

    _createQxObject(id) {
      var result = this._createQxObjectImpl(id)
      if (result !== undefined) {
        this.addOwnedQxObject(result, id)
      }
      return result
    },
  },
})
