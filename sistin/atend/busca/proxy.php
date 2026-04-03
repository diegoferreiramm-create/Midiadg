<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$url = 'https://script.google.com/macros/s/AKfycbwDpfgFnL1S0RLP5QavKGY0he01KjQXBLZ2BZBEaA1PYWsvn3wBeBAIIBFgFhzNsGmt/exec';
$url .= '?' . $_SERVER['QUERY_STRING'];

// Log para debug
error_log("Proxy chamado: " . $url);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if(curl_error($ch)) {
    $response = json_encode(['success' => false, 'mensagem' => 'Erro curl: ' . curl_error($ch)]);
}

curl_close($ch);

http_response_code($httpCode);
header('Content-Type: application/json');
echo $response;
?>
