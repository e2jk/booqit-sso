/*jslint browser: true, white */

const mandatoryParameters = ["ssoUrl", "apikey", "acceptedTermsOfUse", "internalUserId", "userFirstName", "userLastName", "language"];
const supportedLanguages = ['en', 'fr', 'nl'];
const optParameters = {
    "passenger": ["passengerFirstName", "passengerLastName", "passengerRrNumber", "passengerInternalNumber", "passengerDateOfBirth", "passengerDateOfBirthDD-MM-YY", "passengerDateOfBirthDD-MM-YYYY", "passengerPhoneNumber", "passengerEmail", "passengerMutuality"],
    "specifics": ["specificsPassengers", "specificsOxygen", "specificsPerfusion", "specificsInfectionRisk", "specificsWithProbe"],
    "payment": ["paymentInvoiceTo", "paymentName", "paymentInvoiceAddress"]
};
const otherOptParameters = ["transportType", "reason", "dateTime", "dateTimeEnd", "operationDate", "pickup", "dropOff", "info", "vehicleType", "vehicleSpecification", "proOrVolunteer"];
const optionalParameters = [].concat(["destinationUrl", "debug", "redirect"], optParameters["passenger"], optParameters["specifics"], optParameters["payment"], otherOptParameters);
var debugMode = false;

function log(value) {
    if (debugMode) {
        console.log(value);
        if (!(typeof value === 'string' || value instanceof String)) {
            value = JSON.stringify(value);
        }
        document.getElementById('debug').innerHTML = document.getElementById('debug').innerHTML + "<br><br>" + value;
    }
}

// Inspired from https://stackoverflow.com/a/11582513/185053 , modified for JSLint
function getURLParameter(name) {
    "use strict";
    // This function will return null if this specific parameter is not found
    var parameterValue = null;
    // Perform a regex match to find the value of the parameter from the query string
    var parameterRegex = new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(location.search);
    if (parameterRegex) {
        // If the regex found a match, replace any occurrence of + by %20
        parameterValue = parameterRegex[1].replace(/\+/g, "%20");
        // and perform proper decoding of the URI
        parameterValue = decodeURIComponent(parameterValue);
    }
    // Returns either null or the value of that parameter
    return parameterValue;
}

function getParam(paramName, params) {
    var parameter = getURLParameter(paramName);
    if (parameter) {
        params.set(paramName, parameter);
    }
}

function getParams() {
    "use strict";
    let params = new Map()

    // Required parameters
    let errorMessage = "";
    for (let i = 0; i < mandatoryParameters.length; i++) {
        let paramName = mandatoryParameters[i];
        getParam(paramName, params);
        if (!params.has(paramName)) {
            errorMessage += "<li>Mandatory parameter '" + paramName + "' was not provided.</li>";
        }
    }
    if (params.has("acceptedTermsOfUse") && params.get("acceptedTermsOfUse") !== "true") {
        errorMessage += "<li>Mandatory parameter 'acceptedTermsOfUse' must have the value 'true', the provided value '" + params.get("acceptedTermsOfUse") + "' is not supported.</li>";
    }
    if (supportedLanguages.indexOf(params.get("language")) === -1) {
        errorMessage += "<li>Mandatory parameter 'language' must be one of 'en', 'fr' or 'nl', the provided value '" + params.get("language") + "' is not supported.</li>";
    }
    if (errorMessage) {
        console.error(errorMessage);
        updatePage("<h2>Invalid configuration</h2><ul>" + errorMessage + "</ul><br>Please contact IT support.");
        return null;
    }

    // Optional parameters
    for (let i = 0; i < optionalParameters.length; i++) {
        getParam(optionalParameters[i], params);
    }

    // Handle specific parameters
    if (params.has("passengerDateOfBirthDD-MM-YYYY")) {
        // Date of birth must be in the format DDMMYYYY for Booqit
        var d = params.get("passengerDateOfBirthDD-MM-YYYY");
        var newdate  = d.substr(0,2) + d.substr(3,2) + d.substr(6,4);
        params.set("passengerDateOfBirth", newdate);
        params.delete("passengerDateOfBirthDD-MM-YYYY");
    }
    if (params.has("passengerDateOfBirthDD-MM-YY")) {
        // Date of birth must be in the format DDMMYYYY for Booqit
        var d = params.get("passengerDateOfBirthDD-MM-YY");
        var yy = d.substr(6,2);
        var currentYear = new Date().getFullYear().toString().substr(-2);
        var newdate  = d.substr(0,2) + d.substr(3,2);
        // A 2-digit date lower than the current year's 2 digits is assumed to be this century, a higher value from the previous century
        newdate += (yy < currentYear+1) ? '20' + yy : '19' + yy;
        params.set("passengerDateOfBirth", newdate);
        params.delete("passengerDateOfBirthDD-MM-YY");
    }

    // Logging in debug mode
    if (params.get("debug") === "true") {
        debugMode = true;
        log("DEBUG MODE ON");
        let receivedParameters = "Received parameters:\n";
        for (let [key, value] of params) {
            receivedParameters += key + ' = ' + value + "\n";
        }
        log(receivedParameters);
    }

    return params;
}

function updatePage(content) {
    document.getElementById('content').innerHTML = content;
}

function getSSOLink(params) {
    "use strict";
    // The base of the payload comes from the required parameters
    let payload = {
        "acceptedTermsOfUse": params.get("acceptedTermsOfUse") === "true",
        "internalUserId": params.get("internalUserId"),
        "firstName": params.get("userFirstName"),
        "lastName": params.get("userLastName"),
        "language": params.get("language")
    };

    // Handle the optional parameters
    // Count how many parameters of each type have been passed
    let numParameters = {"optional": 0, "passenger": 0, "specifics": 0, "payment": 0};
    let parameterTypes = ["passenger", "specifics", "payment"];
    for (let i = 0; i < optionalParameters.length; i++) {
        let paramName = optionalParameters[i];
        if (params.get(paramName)){
            numParameters["optional"]++;
            for (let j = 0; j < parameterTypes.length; j++) {
                if (paramName.startsWith(parameterTypes[j])) {
                    numParameters[parameterTypes[j]]++;
                    break;
                }
            }
        }
    }
    if (numParameters["optional"] > 0) {
        // We assume that additional parameters are meant to pass info for a new trip, not for restrictions (currently unsupported)
        let destinationUrl = "";
        if (params.get("destinationUrl") && numParameters["optional"] === 1) {
            // Only respect the destinationUrl if it is the only optional parameter passed, otherwise the rest of the parameters need to be passed as extra payload in the return URL
            destinationUrl = params.get("destinationUrl");
        } else {
            let requestPayload = {
                "request": {
                }
            };
            // Handle passenger, specifics and payment parameters
            for (let j = 0; j < parameterTypes.length; j++) {
                let parameterType = parameterTypes[j];
                let ptl = parameterType.length;
                if (numParameters[parameterType] > 0) {
                    requestPayload.request[parameterType] = {};
                    for (let i = 0; i < optParameters[parameterType].length; i++) {
                        let paramName = optParameters[parameterType][i];
                        if (params.get(paramName)){
                            let elementName = paramName.substring(ptl, ptl+1).toLowerCase() + paramName.substring(ptl+1);
                            requestPayload.request[parameterType][elementName] = params.get(paramName);
                        }
                    }
                }
            }
            // Other optional parameters
            for (let i = 0; i < otherOptParameters.length; i++) {
                let paramName = otherOptParameters[i];
                if (params.get(paramName)){
                    requestPayload.request[paramName] = params.get(paramName);
                }
            }
            log(requestPayload);
            // Encode the optional parameters into the destination URL
            destinationUrl = "/trips?new=" + encodeURI(JSON.stringify(requestPayload));
        }
        log("destinationUrl: " + destinationUrl);

        // Now that the final destinationUrl is generated, add it to the payload
        payload.destinationUrl = destinationUrl;
    }
    log(payload);

    const xhr = new XMLHttpRequest();
    const url = params.get("ssoUrl");
    xhr.open("POST", url);
    xhr.setRequestHeader('Authorization', 'key ' + params.get("apikey") );
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(payload));

    xhr.onreadystatechange = (e) => {
        if(xhr.readyState === XMLHttpRequest.DONE) {
            const status = xhr.status;
            if (status === 0 || (status >= 200 && status < 400)) {
                // The request has been completed successfully
                try {
                    var response = JSON.parse(xhr.responseText);
                } catch (e) {
                    const errorMessage = "<h2>Error</h2>Could not parse the JSON content sent by the server.<br>responseText: <pre>" + xhr.responseText + "</pre><br>Exception: <pre>" + e + "</pre><br>Please contact IT support.";
                    console.error(errorMessage);
                    updatePage(errorMessage);
                }
                if(response.hasOwnProperty("data") && response.data.hasOwnProperty("ssoUrl")) {
                    const ssoUrl = response.data.ssoUrl;
                    redirectToBooqit(ssoUrl, params.get("redirect"));
                } else {
                    const errorMessage = "<h2>Error</h2>Could not identify the ssoUrl.<br>responseText: <pre>" + xhr.responseText + "</pre><br>Please contact IT support.";
                    console.error(errorMessage);
                    updatePage(errorMessage);
                }
            } else {
                // There has been an error with the request!
                let extraText = "";
                if (status === 401) {
                    extraText = " Please check if the provided API key is valid.";
                }
                const errorMessage = "<h2>Error</h2>Status code " + status + ", message: <pre>" + xhr.responseText + "</pre>" + extraText + "<br>Please contact IT support.";
                console.error(errorMessage);
                updatePage(errorMessage);
            }
        }
    }
}

function redirectToBooqit(ssoUrl, redirect) {
    "use strict";
    log("redirectToBooqit() -> " + ssoUrl);
    if (redirect === "false") {
        const urlMessage = "SSO Successful, redirecting to <a href='" + ssoUrl + "' target='_blank'>" + ssoUrl + "</a>";
        updatePage(urlMessage);
    } else {
        // Redirect directly to the SSO page
        window.location = ssoUrl;
    }
}

function main(){
    "use strict";
    var params = getParams();

    if (params) {
        getSSOLink(params);
    }
}

main();
