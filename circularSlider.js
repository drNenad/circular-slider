class CircularSlider {
  /**
   * @constructor
   *
   * @param { Array<{ color, range, step, radius, description }> } slides
   * @param { HTMLElement } container
   */
  constructor(slides, container) {
    this.slides = slides;
    this.container = container;
    this.svgContainer = null; // used to append group of slides
    this.uiContainer = document.createElement('div'); // used to append slides values

    this.sliderWidth = 400;
    this.sliderHeight = 400;

    this.init();
    this.draw();
  }
  init() {
    this.initSliderContainer();
    this.initSlides();
  }
  initSliderContainer() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svg.setAttribute('width', this.sliderWidth);
    svg.setAttribute('height', this.sliderHeight);

    this.svgContainer = svg;
  }
  initSlides() {
    this.slides.forEach(slide => {
      return new Slide({ ...slide, container: this.svgContainer, uiContainer: this.uiContainer });
    });
  }
  draw() {
    this.container.appendChild(this.uiContainer);
    this.container.appendChild(this.svgContainer);
  }
}

class Slide {
  /**
   * @constructor
   *
   * @param { HTMLElement } container
   * @param { HTMLElement } uiContainer
   * @param { String } color
   * @param { Object } range
   * @param { Number } step
   * @param { Number } radius
   * @param { String } description
   */
  constructor({ container, uiContainer, color, range, step, radius, description } = {}) {
    this.container = container;
    this.uiContainer = uiContainer;
    this.color = color;
    this.min = range.min ?? 0;
    this.max = range.max ?? 10;
    this.step = step || 1;
    this.radius = radius || 50;
    this.description = description || '';

    this.group = null;                                                // svg group element to append all slide elements.
    this.progressCircle = null;                                       // svg path element used to show current progress.
    this.handler = null;                                              // svg circle element used to change current progress.
    this.slideUI = null;                                              // slide UI class object, used to update the value in realtime.
    this.mouseDownActive = false;                                     // used to determine is user holding left click.

    this.cx = container.getAttribute('width') / 2;                    // x coordinate of the center of parent svg container.
    this.cy = container.getAttribute('height') / 2;                   // y coordinate of the center of parent svg container.
    this.totalSteps = Math.ceil((this.max - this.min) / this.step);   // total steps of the slide progress.
    this.stepAngle = 360 / this.totalSteps;                           // Angle from the beginning of the circle to the first step.
    this.circumference = 2 * Math.PI * this.radius;
    this.currentAngle = 0;                                            // last clicked angle on the slide.
    this.strokeWidth = 20;
    this.strokeBgColor = '#cecfd1';
    this.handlerRadius = 13;

    this.init();
    this.draw();
  }
  init() {
    this.initSlideContainer();
    this.drawBackgroundCircle();
    this.drawProgressCircle();
    this.drawHandler();
    this.initEventListeners();
    this.initSlideUI();
  }
  draw() {
    this.container.appendChild(this.group);
  }
  initSlideContainer() {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    group.setAttribute('transform', `rotate(-90, ${ this.cx }, ${ this.cy })`);

    this.group = group;
  }
  drawBackgroundCircle() {
    const path = this.createCirclePath({
      color: this.strokeBgColor
    });

    this.group.appendChild(path);
  }
  drawProgressCircle() {
    const path = this.createCirclePath({
      endAngle: 0
    });

    this.progressCircle = path;
    this.group.appendChild(path);
  }
  drawHandler() {
    const handler = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const { x, y } = this.calculateHandlerPosition();

    handler.setAttribute('cx', x);
    handler.setAttribute('cy', y);
    handler.setAttribute('fill', '#f0f0f0');
    handler.setAttribute('stroke', this.strokeBgColor);
    handler.setAttribute('r', this.handlerRadius);

    this.handler = handler;
    this.group.appendChild(handler);
  }
  /**
   * Helper function used to create circular svg path element.
   *
   * @param { Number } x - x coordinate of center of the circle
   * @param { Number } y - y coordinate of center of the circle
   * @param { String } color - outline color of the circle
   * @param { Number } radius
   * @param { Number } startAngle
   * @param { Number } endAngle
   *
   * @returns { SVGPathElement } path
   */
  createCirclePath({
                     x = this.cx,
                     y = this.cy,
                     color = this.color,
                     radius = this.radius,
                     startAngle = 0,
                     endAngle = 360
                   } = {}) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', this.strokeWidth);
    path.setAttribute('fill', 'none');
    path.setAttribute('r', radius);
    path.setAttribute('stroke-dasharray', `${ this.circumference / (this.totalSteps) } 1`);
    path.setAttribute('d', this.calculateDescribeAttribute({ x, y, radius, startAngle, endAngle }));

    return path;
  }
  /**
   * Helper function used to calculate values of path dimension attribute.
   *
   * @param { Number } x - x coordinate of center of the circle
   * @param { Number } y - y coordinate of center of the circle
   * @param { Number } radius
   * @param { Number } startAngle
   * @param { Number } endAngle
   *
   * @returns { String } d - attribute value
   */
  calculateDescribeAttribute({
                   x = this.cx,
                   y = this.cy,
                   radius = this.radius,
                   startAngle = 0,
                   endAngle = 360
                 } = {}) {
    const fullCircle = endAngle - startAngle === 360;
    const start = this.polarToCartesian({ x, y, radius, angleInDegrees: endAngle - 0.01 });
    const end = this.polarToCartesian({ x, y, radius, angleInDegrees: startAngle });
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';

    let d = `M ${ start.x } ${ start.y } A ${ radius } ${ radius } 0 ${ largeArc } 0 ${ end.x } ${ end.y }`;

    if (fullCircle) {
      d += 'z';
    }

    return d;
  }
  /**
   * Convert from Polar coordinates (r,θ) to Cartesian coordinates (x,y).
   *
   * @param { Number } centerX - x coordinate of center of the circle
   * @param { Number } centerY - y coordinate of center of the circle
   * @param { Number } radius
   * @param { Number } angleInDegrees
   *
   * @returns { Object } { x, y } - Cartesian coordinates
   */
  polarToCartesian({
                     centerX = this.cx,
                     centerY = this.cy,
                     radius = this.radius,
                     angleInDegrees = 0
                   } = {}) {
    const angle = this.angleInRadians(angleInDegrees);

    return {
      x: centerX + (radius * Math.cos(angle)),
      y: centerY + (radius * Math.sin(angle))
    };
  }
  /**
   * Convert angle from degree to radians.
   *
   * @param { Number } angleInDegrees
   * @returns { Number } - angleInRadians
   */
  angleInRadians(angleInDegrees = 0) {
    return angleInDegrees * Math.PI / 180;
  }
  /**
   * Helper function use to return Cartesian coordinates of the handler from given circle angle.
   *
   * @param { Number } angle
   * @returns { Object } { x, y } - Cartesian coordinates of the handler
   */
  calculateHandlerPosition(angle = 0) {
    const x = this.cx + this.radius * Math.cos(this.angleInRadians(angle));
    const y = this.cy + this.radius * Math.sin(this.angleInRadians(angle));

    return { x, y };
  }
  initSlideUI() {
    this.slideUI = new SlideUI({ color: this. color, description: this.description }, this.uiContainer);
    this.slideUI.setValue(this.min);
  }
  initEventListeners() {
    this.group.addEventListener('mousedown', this.sliderTouchStart.bind(this), false);
    this.container.addEventListener('mousemove', this.sliderTouchMove.bind(this), false);
    this.container.addEventListener('mouseup', this.sliderTouchEnd.bind(this), false);
  }
  sliderTouchStart(e) {
    e.preventDefault();

    this.mouseDownActive = true;

    this.updateSlide(e);
  }
  sliderTouchMove(e) {
    e.preventDefault();

    if (!this.mouseDownActive) { return; }

    this.updateSlide(e);
  }
  sliderTouchEnd(e) {
    e.preventDefault();

    this.mouseDownActive = false;

    this.changeProgressCircleValue(this.currentAngle);
    this.changeHandlerPosition(this.currentAngle);
  }
  /**
   * Find x and y coordinates, calculate clicked angle and update slide elements.
   *
   * @param { EventListenerObject } e
   */
  updateSlide(e) {
    const x = e.clientX;
    const y = e.clientY;
    const clickedAngle = this.calcAngle(x, y);
    const currentStep = Math.round(clickedAngle / this.stepAngle); // calculate current step from clicked angle
    this.currentAngle = currentStep * this.stepAngle; // set angle of current step

    this.changeProgressCircleValue(clickedAngle);
    this.changeHandlerPosition(clickedAngle);
    this.changeUIValue(currentStep);
  }
  /**
   * Change progress circle value using given angle.
   *
   * @param { Number } angle
   */
  changeProgressCircleValue(angle= 0) {
    this.progressCircle.setAttribute('d', this.calculateDescribeAttribute({
      endAngle: angle
    }));
  }
  /**
   * Change handler position using given angle.
   *
   * @param { Number } angle
   */
  changeHandlerPosition(angle = 0) {
    const { x, y } = this.calculateHandlerPosition(angle);

    this.handler.setAttribute('cx', x);
    this.handler.setAttribute('cy', y);
  }
  /**
   * Calculate angle on of the circle from beginning point to the point we passed as functions parameter.
   *
   * @param { Number } x - x coordinates of the point on the circle.
   * @param { Number } y - y coordinates of the point on the circle.
   *
   * @returns { Number } angle
   */
  calcAngle(x, y) {
    // get svg group element and calculate center coordinates(cx, cy).
    const container = this.group.getBoundingClientRect();
    let cx = container.x + container.width / 2;
    let cy = container.y + container.height / 2;

    // calculate distance from the center of the circle to the given point.
    let dx = x - cx;
    let dy = y - cy;

    // calculate the angle.
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;

    if (angle < 0) {
      angle += 360;
    }

    return angle;
  }
  /**
   * Calculate slide progress value from current step and change it in the slide ui.
   *
   * @param { Number } currentStep.
   */
  changeUIValue(currentStep) {
    let price = this.min + currentStep * this.step;

    if (price > this.max) {
      price = this.max;
    }

    this.slideUI.setValue(price);
  }
}

class SlideUI {
  /**
   * @constructor
   *
   * @param { Object } slide
   * @param { HTMLElement } container
   */
  constructor({ color, description }, container) {
    this.state = {
      value: 0
    };

    this.container = container;
    this.color = color || '#ffffff';
    this.description = description || '';
    this.slideUIWrapper = document.createElement('div');   // div element used to append all slide ui elements.
    this.valuePlaceholder = document.createElement('p');   // paragraph element to display slide value.
    this.valueSymbol = '$';                                           // default value symbol.

    this.init();
    this.draw();
  }
  init() {
    this.initSlideUIWrapper();
    this.initUIValueSymbol();
    this.initUIValue();
    this.initUIColor();
    this.initUIDescription();
  }
  draw() {
    this.container.appendChild(this.slideUIWrapper);
  }
  initSlideUIWrapper() {
    this.container.className = 'slider-ui-container';
    this.slideUIWrapper.className = 'slide-ui-wrapper';
  }
  initUIValueSymbol() {
    const symbol = document.createElement('span');
    symbol.className = 'slide-ui-symbol';
    symbol.innerText = this.valueSymbol;

    this.slideUIWrapper.appendChild(symbol);
  }
  initUIValue() {
    this.setValue(this.state.value);

    this.slideUIWrapper.appendChild(this.valuePlaceholder);
  }
  initUIColor() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    svg.setAttribute('width', '10');
    svg.setAttribute('height', '10');
    rect.setAttribute('width', '10');
    rect.setAttribute('height', '10');
    rect.setAttribute('fill', this.color);

    svg.appendChild(rect);
    this.slideUIWrapper.appendChild(svg);
  }
  initUIDescription() {
    const description = document.createElement('span');

    description.innerText = this.description;

    this.slideUIWrapper.appendChild(description);
  }
  setValue(value) {
    this.valuePlaceholder.innerText = value;
  }
}
