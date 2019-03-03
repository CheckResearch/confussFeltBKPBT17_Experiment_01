import * as fs from "fs";
import axios from "axios";
import * as xmlParser from "xml2json";
import * as program from "commander";

declare var Promise: any;

let fileName: string;

program
    .version('0.1.0')
    .usage("node index.js --file <file>")
    .option('-f, --file', 'The website list')
    .action(function (fileArg: string) {
        fileName = fileArg;
    })
    .option('-a, --aws', 'Parse file as AWS Alexa response')
    .parse(process.argv);

type IScanResults = {
    website: string;
    http: any;
    tls: any
}

async function main() {
    if (!fileName || typeof fileName !== "string") {
        console.error("Please specify a website list.\n");
        program.help();

        return -1;
    }

    // Read the website list.
    const content = fs.readFileSync(`website_lists/${fileName}`, "utf8");

    let websites;
    if (program.aws) {
        try {
            const xmlJSON = JSON.parse(xmlParser.toJson(content));
            websites = xmlJSON["aws:TopSitesResponse"]["aws:Response"]["aws:TopSitesResult"]["aws:Alexa"]["aws:TopSites"]["aws:Country"]["aws:Sites"]["aws:Site"].map((topSite: any) => {
                return topSite["aws:DataUrl"];
            });
        } catch (e) {
            console.error("Error while parsing AWS Alexa file.");

            return -1;
        }
    } else {
        websites = content.trim().split("\n");
    }

    console.log(`${websites.length} websites to scan...`)

    const results: IScanResults[] = [];
    await Promise.all(websites.map(async (website: any) => {
        return new Promise(async (resolve: any, reject: any) => {
            // console.log(`Requesting site ${website}...`);
            try {
                const responseTLSTarget = await axios.post(`https://tls-observatory.services.mozilla.com/api/v1/scan?target=${website}`);
                const responseTLSResults = await axios.get(`https://tls-observatory.services.mozilla.com/api/v1/results?id=${responseTLSTarget.data.scan_id}`);

                let pending = true;
                let responseHTTPResults;
                while (pending) {
                    const responseHTTPTarget = await axios.post(`https://http-observatory.security.mozilla.org/api/v1/analyze?host=${website}`);
                    if (responseHTTPTarget.data.state === "FAILED") {
                        console.error(`Request to ${website} failed`);
                        return resolve();
                    }
                    responseHTTPResults = await axios.get(`https://http-observatory.security.mozilla.org/api/v1/getScanResults?scan=${responseHTTPTarget.data.scan_id}`);
                    pending = (responseHTTPResults as any).state === "PENDING";
                }

                const result: IScanResults = {
                    website: website,
                    tls: responseTLSResults,
                    http: responseHTTPResults
                };
                results.push(result);
            } catch (e) {
                console.error("Error while requesting website", e);
            }

            resolve();
        })
    }));

    let isTLSValid = 0;
    const isTLSInvalidList: IScanResults[] = [];
    let hstsEnabled = 0;
    let redirectionToHTTPS = 0;
    results.map((result) => {
        if (result.tls.data.is_valid) {
            isTLSValid++;
        } else {
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
    console.log("Failed:", websites.length - results.length, `(${(websites.length - results.length) / websites.length * 100}%)`);
    console.log("TLS valid:", isTLSValid, `(${isTLSValid / websites.length * 100}%)`);
    isTLSInvalidList.map((result) => {
        console.log(`- ${result.website}`);
    });
    console.log("HSTS enabled (at least 6 months):", hstsEnabled, `(${hstsEnabled / websites.length * 100}%)`);
    console.log("Redirection to HTTPS:", redirectionToHTTPS, `(${redirectionToHTTPS / websites.length * 100}%)`);
}

main();
