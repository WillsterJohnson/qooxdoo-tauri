const { Signal } = require("signal-polyfill")

/**
 * @ignore(queueMicrotask)
 * @ignore(globalThis)
 */

/**
 * Static helper class for creating and deriving signals and running effects
 * as they update.
 *
 * For a better developer experience, the key members of this class are aliased
 * globally as 'runes'; favorably named for the apparent magic of signals.
 * ```js
 * $create // signal.Signal.create
 * $derive // signal.Signal.derive
 * $effect // signal.Signal.effect
 * $ignore // signal.Signal.ignore
 * $debug  // signal.Signal.debug
 * ```
 */
qx.Class.define("signal.Signal", {
  defer() {
    globalThis.$create = signal.Signal.create
    globalThis.$derive = signal.Signal.derive
    globalThis.$effect = signal.Signal.effect
    globalThis.$ignore = signal.Signal.ignore
    globalThis.$debug = signal.Signal.debug
  },

  statics: {
    /**
     * > *Available as `signal.Signal.create` or `$create`*
     *
     * Create a signal with a given initial value
     *
     * @template T
     * @param {T} value
     * @param {Signal.Options<T>} [options] - optional signal configuration
     * @returns {Signal.State<T>}
     */
    create(value, options) {
      return new Signal.State(value, options)
    },

    /**
     * > *Available as `signal.Signal.derive` or `$derive`*
     *
     * Creates a derived signal that updates each time any of the non-ignored
     * referenced signals change
     *
     * @template T
     * @param {() => T} callback
     * @param {Signal.Options<T>} [options] - optional signal configuration
     * @returns {Signal.Computed<T>}
     */
    derive(callback, options) {
      return new Signal.Computed(callback, options)
    },

    /**
     * > *Available as `signal.Signal.effect` or `$effect`*
     *
     * Runs an effect each time any of the non-ignored referenced signals change
     *
     * @param {() => (() => void) | void} callback - - the effect to run. May return a cleanup function, which will be run immediately prior to the next effect run
     * @returns {$dispel}
     */
    effect(callback) {
      let needsEnqueue = true
      let watcher = new Signal.subtle.Watcher(() => {
        if (needsEnqueue) {
          needsEnqueue = false
          queueMicrotask(() => {
            needsEnqueue = true
            for (const signal of watcher.getPending()) {
              signal.get()
            }
            watcher.watch()
          })
        }
      })
      let cleanup

      const computed = new Signal.Computed(() => {
        if (typeof cleanup === "function") {
          cleanup()
        }
        cleanup = callback()
      })

      watcher.watch(computed)
      if (signal.Signal.promiseBeforeEffect) {
        signal.Signal.promiseBeforeEffect.then(() => computed.get())
      } else {
        computed.get()
      }

      return () => {
        watcher.unwatch(computed)
        if (typeof cleanup === "function") {
          cleanup()
        }
      }
    },

    /**
     * > *Available as `signal.Signal.ignore` or `$ignore`*
     *
     * Prevents a signal from being subscribed to within an effect or derived
     * signal
     *
     * @template T
     * @param {Signal.Computed<T>} computed
     * @returns {T}
     */
    ignore(computed) {
      return Signal.subtle.untrack(() => computed.get())
    },

    /**
     * > *Available as `signal.Signal.debug` or `$debug`*
     *
     * Inspects the value of all signals passed in every time any of the
     * non-ignored referenced signals change.
     *
     * By default, inspection occurs by logging the values to the console. This
     * may be changed by calling the `with` method of the returned object.
     *
     * This method is only functional in debug mode, but will execute safely
     * in production.
     *
     * @template T
     * @param {Signal.Computed<T>[]} signals
     * @returns {$with<T>}
     */
    debug(...signals) {
      let callback = (...args) => console.log(...args)
      if (qx.core.Environment.get("qx.debug")) {
        signal.Signal.effect(() => callback(...signals.map(signal => signal.get())))
      }
      return {
        with(cb) {
          callback = cb
          return this
        },
      }
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                              Private Jargon                             */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    /**
     * Internal helper for compatibility with {@link signal.MQxObjectSignal}
     * @type {Promise<void>}
     */
    promiseBeforeEffect: null,

    /**
     * Processes all pending signals
     * @param {Signal.subtle.Watcher} watcher
     * @returns {void}
     */
    __processPending(watcher) {
      signal.Signal.__needsEnqueue = true

      for (const signal of watcher.getPending()) {
        signal.get()
      }

      watcher.watch()
    },
  },
})
