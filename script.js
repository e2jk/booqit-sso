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

function getParams(params) {
    "use strict";
    console.log("getParams");
}

function getSSOLink(params) {
    "use strict";
    console.log("getSSOLink");
}

function redirectToBooqit(params) {
    "use strict";
    console.log("redirectToBooqit");
}

function main(){
    "use strict";
    console.log("starting");
    getParams();
    
    getSSOLink();

    redirectToBooqit();

    console.log("finished");
}

main();
