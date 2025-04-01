import React from "react";
import { Icon } from "@iconify/react";
import { Head, Link, usePage } from '@inertiajs/react';
const Breadcrumb = ({ title }) => {
  return (
    <div className='d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24'>
      <h6 className='fw-semibold mb-0'>Admin Dashboard</h6>
      <ul className='d-flex align-items-center gap-2'>
        <li className='fw-medium'>
          <Link
            href={route('admin.dashboard')}
            className='d-flex align-items-center gap-1 hover-text-primary'
          >
            <Icon
              icon='solar:home-smile-angle-outline'
              className='icon text-lg'
            />
            Dashboard
          </Link>
        </li>
        <li> - </li>
        <li className='fw-medium'>{title}</li>
      </ul>
    </div>
  );
};

export default Breadcrumb;
