'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertToInt = convertToInt;
exports.convertAllToInt = convertAllToInt;
exports.filterNewItems = filterNewItems;
exports.applyStylesToDOMNode = applyStylesToDOMNode;
exports.whichTransitionEvent = whichTransitionEvent;
/**
 * React Flip Move
 * (c) 2016-present Joshua Comeau
 */

function convertToInt(val, propName) {
  var int = typeof val === 'string' ? parseInt(val) : val;

  if (isNaN(int)) {
    console.error('Invalid prop \'' + propName + '\' supplied to FlipMove. Expected a number, or a string that can easily be resolved to a number (eg. "100"). Instead, received \'' + val + '\'.');
  }

  return int;
}

function convertAllToInt() {
  for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
    values[_key] = arguments[_key];
  }

  return values.map(convertToInt);
}

function filterNewItems(group1, group2) {
  var idProp = arguments.length <= 2 || arguments[2] === undefined ? 'key' : arguments[2];

  // We want to find all items in group2 that are NOT in group1.
  return group2.filter(function (g2Item) {
    return !group1.find(function (g1Item) {
      return g1Item[idProp] === g2Item[idProp];
    });
  });
}

function applyStylesToDOMNode(domNode, styles) {
  // Can't just do an object merge because domNode.styles is no regular object.
  // Need to do it this way for the engine to fire its `set` listeners.
  Object.keys(styles).forEach(function (key) {
    domNode.style[key] = styles[key];
  });
}

// Modified from Modernizr
function whichTransitionEvent() {
  var transitions = {
    'transition': 'transitionend',
    'OTransition': 'oTransitionEnd',
    'MozTransition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd'
  };

  // If we're running in a browserless environment (eg. SSR), it doesn't apply.
  // Return a string so that it maintains the type that is expected.
  if (typeof document === 'undefined') return '';

  var el = document.createElement('fakeelement');

  for (var t in transitions) {
    if (el.style[t] !== undefined) return transitions[t];
  }
}