/*jslint browser: true, white */

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
    getParam("apikey", params);
    if (!params.has("apikey")) {
        const errorMessage = "API key not provided.<br>Please contact IT support."
        console.error(errorMessage);
        updatePage(errorMessage);
    } else {
        getParam("lastName", params);
        getParam("firstName", params);

        console.log("Received parameters:");
        for (let [key, value] of params) {
            console.log(key + ' = ' + value)
        }
    }
    return params;
}

function updatePage(content) {
    document.getElementById('content').innerHTML = content;
}

function getSSOLink(params) {
    "use strict";
    console.log("getSSOLink()");

    //TODO: pass these as required parameters
    let payload = {
        "acceptedTermsOfUse": true,
        "internalUserId": "testUserID",
        "firstName": "testFirstName",
        "lastName": "testLastName",
        "language": "en"
    };

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
    
    if (params.has("apikey")) {
        getSSOLink(params);
    }

    console.log("finished");
}

main();
