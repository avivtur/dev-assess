'use strict';

self.onmessage = function (e) {
  const code = e.data;
  const output = [];

  const fakeConsole = {
    log: function () {
      output.push(
        Array.from(arguments)
          .map(function (a) {
            return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
          })
          .join(' '),
      );
    },
  };

  fakeConsole.info = fakeConsole.log;
  fakeConsole.warn = fakeConsole.log;
  fakeConsole.debug = fakeConsole.log;

  fakeConsole.error = function () {
    output.push(
      'Error: ' +
        Array.from(arguments)
          .map(function (a) {
            return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
          })
          .join(' '),
    );
  };

  try {
    const fn = new Function('console', code);
    fn(fakeConsole);
    self.postMessage({ success: true, output: output.join('\n') });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    output.push('Error: ' + errMsg);
    self.postMessage({ success: false, output: output.join('\n') });
  }
};
