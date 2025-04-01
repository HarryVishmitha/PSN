<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="{{ $description ?? 'You think it, We ink it.' }}">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="canonical" href="{{ url()->current() }}">
        <title inertia>{{ config('app.name', 'Printair') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
        <script src="https://kit.fontawesome.com/9d3f75581e.js" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@2.8.2/dist/alpine.min.js" defer></script>
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;700&display=swap" rel="stylesheet">

        <!-- Bootstrap CSS -->
        <!-- <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous"> -->

        <!-- Bootstrap JS Bundle (includes Popper.js) -->
        <!-- <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script> -->

        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
        <!-- BootStrap css -->
        <link href="{{ asset('assets/css/lib/bootstrap.min.css')}}" rel="stylesheet"/>
        <!-- remix icon font css -->
        <link href="{{ asset('assets/css/remixicon.css')}}" rel="stylesheet"/>
        <!-- Apex Chart css -->
        <link href="{{ asset('assets/css/lib/apexcharts.css')}}" rel="stylesheet"/>
        <!-- Data Table css -->
        <link href="{{ asset('assets/css/lib/dataTables.min.css')}}" rel="stylesheet"/>
        <!-- Text Editor css -->
        <link href="{{ asset('assets/css/lib/editor-katex.min.css')}}" rel="stylesheet"/>
        <link href="{{ asset('assets/css/lib/editor.atom-one-dark.min.css')}}" rel="stylesheet"/>
        <link href="{{ asset('assets/css/lib/editor.quill.snow.css')}}" rel="stylesheet"/>
        <!-- Date picker css -->
        <link href="{{ asset('assets/css/lib/flatpickr.min.css')}}" rel="stylesheet"/>
        <!-- Calendar css -->
        <link href="{{ asset('assets/css/lib/full-calendar.css')}}" rel="stylesheet"/>
        <!-- Vector Map css -->
        <link href="{{ asset('assets/css/lib/jquery-jvectormap-2.0.5.css')}}" rel="stylesheet"/>
        <!-- Popup css -->
        <link href="{{ asset('assets/css/lib/magnific-popup.css')}}" rel="stylesheet"/>
        <!-- Slick Slider css -->
        <link href="{{ asset('assets/css/lib/slick.css')}}" rel="stylesheet"/>
        <!-- prism css -->
        <link href="{{ asset('assets/css/lib/prism.css')}}" rel="stylesheet"/>
        <!-- file upload css -->
        <link href="{{ asset('assets/css/lib/file-upload.css')}}" rel="stylesheet"/>

        <link href="{{ asset('assets/css/lib/audioplayer.css')}}" rel="stylesheet"/>
        <link href="{{ asset('assets/css/lib/animate.min.css')}}" rel="stylesheet"/>
        <!-- main css -->
        <link href="{{ asset('assets/css/style.css')}}" rel="stylesheet"/>
        <link href="{{ asset('assets/css/extra.css')}}" rel="stylesheet"/>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
