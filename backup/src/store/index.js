export const state = {
  domTree: undefined,
  iframe: undefined
}

// Public functions

/**
* Save the DOM tree object
* @param {Object} DOM tree elemnts object
*/
export function setDomTree(data) {
  state.domTree = data
}

/**
* Save the iFrame reference
* @param {Object} DOM elemnt object
*/
export function setIframe(iframe) {
  state.iframe = iframe
}

/**
* Save the iFrame content window reference
* @param {Object} DOM elemnt object
*/
export function setIframeContentWindow(cw) {
  state.iframeContentWindow = cw
}