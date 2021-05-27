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
        console.error("API key not provided, exiting...");
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

function getSSOLink(params) {
    "use strict";
    console.log("getSSOLink()");

    const xhr = new XMLHttpRequest();
    const url="https://api.staging.booqitapp.com/v1/sso";
    xhr.open("POST", url);
    xhr.setRequestHeader('Authorization', 'key ' + params.get("apikey") );
    xhr.send();

    xhr.onreadystatechange = (e) => {
        if(xhr.readyState === XMLHttpRequest.DONE) {
            if (status === 0 || (status >= 200 && status < 400)) {
                // The request has been completed successfully
                console.log(xhr.responseText);

                redirectToBooqit();
              } else {
                // There has been an error with the request!
                const errorMessage = "Error, status code " + status + ", message '" + xhr.responseText + "', exiting...";
                console.error(errorMessage);
              }
        }
    }
}

function redirectToBooqit() {
    "use strict";
    console.log("redirectToBooqit()");
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
