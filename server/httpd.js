'use strict';

import fs from 'fs';
import {createServer, STATUS_CODES, get as getRequest} from 'http';
import {join} from 'path';
import objectAssign from 'object-assign';

const cwd = process.cwd();

let customSettings;

try {
  const customSettingsPath = join(__dirname, 'settings.js');
  customSettings = require(customSettingsPath);
} catch (e) {
  console.warn(`could not find ${join(cwd, 'settings.js')}`);
  console.warn('trying to start with exampleSettings, errors ahead!');
}

const exampleSettingsPath = join(cwd, 'server', 'settings.example.js');
const exampleSettings = require(exampleSettingsPath);

const settings = objectAssign(exampleSettings || {}, customSettings || {});

const contentTypes = {
  html: 'text/html;charset=UTF-8',
  js: 'application/javascript',
  json: 'application/json;charset=UTF-8',
  svg: 'image/svg+xml',
  ico: 'image/vnd.microsoft.icon',
  txt: 'text/plain;charset=UTF-8',
  css: 'text/css',
};

const arc = { // Api response cache
  pending: [],             // Set of pending response objects
  lastUpdate: 0,          // Date.now() of the last completed update
  updating: false,         // Currently running an update()?
  bufferedResponse: null, // The concatenated response
  contentType: null,      // The content-type that was sent by the server
  data: null,              // The data being cached (concatenated when sent)

  // Deliver a cached response or add the response object to the set of
  // Pending response handles and trigger an API update
  add(response) {
    // Cached API response not yet expired? Deliver it right away.
    if (Date.now() - arc.lastUpdate < settings.cache.msec) {
      arc.deliver(response);
      return true;
    }

    arc.pending.push(response);
    arc.update();
    return false;
  },

  // Flush all pending response objects with the buffered response
  flush() {
    arc.pending.forEach(arc.deliver);
  },

  // Remove a response from the list of pending response handles
  remove(response) {
    const idx = arc.pending.indexOf(response);
    if (idx > -1) {
      arc.pending.pop(idx);
    }
  },

  // Deliver a response from the cache and remove the response handle
  // From pending if applicable
  deliver(response) {
    sendResponse(response, arc.bufferedResponse, arc.contentType, 200);
    arc.remove(response);
  },

  // Send an API request, queue data in arc.data
  update() {
    // Update already in progress?
    if (arc.updating) {
      return;
    }

    arc.updating = true;
    arc.data = [];

    getRequest(settings.api.url, (response) => {
      response.on('data', (chunk) => {
        if (response.statusCode !== 200) {
          return response.emit('error');
        }

        arc.contentType = response.headers['content-type'];
        arc.data.push(chunk);
      }).on('end', () => {
        arc.bufferedResponse = Buffer.concat(arc.data);
        arc.flush();
        arc.data = null;
        arc.lastUpdate = Date.now();
        arc.updating = false;
      }).on('error', (e) => {
        console.log(`API: update failed: ${e}`);
        arc.updating = false;
      });

    }).on('error', (e) => {
      console.log(`API: update failed ${e}`);
      arc.updating = false;
    });
  },
};

function sendResponse(response, body, contentType, statusCode) {
  response.writeHead(statusCode, {
    'Content-Length': body.length,
    'Content-Type': contentType,
  });
  response.end(body);
}

function sendError(response, code) {
  const m = `${code} ${STATUS_CODES[code]}`;
  const html = `<!DOCTYPE html>
<html>
  <head>
    <link rel="icon" href="/favicon.ico" />
    <title>${m}</title>
  </head>
  <body>
    <h1>${m}</h1>
  </body>
</html>`;
  sendResponse(response, html, 'text/html', code);
}

function tryStaticFile(response, path) {
  try {
    const extension = path.split('.').pop();
    const ct = contentTypes[extension] || 'application/octet-stream';
    const filePath = join(process.cwd(), 'site', path);
    const buf = fs.readFileSync(filePath);
    sendResponse(response, buf, ct, 200);
    console.log(`Hit: ${path}`);
  } catch (e) {
    console.log(`Miss: ${path}: ${e}`);
    sendError(response, 404);
  }
}

function handleRequest(request, response) {
  let path = request.url.split('?')[0];

  if (path === '/robots.txt') {
    return sendError(response, 404); // Don't log these
  }

  if (path[path.length - 1] === '/') {
    path += 'index.html';
  }

  if (path === '/api') {
    const r = arc.add(response) ? ' (cached)' : '';
    console.log(`Hit: ${path}${r}`);

  // Deadsimple directory traversal prevention
  } else if (path.indexOf('..') === -1) {
    tryStaticFile(response, path);
  } else {
    console.log(`Miss: ${path} (possible directory traversal)`);
    sendError(response, 403);
  }
}

createServer(handleRequest)
  .listen(settings.server.port, () => {
    console.log(`server listening to 0.0.0.0:${settings.server.port}`);
  });
