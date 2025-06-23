<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EST-20250622-1602</title>
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
    <link href="{{ asset('assets/css/lib/bootstrap.min.css')}}" rel="stylesheet" />
    <!-- remix icon font css -->
    <link href="{{ asset('assets/css/remixicon.css')}}" rel="stylesheet" />
    <!-- Apex Chart css -->
    <link href="{{ asset('assets/css/lib/apexcharts.css')}}" rel="stylesheet" />
    <!-- Data Table css -->
    <link href="{{ asset('assets/css/lib/dataTables.min.css')}}" rel="stylesheet" />
    <!-- Text Editor css -->
    <link href="{{ asset('assets/css/lib/editor-katex.min.css')}}" rel="stylesheet" />
    <link href="{{ asset('assets/css/lib/editor.atom-one-dark.min.css')}}" rel="stylesheet" />
    <link href="{{ asset('assets/css/lib/editor.quill.snow.css')}}" rel="stylesheet" />
    <!-- Date picker css -->
    <link href="{{ asset('assets/css/lib/flatpickr.min.css')}}" rel="stylesheet" />
    <!-- Calendar css -->
    <link href="{{ asset('assets/css/lib/full-calendar.css')}}" rel="stylesheet" />
    <!-- Vector Map css -->
    <link href="{{ asset('assets/css/lib/jquery-jvectormap-2.0.5.css')}}" rel="stylesheet" />
    <!-- Popup css -->
    <link href="{{ asset('assets/css/lib/magnific-popup.css')}}" rel="stylesheet" />
    <!-- Slick Slider css -->
    <link href="{{ asset('assets/css/lib/slick.css')}}" rel="stylesheet" />
    <!-- prism css -->
    <link href="{{ asset('assets/css/lib/prism.css')}}" rel="stylesheet" />
    <!-- file upload css -->
    <link href="{{ asset('assets/css/lib/file-upload.css')}}" rel="stylesheet" />

    <link href="{{ asset('assets/css/lib/audioplayer.css')}}" rel="stylesheet" />
    <link href="{{ asset('assets/css/lib/animate.min.css')}}" rel="stylesheet" />
    <!-- main css -->
    <link href="{{ asset('assets/css/style.css')}}" rel="stylesheet" />
    <link href="{{ asset('assets/css/extra.css')}}" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.3.2/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@iconify/iconify@2.2.0/dist/iconify.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons-extended.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons-extended-2.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons-extended-3.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons-extended-4.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons-extended-5.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons-extended-6.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons-extended-7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons-extended-8.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@iconify/mage@1.0.0/dist/mage-icons-extended-9.min.js"></script>

    @vite(['resources/css/app.css'])

    <style>

    </style>
</head>

<body class="font-sans antialiased">

    <div class="card-body py-40 tw-bg-white">
        <div class="row justify-content-center tw-mt-4" id="estimate">
            <div class="col tw-max-w-[8.3in]">
                <div class="shadow-4 border radius-8">
                    <div class="p-20 border-bottom">
                        <div class="row justify-content-between g-3">
                            <!-- Left: Estimate #, Issue & Due -->
                            <div class="col-sm-6">
                                <h3 class="text-xl tw-text-black">

                                    <h4 class='tw-font-bold'>Estimate</h4>
                                    <div class='tw-font-semibold tw-text-md tw-text-black'>#EST-20250622-1601</div>
                                </h3>

                                <!-- Issue Date -->
                                <p class="mb-1 text-sm d-flex align-items-center tw-mt-3">
                                    Date Issued:&nbsp;

                                    <span class="editable  ">
                                        2025-06-22
                                    </span>

                                </p>

                                <!--  Due Date  -->
                                <p class="mb-0 text-sm d-flex align-items-center">
                                    Date Due:&nbsp;

                                    <span class="editable  ">
                                        2025-06-22
                                    </span>


                                </p>
                            </div>

                            <!-- Right: Company Logo & Contact -->
                            <div class="col-sm-6 d-flex flex-column align-items-end justify-content-end text-end">
                                <div>
                                    <img
                                        src="/images/printairlogo.png"
                                        alt="Printair Logo"
                                        class="tw-mb-3"
                                        style="max-height: 95px" />
                                </div>
                                <p class="tw-mb-1 tw-text-sm">
                                    No. 67/D/1, Uggashena Road,
                                    <br />Walpola, Ragama, Sri Lanka
                                </p>
                                <p class="tw-mb-0 tw-text-sm">
                                    contact@printair.lk
                                    <br />
                                    &nbsp;+94 76 886 0175
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Body: “Issues For” + “Order Info” + Line Items + Totals -->
                    <div class="py-28 px-20">
                        <div class="d-flex flex-wrap justify-content-between align-items-end gap-3">
                            <div>
                                <h6 class="text-md">Issues For:

                                </h6>
                                <table class="text-sm text-secondary-light">
                                    <tbody>
                                        <!-- Client Name -->
                                        <tr>
                                            <td>Name</td>
                                            <td class="ps-8 d-flex align-items-center">
                                                : Thejan Vishmitha
                                            </td>
                                        </tr>

                                        <!-- Client Address -->
                                        <tr>
                                            <td>Address</td>
                                            <td class="ps-8 d-flex align-items-center">
                                                <span class="ps-7  ">
                                                    : 264/B/2, Batuwatta, Ragama
                                                </span>
                                            </td>
                                        </tr>

                                        <!-- Client Phone -->
                                        <tr>
                                            <td>Phone number</td>
                                            <td class="ps-8 d-flex align-items-center">
                                                : 0761719574
                                            </td>
                                        </tr>

                                        <tr>
                                            <td>Email</td>
                                            <td class="ps-8 d-flex align-items-center">
                                                : vishmithathejan154@gmail.com
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Right side “Order Info” (Issus Date, Order ID, Shipment ID) -->
                            <div>
                                <table class="text-sm text-secondary-light">
                                    <tbody>
                                        <tr>
                                            <td class='tw-text-end'>Issus Date :</td>
                                            <td class="ps-8">
                                                2025-06-23
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class='tw-text-end'>Order ID :</td>
                                            <td class="ps-8">
                                                EST-20250622-1601
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class='tw-text-end'>P.O. Number :</td>
                                            <td class="ps-8">

                                                <span class="editable  ">
                                                    -
                                                </span>


                                            </td>
                                        </tr>
                                        <tr>
                                            <td class='tw-text-end'>Shipment ID :</td>
                                            <td class="ps-8">



                                                <span class="editable  ">
                                                    -
                                                </span>

                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Line Items Table -->
                        <div class="mt-24">
                            <div class="table-responsive scroll-sm">
                                <table
                                    class="table bordered-table text-sm"
                                    id="invoice-table">
                                    <thead>
                                        <tr>
                                            <th scope="col" class="text-sm">
                                                SL.
                                            </th>
                                            <th scope="col" class="text-sm">
                                                Items
                                            </th>
                                            <th scope="col" class="text-sm">
                                                Qty
                                            </th>
                                            <th scope="col" class="text-sm">
                                                Units
                                            </th>
                                            <th scope="col" class="text-sm">
                                                Unit Price
                                            </th>
                                            <th scope="col" class="text-sm">
                                                Price
                                            </th>

                                        </tr>
                                    </thead>
                                    <tbody>

                                        <tr key="1">
                                            <!-- SL # -->
                                            <td>1</td>

                                            <!-- Description (inline editable) -->
                                            <td>
                                                <div class="tw-font-semibold">{item.product_name}</div>

                                                <div class="d-flex align-items-center">
                                                    <span class="editable   tw-text-sm tw-text-gray-500">
                                                        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Numquam porro fugit blanditiis itaque, laborum, ullam adipisci sint quod ducimus quos quibusdam error ea aliquam alias maxime optio? Ducimus, laudantium numquam.
                                                    </span>

                                                </div>


                                                <div>
                                                    <div class='tw-text-xs'>
                                                        <span class="tw-font-semibold tw-text-gray-500">
                                                            Size:
                                                        </span>
                                                        18in x 24in
                                                    </div>
                                                </div>

                                                <div>
                                                    <div class='tw-text-xs'>
                                                        <span class="tw-font-semibold tw-text-gray-500">
                                                            Base Price:
                                                        </span>
                                                        LKR 180.00
                                                    </div>

                                                    <div class='tw-text-xs'>
                                                        <span class="tw-font-semibold tw-text-gray-500">
                                                            Variants
                                                        </span>

                                                        <ul class='tw-list-disc tw-ml-4'>

                                                            <li key="1">
                                                                name: color


                                                                <ul>

                                                                    <li key={j}>
                                                                        name: size

                                                                    </li>

                                                                </ul>

                                                            </li>

                                                        </ul>

                                                    </div>
                                                </div>

                                            </td>

                                            <!-- Qty -->
                                            <td>

                                                <div class="d-flex align-items-center">
                                                    <span class="editable  ">
                                                        5
                                                    </span>

                                                </div>

                                            </td>

                                            <!-- Unit -->
                                            <td>

                                                <div class="d-flex align-items-center">
                                                    <span class="editable  ">
                                                        -
                                                    </span>

                                                </div>

                                            </td>

                                            <!-- Unit Price -->
                                            <td>

                                                <div class="d-flex align-items-center">
                                                    <span class="editable  ">
                                                        180.00
                                                    </span>

                                                </div>

                                            </td>


                                            <!-- Price = qty × unit_price (read‐only) -->
                                            <td>4000.00</td>


                                        </tr>

                                    </tbody>
                                </table>
                            </div>



                            <!-- Totals -->
                            <div class="d-flex flex-wrap justify-content-between gap-3 mt-24">
                                <div>
                                    <p class="text-sm mb-0">
                                        <span class="text-primary-light fw-semibold">
                                            Sales By:
                                        </span>
                                        Thejan Vishmitha
                                    </p>
                                    <p class="text-sm mb-0">Thank You!</p>
                                </div>

                                <div>
                                    <table class="text-sm">
                                        <tbody>
                                            <tr>
                                                <td class="pe-64 text-start">Subtotal:</td>
                                                <td class="pe-16 text-end">
                                                    <span class="text-primary-light fw-semibold">
                                                        LKR 1000.00
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="pe-64 text-start">Discount:</td>
                                                <td class="pe-16 text-end">
                                                    <span class="text-primary-light fw-semibold">
                                                        LKR 0.00
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="pe-64 border-bottom pb-4 text-start">Tax:</td>
                                                <td class="pe-16 border-bottom pb-4 text-end">
                                                    <span class="text-primary-light fw-semibold">
                                                        LKR 0.00
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="pe-64 pt-4 text-start">
                                                    <span class="text-primary-light fw-semibold">Total:</span>
                                                </td>
                                                <td class="pe-16 pt-4 text-end">
                                                    <span class="text-primary-light fw-semibold">
                                                        LKR 0.00
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Footer (Signatures) -->
                            <div class="mt-64">
                                <p class="text-center text-secondary-light text-sm fw-semibold">
                                    Looking forward to work with you!
                                </p>
                            </div>
                            <div class="d-flex flex-wrap border-top justify-content-between tw-pt-4 align-items-end mt-64">
                                <div class="text-sm d-inline-block px-12">
                                    System Authorized.
                                </div>
                                <div class='text-sm d-inline-block px-12'>1 of n pages</div>
                                <div class="text-sm d-inline-block px-12">
                                    www.printair.lk
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>