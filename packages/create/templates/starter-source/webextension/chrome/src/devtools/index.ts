/**
 * The devtools page, which the browser opens invisibly and which renders nothing. Its only job is to register the panel
 * the user sees, so it is an entry shell and excluded from coverage the way every other entry is.
 *
 * `void`, like the Firefox entry beside it: `@types/chrome` now answers a promise when no callback is passed, so
 * the bare call is a floating promise and this project's own lint refuses it.
 */
void chrome.devtools.panels.create('Panel', '', 'panel.html');
