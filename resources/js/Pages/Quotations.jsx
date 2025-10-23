import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Meta from '@/Components/Metaheads';
import Breadcrumb from '@/Components/Breadcrumb';

export default function Quotations() {
  return (
    <>
      <Head title="Request a Quote" />
      <Meta title="Request a Quote" description="Tell us what you need and we'll prepare a quotation." />
      <div className="tw-container tw-mx-auto tw-py-8 tw-px-4">
        <Breadcrumb title="Request a Quote" />
        <div className="tw-max-w-3xl tw-mx-auto tw-bg-white dark:tw-bg-zinc-900 tw-rounded-xl tw-shadow tw-p-6">
          <h1 className="tw-text-2xl tw-font-bold tw-mb-2">Tell us about your project</h1>
          <p className="tw-text-zinc-600 dark:tw-text-zinc-300 tw-mb-6">
            Share a few details and our team will get back to you with a personalized quotation.
          </p>
          <ul className="tw-list-disc tw-pl-6 tw-text-sm tw-text-zinc-700 dark:tw-text-zinc-300 tw-space-y-1 tw-mb-6">
            <li>Product or service you’re interested in</li>
            <li>Dimensions, quantity, finishing, or any special notes</li>
            <li>Attach designs or provide a link in the product page if available</li>
          </ul>
          <div className="tw-flex tw-gap-3 tw-flex-wrap">
            <Link href={route('products.all')} className="btn btn-primary">Browse Products</Link>
            <Link href={route('home')} className="btn btn-outline-secondary">Back to Home</Link>
          </div>
        </div>
      </div>
    </>
  );
}

