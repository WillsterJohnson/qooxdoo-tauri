/**
 * > *Available as `signal.Signal.create` or `$create`*
 *
 * Create a signal with a given initial value
 *
 * @param value
 * @param options - optional signal configuration
 */
declare function $create<T>(
  value: T,
  options?: import("signal-polyfill").Signal.Options<T>,
): import("signal-polyfill").Signal.State<T>

/**
 * > *Available as `signal.Signal.derive` or `$derive`*
 *
 * Creates a derived signal that updates each time any of the non-ignored
 * referenced signals change
 *
 * @param callback
 * @param options - optional signal configuration
 */
declare function $derive<T>(
  callback: () => T,
  options?: import("signal-polyfill").Signal.Options<T>,
): import("signal-polyfill").Signal.Computed<T>

/**
 * Dispel the $effect rune from which it was returned
 */
declare type $dispel = () => void

/**
 * > *Available as `signal.Signal.effect` or `$effect`*
 *
 * Runs an effect each time any of the non-ignored referenced signals change
 *
 * @param callback - the effect to run. May return a cleanup function, which will be run immediately prior to the next effect run
 */
declare function $effect(callback: () => (() => void) | void): $dispel

/**
 * > *Available as `signal.Signal.ignore` or `$ignore`*
 *
 * Prevents a signal from being subscribed to within an effect or derived
 * signal
 *
 * @param computed
 */
declare function $ignore<T>(computed: import("signal-polyfill").Signal.Computed<T>): T

declare interface $with<T> {
  /**
   * Update the callback with which a $debug rune inspects it's signals
   * @param cb
   */
  with(cb: (...args: T[]) => unknown): $with<T>
}

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
 * @param signals
 */
declare function $debug<T>(...signals: import("signal-polyfill").Signal.Computed<T>[]): $with<T>
