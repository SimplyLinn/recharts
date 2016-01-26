import React, { PropTypes } from 'react';
import DOMUtils from '../util/DOMUtils';
import pureRender from 'pure-render-decorator';
import ReactUtils, { PRESENTATION_ATTRIBUTES } from '../util/ReactUtils';

@pureRender
class CartesianAxis extends React.Component {

  static displayName = 'CartesianAxis';

  static propTypes = {
    ...PRESENTATION_ATTRIBUTES,
    x: PropTypes.number,
    y: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    orient: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    viewBox: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
    }),
    label: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object,
      PropTypes.element,
    ]),

    axisLine: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    tickLine: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),

    minLabelGap: PropTypes.number,
    ticks: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.any,
      coord: PropTypes.value,
    })),
    tickSize: PropTypes.number,
    tickFormatter: PropTypes.func,
    interval: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  };

  static defaultProps = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    viewBox: { x: 0, y: 0, width: 0, height: 0 },
    // The orientation of axis
    orient: 'bottom',
    // The ticks
    ticks: [],

    stroke: '#666',
    tickLine: true,
    axisLine: true,
    label: true,

    minLabelGap: 5,
    // The width or height of tick
    tickSize: 6,
    interval: 'auto',
  };

  static getTicks(props) {
    const { ticks, viewBox, minLabelGap, orient, interval } = props;

    if (!ticks || !ticks.length) { return [];}

    return interval === +interval && interval >= 0
        ? CartesianAxis.getNumberIntervalTicks(ticks, interval)
        : CartesianAxis.getAutoIntervalTicks(ticks, viewBox, orient, minLabelGap);
  }

  static getNumberIntervalTicks(ticks, interval) {
    return ticks.filter((entry, i) => {
      return i % (interval + 1) === 0;
    });
  }

  static getAutoIntervalTicks(ticks, viewBox, orient, minLabelGap) {
    const { x, y, width, height } = viewBox;
    const sizeKey = (orient === 'top' || orient === 'bottom') ? 'width' : 'height';
    const sign = ticks.length >= 2 ? Math.sign(ticks[1].coord - ticks[0].coord) : 1;

    let pointer;

    if (sign === 1) {
      pointer = sizeKey === 'width' ? x : y;
    } else {
      pointer = sizeKey === 'width' ? x + width : y + height;
    }

    return ticks.filter(entry => {
      const labelSize = DOMUtils.getStringSize(entry.value)[sizeKey];
      const isShow = sign === 1 ? (entry.coord - labelSize / 2) >= pointer : (entry.coord + labelSize / 2) <= pointer;

      if (isShow) {
        pointer = entry.coord + sign * labelSize / 2 + minLabelGap;
      }

      return isShow;
    });
  }
  /**
   * Calculate the coordinates of endpoints in ticks
   * @param  {Object} data The data of a simple tick
   * @return {Object} (x1, y1): The coordinate of endpoint close to label text (x2, y2): The coordinate of endpoint close to axis
   */
  getTickLineCoord(data) {
    const { x, y, width, height, orient, tickSize } = this.props;
    let x1;
    let x2;
    let y1;
    let y2;

    const finalTickSize = data.tickSize || tickSize;

    switch (orient) {
      case 'top':
        x1 = x2 = data.coord;
        y1 = y + height - finalTickSize;
        y2 = y + height;
        break;
      case 'left':
        y1 = y2 = data.coord;
        x1 = x + width - finalTickSize;
        x2 = x + width;
        break;
      case 'right':
        y1 = y2 = data.coord;
        x1 = x + finalTickSize;
        x2 = x;
        break;
      default:
        x1 = x2 = data.coord;
        y1 = y + finalTickSize;
        y2 = y;
        break;
    }

    return { x1, y1, x2, y2 };
  }

  getBaseline() {
    const { orient } = this.props;
    let baseline;

    switch (orient) {
      case 'top':
        baseline = 'auto';
        break;
      case 'bottom':
        baseline = 'text-before-edge';
        break;
      default:
        baseline = 'central';
        break;
    }

    return baseline;
  }

  getTickTextAnchor() {
    const { orient } = this.props;
    let textAnchor;

    switch (orient) {
      case 'left':
        textAnchor = 'end';
        break;
      case 'right':
        textAnchor = 'start';
        break;
      default:
        textAnchor = 'middle';
        break;
    }

    return textAnchor;
  }

  getDy() {
    const { orient } = this.props;
    let dy = 0;

    switch (orient) {
      case 'left':
      case 'right':
        dy = 8;
        break;
      case 'top':
        dy = -2;
        break;
      default:
        dy = 15;
        break;
    }

    return dy;
  }

  renderAxisLine() {
    const { x, y, width, height, orient, stroke, axisLine } = this.props;
    let props = { stroke, ...ReactUtils.getPresentationAttributes(axisLine)};

    switch (orient) {
      case 'top':
        props = { ...props, x1: x, y1: y + height, x2: x + width, y2: y + height };
        break;
      case 'left':
        props = { ...props, x1: x + width, y1: y, x2: x + width, y2: y + height };
        break;
      case 'right':
        props = { ...props, x1: x, y1: y, x2: x, y2: y + height };
        break;
      default:
        props = { ...props, x1: x, y1: y, x2: x + width, y2: y };
        break;
    }

    return <line className="axis-line" {...props}/>;
  }

  renderTicks() {
    const { ticks, tickFormatter, tickLine, stroke, label } = this.props;

    if (!ticks || !ticks.length) { return null; }

    const finalTicks = CartesianAxis.getTicks(this.props);

    const textAnchor = this.getTickTextAnchor();
    const axisProps = ReactUtils.getPresentationAttributes(this.props);
    const customLabelProps = ReactUtils.getPresentationAttributes(label);
    const isLabelElement = React.isValidElement(label);
    const tickLineProps = ReactUtils.getPresentationAttributes(tickLine);

    const items = finalTicks.map((entry, i) => {
      const lineCoord = this.getTickLineCoord(entry);
      const tickProps = { stroke, ...tickLineProps, ...lineCoord, }
      const labelProps = {
        dy: this.getDy(entry),
        textAnchor,
        ...axisProps,
        stroke: 'none',
        fill: stroke,
        ...customLabelProps,
        index: i,
        x: lineCoord.x1,
        y: lineCoord.y1,
        payload: entry,
      };

      return (
        <g className="axis-tick" key={'tick-' + i}>
          {tickLine && <line className="tick-line" {...tickProps}/>}
          {isLabelElement ? React.cloneElement(label, labelProps) : (
            <text {...labelProps} className="tick-value">
              {tickFormatter ? tickFormatter(entry.value) : entry.value}
            </text>
          )}
        </g>
      );
    });

    return (
      <g className="axis-ticks">
        {items}
      </g>
    );
  }

  render() {
    const { axisLine, width, height, ticks } = this.props;

    if (width <= 0 || height <= 0 || !ticks || !ticks.length) {
      return null;
    }

    return (
      <g className="layer-axis layer-cartesian-axis">
        {axisLine && this.renderAxisLine()}
        {this.renderTicks()}
      </g>
    );
  }
}

export default CartesianAxis;