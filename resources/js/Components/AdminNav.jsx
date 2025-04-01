import React from 'react';
import { Link } from '@inertiajs/react';
import { Icon } from "@iconify/react";

const AdminNav = ({breadcrumbs}) => {

    return (
        <nav className="tw-breadcrumb tw-text-sm tw-mt-1 tw-text-gray-500 tw-ms-5">
            <ol className="tw-flex tw-space-x-1">
                {breadcrumbs.map((breadcrumb, index) => (
                    <li key={index} className="tw-flex tw-items-center">
                        {breadcrumb.url ? (
                            <Link href={breadcrumb.url} className="hover:tw-text-red-500 tw-flex tw-items-center">
                                {breadcrumb.icon && (
                                    <Icon icon={breadcrumb.icon} width={18} className="tw-mr-1" />
                                )}
                                {breadcrumb.label}
                            </Link>
                        ) : (
                            <span className="tw-text-gray-500">{breadcrumb.label} </span>
                        )}
                        {index < breadcrumbs.length - 1 && <span>/</span>}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default AdminNav;
