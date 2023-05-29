<?php
/* shared_code.php 
File for general shared code that is used by multiple API endpoints.
*/
require_once "words/word_decryptor.php";
function createWordData($word) // Create word data object from a word (used for the API)
{
    return (object)[
        'word' => $word,
        'wordLength' => strlen(decryptWord($word))
    ];
}
