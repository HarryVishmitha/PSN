import { Head, Link, usePage, router } from '@inertiajs/react';
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from 'react';
import { useLocation, NavLink } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import Cookies from 'js-cookie';
import axios from 'axios';
import 'bootstrap/dist/js/bootstrap.bundle';

const AdminDashboard = ({ children, userDetails }) => {
    let [sidebarActive, seSidebarActive] = useState(false);
    let [mobileMenu, setMobileMenu] = useState(false);
    const location = useLocation(); // Hook to get the current route
    const currentYear = new Date().getFullYear(); // Get the current year
    const [theme, setTheme] = useState('light'); // Initialize theme state
    const { url, component } = usePage();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {

        const themeFromCookie = Cookies.get('theme');
        const sidebarstatus = Cookies.get('sidebarActive');
        if (mobileMenu) {
            seSidebarActive(false); // Close the sidebar when mobile menu is open
            Cookies.set('sidebarActive', 'inactive', { expires: 365 }); // Update cookie accordingly
        } else {
            // When mobile menu is not open, maintain sidebar state
            const sidebarstatus = Cookies.get('sidebarActive');
            if (sidebarstatus === 'active') {
                seSidebarActive(true);
            } else {
                seSidebarActive(false);
            }
        }
        if (themeFromCookie) {
            setTheme(themeFromCookie); // Update state from cookie
        } else {
            // Fallback to localStorage if cookie is not set
            const storedTheme = localStorage.getItem('theme') || 'light';
            setTheme(storedTheme);
        }

        // Apply the theme on the HTML element
        const updateThemeOnHtmlEl = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');

            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        updateThemeOnHtmlEl(themeFromCookie); // Update the theme on page load

        const handleDropdownClick = (event) => {
            event.preventDefault();
            const clickedLink = event.currentTarget;
            const clickedDropdown = clickedLink.closest(".dropdown");

            if (!clickedDropdown) return;

            const isActive = clickedDropdown.classList.contains("open");

            // Close all dropdowns
            const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
            allDropdowns.forEach((dropdown) => {
                dropdown.classList.remove("open");
                const submenu = dropdown.querySelector(".sidebar-submenu");
                if (submenu) {
                    submenu.style.maxHeight = "0px"; // Collapse submenu
                }
            });

            // Toggle the clicked dropdown
            if (!isActive) {
                clickedDropdown.classList.add("open");
                const submenu = clickedDropdown.querySelector(".sidebar-submenu");
                if (submenu) {
                    submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
                }
            }
        };

        // Attach click event listeners to all dropdown triggers
        const dropdownTriggers = document.querySelectorAll(
            ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
        );

        dropdownTriggers.forEach((trigger) => {
            trigger.addEventListener("click", handleDropdownClick);
        });

        const openActiveDropdown = () => {
            const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
            allDropdowns.forEach((dropdown) => {
                const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
                submenuLinks.forEach((link) => {
                    if (link.getAttribute("href") === window.location.pathname) {
                        dropdown.classList.add("open");
                        const submenu = dropdown.querySelector(".sidebar-submenu");
                        if (submenu) {
                            submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
                        }
                    }
                });
            });
        };

        // Call the function to open the active dropdown when the page loads
        document.addEventListener("DOMContentLoaded", openActiveDropdown);

        // Open the submenu that contains the active route
        openActiveDropdown();

        // Cleanup event listeners on unmount
        return () => {
            dropdownTriggers.forEach((trigger) => {
                trigger.removeEventListener("click", handleDropdownClick);
            });
        };
    }, [location.pathname], [mobileMenu], [url]);

    let sidebarControl = () => {
        if (mobileMenu) {
            setMobileMenu(false);  // Close mobile menu when toggling sidebar
        }
        seSidebarActive(!sidebarActive);
        handleSidebarToggle();
    };

    const handleSidebarToggle = () => {
        // Toggle the sidebar state and update the cookie
        const newSidebarState = !sidebarActive;
        seSidebarActive(newSidebarState);
        Cookies.set('sidebarActive', newSidebarState ? 'active' : 'inactive', { expires: 365 });
    };

    let mobileMenuControl = () => {

        setMobileMenu(!mobileMenu);
    };

    useEffect(() => {
        if (mobileMenu && sidebarActive) {
            seSidebarActive(false);
            Cookies.set('sidebarActive', 'inactive', { expires: 365 });
        }
    }, [mobileMenu]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await axios.get('/admin/api/notifications');
                setNotifications(data.notifications);
            } catch (e) {
                console.error('Unable to fetch notifications', e);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // every 30s

        return () => clearInterval(interval);
    }, []);


    return (
        <>
            <section className={mobileMenu ? "overlay active" : "overlay "}>
                {/* sidebar */}
                <aside
                    className={
                        sidebarActive
                            ? "sidebar active "
                            : mobileMenu
                                ? "sidebar sidebar-open"
                                : "sidebar"
                    }
                >
                    <button
                        onClick={mobileMenuControl}
                        type='button'
                        className='sidebar-close-btn'
                    >
                        <Icon icon='radix-icons:cross-2' />
                    </button>
                    {/* LOGO section */}
                    <div>
                        <Link href='/' className='sidebar-logo'>
                            <img
                                src='/assets/images/logo.png'
                                alt='site logo'
                                className='light-logo'
                            />
                            <img
                                src='/assets/images/logo-light.png'
                                alt='site logo'
                                className='dark-logo'
                            />
                            <img
                                src='/assets/images/logo-icon.png'
                                alt='site logo'
                                className='logo-icon'
                            />
                        </Link>
                    </div>
                    {/* End LOGO section */}
                    <div className='sidebar-menu-area'>
                        {/* sidebar start */}
                        <ul className='sidebar-menu' id='sidebar-menu'>
                            <li className='mb-3'>
                                <Link
                                    href={route("admin.dashboard")}
                                    className={url === '/admin/dashboard' ? 'active-page' : ''}
                                >
                                    <Icon
                                        icon='solar:home-smile-angle-outline'
                                        className='menu-icon'
                                    />
                                    <span>Dashboard</span>
                                </Link>
                            </li>
                            <li className='mb-3'>
                                <Link
                                    href='/admin/users'
                                    className={url === '/admin/users' ? 'active-page' : ''}
                                >
                                    <Icon
                                        icon='flowbite:users-group-outline'
                                        className='menu-icon'
                                    />
                                    <span>System Users</span>
                                </Link>
                            </li>

                            {/* Role & Access Dropdown */}
                            <li className='dropdown'>
                                <Link href={route('admin.users')}>
                                    <i className='ri-user-settings-line' />
                                    <span>Role &amp; Access</span>
                                </Link>
                                <ul className='sidebar-submenu'>
                                    <li>
                                        <Link
                                            href={route('admin.roles')}
                                            to='/roles'
                                            className={url === '/admin/roles' ? 'active-page' : ''}
                                        >
                                            <i className='ri-circle-fill circle-icon text-primary-600 w-auto' />{" "}
                                            Role &amp; Access
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to='/assign-role'
                                            href={route('admin.assignRole')}
                                            className={url === '/admin/assign-role' ? 'active-page' : ''}
                                        >
                                            <i className='ri-circle-fill circle-icon text-warning-main w-auto' />{" "}
                                            Assign Role
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                            <li className='mb-3'>
                                <Link
                                    to='/admin/working-groups'
                                    href={route('admin.workingGroups')}
                                    className={url === '/admin/working-groups' ? 'active-page' : ''}
                                >
                                    <Icon
                                        icon='lucide:network'
                                        className='menu-icon'
                                    />
                                    <span>Working Groups</span>
                                </Link>
                            </li>
                            <li className='dropdown'>
                                <Link href={route('admin.inventory')}>
                                    <Icon icon='lsicon:inventory-filled' className='menu-icon' />
                                    <span>Inventory Management</span>
                                </Link>
                                <ul className='sidebar-submenu'>
                                    <li>
                                        <Link
                                            href={route('admin.inventoryProviders')}
                                            className={url === '/admin/manage/inventory/providers' ? 'active-page' : ''}
                                        >
                                            <i className='ri-circle-fill circle-icon text-primary-600 w-auto' />{" "}
                                            Providers
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={route('admin.inventory')}
                                            className={url === '/admin/inventory' ? 'active-page' : ''}
                                        >
                                            <i className='ri-circle-fill circle-icon text-warning-main w-auto' />{" "}
                                            Inventory
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                            <li className='dropdown'>
                                <Link href={route('admin.users')}>
                                    <Icon icon='fluent-mdl2:product-variant' className='menu-icon' />
                                    <span>Products</span>
                                </Link>
                                <ul className='sidebar-submenu'>
                                    <li>
                                        <Link
                                            href={route('admin.addProduct')}
                                            className={url === '/admin/add-new-product' ? 'active-page' : ''}
                                        >
                                            <i className='ri-circle-fill circle-icon text-primary-600 w-auto' />{" "}
                                            Add new product
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={route('admin.products')}
                                            className={url === '/admin/products' ? 'active-page' : ''}
                                        >
                                            <i className='ri-circle-fill circle-icon text-warning-main w-auto' />{" "}
                                            All products
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <Link
                                    href='/testimonials'
                                    className={(navData) => (navData.isActive ? "active-page" : "")}
                                >
                                    <Icon
                                        icon='mage:message-question-mark-round'
                                        className='menu-icon'
                                    />
                                    <span>Testimonials</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </aside>

                <main
                    className={sidebarActive ? "dashboard-main active" : "dashboard-main"}
                >
                    <div className='navbar-header'>
                        <div className='row align-items-center justify-content-between'>
                            <div className='col-auto'>
                                <div className='d-flex flex-wrap align-items-center gap-4'>
                                    <button
                                        type='button'
                                        className='sidebar-toggle'
                                        onClick={sidebarControl}
                                    >
                                        {sidebarActive ? (
                                            <Icon
                                                icon='iconoir:arrow-right'
                                                className='icon text-2xl non-active'
                                            />
                                        ) : (
                                            <Icon
                                                icon='heroicons:bars-3-solid'
                                                className='icon text-2xl non-active '
                                            />
                                        )}
                                    </button>
                                    <button
                                        onClick={mobileMenuControl}
                                        type='button'
                                        className='sidebar-mobile-toggle'
                                    >
                                        <Icon icon='heroicons:bars-3-solid' className='icon' />
                                    </button>
                                    <form className='navbar-search'>
                                        <input type='text' name='search' placeholder='Search' />
                                        <Icon icon='ion:search-outline' className='icon' />
                                    </form>
                                </div>
                            </div>
                            <div className='col-auto'>
                                <div className='d-flex flex-wrap align-items-center gap-3'>
                                    {/* ThemeToggleButton */}
                                    <ThemeToggleButton />
                                    <div className='dropdown'>
                                        <button
                                            className='has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center'
                                            type='button'
                                            data-bs-toggle='dropdown'
                                        >
                                            <Icon
                                                icon='iconoir:bell'
                                                className='text-primary-light text-xl'
                                            />
                                        </button>
                                        <div className='dropdown-menu to-top dropdown-menu-lg p-0'>
                                            <div className='m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2'>
                                                <div>
                                                    <h6 className='text-lg text-primary-light fw-semibold mb-0'>
                                                        Notifications
                                                    </h6>
                                                </div>
                                                <span className='text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center'>
                                                    {notifications.length}
                                                </span>
                                            </div>
                                            <div className='max-h-400-px overflow-y-auto scroll-sm pe-4'>
                                                {notifications.length
                                                    ? notifications.map(n => (
                                                        <Link
                                                            key={n.id}
                                                            to='#'
                                                            className='px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between'
                                                        >
                                                            <div className='d-flex gap-3'>
                                                                <Icon icon='bitcoin-icons:verify-outline' className='icon text-xxl' />
                                                                <div>
                                                                    <h6 className='fw-semibold mb-1'>{n.title}</h6>
                                                                    <p className='text-sm mb-0'>{n.message}</p>
                                                                </div>
                                                            </div>
                                                            <span className='text-sm text-secondary-light'>
                                                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </Link>
                                                    ))
                                                    : <div className='px-24 py-12 text-center'>No notifications</div>
                                                }
                                            </div>
                                            <div className='text-center py-12 px-16'>
                                                <Link
                                                    to='#'
                                                    className='text-primary-600 fw-semibold text-md'
                                                >
                                                    See All Notification
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Notification dropdown end */}
                                    <div className='dropdown'>
                                        <button
                                            className='d-flex justify-content-center align-items-center rounded-circle'
                                            type='button'
                                            data-bs-toggle='dropdown'
                                        >
                                            <img
                                                src={userDetails.profile_picture || '/assets/images/user.png'}
                                                alt='image_user'
                                                className='w-40-px h-40-px object-fit-cover rounded-circle'
                                            />
                                        </button>
                                        <div className='dropdown-menu to-top dropdown-menu-sm'>
                                            <div className='py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2'>
                                                <div>
                                                    <h6 className='text-lg text-primary-light fw-semibold mb-2'>
                                                        {userDetails.name}
                                                    </h6>
                                                    <span className='text-secondary-light fw-medium text-sm'>
                                                        {userDetails.email}
                                                    </span>
                                                    <span className='text-secondary-light fw-medium text-sm tw-capitalize'>
                                                        {userDetails.role.name}
                                                    </span>
                                                </div>
                                                <button type='button' className='hover-text-danger'>
                                                    <Icon
                                                        icon='radix-icons:cross-1'
                                                        className='icon text-xl'
                                                    />
                                                </button>
                                            </div>
                                            <ul className='to-top-list'>
                                                <li>
                                                    <Link
                                                        className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                                                        href={route('admin.profile')}
                                                    >
                                                        <Icon
                                                            icon='solar:user-linear'
                                                            className='icon text-xl'
                                                        />{" "}
                                                        My Profile
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3'
                                                        href={route('logout')}
                                                        method="post"
                                                        as="button"
                                                    >
                                                        <Icon icon='lucide:power' className='icon text-xl' />{" "}
                                                        Log Out
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    {/* Profile dropdown end */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* dashboard-main-body */}
                    <div className='dashboard-main-body'>{children}</div>

                    {/* Footer section */}
                    <footer className='d-footer text-sm'>
                        <div className='row align-items-center justify-content-between'>
                            <div className='col-auto'>
                                <p className='mb-0'>© {currentYear} Printair. All Rights Reserved.</p>
                            </div>
                            <div className='col-auto'>
                                <p className='mb-0'>
                                    Developed by <span className='text-primary-600'>Thejan Vishmitha</span> @Printair
                                </p>
                            </div>
                        </div>
                    </footer>
                </main>
            </section>
        </>
    );
};

export default AdminDashboard;
