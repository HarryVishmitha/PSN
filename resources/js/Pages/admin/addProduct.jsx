import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";

const AddProduct = ({ userDetails, workingGroups }) => {
    const [alert, setAlert] = useState(null); // { type: 'success' | 'danger', message: string }
    const [currentStep, setCurrentStep] = useState(1);
    const [formDataArray, setFormDataArray] = useState([]);
    const [selectedWorkingGroup, setSelectedWorkingGroup] = useState('');
    const [errors, setErrors] = useState({}); // To capture errors for each step
    const [showCookieConsent, setShowCookieConsent] = useState(true);
    const [name, setName] = useState('');


    const nextStep = () => {
        if (currentStep === 1 && !selectedWorkingGroup) {
            setAlert({ type: 'danger', message: 'Please select a working group.' });
            setErrors({ workingGroup: 'Please select a working group.' });
            return;
        }
        // Capture data from the current step; for example, step 1 data:
        if (currentStep === 1) {
            // Append the working group selection to the array.
            setFormDataArray(prev => [...prev, { workingGroup: selectedWorkingGroup }]);
            console.log('Form Data Array:', formDataArray);
        }

        if (currentStep === 2 && !name) {
            setAlert({ type: 'danger', message: 'Please enter a product name.' });
            setErrors({ productName: 'Please enter a product name.' });
            return;
        }
        if (currentStep === 2) {
            // Capture data from step 2 and add to the array.
            const productName = document.querySelector('input[name="productName"]').value;
            setFormDataArray(prev => [...prev, { productName }]);
        }

        setAlert(null);
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <>
            <Head title="Add New Product - Admin Dashboard" />
            <Meta title="Add New Product - Admin Dashboard" description='Add New Product to the system' />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Add New Product" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className='card'>
                    <div className='card-body'>
                        <h6 className='mb-4 tw-text-xl tw-font-semibold tw-text-black mt-3'>Add New Product</h6>
                        <p className='text-neutral-500'>
                            Fill up product details and proceed...
                        </p>
                        {/* Form Wizard Start */}
                        <div className='form-wizard'>
                            <form action='#' method='post'>
                                <div className='form-wizard-header overflow-x-auto scroll-sm pb-8 my-32'>
                                    <ul className='list-unstyled form-wizard-list'>
                                        <li
                                            className={`form-wizard-list__item
                      ${[2, 3, 4, 5].includes(currentStep) && "activated"}
                    ${currentStep === 1 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>1</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>
                                                Select Working Group{" "}
                                            </span>
                                        </li>
                                        <li
                                            className={`form-wizard-list__item
                      ${[3, 4, 5].includes(currentStep) && "activated"}
                    ${currentStep === 2 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>2</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>
                                                Import Data
                                            </span>
                                        </li>
                                        <li
                                            className={`form-wizard-list__item
                      ${[4, 5].includes(currentStep) && "activated"}
                    ${currentStep === 3 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>3</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>
                                                Setup Privacy
                                            </span>
                                        </li>
                                        <li
                                            className={`form-wizard-list__item
                      ${[5].includes(currentStep) && "activated"}
                    ${currentStep === 4 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>4</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>
                                                Add Location
                                            </span>
                                        </li>
                                        <li
                                            className={`form-wizard-list__item

                    ${currentStep === 5 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>5</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>Completed</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Step 1 */}
                                <fieldset
                                    className={`wizard-fieldset ${currentStep === 1 && "show"} `}
                                >
                                    <h6 className='text-md text-neutral-500 mb-3'>
                                        Working Group Information
                                    </h6>
                                    <div className='form-group mb-3'>
                                        <label className='form-label'>Select Category*</label>
                                        <div className='position-relative'>
                                            <select className= {`form-control form-select ${errors.workingGroup ? 'is-invalid' : ''} wizard-required`}
                                                value={selectedWorkingGroup}
                                                onChange={(e) => setSelectedWorkingGroup(e.target.value)}
                                            >
                                                <option value='' disabled>
                                                    Select a working group
                                                </option>
                                                {workingGroups.map((group) => (
                                                    <option key={group.id} value={group.id}>
                                                        {group.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {/* <div className='wizard-form-error' /> */}
                                            <div className='wizard-form-error' />
                                            {errors.workingGroup && (
                                                <div className="invalid-feedback">{errors.workingGroup}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className='form-group d-flex align-items-center justify-content-end gap-8'>
                                        <button
                                            onClick={prevStep}
                                            type='button'
                                            className='form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32'
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            type='button'
                                            className='form-wizard-next-btn btn btn-primary-600 px-32'
                                        >
                                            Next
                                        </button>
                                    </div>
                                </fieldset>

                                {/* Step 2 */}
                                <fieldset
                                    className={`wizard-fieldset ${currentStep === 2 && "show"} `}
                                >
                                    <h6 className='text-md text-neutral-500'>
                                        Basic Product Information
                                    </h6>
                                    <div className='row gy-3'>
                                        <div className='col-12'>
                                            <label className='form-label'>Product Name*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='text'
                                                    className={`form-control ${errors.productName ? 'is-invalid' : ''} wizard-required`}
                                                    placeholder='Enter Product Name'
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                                <div className='wizard-form-error' />
                                                {errors.productName && (
                                                    <div className="invalid-feedback">{errors.productName}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className='col-sm-4'>
                                            <label className='form-label'>Card Number*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='number'
                                                    className='form-control wizard-required'
                                                    placeholder='Enter Card Number '
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='col-sm-4'>
                                            <label className='form-label'>
                                                Card Expiration(MM/YY)*
                                            </label>
                                            <div className='position-relative'>
                                                <input
                                                    type='number'
                                                    className='form-control wizard-required'
                                                    placeholder='Enter Card Expiration'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='col-sm-4'>
                                            <label className='form-label'>CVV Number*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='number'
                                                    className='form-control wizard-required'
                                                    placeholder='CVV Number'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='col-12'>
                                            <label className='form-label'>Password*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='password'
                                                    className='form-control wizard-required'
                                                    placeholder='Enter Password'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='form-group d-flex align-items-center justify-content-end gap-8'>
                                            <button
                                                onClick={prevStep}
                                                type='button'
                                                className='form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32'
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={nextStep}
                                                type='button'
                                                className='form-wizard-next-btn btn btn-primary-600 px-32'
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </fieldset>
                                <fieldset
                                    className={`wizard-fieldset ${currentStep === 3 && "show"} `}
                                >
                                    <h6 className='text-md text-neutral-500'>Bank Information</h6>
                                    <div className='row gy-3'>
                                        <div className='col-sm-6'>
                                            <label className='form-label'>Bank Name*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='text'
                                                    className='form-control wizard-required'
                                                    placeholder='Enter Bank Name'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='col-sm-6'>
                                            <label className='form-label'>Branch Name*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='text'
                                                    className='form-control wizard-required'
                                                    placeholder='Enter Branch Name'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='col-sm-6'>
                                            <label className='form-label'>Account Name*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='text'
                                                    className='form-control wizard-required'
                                                    placeholder='Enter Account Name'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='col-sm-6'>
                                            <label className='form-label'>Account Number*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='number'
                                                    className='form-control wizard-required'
                                                    placeholder='Enter Account Number'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='form-group d-flex align-items-center justify-content-end gap-8'>
                                            <button
                                                onClick={prevStep}
                                                type='button'
                                                className='form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32'
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={nextStep}
                                                type='button'
                                                className='form-wizard-next-btn btn btn-primary-600 px-32'
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </fieldset>
                                <fieldset
                                    className={`wizard-fieldset ${currentStep === 4 && "show"} `}
                                >
                                    <h6 className='text-md text-neutral-500'>
                                        Payment Information
                                    </h6>
                                    <div className='row gy-3'>
                                        <div className='col-sm-12'>
                                            <label className='form-label'>Holder Name*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='text'
                                                    className='form-control wizard-required'
                                                    placeholder='Enter Holder Name'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='col-sm-6'>
                                            <label className='form-label'>Card Number*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='number'
                                                    className='form-control wizard-required'
                                                    placeholder='Enter Card Number'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='col-sm-6'>
                                            <label className='form-label'>CVC Number*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='number'
                                                    className='form-control wizard-required'
                                                    placeholder='CVC Number'
                                                    required=''
                                                />
                                                <div className='wizard-form-error' />
                                            </div>
                                        </div>
                                        <div className='col-12'>
                                            <label className='form-label'>Expiry Date*</label>
                                            <div className='row gy-4'>
                                                <div className='col-sm-4'>
                                                    <div className='position-relative'>
                                                        <select
                                                            className='form-control form-select'
                                                            defaultValue=''
                                                        >
                                                            <option value='Date'>Date</option>
                                                            <option value='1'>1</option>
                                                            <option value='2'>2</option>
                                                            <option value='3'>3</option>
                                                            <option value='4'>4</option>
                                                            <option value='5'>5</option>
                                                            <option value='6'>6</option>
                                                            <option value='7'>7</option>
                                                            <option value='8'>8</option>
                                                            <option value='9'>9</option>
                                                            <option value='10'>10</option>
                                                            <option value='11'>11</option>
                                                            <option value='12'>12</option>
                                                            <option value='13'>13</option>
                                                            <option value='14'>14</option>
                                                            <option value='15'>15</option>
                                                            <option value='16'>16</option>
                                                            <option value='17'>17</option>
                                                            <option value='18'>18</option>
                                                            <option value='19'>19</option>
                                                            <option value='20'>20</option>
                                                            <option value='21'>21</option>
                                                            <option value='22'>22</option>
                                                            <option value='23'>23</option>
                                                            <option value='24'>24</option>
                                                            <option value='25'>25</option>
                                                            <option value='26'>26</option>
                                                            <option value='27'>27</option>
                                                            <option value='28'>28</option>
                                                            <option value='29'>29</option>
                                                            <option value='30'>30</option>
                                                            <option value='31'>31</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className='col-sm-4'>
                                                    <div className='position-relative'>
                                                        <select
                                                            className='form-control form-select'
                                                            defaultValue='jan'
                                                        >
                                                            <option value='Month'>Month</option>
                                                            <option value='jan'>jan</option>
                                                            <option value='Feb'>Feb</option>
                                                            <option value='March'>March</option>
                                                            <option value='April'>April</option>
                                                            <option value='May'>May</option>
                                                            <option value='June'>June</option>
                                                            <option value='July'>July</option>
                                                            <option value='August'>August</option>
                                                            <option value='Sept'>Sept</option>
                                                            <option value='Oct'>Oct</option>
                                                            <option value='Nov'>Nov</option>
                                                            <option value='Dec'>Dec</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className='col-sm-4'>
                                                    <div className='position-relative'>
                                                        <select
                                                            className='form-control form-select'
                                                            defaultValue='2019'
                                                        >
                                                            <option value='Years'>Years</option>
                                                            <option value='2019'>2019</option>
                                                            <option value='2020'>2020</option>
                                                            <option value='2021'>2021</option>
                                                            <option value='2022'>2022</option>
                                                            <option value='2023'>2023</option>
                                                            <option value='2024'>2024</option>
                                                            <option value='2025'>2025</option>
                                                            <option value='2026'>2026</option>
                                                            <option value='2027'>2027</option>
                                                            <option value='2028'>2028</option>
                                                            <option value='2029'>2029</option>
                                                            <option value='2030'>2030</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='form-group d-flex align-items-center justify-content-end gap-8'>
                                            <button
                                                onClick={prevStep}
                                                type='button'
                                                className='form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32'
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={nextStep}
                                                type='button'
                                                className='form-wizard-next-btn btn btn-primary-600 px-32'
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </fieldset>
                                <fieldset
                                    className={`wizard-fieldset ${currentStep === 5 && "show"} `}
                                >
                                    <div className='text-center mb-40'>
                                        <img
                                            src='assets/images/gif/success-img3.gif'
                                            alt=''
                                            className='gif-image mb-24'
                                        />
                                        <h6 className='text-md text-neutral-600'>Congratulations </h6>
                                        <p className='text-neutral-400 text-sm mb-0'>
                                            Well done! You have successfully completed.
                                        </p>
                                    </div>
                                    <div className='form-group d-flex align-items-center justify-content-end gap-8'>
                                        <button
                                            onClick={prevStep}
                                            type='button'
                                            className='form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32'
                                        >
                                            Back
                                        </button>
                                        <button
                                            type='button'
                                            className='form-wizard-submit btn btn-primary-600 px-32'
                                        >
                                            Publish
                                        </button>
                                    </div>
                                </fieldset>
                            </form>
                        </div>
                        {/* Form Wizard End */}
                    </div>
                </div>

            </AdminDashboard>
        </>
    );

};

export default AddProduct;