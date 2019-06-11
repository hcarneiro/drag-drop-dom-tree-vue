/* eslint-disable */
import bus from './bus'
import $ from 'jquery'

const DragDropFunctions = {
  dragoverqueue: [],
  getMouseBearingsPercentage: function($element, elementRect, mousePos) {
    if (!elementRect)
      elementRect = $element.get(0).getBoundingClientRect();
    var mousePosPercent_X = ((mousePos.x - elementRect.left) / (elementRect.right - elementRect.left)) * 100;
    var mousePosPercent_Y = ((mousePos.y - elementRect.top) / (elementRect.bottom - elementRect.top)) * 100;

    return { x: mousePosPercent_X, y: mousePosPercent_Y };
  },
  orchestrateDragDrop: function($element, elementRect, mousePos, toHighlight, hideLine) {
    //If no element is hovered or element hovered is the placeholder -> not valid -> return false;
    if (!$element || $element.length == 0 || !elementRect || !mousePos)
      return false;

    if ($element.is('html'))
      $element = $element.find('body');
    //Top and Bottom Area Percentage to trigger different case. [5% of top and bottom area gets reserved for this]
    var breakPointNumber = { x: 5, y: 5 };

    var mousePercents = this.getMouseBearingsPercentage($element, elementRect, mousePos);
    if ((mousePercents.x > breakPointNumber.x && mousePercents.x < 100 - breakPointNumber.x) && (mousePercents.y > breakPointNumber.y && mousePercents.y < 100 - breakPointNumber.y)) {
      //Case 1 -
      var $tempelement = $element.clone();
      $tempelement.find('.drop-marker').remove();
      if ($tempelement.html() == '' && !this.checkVoidElement($tempelement)) {
        if (mousePercents.y < 90)
          return this.placeInside($element, toHighlight, hideLine);
      } else if ($tempelement.children().length == 0) {
        //text element detected
        this.decideBeforeAfter($element, mousePercents, undefined, toHighlight, hideLine);
      } else if ($tempelement.children().length == 1) {
        //only 1 child element detected
        this.decideBeforeAfter($element.children(':not(.drop-marker,[data-dragcontext-marker])').first(), mousePercents, undefined, toHighlight, hideLine);
      } else {
        var positionAndElement = this.findNearestElement($element, mousePos.x, mousePos.y);
        this.decideBeforeAfter(positionAndElement.el, mousePercents, mousePos, toHighlight, hideLine);
        //more than 1 child element present
      }
    } else if ((mousePercents.x <= breakPointNumber.x) || (mousePercents.y <= breakPointNumber.y)) {
      var validElement = null
      if (mousePercents.y <= mousePercents.x)
        validElement = this.findValidParent($element, 'top', hideLine);
      else
        validElement = this.findValidParent($element, 'left', hideLine);
      if (toHighlight)
        validElement = $element
      if (validElement.is('body,html'))
        validElement = $('#clientframe').contents().find('body').children(':not(.drop-marker,[data-dragcontext-marker])').first();
      this.decideBeforeAfter(validElement, mousePercents, mousePos, toHighlight, hideLine);
    } else if ((mousePercents.x >= 100 - breakPointNumber.x) || (mousePercents.y >= 100 - breakPointNumber.y)) {
      var validElement = null
      if (mousePercents.y >= mousePercents.x)
        validElement = this.findValidParent($element, 'bottom', hideLine);
      else
        validElement = this.findValidParent($element, 'right', hideLine);
      if (toHighlight)
        validElement = $element
      if (validElement.is('body,html'))
        validElement = $('#clientframe').contents().find('body').children(':not(.drop-marker,[data-dragcontext-marker])').last();
      this.decideBeforeAfter(validElement, mousePercents, mousePos, toHighlight, hideLine);
    }
  },
  decideBeforeAfter: function($targetElement, mousePercents, mousePos, toHighlight, hideLine) {
    if (mousePos) {
      mousePercents = this.getMouseBearingsPercentage($targetElement, null, mousePos);
    }

    /*if(!mousePercents)
     {
     mousePercents = this.getMouseBearingsPercentage($targetElement, $targetElement.get(0).getBoundingClientRect(), mousePos);
     } */

    var $orientation = ($targetElement.css('display') == 'inline' || $targetElement.css('display') == 'inline-block');
    if ($targetElement.is('br'))
      $orientation = false;

    if ($orientation) {
      if (mousePercents.x < 50) {
        return this.placeBefore($targetElement, toHighlight, hideLine);
      } else {
        return this.placeAfter($targetElement, toHighlight, hideLine);
      }
    } else {
      if (mousePercents.y < 50) {
        return this.placeBefore($targetElement, toHighlight, hideLine);
      } else {
        return this.placeAfter($targetElement, toHighlight, hideLine);
      }
    }
  },
  checkVoidElement: function($element) {
    var voidelements = ['i', 'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'video', 'iframe', 'source', 'track', 'wbr'];
    var selector = voidelements.join(',')
    if ($element.is(selector))
      return true;
    else
      return false;
  },
  calculateDistance: function(elementData, mouseX, mouseY) {
    return Math.sqrt(Math.pow(elementData.x - mouseX, 2) + Math.pow(elementData.y - mouseY, 2));
  },
  findValidParent: function($element, direction, hideLine) {
    switch (direction) {
      case 'left':
        while (true) {
          var elementRect = $element.get(0).getBoundingClientRect();
          var $tempElement = $element.parent();
          var tempelementRect = $tempElement.get(0).getBoundingClientRect();
          if (hideLine) 
            return $element
          if ($element.is('body'))
            return $element;
          if (Math.abs(tempelementRect.left - elementRect.left) == 0)
            $element = $element.parent();
          else
            return $element;
        }
        break;
      case 'right':
        while (true) {
          var elementRect = $element.get(0).getBoundingClientRect();
          var $tempElement = $element.parent();
          var tempelementRect = $tempElement.get(0).getBoundingClientRect();
          if (hideLine) 
            return $element;
          if ($element.is('body'))
            return $element;
          if (Math.abs(tempelementRect.right - elementRect.right) == 0)
            $element = $element.parent();
          else
            return $element;
        }
        break;
      case 'top':
        while (true) {
          var elementRect = $element.get(0).getBoundingClientRect();
          var $tempElement = $element.parent();
          var tempelementRect = $tempElement.get(0).getBoundingClientRect();
          if (hideLine) 
            return $element;
          if ($element.is('body'))
            return $element;
          if (Math.abs(tempelementRect.top - elementRect.top) == 0)
            $element = $element.parent();
          return $element;
        }
        break;
      case 'bottom':
        while (true) {
          var elementRect = $element.get(0).getBoundingClientRect();
          var $tempElement = $element.parent();
          var tempelementRect = $tempElement.get(0).getBoundingClientRect();
          if (hideLine) 
            return $element
          if ($element.is('body'))
            return $element;
          if (Math.abs(tempelementRect.bottom - elementRect.bottom) == 0)
            $element = $element.parent();
          else
            return $element;
        }
        break;
    }
  },
  addPlaceHolder: function($element, position, placeholder, toHighlight, hideLine) {
    if (!placeholder)
      placeholder = this.getPlaceHolder();
    this.removePlaceholder();
    switch (position) {
      case 'before':
        placeholder.find('.message').html($element.parent().data('sh-dnd-error'));
        if (!toHighlight && !hideLine) {
          $element.before(placeholder);
        }
        this.addContainerContext($element, 'sibling', toHighlight);
        break;
      case 'after':
        placeholder.find('.message').html($element.parent().data('sh-dnd-error'));
        if (!toHighlight && !hideLine) {
          $element.after(placeholder);
        }
        this.addContainerContext($element, 'sibling', toHighlight);
        break
      case 'inside-prepend':
        placeholder.find('.message').html($element.data('sh-dnd-error'));
        if (!toHighlight && !hideLine) {
          $element.prepend(placeholder);
        }

        this.addContainerContext($element, 'inside', toHighlight);
        break;
      case 'inside-append':
        placeholder.find('.message').html($element.data('sh-dnd-error'));
        if (!toHighlight && !hideLine) {
          $element.append(placeholder);
        }

        this.addContainerContext($element, 'inside', toHighlight);
        break;
    }
  },
  removePlaceholder: function() {
    $('#clientframe').contents().find('.drop-marker').remove();
  },
  getPlaceHolder: function() {
    return $('<li class="drop-marker"></li>');
  },
  placeInside: function($element, toHighlight, hideLine) {
    var placeholder = this.getPlaceHolder();
    placeholder.addClass('horizontal').css('width', $element.width() + 'px');
    this.addPlaceHolder($element, 'inside-append', placeholder, toHighlight, hideLine);
  },
  placeBefore: function($element, toHighlight, hideLine) {
    var placeholder = this.getPlaceHolder();
    var inlinePlaceholder = ($element.css('display') == 'inline' || $element.css('display') == 'inline-block');
    if ($element.is('br')) {
      inlinePlaceholder = false;
    } else if ($element.is('td,th')) {
      placeholder.addClass('horizontal').css('width', $element.width() + 'px');
      return this.addPlaceHolder($element, 'inside-prepend', placeholder, toHighlight, hideLine);
    }
    if (inlinePlaceholder)
      placeholder.addClass('vertical').css('height', $element.innerHeight() + 'px');
    else
      placeholder.addClass('horizontal').css('width', $element.parent().width() + 'px');
    this.addPlaceHolder($element, 'before', placeholder, toHighlight, hideLine);
  },

  placeAfter: function($element, toHighlight, hideLine) {
    var placeholder = this.getPlaceHolder();
    var inlinePlaceholder = ($element.css('display') == 'inline' || $element.css('display') == 'inline-block');
    if ($element.is('br')) {
      inlinePlaceholder = false;
    } else if ($element.is('td,th')) {
      placeholder.addClass('horizontal').css('width', $element.width() + 'px');
      return this.addPlaceHolder($element, 'inside-append', placeholder, toHighlight, hideLine);
    }
    if (inlinePlaceholder)
      placeholder.addClass('vertical').css('height', $element.innerHeight() + 'px');
    else
      placeholder.addClass('horizontal').css('width', $element.parent().width() + 'px');
    this.addPlaceHolder($element, 'after', placeholder, toHighlight, hideLine);
  },
  findNearestElement: function($container, clientX, clientY) {
    var _this = this;
    var previousElData = null;
    var childElement = $container.children(':not(.drop-marker,[data-dragcontext-marker])');
    if (childElement.length > 0) {
      childElement.each(function() {
        if ($(this).is('.drop-marker'))
          return;

        var offset = $(this).get(0).getBoundingClientRect();
        var distance = 0;
        var distance1, distance2 = null;
        var position = '';
        var xPosition1 = offset.left;
        var xPosition2 = offset.right;
        var yPosition1 = offset.top;
        var yPosition2 = offset.bottom;
        var corner1 = null;
        var corner2 = null;

        //Parellel to Yaxis and intersecting with x axis
        if (clientY > yPosition1 && clientY < yPosition2) {
          if (clientX < xPosition1 && clientY < xPosition2) {
            corner1 = { x: xPosition1, y: clientY, 'position': 'before' };
          } else {
            corner1 = { x: xPosition2, y: clientY, 'position': 'after' };
          }

        }
        //Parellel to xAxis and intersecting with Y axis
        else if (clientX > xPosition1 && clientX < xPosition2) {
          if (clientY < yPosition1 && clientY < yPosition2) {
            corner1 = { x: clientX, y: yPosition1, 'position': 'before' };
          } else {
            corner1 = { x: clientX, y: yPosition2, 'position': 'after' };
          }

        } else {
          //runs if no element found!
          if (clientX < xPosition1 && clientX < xPosition2) {
            corner1 = { x: xPosition1, y: yPosition1, 'position': 'before' }; //left top
            corner2 = { x: xPosition1, y: yPosition2, 'position': 'after' }; //left bottom
          } else if (clientX > xPosition1 && clientX > xPosition2) {
            corner1 = { x: xPosition2, y: yPosition1, 'position': 'before' }; //Right top
            corner2 = { x: xPosition2, y: yPosition2, 'position': 'after' }; //Right Bottom
          } else if (clientY < yPosition1 && clientY < yPosition2) {
            corner1 = { x: xPosition1, y: yPosition1, 'position': 'before' }; //Top Left
            corner2 = { x: xPosition2, y: yPosition1, 'position': 'after' }; //Top Right
          } else if (clientY > yPosition1 && clientY > yPosition2) {
            corner1 = { x: xPosition1, y: yPosition2, 'position': 'before' }; //Left bottom
            corner2 = { x: xPosition2, y: yPosition2, 'position': 'after' } //Right Bottom
          }
        }

        distance1 = _this.calculateDistance(corner1, clientX, clientY);

        if (corner2 !== null)
          distance2 = _this.calculateDistance(corner2, clientX, clientY);

        if (distance1 < distance2 || distance2 === null) {
          distance = distance1;
          position = corner1.position;
        } else {
          distance = distance2;
          position = corner2.position;
        }

        if (previousElData !== null) {
          if (previousElData.distance < distance) {
            return true; //continue statement
          }
        }
        previousElData = { 'el': this, 'distance': distance, 'xPosition1': xPosition1, 'xPosition2': xPosition2, 'yPosition1': yPosition1, 'yPosition2': yPosition2, 'position': position }
      });
      if (previousElData !== null) {
        var position = previousElData.position;
        return { 'el': $(previousElData.el), 'position': position };
      } else {
        return false;
      }
    }
  },
  addEntryToDragOverQueue: function($element, elementRect, mousePos) {
    var newEvent = [$element, elementRect, mousePos];
    this.dragoverqueue.push(newEvent);
  },
  processDragOverQueue: function($element, elementRect, mousePos) {
    var processing = this.dragoverqueue.pop();
    this.dragoverqueue = [];
    if (processing && processing.length == 3) {
      var $el = processing[0];
      var $elRect = processing[1];
      var mousePos = processing[2];
      this.orchestrateDragDrop($el, $elRect, mousePos);
    }
  },
  getContextMarker: function() {
    var $contextMarker = $('<div data-dragcontext-marker><span data-dragcontext-marker-text></span></div>');
    return $contextMarker;
  },
  addContainerContext: function($element, position, toHighlight) {
    var $contextMarker = this.getContextMarker();
    this.clearContainerContext();
    if ($element.is('html,body')) {
      position = 'inside';
      $element = $('#clientframe').contents().find('body');
    }
    if (toHighlight) {
      position = 'inside';
    }
    switch (position) {
      case 'inside':
        bus.$emit('hovering-element', $element[0], true, true)
        this.positionContextMarker($contextMarker, $element);
        if ($element.hasClass('stackhive-nodrop-zone'))
          $contextMarker.addClass('invalid');
        var name = this.getElementName($element);
        $contextMarker.find('[data-dragcontext-marker-text]').html(name);
        if ($('#clientframe').contents().find('body [data-sh-parent-marker]').length != 0)
          $('#clientframe').contents().find('body [data-sh-parent-marker]').first().before($contextMarker);
        else
          $('#clientframe').contents().find('body').append($contextMarker);
        break;
      case 'sibling':
        bus.$emit('hovering-element', $element.parent()[0], true, true)
        this.positionContextMarker($contextMarker, $element.parent());
        if ($element.parent().hasClass('stackhive-nodrop-zone'))
          $contextMarker.addClass('invalid');
        var name = this.getElementName($element.parent());
        $contextMarker.find('[data-dragcontext-marker-text]').html(name);
        $contextMarker.attr('data-dragcontext-marker', name.toLowerCase());
        if ($('#clientframe').contents().find('body [data-sh-parent-marker]').length != 0)
          $('#clientframe').contents().find('body [data-sh-parent-marker]').first().before($contextMarker);
        else
          $('#clientframe').contents().find('body').append($contextMarker);
        break;
    }
  },
  positionContextMarker: function($contextMarker, $element) {
    var rect = $element.get(0).getBoundingClientRect();
    $contextMarker.css({
      height: (rect.height + 4) + 'px',
      width: (rect.width + 4) + 'px',
      top: (rect.top + $($('#clientframe').get(0).contentWindow).scrollTop() - 2) + 'px',
      left: (rect.left + $($('#clientframe').get(0).contentWindow).scrollLeft() - 2) + 'px'
    });
    if (rect.top + $('#clientframe').contents().find('body').scrollTop() < 24)
      $contextMarker.find('[data-dragcontext-marker-text]').css('top', '4px');
  },
  clearContainerContext: function() {
    $('#clientframe').contents().find('[data-dragcontext-marker]').remove();
  },
  getElementName: function($element) {
    return $element.prop('tagName');
  },
  makeid: function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 8; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  },
  hasChildren: function(node) {
    if (!node.children || !node.children.length) {
      return false
    }

    var childValues = [];
    for (var i = 0; i < node.children.length; i++) {
      switch(node.children[i].nodeName) {
        case '#text':
          childValues.push(false)
          break;
        case '#commet':
          childValues.push(false)
          break;
        default:
          childValues.push(true)
      }
    }

    return childValues.indexOf(true) > -1
  },
  processNodeTree: function(dom) {
    var _this = this;
    return new Promise(function(resolve) {
      resolve(_this.getNodeTree(dom));
    });
  },
  getNodeTree: function(node) {
    let newNodeName

    if (node.hasChildNodes()) {
      var children = [];
      for (var j = 0; j < node.childNodes.length; j++) {
        children.push(this.getNodeTree(node.childNodes[j]));
      }

      if (node.dataset && node.dataset.hasOwnProperty('flWidgetInstance')) {
        newNodeName = node.dataset.name
      }

      return {
        elementId: this.makeid(),
        nodeName: newNodeName || node.nodeName,
        parentName: node.parentNode.nodeName,
        hasChildren: this.hasChildren,
        children: children,
        content: node.innerHTML || node.textContent || '',
        attributes: node.attributes,
        node: node,
        open: true
      };
    }

    if (node.dataset && node.dataset.hasOwnProperty('flWidgetInstance')) {
      newNodeName = node.dataset.name
    }

    return {
      elementId: this.makeid(),
      nodeName: newNodeName || node.nodeName,
      parentName: node.parentNode.nodeName,
      hasChildren: this.hasChildren,
      children: children,
      content: node.innerHTML || node.textContent || '',
      attributes: node.attributes,
      node: node,
      open: true
    };
  },
  getBodyChildrenOnly: function(dom) {
    return dom.children
  }
};

export default DragDropFunctions