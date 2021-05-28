/*jslint browser: true, white */

const mandatoryParameters = ["apikey", "acceptedTermsOfUse", "internalUserId", "userFirstName", "userLastName", "language"];
const supportedLanguages = ['en', 'fr', 'nl'];
const optionalParameters = ["destinationUrl", "passengerFirstName", "passengerLastName"];

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
    // console.log(paramName, parameter);
    if (parameter) {
        params.set(paramName, parameter);
    }
}

function getParams() {
    "use strict";
    console.log("getParams()");
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
        updatePage("<ul>" + errorMessage + "</ul><br>Please contact IT support.");
        return null;
    }

    // Optional parameters
    for (let i = 0; i < optionalParameters.length; i++) {
        let paramName = optionalParameters[i];
        getParam(paramName, params);
    }

    console.log("Received parameters:");
    for (let [key, value] of params) {
        console.log(key + ' = ' + value)
    }
    return params;
}

function updatePage(content) {
    document.getElementById('content').innerHTML = content;
}

function getSSOLink(params) {
    "use strict";
    console.log("getSSOLink()");

    // The base of the payload comes from the required parameters
    let payload = {
        "acceptedTermsOfUse": params.get("acceptedTermsOfUse") === "true",
        "internalUserId": params.get("internalUserId"),
        "firstName": params.get("userFirstName"),
        "lastName": params.get("userLastName"),
        "language": params.get("language")
    };

    // Handle the optional parameters
    let numOptionalParametersPresent = 0;
    for (let i = 0; i < optionalParameters.length; i++) {
        let paramName = optionalParameters[i];
        console.log(paramName, params.get(paramName));
        if (params.get(paramName)){
            numOptionalParametersPresent += 1;
        }
    }
    if (numOptionalParametersPresent > 0) {
        // We assume that additional parameters are meant to pass info for a new trip, not for restrictions (currently unsupported)
        let destinationUrl = "";
        if (params.get("destinationUrl") && numOptionalParametersPresent === 1) {
            // Only respect the destinationUrl if it is the only optional parameter passed, otherwise the rest of the parameters need to be passed as extra payload in the return URL
            destinationUrl = params.get("destinationUrl");
        } else {
            let requestPayload = {
                "request": {
                }
            };
            if (params.get("passengerFirstName") || params.get("passengerLastName")) {
                requestPayload.request.passenger = {};
            }
            if (params.get("passengerFirstName")) {
                requestPayload.request.passenger.firstName = params.get("passengerFirstName");
            }
            if (params.get("passengerLastName")) {
                requestPayload.request.passenger.lastName = params.get("passengerLastName");
            }
            console.log(requestPayload);
            // Encode the optional parameters into the destination URL
            destinationUrl = "/trips?new=" + encodeURI(JSON.stringify(requestPayload));
        }
        console.log("destinationUrl ", destinationUrl);


        // Now that the final destinationUrl is generated, add it to the payload
        payload.destinationUrl = destinationUrl;
    }
    console.log(payload);

    const xhr = new XMLHttpRequest();
    const url="https://api.staging.booqitapp.com/v1/sso";
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
                    const errorMessage = "Error, could not parse the JSON content sent by the server.<br>responseText: '" + xhr.responseText + "'<br>Exception: '" + e + "'<br>Please contact IT support.";
                    console.error(errorMessage);
                    updatePage(errorMessage);
                }
                if(response.hasOwnProperty("data") && response.data.hasOwnProperty("ssoUrl")) {
                    const ssoUrl = response.data.ssoUrl;
                    redirectToBooqit(ssoUrl);
                } else {
                    const errorMessage = "Error, could not identify the ssoUrl.<br>responseText: '" + xhr.responseText + "'<br>Please contact IT support.";
                    console.error(errorMessage);
                    updatePage(errorMessage);
                }
            } else {
                // There has been an error with the request!
                let extraText = "";
                if (status === 401) {
                    extraText = " Please check if the provided API key is valid.";
                }
                const errorMessage = "Error, status code " + status + ", message '" + xhr.responseText + "'." + extraText + "<br>Please contact IT support.";
                console.error(errorMessage);
                updatePage(errorMessage);
            }
        }
    }
}

function redirectToBooqit(ssoUrl) {
    "use strict";
    console.log("redirectToBooqit() -> " + ssoUrl);
    const urlMessage = "SSO Successful, redirecting to <a href='" + ssoUrl + "'>" + ssoUrl + "</a>";
    updatePage(urlMessage);
}

function main(){
    "use strict";
    console.log("starting");
    var params = getParams();

    if (params) {
        getSSOLink(params);    
    }

    console.log("finished");
}

main();
