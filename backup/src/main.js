import Vue from 'vue'
import Main from './Main.vue'

const mainApp = new Vue({
  el: '#app',
  render: (createElement) => {
    return createElement(Main)
  }
})