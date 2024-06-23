qx.Class.define("ter.wills.calculator.Equation", {
  extend: jsx.Component,

  construct() {
    super()

    this.$.render = () => (
      <>
        <p>
          A = &pi;
          <input
            type="number"
            placeholder="r"
            value={this.$.radius}
            onInput={e => (this.$.radius = e.getData())}
          />
          <sup>2</sup>
        </p>
        <p>A = {this.$.area}</p>
      </>
    )
    this.$.styles = /*css*/ `
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input {
          -moz-appearance: textfield;
          max-width: 6ch;
        }
      `
  },

  objects: {
    $radius() {
      let $ = $create(0)
      $effect(() => (this.$.radius = parseFloat(this.$.radius)))
      $effect(() => isNaN(this.$.radius) && (this.$.radius = 0))
      return $
    },
    $area() {
      let $ = $derive(() => Math.PI * this.$.radius ** 2)
      return $
    },
  },
})
