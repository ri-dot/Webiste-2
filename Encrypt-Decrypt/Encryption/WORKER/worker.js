// minified version of https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
(function(w){"use strict";var b64={},base64abc=["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9","+","/"],base64codes=[255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,62,255,255,255,63,52,53,54,55,56,57,58,59,60,61,255,255,255,0,255,255,255,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,255,255,255,255,255,255,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51];function getBase64Code(e){if(e>base64codes.length)throw new Error("Unable to parse base64 string.");var a=base64codes[e];if(255===a)throw new Error("Unable to parse base64 string.");return a}function bytesToBase64(e){var a,s="",t=e.length;for(a=2;a<t;a+=3)s+=base64abc[e[a-2]>>2],s+=base64abc[(3&e[a-2])<<4|e[a-1]>>4],s+=base64abc[(15&e[a-1])<<2|e[a]>>6],s+=base64abc[63&e[a]];return a===t+1&&(s+=base64abc[e[a-2]>>2],s+=base64abc[(3&e[a-2])<<4],s+="=="),a===t&&(s+=base64abc[e[a-2]>>2],s+=base64abc[(3&e[a-2])<<4|e[a-1]>>4],s+=base64abc[(15&e[a-1])<<2],s+="="),s}function base64ToBytes(e){if(e.length%4!=0)throw new Error("Unable to parse base64 string.");var a=e.indexOf("=");if(-1!==a&&a<e.length-2)throw new Error("Unable to parse base64 string.");for(var s,t=e.endsWith("==")?2:e.endsWith("=")?1:0,r=e.length,o=new Uint8Array(r/4*3),n=0,b=0;n<r;n+=4,b+=3)s=getBase64Code(e.charCodeAt(n))<<18|getBase64Code(e.charCodeAt(n+1))<<12|getBase64Code(e.charCodeAt(n+2))<<6|getBase64Code(e.charCodeAt(n+3)),o[b]=s>>16,o[b+1]=s>>8&255,o[b+2]=255&s;return o.subarray(0,o.length-t)}function base64encode(e){return bytesToBase64((arguments.length>1&&void 0!==arguments[1]?arguments[1]:new TextEncoder).encode(e))}function base64decode(e){return(arguments.length>1&&void 0!==arguments[1]?arguments[1]:new TextDecoder).decode(base64ToBytes(e))}b64.bytesToBase64=bytesToBase64;b64.base64ToBytes=base64ToBytes;b64.base64encode=base64encode;b64.base64decode=base64decode;w.b64=b64})(this);

async function encrypt(text, b64Key) {
  const key = await crypto.subtle.importKey(
    "raw",
    b64.base64ToBytes(b64Key),
    {name: "AES-GCM"},
    false,
    ["encrypt"]
  );
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    enc.encode(text)
  );

  const result = new Uint8Array(iv.length + ciphertext.byteLength);
  result.set(iv);
  result.set(new Uint8Array(ciphertext), iv.length);

  return b64.bytesToBase64(result);
}

async function decrypt(encryptedText, b64Key) {
  const key = await crypto.subtle.importKey(
    "raw",
    b64.base64ToBytes(b64Key),
    {name: "AES-GCM"},
    false,
    ["decrypt"]
  );
  const encryptedBytes = b64.base64ToBytes(encryptedText);
  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    ciphertext
  );
  const dec = new TextDecoder();

  return dec.decode(decrypted);
}

async function generateKey() {
  const key = await crypto.subtle.generateKey(
    {
        name: "AES-GCM",
        length: 256,
    },
    true,
    ["encrypt"] // Chrome doesn't like when it's empty
  );
  const rawKey = await crypto.subtle.exportKey("raw", key);
  return b64.bytesToBase64(new Uint8Array(rawKey));
}

const KEY = "ia5F8X87kETlE8Be7VD4KtmTwuKdNZsuKLfLTizNkd4=";

async function encode(text) {
  return encrypt(text, KEY);
}

async function decode(encoded) {
  return decrypt(encoded, KEY);
}

/* END OF DECRYPT FUNCTIONS */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST"
};
const DEFAULT_HEADERS = Object.assign({
  "Content-Type": "application/json"
}, CORS_HEADERS);
const VERSION = 4;

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
});

function fail(reason, status) {
  return new Response(
    JSON.stringify({status: "error", reason: reason, version: VERSION}),
    {
      status: status || 400,
      headers: DEFAULT_HEADERS
    }
  );
}

function success(data, status) {
  return new Response(
    JSON.stringify({status: "ok", data: data, version: VERSION}),
    {
      status: status || 200,
      headers: DEFAULT_HEADERS
    }
  );
}

async function apiRequest(auth, path, options) {
  const opt = options || {};
  opt.headers = opt.headers || {};
  opt.headers.Authorization = opt.headers.Authorization || `Bearer ${auth}`;
  opt.headers.Accept = opt.headers.Accept || "application/json";

  const result = await fetch(`https://www.googleapis.com/drive/v3/${path}`, opt);

  const text = await result.text();
  let responseData;
  try {
    responseData = JSON.parse(text);
  }
  catch(e) {
    throw Error(text);
  }

  if(typeof responseData.error !== "undefined") {
    throw Error(responseData.error.message);
  }
  return responseData;
}

async function info(data) {
  const folderId = await decode(data.folder);

  const folderInfo = await apiRequest(
    data.auth,
    `files/${folderId}?supportsAllDrives=true&fields=name,mimeType,shortcutDetails/*`
  );

  let folderContents;
  // if it's a folder, grab the contents
  if(folderInfo.mimeType === "application/vnd.google-apps.folder") {
    folderContents = await apiRequest(
      data.auth,
      `files?q="${folderId}"+in+parents`
      + "&fields=nextPageToken,files(id,size,name,mimeType,md5Checksum,shortcutDetails/*)"
      + "&orderBy=name_natural&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=100"
      + (typeof data.pageToken !== "undefined" ? `&pageToken=${data.pageToken}` : '')
    );
  }
  // if it's shortcut/file, set notLoaded to true and grab the info later
  else if(folderInfo.mimeType === "application/vnd.google-apps.shortcut") {
    folderContents = {
      files: [{
        notLoaded: true,
        id: folderInfo.shortcutDetails.targetId,
        mimeType: folderInfo.shortcutDetails.targetMimeType,
        name: folderInfo.name
      }]
    }
    delete folderInfo.shortcutDetails;
  }
  else {
    folderContents = {
      files: [{
        notLoaded: true,
        id: folderId,
        mimeType: folderInfo.mimeType,
        name: folderInfo.name
      }]
    }
  }
  delete folderInfo.mimeType;

  const files = [];
  for(const file of folderContents.files) {
    // set notLoaded to true for shortcuts
    if(file.mimeType === "application/vnd.google-apps.shortcut") {
      file.notLoaded = true;
      file.id = file.shortcutDetails.targetId;
      file.mimeType = file.shortcutDetails.targetMimeType;
    }

    let fileInfo;
    if(file.notLoaded === true) {
      // ignore shortcuts to folders
      if(file.mimeType === "application/vnd.google-apps.folder") {
        continue;
      }
      fileInfo = await this.apiRequest(
        data.auth,
        `files/${file.id}?supportsAllDrives=true&fields=size,md5Checksum`
      );
      fileInfo.id = file.id;
      fileInfo.mimeType = file.mimeType;
      fileInfo.name = file.name;
    }
    else {
      fileInfo = file;
    }

    fileInfo.id = await encode(fileInfo.id);
    files.push(fileInfo);
  }

  folderContents.files = files;

  return Object.assign(folderContents, folderInfo);
}

async function cloneOne(auth, fileId, folder) {
  return apiRequest(
    auth,
    `files/${fileId}/copy?supportsAllDrives=true`,
    {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        "parents": [folder],
        "appProperties": {
          "createdWithDdEfc": 1
        }
      })
    }
  );
}

async function clone(data) {
  const result = [];
  for(const id of data.files) {
    const realId = await decode(id);
    const cloneResult = await cloneOne(data.auth, realId, data.destination);
    result.push({
      id: id,
      data: cloneResult
    });
  }

  return result;
}

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  if(request.method === "OPTIONS") {
    return new Response(null, {status: 200, headers: CORS_HEADERS});
  }
  else if(request.method !== "POST") {
    return fail("Method not allowed", 405);
  }

  let parser;
  if(request.url.endsWith("/info")) {
    parser = info;
  }
  else if(request.url.endsWith("/clone")) {
    parser = clone;
  }
  else {
    return fail("Page not found", 404);
  }

  let requestData;
  try {
    requestData = await request.json();
  }
  catch {
    return fail("Invalid json data");
  }

  try {
    return success(await parser(requestData));
  }
  catch(e) {
    return fail(e.toString());
  }
}
