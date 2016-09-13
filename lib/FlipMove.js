'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class; /**
             * React Flip Move
             * (c) 2016-present Joshua Comeau
             *
             * How it works:
             * The basic idea with this component is pretty straightforward:
             *
             *   - We track all rendered elements by their `key` property, and we keep
             *     their bounding boxes (their top/left/right/bottom coordinates) in this
             *     component's state.
             *   - When the component updates, we compare its former position (held in
             *     state) with its new position (derived from the DOM after update).
             *   - If the two have moved, we use the FLIP technique to animate the
             *     transition between their positions.
             */

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

require('./polyfills');

var _propConverter = require('./prop-converter');

var _propConverter2 = _interopRequireDefault(_propConverter);

var _helpers = require('./helpers.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var transitionEnd = (0, _helpers.whichTransitionEvent)();

var FlipMove = (0, _propConverter2.default)(_class = function (_Component) {
  _inherits(FlipMove, _Component);

  function FlipMove(props) {
    _classCallCheck(this, FlipMove);

    var _this = _possibleConstructorReturn(this, (FlipMove.__proto__ || Object.getPrototypeOf(FlipMove)).call(this, props));

    _this.boundingBoxes = {};

    _this.parentElement = null;
    _this.parentBox = null;

    _this.doesChildNeedToBeAnimated = _this.doesChildNeedToBeAnimated.bind(_this);

    // Copy props.children into state.
    // To understand why this is important (and not an anti-pattern), consider
    // how "leave" animations work. An item has "left" when the component
    // receives a new set of props that do NOT contain the item.
    // If we just render the props as-is, the item would instantly disappear.
    // We want to keep the item rendered for a little while, until its animation
    // can complete. Because we cannot mutate props, we make `state` the source
    // of truth.
    _this.state = { children: props.children };

    // Keep track of remaining animations so we know when to fire the
    // all-finished callback, and clean up after ourselves.
    _this.remainingAnimations = 0;
    _this.childrenToAnimate = {
      elements: [],
      domNodes: []
    };

    // When leaving items, we apply some over-ride styles to them (position,
    // top, left). If the item is passed in through props BEFORE the item has
    // finished leaving, its style will be wrong. So, to prevent any weirdness,
    // we store the "original" styles here so they can be applied on re-entry.
    // A crazy edge case, I know.
    _this.originalDomStyles = {};
    return _this;
  }

  _createClass(FlipMove, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.parentElement = _react2.default.findDOMNode(this);
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(previousProps) {
      // If the children have been re-arranged, moved, or added/removed,
      // trigger the main FLIP animation.
      //
      // This check is required so that we don't trigger a re-animation when the
      // `onFinishAll` handler is called, at the end of the animation, to remove
      // exited nodes.
      if (this.props.children !== previousProps.children) {
        this.calculateAndAnimateChildren();
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var _this2 = this;

      // When the component is handed new props, we need to figure out the "resting"
      // position of all currently-rendered DOM nodes. We store that data in
      // this.boundingBoxes, so it can be used later to work out the animation.

      // Calculate the parentBox. This is used to find childBoxes relative
      // to the parent container, not the viewport.
      var parentBox = this.props.getPosition(this.parentElement);

      // Get the bounding boxes of all currently-rendered, keyed children.
      var newBoundingBoxes = this.props.children.reduce(function (boxes, child) {
        // It is possible that a child does not have a `key` property;
        // Ignore these children, they don't need to be moved.
        if (!child.key) return boxes;

        var domNode = _react2.default.findDOMNode(_this2.refs[child.key]);

        var childBox = _this2.props.getPosition(domNode);
        var relativeBox = {
          'top': childBox['top'] - parentBox['top'],
          'left': childBox['left'] - parentBox['left'],
          'right': parentBox['right'] - childBox['right'],
          'bottom': parentBox['bottom'] - childBox['bottom']
        };

        return _extends({}, boxes, _defineProperty({}, child.key, relativeBox));
      }, {});

      this.boundingBoxes = _extends({}, this.boundingBoxes, newBoundingBoxes);

      // Create our custom list of items.
      // We use this list instead of props so that we can mutate it.
      // We're keeping just-deleted nodes for a bit longer, as well as adding a
      // flag to just-created nodes, so we know they need to be entered.
      this.setState({
        children: this.prepareNextChildren(nextProps.children)
      });
    }
  }, {
    key: 'prepareNextChildren',
    value: function prepareNextChildren(nextChildren) {
      var _this3 = this;

      // We want to:
      //   - Mark all new children as `entering`
      //   - Pull in previous children that aren't in nextChildren, and mark them
      //     as `leaving`
      //   - Preserve the nextChildren list order, with leaving children in their
      //     appropriate places.
      //

      // Start by marking new children as 'entering'
      var updatedChildren = nextChildren.map(function (nextChild) {
        var child = _this3.state.children.find(function (_ref) {
          var key = _ref.key;
          return key === nextChild.key;
        });

        // If the current child did exist, but it was in the middle of leaving,
        // we want to treat it as though it's entering
        var isEntering = !child || child.leaving;

        return _extends({}, nextChild, { entering: isEntering, props: nextChild.props });
      });

      // This is tricky. We want to keep the nextChildren's ordering, but with
      // any just-removed items maintaining their original position.
      // eg.
      //   this.state.children  = [ 1, 2, 3, 4 ]
      //   nextChildren         = [ 3, 1 ]
      //
      // In this example, we've removed the '2' & '4'
      // We want to end up with:  [ 2, 3, 1, 4 ]
      //
      // To accomplish that, we'll iterate through this.state.children. whenever
      // we find a match, we'll append our `leaving` flag to it, and insert it
      // into the nextChildren in its ORIGINAL position. Note that, as we keep
      // inserting old items into the new list, the "original" position will
      // keep incrementing.
      var numOfChildrenLeaving = 0;
      this.state.children.forEach(function (child, index) {
        var isLeaving = !nextChildren.find(function (_ref2) {
          var key = _ref2.key;
          return key === child.key;
        });

        // If the child isn't leaving (or, if there is no leave animation),
        // we don't need to add it into the state children.
        if (!isLeaving || !_this3.props.leaveAnimation) return;

        var nextChild = _extends({}, child, { leaving: true });
        var nextChildIndex = index + numOfChildrenLeaving;

        updatedChildren.splice(nextChildIndex, 0, nextChild);
        numOfChildrenLeaving++;
      });

      return updatedChildren;
    }
  }, {
    key: 'calculateAndAnimateChildren',
    value: function calculateAndAnimateChildren() {
      var _this4 = this;

      // Re-calculate the bounding boxes of tracked elements.
      // Compare to the bounding boxes stored in state.
      // Animate as required =)

      // There are two situations in which we want to skip all animations.
      //   - Developer has specifically disabled animations
      //   - User is running in a browser without CSS transition support
      //
      // In either case, simply set the children to their new values.
      if (this.isAnimationDisabled() || !transitionEnd) {
        return this.setState({ children: this.props.children });
      }

      this.parentBox = this.props.getPosition(this.parentElement);

      // we need to make all leaving nodes "invisible" to the layout calculations
      // that will take place in the next step (this.runAnimation).
      if (this.props.leaveAnimation) {
        var leavingChildren = this.state.children.filter(function (_ref3) {
          var leaving = _ref3.leaving;
          return leaving;
        });

        leavingChildren.forEach(function (leavingChild) {
          var domNode = _react2.default.findDOMNode(_this4.refs[leavingChild.key]);
          var leavingBoundingBox = _this4.boundingBoxes[leavingChild.key];

          // We need to take the items out of the "flow" of the document, so that
          // its siblings can move to take its place.
          // By setting its position to absolute and positioning it where it is,
          // we can make it leave in-place while its siblings can calculate where
          // they need to go.
          // If, however, the 'leave' is interrupted and they're forced to re-enter,
          // we want to undo this change, and the only way to do that is to preserve
          // their current styles.
          _this4.originalDomStyles[leavingChild.key] = {
            position: domNode.style.position,
            top: domNode.style.top,
            left: domNode.style.left,
            right: domNode.style.right
          };

          // For this to work, we have to offset any given `margin`.
          var computed = window.getComputedStyle(domNode);
          var cleanedComputed = {};

          // Clean up the properties (remove 'px', convert to Number).
          ['margin-top', 'margin-left', 'margin-right'].forEach(function (margin) {
            var propertyVal = computed.getPropertyValue(margin);
            cleanedComputed[margin] = Number(propertyVal.replace('px', ''));
          });

          domNode.style.position = 'absolute';
          domNode.style.top = leavingBoundingBox.top - cleanedComputed['margin-top'] + 'px';
          domNode.style.left = leavingBoundingBox.left - cleanedComputed['margin-left'] + 'px';
          domNode.style.right = leavingBoundingBox.right - cleanedComputed['margin-right'] + 'px';
        });
      }

      var dynamicChildren = this.state.children.filter(this.doesChildNeedToBeAnimated);

      // Next, we need to do all our new layout calculations, and get our new
      // styles for each item. We'll organize it as an object where the keys
      // are the item key, and the value is their new 'style'.
      this.domStyles = dynamicChildren.reduce(function (memo, child) {
        memo[child.key] = _this4.computeInitialStyles(child);
        return memo;
      }, {});

      // Now that the styles are computed, animate each child individually.
      dynamicChildren.forEach(function (child, index) {
        _this4.addChildToAnimationsList(child);
        _this4.runAnimation(child, index);
      });

      // Trigger the onStartAll callback, if provided.
      if (this.props.onStartAll) {
        this.props.onStartAll(this.childrenToAnimate.elements, this.childrenToAnimate.domNodes);
      }
    }
  }, {
    key: 'computeInitialStyles',
    value: function computeInitialStyles(child) {
      var style = { transition: '0ms' };

      if (child.entering) {
        if (this.props.enterAnimation) {
          var original = this.originalDomStyles[child.key] || {};
          style = _extends({}, style, this.props.enterAnimation.from, original);
        }
      } else if (child.leaving) {
        if (this.props.leaveAnimation) {
          style = _extends({}, style, this.props.leaveAnimation.from);
        }
      } else {
        var domNode = _react2.default.findDOMNode(this.refs[child.key]);

        var _getPositionDelta = this.getPositionDelta(domNode, child.key);

        var _getPositionDelta2 = _slicedToArray(_getPositionDelta, 2);

        var dX = _getPositionDelta2[0];
        var dY = _getPositionDelta2[1];

        style.transform = 'translate(' + dX + 'px, ' + dY + 'px)';
      }

      return style;
    }
  }, {
    key: 'isAnimationDisabled',
    value: function isAnimationDisabled() {
      // If the component is explicitly passed a `disableAllAnimations` flag,
      // we can skip this whole process. Similarly, if all of the numbers have
      // been set to 0, there is no point in trying to animate; doing so would
      // only cause a flicker (and the intent is probably to disable animations)
      return this.props.disableAllAnimations || this.props.duration === 0 && this.props.delay === 0 && this.props.staggerDurationBy === 0 && this.props.staggerDelayBy === 0;
    }
  }, {
    key: 'doesChildNeedToBeAnimated',
    value: function doesChildNeedToBeAnimated(child) {
      // If the child doesn't have a key, it's an immovable child (one that we
      // do not want to do flip stuff to.)
      if (!child.key) return;

      if (child.entering && this.props.enterAnimation || child.leaving && this.props.leaveAnimation) {
        return true;
      }

      // Otherwise, we only want to animate it if the child's position on-screen
      // has changed. Let's figure that out.
      var domNode = _react2.default.findDOMNode(this.refs[child.key]);

      var _getPositionDelta3 = this.getPositionDelta(domNode, child.key);

      var _getPositionDelta4 = _slicedToArray(_getPositionDelta3, 2);

      var dX = _getPositionDelta4[0];
      var dY = _getPositionDelta4[1];


      return dX !== 0 || dY !== 0;
    }
  }, {
    key: 'addChildToAnimationsList',
    value: function addChildToAnimationsList(child) {
      // Add this child to the animations array. This is used for working out
      // when all children have finished animated (so that the onFinishAll
      // callback can be fired, and so we can do some cleanup).
      var domNode = _react2.default.findDOMNode(this.refs[child.key]);

      this.remainingAnimations++;
      this.childrenToAnimate.elements.push(child);
      this.childrenToAnimate.domNodes.push(domNode);
    }
  }, {
    key: 'runAnimation',
    value: function runAnimation(child, n) {
      var _this5 = this;

      var domNode = _react2.default.findDOMNode(this.refs[child.key]);
      var styles = this.domStyles[child.key];

      // Apply the relevant style for this DOM node
      // This is the offset from its actual DOM position.
      // eg. if an item has been re-rendered 20px lower, we want to apply a
      // style of 'transform: translate(-20px)', so that it appears to be where
      // it started.
      (0, _helpers.applyStylesToDOMNode)(domNode, styles);

      //// A note on the double-requestAnimationFrame:
      //// Sadly, this is the most browser-compatible way to do this I've found.
      //// Essentially we need to set the initial styles outside of any request
      //// callbacks to avoid batching them. Then, a frame needs to pass with
      //// the styles above rendered. Then, on the second frame, we can apply
      //// our final styles to perform the animation.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          // Our first order of business is to "undo" the styles applied in the
          // previous frames, while also adding a `transition` property.
          // This way, the item will smoothly transition from its old position
          // to its new position.
          var styles = {
            transition: _this5.createTransitionString(n),
            transform: '',
            opacity: ''
          };

          if (child.entering && _this5.props.enterAnimation) {
            styles = _extends({}, styles, _this5.props.enterAnimation.to);
          } else if (child.leaving && _this5.props.leaveAnimation) {
            styles = _extends({}, styles, _this5.props.leaveAnimation.to);
          }

          (0, _helpers.applyStylesToDOMNode)(domNode, styles);
        });
      });

      // Trigger the onStart callback immediately.
      if (this.props.onStart) this.props.onStart(child, domNode);

      // The onFinish callback needs to be bound to the transitionEnd event.
      // We also need to unbind it when the transition completes, so this ugly
      // inline function is required (we need it here so it closes over
      // dependent variables `child` and `domNode`)
      var transitionEndHandler = function transitionEndHandler(ev) {
        // It's possible that this handler is fired not on our primary transition,
        // but on a nested transition (eg. a hover effect). Ignore these cases.
        if (ev.target !== domNode) return;

        // Remove the 'transition' inline style we added. This is cleanup.
        domNode.style.transition = '';

        // Trigger any applicable onFinish/onFinishAll hooks
        _this5.triggerFinishHooks(child, domNode);

        domNode.removeEventListener(transitionEnd, transitionEndHandler);
      };

      domNode.addEventListener(transitionEnd, transitionEndHandler);
    }
  }, {
    key: 'getPositionDelta',
    value: function getPositionDelta(domNode, key) {
      // TEMP: A mystery bug is sometimes causing unnecessary boundingBoxes to
      // remain. Until this bug can be solved, this band-aid fix does the job:
      var defaultBox = { left: 0, top: 0 };
      var newBox = this.props.getPosition(domNode);
      var oldBox = this.boundingBoxes[key] || defaultBox;
      var relativeBox = {
        top: newBox.top - this.parentBox.top,
        left: newBox.left - this.parentBox.left
      };

      return [oldBox.left - relativeBox.left, oldBox.top - relativeBox.top];
    }
  }, {
    key: 'createTransitionString',
    value: function createTransitionString(n) {
      var props = arguments.length <= 1 || arguments[1] === undefined ? ['transform', 'opacity'] : arguments[1];
      var _props = this.props;
      var duration = _props.duration;
      var staggerDurationBy = _props.staggerDurationBy;
      var delay = _props.delay;
      var staggerDelayBy = _props.staggerDelayBy;
      var easing = _props.easing;


      delay += n * staggerDelayBy;
      duration += n * staggerDurationBy;

      return props.map(function (prop) {
        return prop + ' ' + duration + 'ms ' + easing + ' ' + delay + 'ms';
      }).join(', ');
    }
  }, {
    key: 'triggerFinishHooks',
    value: function triggerFinishHooks(child, domNode) {
      var _this6 = this;

      if (this.props.onFinish) this.props.onFinish(child, domNode);

      // Reduce the number of children we need to animate by 1,
      // so that we can tell when all children have finished.
      this.remainingAnimations--;

      if (this.remainingAnimations === 0) {
        // Reset our variables for the next iteration
        this.childrenToAnimate.elements = [];
        this.childrenToAnimate.domNodes = [];

        // Remove any items from the DOM that have left, and reset `entering`.
        var nextChildren = this.state.children.filter(function (_ref4) {
          var leaving = _ref4.leaving;
          return !leaving;
        }).map(function (item) {
          return _extends({}, item, {
            entering: false
          });
        });

        this.originalDomStyles = {};

        this.setState({ children: nextChildren }, function () {
          if (typeof _this6.props.onFinishAll === 'function') {
            _this6.props.onFinishAll(_this6.childrenToAnimate.elements, _this6.childrenToAnimate.domNodes);
          }
        });
      }
    }
  }, {
    key: 'childrenWithRefs',
    value: function childrenWithRefs() {
      return this.state.children.map(function (child) {
        return _react2.default.cloneElement(child, { ref: child.key });
      });
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(this.props.typeName, this.props.delegated, this.childrenWithRefs());
    }
  }]);

  return FlipMove;
}(_react.Component)) || _class;

exports.default = FlipMove;
module.exports = exports['default'];