<?php
// Desliga qualquer saída indesejada
error_reporting(0);
ini_set('display_errors', 0);

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Responde requisição OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Pega a URL do Google Apps Script
$url = 'https://script.google.com/macros/s/AKfycbxO3a3KbHj8naVTrrTRlKQcfHrElbQ54HloepIT2Cvd1kxWJXjsJyV225-3pPVBEB0/exec';

// Adiciona os parâmetros da requisição
if (!empty($_SERVER['QUERY_STRING'])) {
    $url .= '?' . $_SERVER['QUERY_STRING'];
}

// Inicia CURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json'
));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo json_encode([
        'success' => false, 
        'mensagem' => 'Erro de conexão: ' . curl_error($ch)
    ]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
?>
