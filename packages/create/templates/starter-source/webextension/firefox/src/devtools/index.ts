/**
 * The devtools page, which the browser opens invisibly and which renders nothing. Its only job is to register the panel
 * the user sees, so it is an entry shell and excluded from coverage the way every other entry is.
 *
 * `browser.*`, not `chrome.*`: Firefox declares this namespace and only this one, and its `create` returns a promise
 * rather than taking a callback.
 */
void browser.devtools.panels.create('Panel', '', 'panel.html');
