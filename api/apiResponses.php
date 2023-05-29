<?php
/* apiResponses.php 
Functions for generating API responses.
*/
$apiVersion = "v1.0.0";
// Make sure JSON is set as content type and that CORS is set for any function that imports this
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
function generateAPIResponse($status, $data) {
    // Set variables on response
    $response = (object)[
    'status'=>$status,
    'data'=>$data,
    ];
    return $response;
};

function generateSuccessResponse($data){
    return generateAPIResponse("success", $data);
};

function generateErrorResponse($data)
{
    return generateAPIResponse("error", $data);
};

// Pregenerated responses
$_internalServerErrorResponseContent = (object) [
    'message'=>"Internal server error"
];
$internalServerErrorResponse = generateErrorResponse($_internalServerErrorResponseContent);

$_missingParametersResponseContent = (object) [
    'message'=>"Missing URL parameters"
];
$missingParametersResponse = generateErrorResponse($_missingParametersResponseContent);

// Add an error handler for warnings
function warningHandler($errorNumber, $errorString, $filename, $lineNumber, $variables){
    throw new Exception("Error from warning: $errorString.");
};

set_error_handler("warningHandler", E_WARNING);
?>