import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminHeader from '../../Components/AdminHeader';
import AdminNav from '@/Components/AdminNav';
import CookiesV from '@/Components/CookieConsent';
import { Icon } from "@iconify/react";
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import Alert from "@/Components/Alert";
import Meta from '@/Components/Metaheads';

const useredit = ({ userDetails, selectedUser, selectedID }) => {
    const [imagePreview, setImagePreview] = useState(selectedUser.profile_picture || '/assets/images/user.png');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: selectedUser.name,
        email: selectedUser.email,
        phone_number: selectedUser.phone_number || '',
        description: selectedUser.description || '',
        newPassword: '',
        confirmPassword: '',
        profileImage: null
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };

    const readURL = (input) => {
        if (input.target.files && input.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(input.target.files[0]);
        }
    };
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Full Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            const formDataToSend = new FormData();
            // Append all the regular form fields
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone_number', formData.phone_number);
            formDataToSend.append('description', formData.description);

            // If a new profile image exists, append it
            if (formData.profileImage) {
                formDataToSend.append('profile_picture', formData.profileImage);
            }

            // If a new password exists, append it
            if (formData.newPassword) {
                formDataToSend.append('newPassword', formData.newPassword);
            }

            try {
                const response = await axios.post(`/admin/api/edit-profile/${selectedID}`, formDataToSend);
                console.log(formDataToSend);
                setLoading(false);
                setSuccessMessage('Profile updated successfully!');
            } catch (error) {
                setLoading(false);
                if (error.response) {
                    // Backend error response handling
                    const responseData = error.response.data;
                    if (responseData.errors) {
                        // If the backend provides specific field errors
                        setErrors(responseData.errors);
                        if (responseData.errors.profile_picture) {
                            setErrorMessage(responseData.errors.profile_picture);
                        } else {
                            setErrorMessage('Please fill all required fields');
                        }


                    } else {
                        setErrorMessage(responseData.error || 'Something went wrong. Please try again later');
                    }
                } else {
                    // Network or other errors
                    setErrorMessage('An unexpected error occurred. Please try again later. Error:' + error.message);
                }
            }
        }
    };


    return (
        <>
            <Head title="Edit - Admin" />
            <Meta title='Edit User' description='Edit user details and profile image' />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Edit User" />
                <div className="row gy-4">
                    <div className="col-lg-4">
                        <div className="user-grid-card position-relative border radius-16 overflow-hidden bg-base h-100">
                            <img
                                src="/assets/images/user-grid/user-grid-bg1.png"
                                alt="profile banner image"
                                className="w-100 object-fit-cover"
                            />
                            <div className="pb-24 ms-16 mb-24 me-16 mt--100">
                                <div className="text-center border border-top-0 border-start-0 border-end-0">
                                    <img
                                        src={imagePreview}
                                        alt={`Profile picture of ${selectedUser.name}`}
                                        className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover mx-auto"
                                    />
                                    <h6 className="mb-0 mt-16">{selectedUser.name}</h6>
                                    <span className="text-secondary-light mb-16">{selectedUser.email}</span>
                                </div>
                                <div className="mt-24">
                                    <h6 className="text-xl mb-16">Personal Info</h6>
                                    <ul>
                                        <li className="d-flex align-items-center gap-1 mb-12">
                                            <span className="w-30 text-md fw-semibold text-primary-light">
                                                Full Name
                                            </span>
                                            <span className="w-70 text-secondary-light fw-medium">
                                                : {selectedUser.name}
                                            </span>
                                        </li>
                                        <li className="d-flex align-items-center gap-1 mb-12">
                                            <span className="w-30 text-md fw-semibold text-primary-light">
                                                {" "}Email
                                            </span>
                                            <span className="w-70 text-secondary-light fw-medium">
                                                : {selectedUser.email}
                                            </span>
                                        </li>
                                        <li className="d-flex align-items-center gap-1 mb-12">
                                            <span className="w-30 text-md fw-semibold text-primary-light">
                                                {" "}Phone Number
                                            </span>
                                            <span className="w-70 text-secondary-light fw-medium">
                                                : {selectedUser.phone_number || 'Not Set'}
                                            </span>
                                        </li>
                                        <li className="d-flex align-items-center gap-1 mb-12">
                                            <span className="w-30 text-md fw-semibold text-primary-light">
                                                {" "}Account
                                            </span>
                                            <span className="w-70 text-secondary-light fw-medium tw-capitalize">
                                                : {selectedUser.role.name}
                                            </span>
                                        </li>
                                        <li className="d-flex align-items-center gap-1 mb-12">
                                            <span className="w-30 text-md fw-semibold text-primary-light">
                                                {" "}Working Group
                                            </span>
                                            <span className="w-70 text-secondary-light fw-medium tw-capitalize">
                                                : {selectedUser.working_group && selectedUser.working_group.name ? selectedUser.working_group.name : 'Public'}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-8">
                        <div className="card h-100">
                            <div className="card-body p-24">

                                {errorMessage && <Alert type="danger" message={errorMessage} />}
                                {successMessage && <Alert type="success" message={successMessage} />}
                                {errors.profile_picture && <div className="mb-3 alert alert-danger bg-danger-100 text-danger-600 border-danger-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 text-lg radius-4 d-flex align-items-center justify-content-between">{errors.profile_picture}</div>}

                                <form onSubmit={handleSubmit} encType="multipart/form-data">
                                    <h6 className="text-md text-primary-light mb-16">Profile Image</h6>
                                    {/* Upload Image Start */}
                                    <div className="mb-24 mt-16">
                                        <div className="avatar-upload">
                                            <div className="avatar-edit position-absolute bottom-0 end-0 me-24 mt-16 z-1 cursor-pointer">
                                                <input
                                                    type="file"
                                                    id="imageUpload"
                                                    accept=".png, .jpg, .jpeg"
                                                    hidden
                                                    onChange={readURL}
                                                />
                                                <label
                                                    htmlFor="imageUpload"
                                                    className="w-32-px h-32-px d-flex justify-content-center align-items-center bg-primary-50 text-primary-600 border border-primary-600 bg-hover-primary-100 text-lg rounded-circle"
                                                >
                                                    <Icon icon="solar:camera-outline" className="icon"></Icon>
                                                </label>
                                            </div>
                                            <div className="avatar-preview">
                                                <div
                                                    id="imagePreview"
                                                    style={{
                                                        backgroundImage: `url(${imagePreview})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Upload Image End */}
                                    <div className="row">
                                        <div className="col-sm-6">
                                            <div className="mb-20">
                                                <label htmlFor="name" className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                    Full Name <span className="text-danger-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control radius-8 tw-rounded ${errors.name ? 'is-invalid' : ''}`}
                                                    id="name"
                                                    placeholder="Enter Full Name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                />
                                                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            <div className="mb-20">
                                                <label htmlFor="email" className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                    Email <span className="text-danger-600">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    className={`form-control radius-8 tw-rounded ${errors.email ? 'is-invalid' : ''}`}
                                                    id="email"
                                                    placeholder="Enter email address"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                />
                                                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            <div className="mb-20">
                                                <label htmlFor="phone_number" className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                    Phone <span className="text-danger-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control radius-8 tw-rounded ${errors.phone_number ? 'is-invalid' : ''}`}
                                                    id="phone_number"
                                                    placeholder="Enter phone number"
                                                    value={formData.phone_number}
                                                    onChange={handleChange}
                                                />
                                                {errors.phone_number && <div className="invalid-feedback">{errors.phone_number}</div>}
                                            </div>
                                        </div>
                                        <div className="mb-20">
                                            <label htmlFor="your-password" className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                New Password <span className="text-danger-600">*</span>
                                            </label>
                                            <div className="position-relative">
                                                <input
                                                    type={passwordVisible ? "text" : "password"}
                                                    className="form-control radius-8 tw-rounded"
                                                    id="your-password"
                                                    placeholder="Enter New Password*"
                                                />
                                                <span
                                                    className={`toggle-password ${passwordVisible ? "ri-eye-off-line" : "ri-eye-line"} cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light`}
                                                    onClick={togglePasswordVisibility}
                                                ></span>
                                            </div>
                                        </div>
                                        <div className="mb-20">
                                            <label htmlFor="confirm-password" className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                Confirm Password <span className="text-danger-600">*</span>
                                            </label>
                                            <div className="position-relative">
                                                <input
                                                    type={confirmPasswordVisible ? "text" : "password"}
                                                    className="form-control radius-8 tw-rounded tw-bg-none"
                                                    id="confirm-password"
                                                    placeholder="Confirm Password*"
                                                />
                                                <span
                                                    className={`toggle-password ${confirmPasswordVisible ? "ri-eye-off-line" : "ri-eye-line"} cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light`}
                                                    onClick={toggleConfirmPasswordVisibility}
                                                ></span>
                                            </div>
                                        </div>
                                        <div className="col-sm-12">
                                            <div className="mb-20">
                                                <label htmlFor="description" className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                    Description
                                                </label>
                                                <textarea
                                                    className="form-control radius-8"
                                                    id="description"
                                                    placeholder="Write description..."
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center gap-3">
                                        <Link
                                            type="button"
                                            className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-56 py-11 radius-8"
                                            href={route('admin.users')}
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            className="btn btn-primary border border-primary-600 text-md px-56 py-12 radius-8"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboard>
            <CookiesV />
        </>
    );
};

export default useredit;
