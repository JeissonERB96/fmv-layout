(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('dom-factory'), require('material-design-kit/dist/drawer.js'), require('material-design-kit/dist/drawer-layout.js'), require('perfect-scrollbar'), require('camelcase-keys'), require('material-design-kit/dist/header.js'), require('material-design-kit/dist/box.js'), require('material-design-kit/dist/header-layout.js'), require('bootstrap-vue/esm/utils/target'), require('bootstrap-vue/esm/utils/dom')) :
  typeof define === 'function' && define.amd ? define(['exports', 'dom-factory', 'material-design-kit/dist/drawer.js', 'material-design-kit/dist/drawer-layout.js', 'perfect-scrollbar', 'camelcase-keys', 'material-design-kit/dist/header.js', 'material-design-kit/dist/box.js', 'material-design-kit/dist/header-layout.js', 'bootstrap-vue/esm/utils/target', 'bootstrap-vue/esm/utils/dom'], factory) :
  (global = global || self, factory(global.FmvLayout = {}, global.domFactory, null, null, global.PerfectScrollbar$1, global.camelCaseKeys, null, null, null, global.target, global.dom));
}(this, function (exports, domFactory, drawer_js, drawerLayout_js, PerfectScrollbar$1, camelCaseKeys, header_js, box_js, headerLayout_js, target, dom) { 'use strict';

  PerfectScrollbar$1 = PerfectScrollbar$1 && PerfectScrollbar$1.hasOwnProperty('default') ? PerfectScrollbar$1['default'] : PerfectScrollbar$1;
  camelCaseKeys = camelCaseKeys && camelCaseKeys.hasOwnProperty('default') ? camelCaseKeys['default'] : camelCaseKeys;
  target = target && target.hasOwnProperty('default') ? target['default'] : target;

  if (!Array.isArray) {
    Array.isArray = function (arg) { return Object.prototype.toString.call(arg) === '[object Array]'; };
  }

  var isArray = Array.isArray;

  var BVRL = '__BV_root_listeners__';

  var listenOnRootMixin = {
    methods: {
      /**
       * Safely register event listeners on the root Vue node.
       * While Vue automatically removes listeners for individual components,
       * when a component registers a listener on root and is destroyed,
       * this orphans a callback because the node is gone,
       * but the root does not clear the callback.
       *
       * This adds a non-reactive prop to a vm on the fly
       * in order to avoid object observation and its performance costs
       * to something that needs no reactivity.
       * It should be highly unlikely there are any naming collisions.
       * @param {string} event
       * @param {function} callback
       * @chainable
       */
      listenOnRoot: function listenOnRoot(event, callback) {
        if (!this[BVRL] || !isArray(this[BVRL])) {
          this[BVRL] = [];
        }
        this[BVRL].push({ event: event, callback: callback });
        this.$root.$on(event, callback);
        return this
      },

      /**
       * Convenience method for calling vm.$emit on vm.$root.
       * @param {string} event
       * @param {*} args
       * @chainable
       */
      emitOnRoot: function emitOnRoot(event) {
        var ref;

        var args = [], len = arguments.length - 1;
        while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
        (ref = this.$root).$emit.apply(ref, [ event ].concat( args ));
        return this
      }
    },

    beforeDestroy: function beforeDestroy() {
      if (this[BVRL] && isArray(this[BVRL])) {
        while (this[BVRL].length > 0) {
          // shift to process in order
          var ref = this[BVRL].shift();
          var event = ref.event;
          var callback = ref.callback;
          this.$root.$off(event, callback);
        }
      }
    }
  };

  var drawerProps = {
    id: {
      type: String,
      default: function () { return 'default-drawer'; }
    },
    align: {
      type: String,
      default: 'start',
      validator: function (val) { return ['start', 'end', 'left', 'right'].includes(val); }
    },
    persistent: {
      type: Boolean,
      default: false
    },
    opened: {
      type: Boolean,
      default: false
    },
    classes: {
      type: String,
      default: null
    },
    contentClass: {
      type: String,
      default: null
    }
  };

  //

  // Events we emit on $root
  var EVENT_STATE = 'fm::drawer::state';

  // Events we listen to on $root
  var EVENT_TOGGLE = 'fm::toggle::drawer';
  var EVENT_CLOSE = 'fm::close::drawer';

  var script = {
    mixins: [listenOnRootMixin],
    props: drawerProps,
    data: function data() {
      return {
        show: null
      }
    },
    computed: {
      state: function state() {
        return {
          id: this.id,
          show: this.show,
          align: this.align,
          persistent: this.persistent
        }
      }
    },
    watch: {
      show: function show(newVal, oldVal) {
        var this$1 = this;

        this.try(function () {
          this$1.$el.mdkDrawer[newVal ? 'open' : 'close']();
          this$1.emitState();
        });
      },
      opened: function opened(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.show = newVal;
        }
      },
      align: function align(newVal, oldVal) {
        var this$1 = this;

        this.try(function () {
          this$1.$el.mdkDrawer.align = newVal;
          this$1.emitState();
        });
      }
    },
    created: function created() {
      // Listen for toggle events to open/close us
      this.listenOnRoot(EVENT_TOGGLE, this.handleToggleEvt);
      this.listenOnRoot(EVENT_CLOSE, this.handleCloseEvt);
    },
    mounted: function mounted() {
      var this$1 = this;

      this.$el.addEventListener('mdk-drawer-change', function () { return this$1.onChangeHandler(); });
      this.$el.addEventListener('domfactory-component-upgraded', function () { return this$1.onInitHandler(); }
      );
      this.$nextTick(function () {
        domFactory.handler.upgradeElement(this$1.$el, 'mdk-drawer');
      });
    },
    beforeDestroy: function beforeDestroy() {
      var this$1 = this;

      domFactory.handler.downgradeElement(this.$el, 'mdk-drawer');
      this.$el.removeEventListener('mdk-drawer-change', function () { return this$1.onChangeHandler(); }
      );
      this.$el.removeEventListener('domfactory-component-upgraded', function () { return this$1.onInitHandler(); }
      );
    },
    methods: {
      onInitHandler: function onInitHandler() {
        if (this.opened) {
          this.open();
        }
      },
      onChangeHandler: function onChangeHandler() {
        if (this.$el.mdkDrawer) {
          this.show = this.$el.mdkDrawer.opened;
        }
      },
      try: function try$1(callback) {
        try {
          callback();
        } catch (e) {
          this.$el.addEventListener(
            'domfactory-component-upgraded',
            callback.bind(this)
          );
        }
      },
      toggle: function toggle() {
        this.show = !this.show;
      },
      open: function open() {
        this.show = true;
      },
      close: function close() {
        this.show = false;
      },
      emitState: function emitState() {
        this.$emit('input', this.show);
        // Let toggle know the state of this drawer
        this.$root.$emit(EVENT_STATE, this.id, this.state);
      },
      handleToggleEvt: function handleToggleEvt(target) {
        if (!!target && target !== this.id) {
          return
        }
        this.toggle();
      },
      handleCloseEvt: function handleCloseEvt(target) {
        if (!!target && target !== this.id) {
          return
        }
        this.close();
      }
    }
  };

  function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
  /* server only */
  , shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
      createInjectorSSR = createInjector;
      createInjector = shadowMode;
      shadowMode = false;
    } // Vue.extend constructor export interop.


    var options = typeof script === 'function' ? script.options : script; // render functions

    if (template && template.render) {
      options.render = template.render;
      options.staticRenderFns = template.staticRenderFns;
      options._compiled = true; // functional template

      if (isFunctionalTemplate) {
        options.functional = true;
      }
    } // scopedId


    if (scopeId) {
      options._scopeId = scopeId;
    }

    var hook;

    if (moduleIdentifier) {
      // server build
      hook = function hook(context) {
        // 2.3 injection
        context = context || // cached call
        this.$vnode && this.$vnode.ssrContext || // stateful
        this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
        // 2.2 with runInNewContext: true

        if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
          context = __VUE_SSR_CONTEXT__;
        } // inject component styles


        if (style) {
          style.call(this, createInjectorSSR(context));
        } // register component module identifier for async chunk inference


        if (context && context._registeredComponents) {
          context._registeredComponents.add(moduleIdentifier);
        }
      }; // used by ssr in case component is cached and beforeCreate
      // never gets called


      options._ssrRegister = hook;
    } else if (style) {
      hook = shadowMode ? function () {
        style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
      } : function (context) {
        style.call(this, createInjector(context));
      };
    }

    if (hook) {
      if (options.functional) {
        // register for functional component in vue file
        var originalRender = options.render;

        options.render = function renderWithStyleInjection(h, context) {
          hook.call(context);
          return originalRender(h, context);
        };
      } else {
        // inject component registration as beforeCreate hook
        var existing = options.beforeCreate;
        options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
      }
    }

    return script;
  }

  var normalizeComponent_1 = normalizeComponent;

  /* script */
  var __vue_script__ = script;

  /* template */
  var __vue_render__ = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"mdk-drawer js-mdk-drawer",attrs:{"id":_vm.id,"data-align":_vm.align}},[_c('div',{staticClass:"mdk-drawer__content",class:_vm.contentClass},[_vm._t("default")],2)])};
  var __vue_staticRenderFns__ = [];

    /* style */
    var __vue_inject_styles__ = undefined;
    /* scoped */
    var __vue_scope_id__ = undefined;
    /* module identifier */
    var __vue_module_identifier__ = undefined;
    /* functional template */
    var __vue_is_functional_template__ = false;
    /* style inject */
    
    /* style inject SSR */
    

    
    var Drawer = normalizeComponent_1(
      { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
      __vue_inject_styles__,
      __vue_script__,
      __vue_scope_id__,
      __vue_is_functional_template__,
      __vue_module_identifier__,
      undefined,
      undefined
    );

  //

  var script$1 = {
    props: {
      settings: {
        type: Object,
        default: function default$1() {
          return {}
        }
      },
      tag: {
        type: String,
        default: 'div'
      },
      wheelPropagation: {
        type: Boolean,
        default: false
      }
    },
    data: function data() {
      return {
        ps: null
      }
    },
    computed: {
      localSettings: function localSettings() {
        return Object.assign(
          {
            wheelPropagation: this.wheelPropagation
          },
          this.settings
        )
      }
    },
    watch: {
      $route: function $route() {
        this.update();
      }
    },
    mounted: function mounted() {
      this.init();
    },
    updated: function updated() {
      this.$nextTick(this.update);
    },
    activated: function activated() {
      this.init();
    },
    deactivated: function deactivated() {
      this.destroy();
    },
    beforeDestroy: function beforeDestroy() {
      this.destroy();
    },
    methods: {
      scrollHandle: function scrollHandle(evt) {
        this.$emit(evt.type, evt);
      },
      update: function update() {
        if (this.ps) {
          this.ps.update();
          this.$emit('update');
        }
      },
      init: function init() {
        if (!this.ps) {
          this.ps = new PerfectScrollbar$1(this.$el, this.localSettings);
        } else {
          this.update();
        }
      },
      destroy: function destroy() {
        this.ps.destroy();
        this.ps = null;
      }
    }
  };

  /* script */
  var __vue_script__$1 = script$1;
  /* template */
  var __vue_render__$1 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c(_vm.$props.tag,{tag:"div",staticClass:"ps-container",on:{"~mouseover":function($event){return _vm.update($event)},"ps-scroll-y":_vm.scrollHandle,"ps-scroll-x":_vm.scrollHandle,"ps-scroll-up":_vm.scrollHandle,"ps-scroll-down":_vm.scrollHandle,"ps-scroll-left":_vm.scrollHandle,"ps-scroll-right":_vm.scrollHandle,"ps-y-reach-start":_vm.scrollHandle,"ps-y-reach-end":_vm.scrollHandle,"ps-x-reach-start":_vm.scrollHandle,"ps-x-reach-end":_vm.scrollHandle}},[_vm._t("default")],2)};
  var __vue_staticRenderFns__$1 = [];

    /* style */
    var __vue_inject_styles__$1 = undefined;
    /* scoped */
    var __vue_scope_id__$1 = undefined;
    /* module identifier */
    var __vue_module_identifier__$1 = undefined;
    /* functional template */
    var __vue_is_functional_template__$1 = false;
    /* style inject */
    
    /* style inject SSR */
    

    
    var PerfectScrollbar = normalizeComponent_1(
      { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
      __vue_inject_styles__$1,
      __vue_script__$1,
      __vue_scope_id__$1,
      __vue_is_functional_template__$1,
      __vue_module_identifier__$1,
      undefined,
      undefined
    );

  var prefixProps = function (props, prefix) {
    var newProps = {};
    Object.keys(props).forEach(function (prop) {
      newProps[(prefix + "-" + prop)] = props[prop];
    });

    return camelCaseKeys(newProps)
  };

  //

  var script$2 = {
    components: {
      Drawer: Drawer,
      PerfectScrollbar: PerfectScrollbar
    },
    props: Object.assign({}, {push: {
        type: Boolean,
        default: true
      },
      fullbleed: {
        type: Boolean
      },
      hasScrollingRegion: {
        type: Boolean
      },
      responsiveWidth: {
        type: String,
        default: '992px'
      },
      contentClass: {
        type: [String, Array, Object],
        default: null
      },
      contentId: {
        type: String,
        default: null
      }},
      prefixProps(drawerProps, 'drawer')),
    mounted: function mounted() {
      var this$1 = this;

      this.$el.addEventListener(
        'domfactory-component-upgraded',
        this.init.bind(this)
      );
      this.$nextTick(function () { return domFactory.handler.upgradeElement(this$1.$el, 'mdk-drawer-layout'); });
    },
    beforeDestroy: function beforeDestroy() {
      this.$el.removeEventListener(
        'domfactory-component-upgraded',
        this.init.bind(this)
      );
      domFactory.handler.downgradeElement(this.$el, 'mdk-drawer-layout');
    },
    methods: {
      init: function init() {
        var this$1 = this;
  ['push', 'responsiveWidth', 'fullbleed', 'hasScrollingRegion'].map(function (prop) {
          this$1.$el.mdkDrawerLayout[prop] = this$1[prop];
          this$1.$watch(prop, function (val) { return (this$1.$el.mdkDrawerLayout[prop] = val); });
        });
      }
    }
  };

  /* script */
  var __vue_script__$2 = script$2;

  /* template */
  var __vue_render__$2 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"mdk-drawer-layout js-mdk-drawer-layout",attrs:{"data-push":_vm.push,"data-responsive-width":_vm.responsiveWidth,"fullbleed":_vm.fullbleed}},[_c('div',{staticClass:"mdk-drawer-layout__content",class:_vm.contentClass,attrs:{"id":_vm.contentId}},[(_vm.hasScrollingRegion)?_c('perfect-scrollbar',{staticStyle:{"height":"100%"},on:{"ps-scroll-y":function($event){return _vm.$emit($event.type, $event)}}},[_vm._t("default")],2):_vm._t("default")],2),_vm._v(" "),_c('drawer',{class:_vm.drawerClasses,attrs:{"id":_vm.drawerId,"align":_vm.drawerAlign,"content-class":_vm.drawerContentClass}},[_vm._t("drawer",[_vm._v("\n      // drawer\n    ")])],2)],1)};
  var __vue_staticRenderFns__$2 = [];

    /* style */
    var __vue_inject_styles__$2 = undefined;
    /* scoped */
    var __vue_scope_id__$2 = undefined;
    /* module identifier */
    var __vue_module_identifier__$2 = undefined;
    /* functional template */
    var __vue_is_functional_template__$2 = false;
    /* style inject */
    
    /* style inject SSR */
    

    
    var DrawerLayout = normalizeComponent_1(
      { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
      __vue_inject_styles__$2,
      __vue_script__$2,
      __vue_scope_id__$2,
      __vue_is_functional_template__$2,
      __vue_module_identifier__$2,
      undefined,
      undefined
    );

  //

  var script$3 = {
    props: {
      fixed: {
        type: Boolean,
        default: true
      },
      disabled: {
        type: Boolean,
        default: false
      },
      reveals: {
        type: Boolean,
        default: false
      },
      condenses: {
        type: Boolean,
        default: false
      },
      effects: {
        type: [String, Array],
        default: null
      },
      headerImage: {
        type: String,
        default: null
      },
      headerContentClass: {
        type: [String, Array, Object],
        default: null
      }
    },
    computed: {
      props: function props() {
        return ['fixed', 'disabled', 'reveals', 'condenses']
      },
      headerEffects: function headerEffects() {
        if (this.effects) {
          var effects = isArray(this.effects) ? this.effects : [this.effects];
          return effects.join(' ')
        }
      }
    },
    mounted: function mounted() {
      var this$1 = this;

      this.$el.addEventListener(
        'domfactory-component-upgraded',
        this.init.bind(this)
      );
      this.$nextTick(function () { return domFactory.handler.upgradeElement(this$1.$el, 'mdk-header'); });
    },
    beforeDestroy: function beforeDestroy() {
      var this$1 = this;

      this.$el.mdkHeader.eventTarget.removeEventListener('scroll', function () { return this$1.onScroll(); });

      domFactory.handler.downgradeElement(this.$el, 'mdk-header');
      this.$el.removeEventListener(
        'domfactory-component-upgraded',
        this.init.bind(this)
      );
    },
    methods: {
      onScroll: function onScroll() {
        var state = this.$el.mdkHeader.getScrollState();
        this.$emit('header-target-scroll', state);
      },
      init: function init() {
        var this$1 = this;

        this.props.map(function (prop) {
          this$1.$el.mdkHeader[prop] = this$1[prop];
          this$1.$watch(prop, function (val) { return (this$1.$el.mdkHeader[prop] = val); });
        });

        this.$el.mdkHeader.eventTarget.addEventListener('scroll', function () { return this$1.onScroll(); });
        this.$nextTick(function () { return this$1.$el.mdkHeader._reset(); });
      }
    }
  };

  /* script */
  var __vue_script__$3 = script$3;

  /* template */
  var __vue_render__$3 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"mdk-header js-mdk-header",attrs:{"data-effects":_vm.headerEffects}},[_c('div',{staticClass:"mdk-header__bg"},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.headerImage),expression:"headerImage"}],staticClass:"mdk-header__bg-front",style:(("background-image: url(" + _vm.headerImage + ");"))})]),_vm._v(" "),_c('div',{staticClass:"mdk-header__content",class:_vm.headerContentClass},[_vm._t("default",[_c('div',{attrs:{"data-primary":""}},[_vm._v("\n        // header\n      ")])])],2)])};
  var __vue_staticRenderFns__$3 = [];

    /* style */
    var __vue_inject_styles__$3 = undefined;
    /* scoped */
    var __vue_scope_id__$3 = undefined;
    /* module identifier */
    var __vue_module_identifier__$3 = undefined;
    /* functional template */
    var __vue_is_functional_template__$3 = false;
    /* style inject */
    
    /* style inject SSR */
    

    
    var AppHeader = normalizeComponent_1(
      { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
      __vue_inject_styles__$3,
      __vue_script__$3,
      __vue_scope_id__$3,
      __vue_is_functional_template__$3,
      __vue_module_identifier__$3,
      undefined,
      undefined
    );

  //

  var script$4 = {
    props: {
      disabled: {
        type: Boolean,
        default: false
      },
      effects: {
        type: [String, Array],
        default: null
      },
      boxImage: {
        type: String,
        default: null
      },
      boxContentClass: {
        type: [String, Array, Object],
        default: null
      }
    },
    computed: {
      props: function props() {
        return ['disabled']
      },
      boxEffects: function boxEffects() {
        if (this.effects) {
          var effects = isArray(this.effects) ? this.effects : [this.effects];
          return effects.join(' ')
        }
      }
    },
    mounted: function mounted() {
      var this$1 = this;

      this.$el.addEventListener(
        'domfactory-component-upgraded',
        this.init.bind(this)
      );
      this.$nextTick(function () { return domFactory.handler.upgradeElement(this$1.$el, 'mdk-box'); });
    },
    beforeDestroy: function beforeDestroy() {
      var this$1 = this;

      if (this.$el.mdkBox) {
        this.$el.mdkBox.eventTarget.removeEventListener('scroll', function () { return this$1.onScroll(); });
      }

      domFactory.handler.downgradeElement(this.$el, 'mdk-box');
      this.$el.removeEventListener(
        'domfactory-component-upgraded',
        this.init.bind(this)
      );
    },
    methods: {
      onScroll: function onScroll() {
        var state = this.$el.mdkBox.getScrollState();
        this.$emit('header-target-scroll', state);
      },
      init: function init() {
        var this$1 = this;

        this.props.map(function (prop) {
          this$1.$el.mdkBox[prop] = this$1[prop];
          this$1.$watch(prop, function (val) { return (this$1.$el.mdkBox[prop] = val); });
        });

        this.$el.mdkBox.eventTarget.addEventListener('scroll', function () { return this$1.onScroll(); });
        this.$nextTick(function () { return this$1.$el.mdkBox._reset(); });
      }
    }
  };

  /* script */
  var __vue_script__$4 = script$4;

  /* template */
  var __vue_render__$4 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"mdk-box",attrs:{"data-effects":_vm.boxEffects}},[_c('div',{staticClass:"mdk-box__bg"},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.boxImage),expression:"boxImage"}],staticClass:"mdk-box__bg-front",style:(("background-image: url(" + _vm.boxImage + ");"))})]),_vm._v(" "),_c('div',{staticClass:"mdk-box__content",class:_vm.boxContentClass},[_vm._t("default",[_c('div',[_vm._v("\n        // box content\n      ")])])],2)])};
  var __vue_staticRenderFns__$4 = [];

    /* style */
    var __vue_inject_styles__$4 = undefined;
    /* scoped */
    var __vue_scope_id__$4 = undefined;
    /* module identifier */
    var __vue_module_identifier__$4 = undefined;
    /* functional template */
    var __vue_is_functional_template__$4 = false;
    /* style inject */
    
    /* style inject SSR */
    

    
    var Box = normalizeComponent_1(
      { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
      __vue_inject_styles__$4,
      __vue_script__$4,
      __vue_scope_id__$4,
      __vue_is_functional_template__$4,
      __vue_module_identifier__$4,
      undefined,
      undefined
    );

  //

  var script$5 = {
    components: {
      AppHeader: AppHeader
    },
    props: {
      fullbleed: {
        type: Boolean
      },
      headerFixed: {
        type: Boolean,
        default: true
      },
      headerDisabled: {
        type: Boolean,
        default: false
      },
      headerReveals: {
        type: Boolean,
        default: false
      },
      headerCondenses: {
        type: Boolean,
        default: false
      },
      headerEffects: {
        type: [String, Array],
        default: null
      },
      headerClass: {
        type: [String, Array, Object],
        default: null
      },
      headerContentClass: {
        type: [String, Array, Object],
        default: null
      },
      contentClass: {
        type: [String, Array, Object],
        default: null
      },
      contentId: {
        type: String,
        default: null
      },
      headerImage: {
        type: String,
        default: null
      }
    },
    watch: {
      headerClass: 'reset'
    },
    mounted: function mounted() {
      var this$1 = this;

      this.$el.addEventListener(
        'domfactory-component-upgraded',
        this.init.bind(this)
      );
      this.$nextTick(function () { return domFactory.handler.upgradeElement(this$1.$el, 'mdk-header-layout'); });
    },
    beforeDestroy: function beforeDestroy() {
      this.$el.removeEventListener(
        'domfactory-component-upgraded',
        this.init.bind(this)
      );
      domFactory.handler.downgradeElement(this.$el, 'mdk-header-layout');
    },
    methods: {
      init: function init() {
        var this$1 = this;

        this.$nextTick(this.reset);
        setTimeout(this.reset.bind(this), 200);
        setTimeout(this.reset.bind(this), 1000);
        this.$el.mdkHeaderLayout.fullbleed = this.fullbleed;
        this.$root.$on('reset::header-layout', this.reset);

        this.$watch('$route', this.reset)

        ;['fullbleed'].map(function (prop) {
          this$1.$el.mdkHeaderLayout[prop] = this$1[prop];
          this$1.$watch(prop, function (val) { return (this$1.$el.mdkHeaderLayout[prop] = val); });
        });
      },
      reset: function reset() {
        var this$1 = this;

        this.$nextTick(function () { return this$1.$el.mdkHeaderLayout._reset(); });
      },
      handleEmit: function handleEmit(type, e) {
        this.$emit(type, e);
      }
    }
  };

  /* script */
  var __vue_script__$5 = script$5;

  /* template */
  var __vue_render__$5 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"mdk-header-layout js-mdk-header-layout"},[_c('app-header',{class:_vm.headerClass,attrs:{"fixed":_vm.headerFixed,"reveals":_vm.headerReveals,"condenses":_vm.headerCondenses,"disabled":_vm.headerDisabled,"effects":_vm.headerEffects,"header-image":_vm.headerImage,"header-content-class":_vm.headerContentClass},on:{"header-target-scroll":function($event){return _vm.handleEmit('header-target-scroll', $event)}}},[_vm._t("header",[_vm._v("\n      // header\n    ")])],2),_vm._v(" "),_c('div',{staticClass:"mdk-header-layout__content",class:_vm.contentClass,style:({ height: _vm.fullbleed ? '100%' : '' }),attrs:{"id":_vm.contentId}},[_vm._t("default")],2)],1)};
  var __vue_staticRenderFns__$5 = [];

    /* style */
    var __vue_inject_styles__$5 = undefined;
    /* scoped */
    var __vue_scope_id__$5 = undefined;
    /* module identifier */
    var __vue_module_identifier__$5 = undefined;
    /* functional template */
    var __vue_is_functional_template__$5 = false;
    /* style inject */
    
    /* style inject SSR */
    

    
    var HeaderLayout = normalizeComponent_1(
      { render: __vue_render__$5, staticRenderFns: __vue_staticRenderFns__$5 },
      __vue_inject_styles__$5,
      __vue_script__$5,
      __vue_scope_id__$5,
      __vue_is_functional_template__$5,
      __vue_module_identifier__$5,
      undefined,
      undefined
    );

  var sidebarProps = {
    props: {
      type: {
        type: String,
        default: 'light'
      },
      variant: {
        type: String,
        default: null
      },
      align: {
        type: String,
        default: 'start',
        validator: function (val) { return ['start', 'end', 'left', 'right'].includes(val); }
      }
    }
  };

  //

  var script$6 = {
    components: {
      PerfectScrollbar: PerfectScrollbar
    },
    mixins: [sidebarProps],
    computed: {
      isRTL: function isRTL() {
        if (!process.server && this.$el) {
          return window.getComputedStyle(this.$el).direction === 'rtl'
        }
      },
      position: function position() {
        var position = this.align;
        var isRTL = this.isRTL;

        if (isRTL && ['left', 'right'].includes(position)) {
          if (position === 'left') {
            position = 'right';
          } else if (position === 'right') {
            position = 'left';
          }
        }

        if (this.align === 'start') {
          position = isRTL ? 'right' : 'left';
        }
        if (this.align === 'end') {
          position = isRTL ? 'left' : 'right';
        }

        return position
      },
      classes: function classes() {
        var classes = {};
        classes[("sidebar-" + (this.type))] = true;
        classes[("sidebar-" + (this.position))] = true;

        if (this.variant) {
          this.variant.split(' ').map(function (variant) { return (classes[variant] = true); });
        }

        return classes
      }
    },
    methods: {
      update: function update() {
        var this$1 = this;

        this.$nextTick(function () {
          if (this$1.$refs.ps) {
            this$1.$refs.ps.update();
          }
        });
      }
    }
  };

  /* script */
  var __vue_script__$6 = script$6;

  /* template */
  var __vue_render__$6 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('perfect-scrollbar',{ref:"ps",staticClass:"sidebar o-hidden",class:_vm.classes},[_vm._t("default")],2)};
  var __vue_staticRenderFns__$6 = [];

    /* style */
    var __vue_inject_styles__$6 = undefined;
    /* scoped */
    var __vue_scope_id__$6 = undefined;
    /* module identifier */
    var __vue_module_identifier__$6 = undefined;
    /* functional template */
    var __vue_is_functional_template__$6 = false;
    /* style inject */
    
    /* style inject SSR */
    

    
    var Sidebar = normalizeComponent_1(
      { render: __vue_render__$6, staticRenderFns: __vue_staticRenderFns__$6 },
      __vue_inject_styles__$6,
      __vue_script__$6,
      __vue_scope_id__$6,
      __vue_is_functional_template__$6,
      __vue_module_identifier__$6,
      undefined,
      undefined
    );

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //

  var script$7 = {
    props: {
      menu: {
        type: Array,
        default: function default$1() {
          return []
        }
      },
      menuClass: {
        type: [Array, String, Object],
        default: null
      }
    },
    data: function data() {
      return {
        localMenu: []
      }
    },
    watch: {
      menu: function menu(menu$1) {
        this.localMenu = menu$1;
      },
      localMenu: 'matchRoute',
      '$route': 'matchRoute'
    },
    created: function created() {
      var this$1 = this;

      this.$root.$on('bv::collapse::state', function (collapseId, open) {
        this$1.emitState(collapseId, false, open);
      });
    },
    mounted: function mounted() {
      this.localMenu = this.menu;
    },
    methods: {
      matchRoute: function matchRoute() {
        var this$1 = this;

        this.$nextTick(function () {
          this$1.localMenu.map(function (item) {
            var open = this$1.routeMatches(item);
            this$1[
              open ? 'open' : 'close'
            ](item);
          });
        });
      },
      open: function open(target) {
        if (!target.open) {
          var targetId = this.getId(target);
          this.$set(target, 'open', true);
          this.$emit('open', targetId);
          this.$root.$emit('bv::toggle::collapse', targetId);
        }
      },
      close: function close(target) {
        this.$set(target, 'open', false);
        this.$emit('close', this.getId(target));
      },
      emitState: function emitState(targetId, opened, open) {
        var state = {
          targetId: targetId,
          open: open,
          opened: opened
        };
        this.$emit('state', state);
        this.$root.$emit('fmv::sidebar-menu::state', state);
      },
      getId: function getId(item) {
        return ("sm" + (item.id))
      },
      routeMatches: function routeMatches(item) {
        var this$1 = this;

        var route;
        if (process.server) {
          return false
        }
        try {
          item.children.map(function (child) {
            if (typeof child.route === 'string') {
              route = route || this$1.$route.name === child.route;
              route = route || this$1.$route.path === child.route;

              if (this$1.$i18n) {
                this$1.$i18n.locales.map(function (locale) {
                  var localeRoute = (child.route) + "__" + (locale.code);

                  route = route || this$1.$route.name === localeRoute;
                  route = route || this$1.$route.path === localeRoute;
                });
              }
            }
            
            route = route || this$1.$route.name === child.route.name;
            route = route || this$1.$route.path === child.route.path;
          });
        } catch(e) {}

        return route
      },
      onClick: function onClick(e, callback) {
        if (callback) {
          e.preventDefault();
          callback();
        }
      }
    }
  };

  /* script */
  var __vue_script__$7 = script$7;

  /* template */
  var __vue_render__$7 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[(_vm.menu)?_c('ul',{staticClass:"sidebar-menu",class:_vm.menuClass},[_vm._l((_vm.localMenu),function(item,itemIdx){return [(item.children !== undefined && item.children.length)?[_c('li',{key:("smi-collapse-" + itemIdx),staticClass:"sidebar-menu-item",class:{ 'open': item.open }},[_c('a',{directives:[{name:"b-toggle",rawName:"v-b-toggle",value:(_vm.getId(item)),expression:"getId(item)"}],staticClass:"sidebar-menu-button",attrs:{"href":"#"}},[(!!item.icon)?_c(item.icon.type,{tag:"component",staticClass:"sidebar-menu-icon",class:{ 
                  'sidebar-menu-icon--left': item.icon.align === undefined || item.icon.align === 'left',
                  'sidebar-menu-icon--right': item.icon.align === 'right',
                },domProps:{"textContent":_vm._s(item.icon.id)}}):_vm._e(),_vm._v("\n            "+_vm._s(item.label)+"\n            "),_c('span',{staticClass:"ml-auto sidebar-menu-toggle-icon"})],1),_vm._v(" "),_c('b-collapse',{staticClass:"sidebar-submenu sm-indent",attrs:{"id":_vm.getId(item),"tag":"ul"},on:{"shown":function($event){_vm.emitState(_vm.getId(item), true);},"hidden":function($event){_vm.emitState(_vm.getId(item), false);}},model:{value:(item.open),callback:function ($$v) {_vm.$set(item, "open", $$v);},expression:"item.open"}},_vm._l((item.children),function(child,idx){return _c('router-link',{key:("smi-" + idx + "-" + (_vm.$store.state.locale)),staticClass:"sidebar-menu-item",attrs:{"to":child.route,"tag":"li","exact":""}},[_c('a',{staticClass:"sidebar-menu-button"},[_c('span',{staticClass:"sidebar-menu-text"},[_vm._v(_vm._s(child.label))])])])}),1)],1)]:_c(item.route ? 'router-link' : 'li',{key:("smi-" + itemIdx + "-" + (_vm.$store.state.locale)),tag:"component",staticClass:"sidebar-menu-item",attrs:{"to":item.route ? item.route : {},"tag":"li","exact":item.exact !== false},on:{"click":function($event){return _vm.onClick($event, item.click)}}},[_c('a',{staticClass:"sidebar-menu-button"},[(!!item.icon)?_c(item.icon.type,{tag:"component",staticClass:"sidebar-menu-icon sidebar-menu-icon--left",domProps:{"textContent":_vm._s(item.icon.id)}}):_vm._e(),_vm._v(" "),_c('span',{staticClass:"sidebar-menu-text",domProps:{"textContent":_vm._s(item.label)}}),_vm._v(" "),(item.badge)?_c('b-badge',{staticClass:"sidebar-menu-badge ml-auto",attrs:{"variant":item.badge.variant},domProps:{"textContent":_vm._s(item.badge.label)}}):_vm._e()],1)])]})],2):_vm._e()])};
  var __vue_staticRenderFns__$7 = [];

    /* style */
    var __vue_inject_styles__$7 = undefined;
    /* scoped */
    var __vue_scope_id__$7 = undefined;
    /* module identifier */
    var __vue_module_identifier__$7 = undefined;
    /* functional template */
    var __vue_is_functional_template__$7 = false;
    /* style inject */
    
    /* style inject SSR */
    

    
    var SidebarMenu = normalizeComponent_1(
      { render: __vue_render__$7, staticRenderFns: __vue_staticRenderFns__$7 },
      __vue_inject_styles__$7,
      __vue_script__$7,
      __vue_scope_id__$7,
      __vue_is_functional_template__$7,
      __vue_module_identifier__$7,
      undefined,
      undefined
    );

  // Are we client side?
  var inBrowser = typeof window !== 'undefined';

  // target listen types
  var listenTypes = { click: true };

  // Property key for handler storage
  var BVT = '__BV_toggle__';

  // Emitted Control Event for collapse (emitted to collapse)
  var EVENT_TOGGLE$1 = 'fm::toggle::drawer';

  // Listen to Event for toggle state update (Emited by collapse)
  var EVENT_STATE$1 = 'fm::drawer::state';

  var toggle = {
    bind: function bind(el, binding, vnode) {
      var targets = target(
        vnode,
        binding,
        listenTypes,
        function (ref) {
          var targets = ref.targets;
          var vnode = ref.vnode;

          targets.forEach(function (target) {
            vnode.context.$root.$emit(EVENT_TOGGLE$1, target);
          });
        }
      );

      if (inBrowser && vnode.context && targets.length > 0) {
        // Add aria attributes to element
        dom.setAttr(el, 'aria-controls', targets.join(' '));
        dom.setAttr(el, 'aria-expanded', 'false');
        if (el.tagName !== 'BUTTON') {
          // If element is not a button, we add `role="button"` for accessibility
          dom.setAttr(el, 'role', 'button');
        }

        // Toggle state hadnler, stored on element
        el[BVT] = function toggleDirectiveHandler(id, state) {
          if (targets.indexOf(id) !== -1) {
            // Set aria-expanded state
            dom.setAttr(el, 'aria-expanded', state.show ? 'true' : 'false');
            // Set/Clear 'active' class state
            if (state.show) {
              dom.addClass(el, 'active');
            } else {
              dom.removeClass(el, 'active');
            }
          }
        };

        // Listen for toggle state changes
        vnode.context.$root.$on(EVENT_STATE$1, el[BVT]);
      }
    },
    unbind: function unbind(el, binding, vnode) {
      if (el[BVT]) {
        // Remove our $root listener
        vnode.context.$root.$off(EVENT_STATE$1, el[BVT]);
        el[BVT] = null;
      }
    }
  };

  var utils = {
    isArray: isArray,
    prefixProps: prefixProps,
    drawerProps: drawerProps,
    sidebarProps: sidebarProps.props
  };

  var mixins = {
    listenOnRootMixin: listenOnRootMixin
  };

  exports.FmvBox = Box;
  exports.FmvDrawer = Drawer;
  exports.FmvDrawerLayout = DrawerLayout;
  exports.FmvHeader = AppHeader;
  exports.FmvHeaderLayout = HeaderLayout;
  exports.FmvPerfectScrollbar = PerfectScrollbar;
  exports.FmvSidebar = Sidebar;
  exports.FmvSidebarMenu = SidebarMenu;
  exports.FmvToggle = toggle;
  exports.mixins = mixins;
  exports.utils = utils;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
