<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PangkalMart</title>
    {{-- Memanggil CSS dan JS React melalui Vite --}}
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-gray-100">
    {{-- ID ini penting! React akan dirender di dalam div ini --}}
    <div id="app"></div>
</body>
</html>
