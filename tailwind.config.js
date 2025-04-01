import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    prefix: 'tw-',
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Be Vietnam Pro', 'sans-serif'],
            },
            keyframes: {
                slideIn: {
                  '0%': { transform: 'translateX(100%)', opacity: 0 },
                  '100%': { transform: 'translateX(0)', opacity: 1 },
                },
                slideOut: {
                  '0%': { transform: 'translateX(0)', opacity: 1 },
                  '100%': { transform: 'translateX(100%)', opacity: 0 },
                },
            },
            animation: {
                slideIn: 'slideIn 0.5s forwards',
                slideOut: 'slideOut 0.5s forwards',
            },
        },
    },

    plugins: [forms,

    ],

};
