import '../testHelper';

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
global.IS_REACT_ACT_ENVIRONMENT = true;

const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
const TestUtils = require('react-dom/test-utils');
const DatePicker = require('../../app/assets/javascripts/components/common/date_picker.jsx').default;

// Redux Store
const { Provider } = require('react-redux');
const { createStore, applyMiddleware } = require('redux');
const thunk = require('redux-thunk').default;
const reducer = require('../../app/assets/javascripts/reducers').default;


const renderComponent = (props = {}) => {
    const store = createStore(reducer, applyMiddleware(thunk));

    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
        createRoot(container).render(
            React.createElement(Provider, { store },
                React.createElement(DatePicker, props))
        );
    });

    return container;
}


describe('DatePicker timezone handling', () => {

    test('date-only value (showTime=false) displays the correct day, unshifted', () => {
        // Saved as midnight UTC on April 2nd, like a real timeline_start value from the server
        const savedValue = '2019-04-02T00:00:00.000Z';

        const container = renderComponent({
            id: 'test-date',
            value: '2019-04-02T00:00:00.000Z',
            value_key: 'timeline_start',
            editable: true,
            showTime: false,
            onChange: () => { }
        });

        const input = container.querySelector('input.timeline_start');
        // Should show April 2nd, no matter what timezone this test runs under
        expect(input.value).toBe('2019-04-02');
    });

    test('date-only value (showTime=false): typing a new date sends a UTC value with no local offset', () => {
        let sentValue = null;

        const container = renderComponent({
            id: 'test-date',
            value: '2019-04-02T00:00:00.000Z',
            value_key: 'timeline_start',
            editable: true,
            showTime: false,
            onChange: (key, value) => { sentValue = value; }
        });

        const input = container.querySelector('input.timeline_start');

        act(() => {
            TestUtils.Simulate.change(input, { target: { value: '2019-04-03' } });
        });
        act(() => {
            TestUtils.Simulate.blur(input);
        });

        // Should send April 3rd, locked to UTC, no local timezone offset attached
        expect(sentValue).toBe('2019-04-03T00:00:00.000Z');
    });

    test('timed value (showTime=true) displays the correct local hour, not shifted to UTC', () => {
        // 15:30 UTC on April 2nd -- what this looks like locally depends on the test machine's TZ
        const savedValue = '2019-04-02T15:30:00.000Z';
        const expectedLocalHour = new Date(savedValue).getHours();

        const container = renderComponent({
            id: 'test-timed',
            value: savedValue,
            value_key: 'meetings_timeline_start',
            editable: true,
            showTime: true,
            onChange: () => { }
        });

        const hourSelect = container.querySelector('select.time-input__hour');
        expect(Number(hourSelect.value)).toBe(expectedLocalHour);
    });
});
