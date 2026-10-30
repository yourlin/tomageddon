/* global window */
/** Keep each art verification run on its loaded module snapshot while other batches add assets. */
export async function freezeArtHmr(page) {
  await page.evaluateOnNewDocument(() => {
    const NativeWebSocket = window.WebSocket;
    window.WebSocket = class extends NativeWebSocket {
      addEventListener(type, listener, options) {
        if (type !== 'message' || !listener) return super.addEventListener(type, listener, options);
        return super.addEventListener(
          type,
          (event) => {
            let message;
            try {
              message = JSON.parse(event.data);
            } catch {
              /* Non-JSON application traffic passes through. */
            }
            if (['update', 'full-reload', 'prune'].includes(message?.type)) return;
            if (typeof listener === 'function') listener.call(this, event);
            else listener.handleEvent(event);
          },
          options,
        );
      }
    };
  });
}

/** Bound teardown of the verifier's own browser when Chrome has already exited. */
export async function closeArtBrowser(browser) {
  let timer;
  try {
    await Promise.race([
      browser.close(),
      new Promise((resolve) => {
        timer = setTimeout(resolve, 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    const child = browser.process();
    if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    let disconnectTimer;
    try {
      await Promise.race([
        browser.disconnect(),
        new Promise((resolve) => {
          disconnectTimer = setTimeout(resolve, 1000);
        }),
      ]);
    } finally {
      clearTimeout(disconnectTimer);
      // Chrome can exit while its pipe transport still keeps Node alive.
      // These streams belong only to the verifier's browser, after teardown.
      for (const stream of child?.stdio ?? []) stream?.destroy?.();
      child?.unref();
    }
  }
}

/** Context teardown may outlive Chrome; never block completed assertions indefinitely. */
export async function closeArtContext(context) {
  let timer;
  try {
    await Promise.race([
      context.close(),
      new Promise((resolve) => {
        timer = setTimeout(resolve, 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
