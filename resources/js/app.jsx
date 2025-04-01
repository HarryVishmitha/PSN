import '../css/app.css';
import './bootstrap';
// import '../css/style.css';
// import '../css/style_2.css';
// import '../css/remixicon.css';
// import '../css/extra.css';
// import '../css/lib/animate.min.css';
// import '../css/lib/apexcharts.css';
// import '../css/lib/audioplayer.css';
// import '../css/lib/bootstrap.min.css';
// import '../css/lib/dataTables.min.css';
// import '../css/lib/editor-katex.min.css';
// import '../css/lib/editor.atom-one-dark.min.css';
// import '../css/lib/editor.quill.snow.css';
// import '../css/lib/file-upload.css';
// import '../css/lib/flatpickr.min.css';
// import '../css/lib/full-calendar.css';
// import '../css/lib/jquery-jvectormap-2.0.5.css';
// import '../css/lib/magnific-popup.css';
// import '../css/lib/prism.css';
// import '../css/lib/slick.css';
// import '../css/lib/slick.css';

import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Printair';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        if (import.meta.env.SSR) {
            hydrateRoot(el, <App {...props} />);
            return;
        }

        createRoot(el).render(
            <BrowserRouter>
                <App {...props} />
            </BrowserRouter>
        );
    },
    progress: {
        color: '#f44032',
    },
}).then(() => {
    document.getElementById('app').removeAttribute('data-page');
});
