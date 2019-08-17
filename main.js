
window.onload = function () {
  const DEFAULT_BTN_WIDTH = '50px';

  function StoryDrawer() {
    /**
     *
     * @param {StoryStep[]} story
     * @param {CanvasController} canvas
     */
    this.draw = (story, canvas) => {
      story.forEach((storyStep) => {
        if (storyStep.s.length) {
          canvas.context.beginPath();
          canvas.setWidth(storyStep.w);
          canvas.setColor(storyStep.c);
          canvas.context.moveTo(storyStep.s[0].x, storyStep.s[0].y);
          storyStep.s.forEach((points => {
            canvas.context.lineTo(points.x, points.y);
          }));
          canvas.context.stroke();
        }
      })
    }
  }

  function StoryStepPoint(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   *
   * @param {string} color
   * @param {number} width
   * @param {StoryStepPoint[]} points
   * @constructor
   */
  function StoryStep(color, width, points) {
    this.c = color;
    this.w = width;
    this.s = points;
    /**
     * Hash
     * @type {number}
     */
    this.h = (new Date()).getTime();
  }

  /**
   *
   * @constructor
   */
  function Story() {
    /**
     *
     * @type {StoryStep[]}
     * @private
     */
    let _storyBetweenSteps = [];
    /**
     *
     * @type {StoryStep[]}
     * @private
     */
    let _fullStory = [];
    let _color = '';
    let _width = 0;
    let _accumulator = [];

    /**
     *
     * @param {number} x
     * @param {number} y
     */
    this.accumulate = (x, y) => {
      _accumulator.push(new StoryStepPoint(x, y));
    };

    this.write = () => {
      _storyBetweenSteps.push(new StoryStep(_color, _width, _accumulator));
      _accumulator = [];
    };

    this.save = () => {
      _fullStory.push(..._storyBetweenSteps);
      _storyBetweenSteps = [];
    };

    /**
     *
     * @param {Array} val
     */
    this.update = (val) => {
      _fullStory = val;
    };

    /**
     *
     * @return {StoryStep[]}
     */
    this.get = () => {
      return _fullStory;
    };


    /**
     *
     * @param {string} color
     */
    this.setColor = (color) => {
      _color = color;
    };

    /**
     *
     * @param {number} width
     */
    this.setWidth = (width) => {
      _width = width;
    };
  }
  Story.STORAGE_KEY_NAME = 'utip';

  function EventDispatcher() {
    /**
     *
     * @type {{}}
     * @private
     */
    const _events = {};

    /**
     *
     * @param {string} to
     * @param {function} handler
     */
    this.subscribe = (to, handler) => {
      if (!_events[to]) {
        _events[to] = [];
      }
      _events[to].push(handler);
    };

    /**
     *
     * @param eventName
     * @param args
     */
    this.dispatch = (eventName, ...args) => {
      if (_events[eventName]) {
        _events[eventName].forEach((event) => {
          event.apply(null, args);
        });
      }
    }
  }

  /**
   * 
   * @param {EventDispatcher} eventDispatcher
   * @constructor
   */
  const Mouse = function (eventDispatcher) {
    /**
     *
     * @type {number}
     * @private
     */
    let _x = 0;

    /**
     *
     * @type {number}
     * @private
     */
    let _y = 0;

    /**
     *
     * @param {number} x
     * @param {number} y
     */
    this.setPoint = (x, y) => {
      _x = x;
      _y = y;
      this.eventDispatcher.dispatch(Mouse.EVENT_SET_POINT, x, y);
    };

    /**
     *
     * @return {number}
     */
    this.getX = () => {
      return _x;
    };

    /**
     *
     * @return {number}
     */
    this.getY = () => {
      return _y;
    };

    /**
     * 
     * @type {EventDispatcher}
     */
    this.eventDispatcher = eventDispatcher;
  };
  Mouse.EVENT_SET_POINT = 'setPoint';


  /**
   * @param {string} canvasId
   * @param {Mouse} mouse
   * @param {EventDispatcher} eventDispatcher
   * @constructor
   */
  const CanvasController = function (canvasId, mouse, eventDispatcher) {
    /**
     *
     * @type {HTMLElement}
     */
    this.$el = document.getElementById(canvasId);

    /**
     * @type {CanvasRenderingContext2D}
     */
    this.context = this.$el.getContext("2d");

    /**
     *
     * @type {boolean}
     * @private
     */
    let _isDraw = false;

    /**
     *
     * @param {boolean} isDraw
     */
    this.setIsDraw = (isDraw) => {
      _isDraw = isDraw;
    };

    /**
     *
     * @return {boolean}
     */
    this.getIsDraw = () => {
      return _isDraw;
    };

    /**
     *
     * @type {Mouse}
     */
    this.mouse = mouse;

    /**
     *
     * @type EventDispatcher
     */
    this.eventDispatcher = eventDispatcher;

    /**
     * @emits setColor
     * @param {string} color
     */
    this.setColor = (color) => {
      this.context.strokeStyle = color;
      this.eventDispatcher.dispatch(CanvasController.EVENT_SET_COLOR, color);
    };

    /**
     * 
     * @param {number} width
     */
    this.setWidth = (width) => {
      this.context.lineWidth = width;
      this.eventDispatcher.dispatch(CanvasController.EVENT_SET_WIDTH, width);
    };

    /**
     *
     * @return {string | CanvasGradient | CanvasPattern}
     */
    this.getColor = () => {
      return this.context.strokeStyle;
    };

    /**
     *
     * @return {number}
     */
    this.getWidth = () => {
      return this.context.lineWidth;
    }
  };

  CanvasController.EVENT_SET_COLOR = 'setColor';
  CanvasController.EVENT_SET_WIDTH = 'setWidth';

  /**
   * @param {CanvasController} canvasController
   * @param {EventDispatcher} eventDispatcher
   * @constructor
   */
  const CanvasDomEvents = function (canvasController, eventDispatcher) {
    const canvasMouse = canvasController.mouse;
    const canvasCtx = canvasController.context;
    /**
     *
     * @param {MouseEvent} event
     * @param {HTMLElement} element
     */
    const setMousePos = (event, element) => {
      canvasMouse.setPoint(event.pageX - element.offsetLeft, event.pageY - element.offsetTop);

    };
    const event_handler = {
      /**
       *
       * @param {MouseEvent} e
       * @param {HTMLElement} el
       */
      mousedown: (e, el) => {
        setMousePos(e, el);
        canvasController.setIsDraw(true);
        canvasCtx.beginPath();
        canvasCtx.moveTo(canvasMouse.getX(), canvasMouse.getY());
      },
      /**
       *
       * @param {MouseEvent} e
       * @param {HTMLElement} el
       */
      mousemove: (e, el) => {
        if (canvasController.getIsDraw()) {
          setMousePos(e, el);
          canvasCtx.lineTo(canvasMouse.getX(), canvasMouse.getY());
          canvasCtx.stroke();
        }
      },
      /**
       *
       * @param {MouseEvent} e
       * @param {HTMLElement} el
       */
      mouseup: (e, el) => {
        setMousePos(e, el);
        canvasCtx.lineTo(canvasMouse.getX(), canvasMouse.getY());
        canvasCtx.stroke();
        canvasCtx.closePath();
        canvasController.setIsDraw(false);
        this.eventDispatcher.dispatch(CanvasDomEvents.EVENT_MOUSEUP);
      }
    };

    this.addEvents = () => {
      Object.keys(event_handler).forEach((eventName) => {
        canvasController.$el.addEventListener(eventName, function (event) {
          event_handler[eventName](event, this);
        })
      })
    };

    /**
     * 
     * @type {EventDispatcher}
     */
    this.eventDispatcher = eventDispatcher;
  };
  
  CanvasDomEvents.EVENT_MOUSEUP = 'mouseup';

  /**
   *
   * @param {string} color
   * @param {CanvasController} canvasController
   * @constructor
   */
  function ColorBtn(color, canvasController) {
    const btn = document.createElement('div');
    const style = btn.style;
    style.width = DEFAULT_BTN_WIDTH;
    style.height = DEFAULT_BTN_WIDTH;
    style.border = '1px solid black';
    style.background = color;

    /**
     * 
     * @type {HTMLDivElement}
     * @private
     */
    this.__btn = btn;

    /**
     *
     * @type {string}
     * @private
     */
    this.__color = color;
  }

  /**
   * 
   * @return {HTMLDivElement}
   */
  ColorBtn.prototype.getBtn = function() {
    return this.__btn;
  };

  /**
   *
   * @return {string}
   */
  ColorBtn.prototype.getColor = function () {
    return this.__color;
  };


  /**
   * @extends ColorBtn
   * @constructor
   * @param {string} color
   * @param {CanvasController} canvasController
   *
   */
  function MockButton(color, canvasController) {
    ColorBtn.call(this, color, canvasController);
    this.updateColor = (color) => {
      this.getBtn().style.background = color;
    }
  }
  MockButton.prototype = Object.create(ColorBtn.prototype);


  /**
   * @extends ColorBtn
   * @constructor
   * @param {string} color
   * @param {CanvasController} canvasController
   */
  function ToggleColorBtn(color, canvasController) {
    ColorBtn.call(this, color, canvasController);
    this.getBtn().addEventListener('click', () => {
      canvasController.setColor(color);
    });
  }
  ToggleColorBtn.prototype = Object.create(ColorBtn.prototype);


  /**
   *
   * @param {number} width
   * @param {CanvasController} canvasController
   * @constructor
   */
  function Pen(width, canvasController) {
    const btn = document.createElement('div');
    const penWidthIcon = document.createElement('div');
    penWidthIcon.style.background = 'black';
    penWidthIcon.style.borderRadius = '50%';

    btn.style.width = DEFAULT_BTN_WIDTH;
    btn.style.height = DEFAULT_BTN_WIDTH;
    btn.style.border = '1px solid black';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';

    btn.appendChild(penWidthIcon);

    /**
     *
     * @type {HTMLDivElement}
     * @private
     */
    this.__btn = btn;

    /**
     *
     * @type {HTMLDivElement}
     * @private
     */
    this.__penWidthIcon = penWidthIcon;

    /**
     *
     * @type {number}
     * @private
     */
    this.__width = width;

    this.updatePenWidthIcon(width);
  }

  /**
   *
   * @return {HTMLDivElement}
   */
  Pen.prototype.getPenWidthIcon = function() {
    return this.__penWidthIcon;
  };

  /**
   * 
   * @param {number} width
   */
  Pen.prototype.updatePenWidthIcon = function(width) {
    this.getPenWidthIcon().style.width = `${width}px`;
    this.getPenWidthIcon().style.height = `${width}px`;
  };

  /**
   *
   * @return {HTMLDivElement}
   */
  Pen.prototype.getBtn = function() {
    return this.__btn;
  };

  /**
   *
   * @return {number}
   */
  Pen.prototype.getWidth = function() {
    return this.__width;
  };

  /**
   *
   * @param {number} width
   * @param {CanvasController} canvasController
   * @constructor
   * @extends Pen
   */
  function TogglePen(width, canvasController) {
    Pen.call(this, width, canvasController);
    this.getBtn().addEventListener('click', function(event) {
      canvasController.setWidth(width);
    });
  }

  TogglePen.prototype = Object.create(Pen.prototype);

  /**
   *
   * @param {number} width
   * @param {CanvasController} canvasController
   * @constructor
   * @extends Pen
   */
  function MockPen(width, canvasController) {
    Pen.call(this, width, canvasController);

    this.updateWidth = (width) => {
      this.updatePenWidthIcon(width);
    }
  }
  MockPen.prototype = Object.create(Pen.prototype);


  /////////////////////////////
  /////// INIT
  /////////////////////////////
  const localStorageDriver = localStorage;
  const story = new Story();
  const currentTabStory = new Story();
  const eventDispatcher = new EventDispatcher();
  const canvasMouse = new Mouse(eventDispatcher);
  const canvas = new CanvasController('canvas', canvasMouse, eventDispatcher);
  const colorsPlace = document.getElementById('color-btns');
  const pensPlace = document.getElementById('pens');
  const currColorPlace =  document.getElementById('curr-color');
  const currPenPlace =  document.getElementById('curr-pen');
  const btnSave =  document.getElementById('save');
  const btnClear =  document.getElementById('clear');
  const canvasDomEvents = new CanvasDomEvents(canvas, eventDispatcher);
  const storyDrawer = new StoryDrawer();
  /**
   *
   * @type {ToggleColorBtn[]}
   */
  const colors = [
    new ToggleColorBtn('black', canvas),
    new ToggleColorBtn('white', canvas),
    new ToggleColorBtn('red', canvas),
    new ToggleColorBtn('green', canvas),
    new ToggleColorBtn('blue', canvas),
  ];
  /**
   *
   * @type {Pen[]}
   */
  const pens = [
    new TogglePen(1, canvas),
    new TogglePen(3, canvas),
    new TogglePen(6, canvas),
  ];
  const defaultChosenColor = colors[0];
  const defaultChosenPen = pens[0];
  const currColor = new MockButton(defaultChosenColor.getColor(), canvas);
  const currPen = new MockPen(defaultChosenPen.getWidth(), canvas);
  canvas.setColor(defaultChosenColor.getColor());
  canvas.setWidth(defaultChosenPen.getWidth());


  /////////////////////////////
  /////// JS EVENTS INIT
  /////////////////////////////
  canvas.eventDispatcher.subscribe(CanvasController.EVENT_SET_COLOR, (color) => {
    currColor.updateColor(color);
    story.setColor(color);
    currentTabStory.setColor(color);
  });
  canvas.eventDispatcher.subscribe(CanvasController.EVENT_SET_WIDTH, (width) => {
    currPen.updateWidth(width);
    story.setWidth(width);
    currentTabStory.setColor(width);
  });
  canvasMouse.eventDispatcher.subscribe(Mouse.EVENT_SET_POINT, (x, y) => {
    story.accumulate(x, y);
    currentTabStory.accumulate(x, y);
  });
  canvasDomEvents.eventDispatcher.subscribe(CanvasDomEvents.EVENT_MOUSEUP, () => {
    story.write();
    currentTabStory.write();
  });


  /////////////////////////////
  /////// APPEND EL'S TO DOM
  /////////////////////////////
  colors.forEach((btn) => {
    colorsPlace.appendChild(btn.getBtn());
  });
  pens.forEach((btn) => {
    pensPlace.appendChild(btn.getBtn());
  });
  currColorPlace.appendChild(currColor.getBtn());
  currPenPlace.appendChild(currPen.getBtn());


  /////////////////////////////
  /////// INIT DOM EVENTS
  /////////////////////////////
  btnSave.addEventListener('click', () => {
    story.save();
    currentTabStory.save();
    localStorageDriver.setItem(Story.STORAGE_KEY_NAME, JSON.stringify(story.get()));
  });
  btnClear.addEventListener('click', () => {
    canvas.context.clearRect(0, 0, canvas.$el.width, canvas.$el.height);
    story.update([]);
    currentTabStory.update([]);
  });

  canvasDomEvents.addEvents();

  window.addEventListener('storage', (/** @type StorageEvent */event) => {
    if (document.hidden) {
      const currentTabStorySteps = currentTabStory.get();
      /**
       * @type {StoryStep[]}
       */
      const localStorageSteps = JSON.parse(event.newValue);
      const newSteps = localStorageSteps.filter(newStoryStep => {
        let exists = false;
        currentTabStorySteps.forEach((currTabStoryStep) => {
          if (currTabStoryStep.h === newStoryStep.h) {
            exists = true;
          }
        });
        return !exists;
      });

      if (newSteps.length) {
        storyDrawer.draw(newSteps, canvas);
        story.update([...story.get(), ...newSteps]);
      }
    }
  });


  /////////////////////////////
  /////// INIT STORY
  /////////////////////////////
  story.update(JSON.parse(localStorageDriver.getItem(Story.STORAGE_KEY_NAME)));
  currentTabStory.update(JSON.parse(localStorageDriver.getItem(Story.STORAGE_KEY_NAME)));
  story.setWidth(canvas.getWidth());
  story.setColor(canvas.getColor());
  const storageStorySteps = story.get();
  if (storageStorySteps && storageStorySteps.length) {
    storyDrawer.draw(storageStorySteps, canvas);
  }
};

