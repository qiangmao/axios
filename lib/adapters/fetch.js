'use strict';

var settle = require('./../core/settle');
var utils = require('./../utils');
var buildURL = require('./../helpers/buildURL');
var btoa = (typeof window !== 'undefined' && window.btoa) || require('./../helpers/btoa');

module.exports = function fetchAdapter(config) {
  return new Promise(function handleRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    var method = config.method.toUpperCase() || 'GET';

    var headers = new Headers();

    utils.forEach(requestHeaders, function setRequestHeader(val, key) {
      if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
        // Remove Content-Type if data is undefined
        delete requestHeaders[key];
      } else {
        // Otherwise add header to the request
        headers.append(key, val);
      }
    });

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      headers.append('Authorization', 'Basic ' + btoa(username + ':' + password));
    }

    var url = buildURL(config.url, config.params, config.paramsSerializer);

    var init = {
      method: method,
      headers: headers,
      body: requestData
    };

    var request = new Request(url, init);

    fetch(request).then(function handleResponse(response) {
      var contentType = response.headers.get('Content-Type');
      var reg = /^application\/json[;]?\.*/;
      var responsePromise;
      // Json Response
      if (reg.test(contentType)) {
        responsePromise = response.json();
      } else {
        responsePromise = response.text();
      }
      responsePromise.then(function responseData(d) {
        var res = {
          data: d,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: config,
          request: request
        };
        settle(resolve, reject, res);
      });
    });
  });
};
