import React from 'react';
import { shallow } from 'enzyme';

import PieChart from '../index';
import PieChartPath from '../ReactMinimalPieChartPath';

const dataMock = [
  { value: 10, color: 'blue' },
  { value: 15, color: 'orange' },
  { value: 20, color: 'green' },
];

const styleMock = {
  color: 'green',
}

jest.useFakeTimers();

beforeAll(() => {
  global.requestAnimationFrame = (callback) => {callback(); return 'id';};
})

describe('ReactMinimalPieChart component', () => {
  it('Should return null if props.data is undefined', () => {
    const wrapper = shallow(
      <PieChart />
    );

    expect(wrapper.getNode()).toEqual(null);
  });

  it('Should return a Path component for each entry in props.data', () => {
    const wrapper = shallow(
      <PieChart
        data={dataMock}
      />
    );

    const pathElements = wrapper.find('ReactMinimalPieChartPath');
    expect(pathElements.length).toEqual(dataMock.length);
  });

  it('Should pass down className and style props to the wrapping div', () => {
    const wrapper = shallow(
      <PieChart
        data={dataMock}
        className="foo"
        style={styleMock}
      />
    );

    expect(wrapper.prop('className')).toBe('foo');
    expect(wrapper.prop('style')).toEqual(styleMock);
  });

  describe('<svg> ratio', () => {
    it('Should be horizontal when "ratio" > 1', () => {
      const wrapper = shallow(
        <PieChart
          data={dataMock}
          ratio={4}
          />
      );

      const svg = wrapper.find('svg').first();
      expect(svg.prop('viewBox')).toBe('0 0 100 25');
    });

    it('Should be certical when "ratio" < 1', () => {
      const wrapper = shallow(
        <PieChart
          data={dataMock}
          ratio={1/10}
          />
      );

      const svg = wrapper.find('svg').first();
      expect(svg.prop('viewBox')).toBe('0 0 10 100');
    });
  });

  describe('Partial circle', () => {
    it('Should render a set of arc paths having total lengthAngle === 270°', () => {
      const pieLengthAngle = 270;
      let pathsTotalLengthAngle = 0;

      const wrapper = shallow(
        <PieChart
          data={dataMock}
          lengthAngle={pieLengthAngle}
        />
      );

      const paths = wrapper.find('ReactMinimalPieChartPath');
      paths.forEach((path) => {
        pathsTotalLengthAngle += path.prop('lengthAngle');
      });

      expect(pieLengthAngle).toEqual(pathsTotalLengthAngle);
    });

    it('Should render a set of arc paths having total negative lengthAngle === -270°', () => {
      const pieLengthAngle = -270;
      let pathsTotalLengthAngle = 0;

      const wrapper = shallow(
        <PieChart
          data={dataMock}
          lengthAngle={pieLengthAngle}
          />
      );

      const paths = wrapper.find('ReactMinimalPieChartPath');
      paths.forEach((path) => {
        pathsTotalLengthAngle += path.prop('lengthAngle');
      });

      expect(pieLengthAngle).toEqual(pathsTotalLengthAngle);
    });

    it('Should render a set of arc paths + paddings having total lengthAngle === 270°', () => {
      const pieLengthAngle = 270;
      let pathsTotalLengthAngle = 0;
      const totalPaddingDegrees = 10 * dataMock.length;

      const wrapper = shallow(
        <PieChart
          data={dataMock}
          lengthAngle={pieLengthAngle}
          paddingAngle={10}
          />
      );

      const paths = wrapper.find('ReactMinimalPieChartPath');
      paths.forEach((path) => {
        pathsTotalLengthAngle += path.prop('lengthAngle');
      });

      expect(pieLengthAngle).toEqual(pathsTotalLengthAngle + totalPaddingDegrees);
    });
  });

  it('Should append children paths a "transition" inline style prop with custom duration/easing', () => {
    const wrapper = shallow(
      <PieChart
        data={dataMock}
        animate
        animationDuration={100}
        animationEasing="ease"
      />
    );
    const firstPath = wrapper.find('ReactMinimalPieChartPath').first();

    const expected = 'stroke-dashoffset 100ms ease';
    const actual = firstPath.prop('style').transition;
    expect(actual).toEqual(expected);
  });

  it('Should pass down to each segment the custom "reveal" prop', () => {
    const wrapper = shallow(
      <PieChart
        data={dataMock}
        reveal={22}
      />
    );

    wrapper.find('ReactMinimalPieChartPath').forEach((path) => {
      expect(path.prop('reveal')).toBe(22);
    });
  });

  it('Should animate path on mount by rendering twice and setting "reveal" from 0 to 100', () => {
    const wrapper = shallow(
      <PieChart
        data={dataMock}
        animate
      />
    );
    let firstPath = wrapper.find('ReactMinimalPieChartPath').first();
    expect(firstPath.prop('reveal')).toEqual(0);

    // Manually fire componentDidMount hook
    wrapper.instance().componentDidMount();
    jest.runAllTimers();

    firstPath = wrapper.find('ReactMinimalPieChartPath').first();
    expect(firstPath.prop('reveal')).toEqual(100);
  });

  it('Should not fire forceUpdate on unmounted component', () => {
    const wrapper = shallow(
      <PieChart
        data={dataMock}
        animate
      />
    );

    const chartInstance = wrapper.instance();
    chartInstance.startAnimation = jest.fn();

    // Simulate edge case of animation fired after component was unmounted
    // See: https://github.com/toomuchdesign/react-react-minimalm-pie-chart/issues/8
    chartInstance.componentDidMount();
    wrapper.unmount();
    jest.runAllTimers();

    expect(chartInstance.startAnimation).not.toHaveBeenCalled();
  });

  describe('Mouse interactions', () => {
    [
      {eventName: 'onClick', enzymeAction: 'click'},
      {eventName: 'onMouseOver', enzymeAction: 'mouseover'},
      {eventName: 'onMouseOut', enzymeAction: 'mouseout'},
    ].forEach(test => {
      describe(test.eventName, () => {
        it('Should its interaction callback with expected arguments', () => {
          const eventMock = jest.fn();
          const eventCallbackMock = jest.fn();
          const wrapper = shallow(
            <PieChart
              data={dataMock}
              onClick={eventCallbackMock}
              onMouseOver={eventCallbackMock}
              onMouseOut={eventCallbackMock}
            />
          );

          const segment = wrapper.find(PieChartPath).first();
          segment.simulate(test.enzymeAction, eventMock);

          expect(eventCallbackMock).toHaveBeenCalledTimes(1);
          expect(eventCallbackMock).toHaveBeenLastCalledWith(
            eventMock,
            dataMock,
            0
          );
        })
      })
    })
  })
});
