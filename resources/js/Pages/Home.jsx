import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '../components/Header';
import CookieConsent from '@/Components/CookieConsent';
import { useState, useEffect } from 'react';


const Home = () => {
    // 1. Initialize state for the current theme
    const [theme, setTheme] = useState('light');  // Set it directly to 'light'

    // 2. Function to update the theme on the HTML element
    const updateThemeOnHtmlEl = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // 3. On initial render, always set theme to light for Home page
    useEffect(() => {
        // Set the theme to light for the Home page
        updateThemeOnHtmlEl('light');
        localStorage.setItem('theme', 'light');  // Ensure localStorage reflects the light theme
    }, []);  // Empty dependency array to run only once on page load

    // This page will always have a light theme, so no theme toggle necessary here.
    return (
        <>
            <Head title="Home" />
            <Header />
            <CookieConsent>
                <div className="tw-bg-blue-500" style={{ height: '900px' }}>
                    hi
                </div>
            </CookieConsent>
        </>
    );
};

export default Home;
