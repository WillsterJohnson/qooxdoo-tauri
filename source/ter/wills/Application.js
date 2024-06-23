qx.Class.define("ter.wills.Application", {
  extend: qx.html.Root,
  implement: [qx.application.IApplication],

  construct() {
    super(document.body)
  },

  objects: {
    $count() {
      const $count = $create(0)

      $effect(() => this.$.count && this.$.count % 10 === 0 && alert("You clicked 10 times!"))

      return $count
    },

    button() {
      const button = <jsx.Component render={() => <button>Count: {this.$.count}</button>} />

      button.addListener("click", () => (this.$.count += 1))

      this.add(button)

      return button
    },
  },

  members: {
    main() {
      $effect(() => console.log("initial count", this.$ignore.count))
      this.getQxObject("button")
      this.add(new ter.wills.calculator.Equation())

      this.add(
        <jsx.Component
          render={() => (
            <>
              <p>foo</p>
              <jsx.Component render={() => <p>foo</p>} />
            </>
          )}
          styles={
            /*css*/ `
              p {
                color: red;
              }
            `
          }
        />,
      )
    },

    finalize() {},

    close() {},

    terminate() {},
  },

  defer() {
    qx.Class.patch(qx.core.Object, signal.MQxObjectSignal)
  },
})
