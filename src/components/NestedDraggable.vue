<template>
  <draggable
    class="dragArea"
    :list="nodes"
    tag="ul"
    v-bind="dragOptions"
    @start="onStart"
    @end="onEnd"
    :move="onMove"
  >
    <li
      v-for="(el, index) in nodes"
      v-if="el.nodeName && el.nodeName !== '#text' && el.nodeName !== '#comment'"
      :key="index"
      :class="{ 'no-children': !el.hasChildren(el), 'closed': !el.open, 'open': el.open }"
      :data-el-id="el.elementId"
      class="draggable-item"
    >
      <p
        class="draggable-title"
        @mousedown="scrollToEl(el)"
        @mouseover="mouseOver($event, el)"
        @mouseleave="mouseLeave($event, el)"
      >
        <i 
          v-if="el.hasChildren(el)"
          @click="toggleOpen(el)"
          class="fa" :class="{
            'fa-minus': el.open,
            'fa-plus': !el.open
          }"
        ></i>
        {{ el.nodeName }}
        <i
          class="fa fa-trash-o"
          @click="removeAt(el)"
        ></i>
      </p>
      <nested-draggable
        v-if="childrenVisible(el)"
        :nodes="el.children"
      />
    </li>
  </draggable>
</template>

<script>
import { state } from '../store'
import draggable from 'vuedraggable'
import DragDropFunctions from '../libs/drag-drop'
import bus from '../libs/bus'

export default {
  props: {
    nodes: {
      type: Array
    }
  },
  components: {
    draggable
  },
  name: 'nested-draggable',
  data() {
    return {
      state,
      drag: false,
      overElement: undefined,
      dragOptions: {
        draggable: '.draggable-item',
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 1,
        group: {
          name: 'nested'
        },
        ghostClass: "ghost",
        direction: 'vertical',
        pullMode: true
      }
    }
  },
  methods: {
    childrenVisible(el) {
      return el.open
    },
    scrollWindow() {
      const win = $(state.iframe).get(0).contentWindow
      const rect = this.overElement.getBoundingClientRect()
      const windowHeight = win.innerHeight
      const elHeight = rect.height
      const elOffset = rect.top
      let offset

      if (elHeight < windowHeight) {
        offset = (elOffset + win.scrollY) - ((windowHeight / 2) - (elHeight / 2))
      } else {
        offset = elOffset + win.scrollY
      }

      win.scroll({
        top: offset,
        behavior: 'smooth'
      })
    },
    scrollToEl(el) {
      this.overElement = el.node
      this.scrollWindow()
    },
    toggleOpen(element) {
      element.open = !element.open
    },
    recursiveDelete(id, currentNode) {
      let currentChild
      let result

      if (id == currentNode.elementId) {
        return currentNode
      } else {
        if (currentNode.children && currentNode.children.length) {
          for (let i = 0; i < currentNode.children.length; i ++) {
            currentChild = currentNode.children[i]

            // Search in the current child
            result = this.recursiveDelete(id, currentChild)

            // Remove if the node has been found
            if (result !== false) {
              return currentNode.children.splice(i, 1)
            }
          }
        }

        // The node has not been found and we have no more options
        return false
      }
    },
    recursiveReconstruction(element) {
      let newElement

      // Create new nodes
      if (element.nodeName === '#text') {
        newElement = document.createTextNode(element.content)
      } else if (element.nodeName === '#comment') {
        newElement = document.createComment(element.content)
      } else {
        newElement = document.createElement(element.nodeName)
      }

      // Set attributes
      if (element.attributes && element.attributes.length) {
        for (var j = 0; j < element.attributes.length; j++) {
          newElement.setAttribute(element.attributes[j].name, element.attributes[j].value)
        }
      }

      // Check if element has children
      if (element.children && element.children.length) {
        for (var j = 0; j < element.children.length; j++) {
          // If it has run the function again with the child element
          newElement.appendChild(this.recursiveReconstruction(element.children[j]))
        }
      } else if (element.nodeName !== '#text' && element.nodeName !== '#comment') {
        // If it doesn't have children and it's not one of these 2 node types
        newElement.innerHTML = element.content
      }

      // Saves new node reference
      element.node = newElement
      return newElement
    },
    renderPreview() {
      const body = $(state.iframe).get(0).contentWindow.document.body
      // Reconstruct the DOM to then be appended to BODY
      body.innerHTML = ''
      state.domTree.forEach((el) => {
        const element = this.recursiveReconstruction(el)
        body.appendChild(element)
      })
    },
    removeAt(el) {
      let foundItem

      this.nodes.forEach((node, index) => {
        foundItem = this.recursiveDelete(el.elementId, node)
        if (foundItem) {
          this.nodes.splice(index, 1)
        }
      })

      this.onEnd()
    },
    renderHighlight(element, toHighlight, hideLine) {
      const el = element || this.overElement
      if (el) {
        // Get element being dragged
        const $currentElement = $(el)
        const elementRectangle = el.getBoundingClientRect()
        const mousePosition = {
          x: elementRectangle.x,
          y: elementRectangle.y
        }

        // Show highlight line in the iframe
        DragDropFunctions.orchestrateDragDrop($currentElement, elementRectangle, mousePosition, toHighlight, hideLine)
      }
    },
    removeHighlight() {
      DragDropFunctions.clearContainerContext()
    },
    mouseOver(event, element) {
      this.overElement = element.node
      if (!this.drag) {
        this.renderHighlight(this.overElement, true, false)
      }
    },
    mouseLeave() {
      if (!this.drag) {
        this.removeHighlight()
      }
    },
    onStart() {
      this.drag = true
      this.renderHighlight(this.overElement, false, true)
    },
    onEnd(event) {
      this.drag = false
      this.renderPreview()
      this.overElement = undefined
    },
    onMove(event) {
      if (event.draggedContext.element) {
        this.renderHighlight(event.draggedContext.element.node, false, true)
      }
    },
    findByElement(node, element) {
      if (node.node == element) {
        return node
      }

      if (node.children && node.children.length) {
        for (var i = 0; i < node.children.length; i++) {
          this.findByElement(node.children[i])
        }
      }

      return
    },
    highlightElement(element, scroll, inPanel) {
      let found
      if (this.nodes && this.nodes.length) {
        this.nodes.forEach((node) => {
          found = this.findByElement(node, element)

          if (found) {
            $('.dragArea li').removeClass('active')
            $('[data-el-id="' + found.elementId + '"]').addClass('active')

            if (scroll) {
              this.scrollTree(found.elementId, inPanel)
            }
          }
        })
      }
    },
    scrollTree(elementId, inPanel) {
      let win
      let scrollableArea
      let element

      if (inPanel) {
        element = $('.dom-tree-wrapper [data-el-id="' + elementId + '"] .draggable-title')[0]
        win = $('.dom-tree-wrapper .dom-tree')[0]
        scrollableArea = $('.dom-tree-wrapper .dom-tree')
      } else {
        element = $('.side-view [data-el-id="' + elementId + '"] .draggable-title')[0]
        win = $('.side-view .dom-tree')[0]
        scrollableArea = $('.side-view .dom-tree')
      }

      const rect = element.getBoundingClientRect()
      const windowHeight = scrollableArea.outerHeight()
      const elHeight = rect.height
      const elOffset = rect.top
      let offset

      if (elHeight < windowHeight) {
        offset = ((elOffset - 55) + scrollableArea.scrollTop()) - ((windowHeight / 2) - (elHeight / 2))
      } else {
        offset = (elOffset - 55) + scrollableArea.scrollTop()
      }

      win.scroll({
        top: offset,
        behavior: 'smooth'
      })
    }
  },
  mounted() {
    bus.$on('hovering-element', this.highlightElement)
    bus.$on('stopped-hovering-element', () => {
      $('.dragArea li').removeClass('active')
    })
  },
  destroyed() {
    bus.$off('hovering-element', this.highlightElement)
    bus.$off('stopped-hovering-element', () => {
      $('.dragArea li').removeClass('active')
    })
  }
}
</script>