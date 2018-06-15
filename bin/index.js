#! /usr/bin/env node
var axios = require('axios')
const fs = require('fs')
const path = require('path')

function downloadFontFile(url, destination) {
  return new Promise((resolve, reject) => {
    axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
    }).then((response) => {
      var urlParts = url.split("/");
      var fileName = urlParts[urlParts.length - 1];
      var filePath = path.resolve(destination, 'fonts', fileName)
      response.data.pipe(fs.createWriteStream(filePath))
      response.data.on('end', () => {
        resolve();
      })
    });
  });
};

function replaceAll(str, search, replacement) {
  return str.split(search).join(replacement);
};

var arguments = process.argv.splice(2, process.argv.length - 1);
var cssUrl = arguments[0];
var currentPath = process.cwd();
var userDestinationPath = arguments[1];
var destination = "";

destination = currentPath;
if (userDestinationPath && userDestinationPath != "") {
  destination = userDestinationPath;
}
destination += "/google-fonts";

if (!fs.existsSync(destination)) {
  fs.mkdirSync(destination);
}

if (!fs.existsSync(destination + "/fonts")) {
  fs.mkdirSync(destination + "/fonts");
}

axios.get(cssUrl).then(function (response) {
  var fontUrls = response.data.match(/\bhttps?:\/\/\S+/gi);
  var promises = [];
  for (var i in fontUrls) {
    var url = fontUrls[i];
    url = url.replace(")", "");
    promises.push(downloadFontFile(url, destination));
  }
  Promise.all(promises).then(function () {
    var cssFileContent = response.data;
    var cssUrlParts = cssUrl.split("?")
    var cssFileName = cssUrlParts[1];
    cssFileName = replaceAll(cssFileName, "family=", "");
    cssFileName = replaceAll(cssFileName, "+", "-");
    cssFileName = replaceAll(cssFileName, ":", "__");
    cssFileName = replaceAll(cssFileName, ",", "_");
    cssFileName += ".css";
    for (var i in fontUrls) {
      var url = fontUrls[i];
      url = url.replace(")", "");
      var urlParts = url.split("/");
      var fileName = urlParts[urlParts.length - 1];
      cssFileContent = cssFileContent.replace(url, "fonts/" + fileName);
    }
    fs.writeFile(destination + "/" + cssFileName, cssFileContent, function (err) {
      if (err) {
        return console.log(err);
      } else {
        console.log("Pronto!")
      }
    });
  })
}).catch(function (error) {
  console.log(error);
});