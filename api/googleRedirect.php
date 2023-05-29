<?php
/* googleRedirect.php
Handles redirect to Google login page. */
require_once "./vendor/autoload.php";
require_once "secrets.php";
// Setup
$redirectURI = "https://20alse.ssis.nu/hangman/api/googleRedirect.php"; //"http://localhost:5500/website/api/googleRedirect.php";
$client = new Google\Client();
$client->setClientId($_googleClientId);
$client->setClientSecret($_googleClientSecret);
$client->setRedirectUri($redirectURI);
$client->addScope(["email", "profile"]);
// Check: We either have gotten a code from Google here,
// or we have not and should redirect to Google.
if (isset($_GET['code'])){
    $_tokenData = $client->fetchAccessTokenWithAuthCode($_GET['code']);
    $client->setAccessToken($_tokenData['access_token']); // Set access token
    // Get info from the authorized profile
    $oauthClient = new Google\Service\Oauth2($client);
    $userInfoData = $oauthClient->userinfo->get();
    $userInfo = (object)[
        'email'=>$userInfoData->email,
        'name'=>$userInfoData->name,
    ];
    // Parse and add parsed username (everything before the @stockholmscience.se)
    // in the email.
    $usernameParsed = explode("@", $userInfo->email)[0];
    echo "Got you!";
}
else { // Redirect to the Google auth
    echo $client->createAuthUrl();
}
?>