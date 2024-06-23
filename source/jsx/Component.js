/**
 * Creates a component which re-renders itself when any of the signals it
 * depends on change.
 *
 * Recommended to install a css language highlighter (e.g. Tobermory.es6-string-html)
 * for a better experience passing styles.
 * ```js
 * new jsx.Component(() => {...}, /*css* /`p { color: red; }`)
 * ```
 */
qx.Class.define("jsx.Component", {
  extend: qx.html.Element,

  /**
   * @param {object} [config] - the configuration of this component
   * @param {() => qx.html.Element|qx.html.Element[]} [config.render] - a function that returns the root(s) of this component
   * @param {string} [config.styles] - a string of css styles to apply to the elements within this component. To prevent styles from bleeding into child components, all styles are scoped to effect only the elements created within the render function, and any non-component elements that are added as (X-grand)children of this component.
   */
  construct(config={}) {
    super("div", { display: "contents" }, { class: this.__classname() })

    this.$.render = config.render
    this.$.styles = config.styles

    $effect(() => {
      if (!this.$.render) {
        return
      }
      if (!this.getChildren()) {
        let newRoots = this.__newRoots()
        for (let newRoot of newRoots) {
          this.add(newRoot)
        }
      } else {
        this.__minimalRender()
      }
    })

    this.getQxObject("styleElem")
  },

  objects: {
    $render() {
      let $ = $create(null)
      $effect(() => (this.$.render ??= null), false)
      return $
    },
    $styles() {
      let $ = $create("")
      $effect(() => (this.$.render ??= ""), false)
      return $
    },

    styleElem() {
      let styleElem = <style></style>
      document.head.appendChild(styleElem.getDomElement(true))
      $effect(() => {
        styleElem.getDomElement(true).innerHTML = `
          @scope (.${this.__classname()})
            to ([class^="${jsx.Component.__prefix}-"]) {
            ${this.$.styles}
          }
        `
      })
      return styleElem
    },
  },

  members: {
    __classname() {
      return `${jsx.Component.__prefix}-${this.toUuid()}`
    },

    __newRoots() {
      let newRoots = this.$.render()
      if (newRoots instanceof qx.data.Array) {
        newRoots = newRoots.toArray()
      }
      if (!Array.isArray(newRoots)) {
        newRoots = [newRoots]
      }
      return newRoots
    },

    __minimalRender() {
      this.__traverseReplaceIfChanged(
        this,
        <div class={this.__classname()} style="display: contents;">
          {this.__newRoots()}
        </div>,
      )
    },

    __traverseReplaceIfChanged(oldRoot, newRoot) {
      // compare the roots
      let oldSerialized = oldRoot.serialize()
      let newSerialized = newRoot.serialize()
      if (JSON.stringify(oldSerialized) === JSON.stringify(newSerialized)) {
        return
      }
      // if both are instance of qx.html.Text, compare the text
      if (oldRoot instanceof qx.html.Text && newRoot instanceof qx.html.Text) {
        if (oldRoot.getText() !== newRoot.getText()) {
          oldRoot.setText(newRoot.getText())
        }
        return
      }
      // compare the children count
      let oldChildren = oldRoot.getChildren() ?? []
      let newChildren = newRoot.getChildren() ?? []
      if (oldChildren.length !== newChildren.length) {
        oldRoot.removeAll()
        newChildren.forEach(child => oldRoot.add(child))
        return
      }
      // if no children, compare the attributes
      if (oldChildren.length === 0) {
        let oldAttributes = oldRoot.getAttributes()
        let newAttributes = newRoot.getAttributes()
        for (let key in newAttributes) {
          if (oldAttributes[key] !== newAttributes[key]) {
            oldRoot.setAttribute(key, newAttributes[key])
          }
        }
        for (let key in oldAttributes) {
          if (!(key in newAttributes)) {
            oldRoot.removeAttribute(key)
          }
        }
        return
      }
      // recurse into each pair of children
      for (let i = 0; i < oldChildren.length; i++) {
        let oldChild = oldChildren[i]
        let newChild = newChildren[i]
        // if both are instance of jsx.Component, take no action
        if (oldChild instanceof jsx.Component && newChild instanceof jsx.Component) {
          continue
        }
        // if only one is an instance of jsx.Component, old with new
        if (oldChild instanceof jsx.Component || newChild instanceof jsx.Component) {
          oldRoot.removeAt(i)
          oldRoot.addAt(newChild, i)
          continue
        }
        this.__traverseReplaceIfChanged(oldChild, newChild)
      }
    },
  },

  statics: {
    __prefix: "jsx_component_prefix",
  },
})
