"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs = require("fs");
var axios_1 = require("axios");
var xmlParser = require("xml2json");
var program = require("commander");
var fileName;
program
    .version('0.1.0')
    .usage("node index.js --file <file>")
    .option('-f, --file', 'The website list')
    .action(function (fileArg) {
    fileName = fileArg;
})
    .option('-a, --aws', 'Parse file as AWS Alexa response')
    .parse(process.argv);
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var content, websites, xmlJSON, results, isTLSValid, isTLSInvalidList, hstsEnabled, redirectionToHTTPS;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!fileName || typeof fileName !== "string") {
                        console.error("Please specify a website list.\n");
                        program.help();
                        return [2 /*return*/, -1];
                    }
                    content = fs.readFileSync("website_lists/" + fileName, "utf8");
                    if (program.aws) {
                        try {
                            xmlJSON = JSON.parse(xmlParser.toJson(content));
                            websites = xmlJSON["aws:TopSitesResponse"]["aws:Response"]["aws:TopSitesResult"]["aws:Alexa"]["aws:TopSites"]["aws:Country"]["aws:Sites"]["aws:Site"].map(function (topSite) {
                                return topSite["aws:DataUrl"];
                            });
                        }
                        catch (e) {
                            console.error("Error while parsing AWS Alexa file.");
                            return [2 /*return*/, -1];
                        }
                    }
                    else {
                        websites = content.trim().split("\n");
                    }
                    console.log(websites.length + " websites to scan...");
                    results = [];
                    return [4 /*yield*/, Promise.all(websites.map(function (website) { return __awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            return __generator(this, function (_a) {
                                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                                        var responseTLSTarget, responseTLSResults, pending, responseHTTPResults, responseHTTPTarget, result, e_1;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 7, , 8]);
                                                    return [4 /*yield*/, axios_1["default"].post("https://tls-observatory.services.mozilla.com/api/v1/scan?target=" + website)];
                                                case 1:
                                                    responseTLSTarget = _a.sent();
                                                    return [4 /*yield*/, axios_1["default"].get("https://tls-observatory.services.mozilla.com/api/v1/results?id=" + responseTLSTarget.data.scan_id)];
                                                case 2:
                                                    responseTLSResults = _a.sent();
                                                    pending = true;
                                                    responseHTTPResults = void 0;
                                                    _a.label = 3;
                                                case 3:
                                                    if (!pending) return [3 /*break*/, 6];
                                                    return [4 /*yield*/, axios_1["default"].post("https://http-observatory.security.mozilla.org/api/v1/analyze?host=" + website)];
                                                case 4:
                                                    responseHTTPTarget = _a.sent();
                                                    if (responseHTTPTarget.data.state === "FAILED") {
                                                        console.error("Request to " + website + " failed");
                                                        return [2 /*return*/, resolve()];
                                                    }
                                                    return [4 /*yield*/, axios_1["default"].get("https://http-observatory.security.mozilla.org/api/v1/getScanResults?scan=" + responseHTTPTarget.data.scan_id)];
                                                case 5:
                                                    responseHTTPResults = _a.sent();
                                                    pending = responseHTTPResults.state === "PENDING";
                                                    return [3 /*break*/, 3];
                                                case 6:
                                                    result = {
                                                        website: website,
                                                        tls: responseTLSResults,
                                                        http: responseHTTPResults
                                                    };
                                                    results.push(result);
                                                    return [3 /*break*/, 8];
                                                case 7:
                                                    e_1 = _a.sent();
                                                    console.error("Error while requesting website", e_1);
                                                    return [3 /*break*/, 8];
                                                case 8:
                                                    resolve();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); })];
                            });
                        }); }))];
                case 1:
                    _a.sent();
                    isTLSValid = 0;
                    isTLSInvalidList = [];
                    hstsEnabled = 0;
                    redirectionToHTTPS = 0;
                    results.map(function (result) {
                        if (result.tls.data.is_valid) {
                            isTLSValid++;
                        }
                        else {
                            isTLSInvalidList.push(result);
                        }
                        if (result.http.data["strict-transport-security"] && result.http.data["strict-transport-security"].pass) {
                            hstsEnabled++;
                        }
                        if (result.http.data["redirection"] && result.http.data["redirection"].pass) {
                            redirectionToHTTPS++;
                        }
                    });
                    console.log();
                    console.log("[Results]");
                    console.log("Total:", websites.length);
                    console.log("Failed:", websites.length - results.length, "(" + (websites.length - results.length) / websites.length * 100 + "%)");
                    console.log("TLS valid:", isTLSValid, "(" + isTLSValid / websites.length * 100 + "%)");
                    isTLSInvalidList.map(function (result) {
                        console.log("- " + result.website);
                    });
                    console.log("HSTS enabled (at least 6 months):", hstsEnabled, "(" + hstsEnabled / websites.length * 100 + "%)");
                    console.log("Redirection to HTTPS:", redirectionToHTTPS, "(" + redirectionToHTTPS / websites.length * 100 + "%)");
                    return [2 /*return*/];
            }
        });
    });
}
main();
