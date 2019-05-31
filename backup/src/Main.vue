<template>
  <div class="container-fluid wrapper">
    <div v-if="isLoading">
      <p>Loading...</p>
    </div>
    <div v-else class="row">
      <div class="iframe-holder">
        <device-frame />
      </div>

      <div class="app-side-view">
        <div class="side-content">
          <div class="dom-tree-wrapper" :class="{ active: isDragging }">
            <div class="header">
              <p>DOM tree</p>
            </div>
            <div class="dom-tree">
              <nested-draggable v-if="treeData" :nodes="treeData" />
            </div>
          </div>

          <div class="side-view">
            <template v-if="mode === 'components'">
              <div class="header">
                <p>Drag & Drop</p>
              </div>
              <div class="draggables-holder">
                <template v-for="(component, index) in components">
                  <div draggable="true" class="component" :data-insert-html="component.template" v-html="component.name" />
                </template>
              </div>
            </template>
            <template v-if="mode === 'dom'">
              <div class="header">
                <p>DOM tree</p>
              </div>
              <div class="dom-tree">
                <nested-draggable v-if="treeData" :nodes="treeData" />
              </div>
            </template>
          </div>
        </div>

        <div class="side-nav">
          <div :class="{ active: mode === 'components' }" @click="changeMode('components')">
            <i class="fa fa-square-o"></i>
          </div>
          <div :class="{ active: mode === 'dom' }" @click="changeMode('dom')">
            <i class="fa fa-align-left"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { state, setDomTree } from './store'
import DeviceFrame from './components/DeviceFrame'
import NestedDraggable from './components/NestedDraggable'
import DragDropFunctions from './libs/drag-drop'
import bus from './libs/bus'

export default {
  data() {
    return {
      state,
      isLoading: false,
      mode: 'components',
      isDragging: false,
      components: [
        {
          name: 'T',
          template: '<p data-fl-widget-instance data-name="Paragraph">Donec sed odio dui.</p>'
        },
        {
          name: 'H<sub>1</sub>',
          template: '<h1 data-fl-widget-instance data-name="Heading 1">Heading 1</h1>'
        },
        {
          name: 'H<sub>2</sub>',
          template: '<h2 data-fl-widget-instance data-name="Heading 2">Heading 2/h2>'
        },
        {
          name: 'H<sub>3</sub>',
          template: '<h3 data-fl-widget-instance data-name="Heading 3">Heading 3</h3>'
        }
      ],
      dragoverqueue_processtimer: undefined
    }
  },
  components: {
    NestedDraggable,
    DeviceFrame
  },
  computed: {
    treeData() {
      return state.domTree || []
    }
  },
  methods: {
    addHandlers() {
      // Drag start event
      $(document).on('dragstart', '.draggables-holder .component', (event) => {
        // console.log('Drag Started')
        this.dragoverqueue_processtimer = setInterval(() => {
          DragDropFunctions.processDragOverQueue()
        }, 100)

        const insertingHTML = $(event.target).attr('data-insert-html')
        event.originalEvent.dataTransfer.setData('Text', insertingHTML)

        bus.$emit('dragging-component', true)
      })

      // Drag end event
      $(document).on('dragend', '.draggables-holder .component', () => {
        // console.log('Drag End')
        clearInterval(this.dragoverqueue_processtimer)
        DragDropFunctions.removePlaceholder()
        DragDropFunctions.clearContainerContext()

        // Get iframe Node tree and process it
        if (state.iframeContentWindow) {
          DragDropFunctions.processNodeTree(state.iframeContentWindow.document.body)
            .then((dom) => {
              return DragDropFunctions.getBodyChildrenOnly(dom)
            })
            .then((results) => {
              setDomTree(results)
            })
            .catch((error) => {
              console.warn(error)
            })
        }

        bus.$emit('dragging-component', false)
        bus.$emit('stopped-hovering-element')
      })

      // $(document).on('dragenter', '.draggable-item', (event) => {
      //   let elementId
      //   if ($(event.currentTarget).hasClass('draggable-item')) {
      //     elementId = $(event.currentTarget).data('el-id')

      //     if (this.treeData && this.treeData.length) {
      //       let foundItem
      //       this.treeData.some((node) => {
      //         foundItem = this.findElementById(elementId, node)
      //         return foundItem
      //       })

      //       if (foundItem) {
      //         console.log('ITEM FOUND', foundItem)
      //       }
      //     }
      //   }
      // })
    },
    changeMode(mode) {
      this.mode = mode
    },
    toggleDragging(value) {
      this.isDragging = value
    },
    findElementById(id, currentNode) {
      if (id == currentNode.elementId) {
        return currentNode
      }

      if (currentNode.children && currentNode.children.length) {
        for (var i = 0; i < currentNode.children.length; i++) {
          this.findElementById(id, currentNode.children[i])
        }
      }

      return
    }
  },
  created() {
    this.addHandlers()
    bus.$on('dragging-component', this.toggleDragging)
  },
  destroyed() {
    bus.$off('dragging-component', this.toggleDragging)
  }
}
</script>