<template>
  <div class="device-container">
    <div class="device mobile ios">
      <div class="frame">
        <iframe id="clientframe" src="/frame.html" frameborder="0" ref="iframe"></iframe>
      </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery'
import { state, setDomTree, setIframe, setIframeContentWindow } from '../store'
import DragDropFunctions from '../libs/drag-drop'
import { getInsertionCSS } from '../libs/insert-styles'
import bus from '../libs/bus'

export default {
  data() {
    return {
      state,
      clientFrameWindow: undefined,
      currentElement: undefined,
      currentElementChangeFlag: undefined,
      elementRectangle: undefined,
      countdown: undefined
    }
  },
  methods: {
    addHandlers() {
      // iFrame loaded event
      $(this.$refs.iframe).on('load', () => {
        // Get iframe content
        this.clientFrameWindow = this.$refs.iframe.contentWindow
        setIframeContentWindow(this.clientFrameWindow)

        // Get iframe Node tree and process it
        DragDropFunctions.processNodeTree(this.clientFrameWindow.document.body)
          .then((dom) => {
            return DragDropFunctions.getBodyChildrenOnly(dom)
          })
          .then((results) => {
            setDomTree(results)
          })
          .catch((error) => {
            console.warn(error)
          })

        //Add CSS File to iFrame
        const style = $('<style data-reserved-styletag></style>').html(getInsertionCSS())
        $(this.clientFrameWindow.document.head).append(style)

        const htmlBody = $(this.clientFrameWindow.document).find('body,html')
        htmlBody.find('*').addBack().on('dragenter', (event) => {
          event.stopPropagation()
          this.currentElement = $(event.target)
          this.currentElementChangeFlag = true
          this.elementRectangle = event.target.getBoundingClientRect()
          this.countdown = 1
        }).on('dragover', (event) => {
          event.preventDefault()
          event.stopPropagation()
          if (this.countdown % 15 != 0 && this.currentElementChangeFlag == false) {
            this.countdown = this.countdown + 1
            return
          }
          event = event || window.event

          const x = event.originalEvent.clientX
          const y = event.originalEvent.clientY
          this.countdown = this.countdown + 1
          this.currentElementChangeFlag = false
          const mousePosition = { x: x, y: y }
          DragDropFunctions.addEntryToDragOverQueue(this.currentElement, this.elementRectangle, mousePosition)
        }).on('dragstart', (event) => {
          this.dragoverqueue_processtimer = setInterval(() => {
            DragDropFunctions.processDragOverQueue()
          }, 100)

          let insertingHTML = $(event.target).attr('data-insert-html')
          if (!insertingHTML) {
            insertingHTML = $(event.target).prop('outerHTML')
          }

          event.originalEvent.dataTransfer.setData('Text', insertingHTML)

          bus.$emit('dragging-component', true)
        }).on('dragend', () => {
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
        }).on('mouseover', (event) => {
          event.stopPropagation()
          const currentElement = $(event.target)
          const elementRectangle = event.target.getBoundingClientRect()
          const mousePosition = {
            x: elementRectangle.x,
            y: elementRectangle.y
          }

          DragDropFunctions.orchestrateDragDrop(currentElement, elementRectangle, mousePosition, true, true)
          bus.$emit('hovering-element', event.target)
        }).on('mouseleave', () => {
          DragDropFunctions.clearContainerContext()
          bus.$emit('stopped-hovering-element')
        }).on('click', (event) => {
          bus.$emit('hovering-element', event.target, true)
        })

        $(this.clientFrameWindow.document).find('body,html').on('drop', (event) => {
          event.preventDefault()
          event.stopPropagation()

          let e
          if (event.isTrigger)
            e = triggerEvent.originalEvent // eslint-disable-line
          else
            e = event.originalEvent
          try {
            const textData = e.dataTransfer.getData('text')
            const insertionPoint = $(this.$refs.iframe).contents().find('.drop-marker')
            const checkDiv = $(textData)
            insertionPoint.after(checkDiv)
            insertionPoint.remove()
          } catch (e) {
            console.log(e)
          }
        })
      })
    },
  },
  mounted() {
    setIframe(this.$refs.iframe)
    this.addHandlers()
  }
}
</script>