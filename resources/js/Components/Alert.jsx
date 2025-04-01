import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import '../../css/app.css';

const Alert = ({
    type = "primary",
    message,
    onClose,
    timeout = 5000,
    position = { top: "20px", right: "20px" },
    stackIndex = 0
}) => {
    const [visible, setVisible] = useState(true);
    const [transitionClass, setTransitionClass] = useState("alert-enter");
    const [shouldRender, setShouldRender] = useState(true);

    // Trigger the enter animation after mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setTransitionClass("alert-enter-active");
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    // Auto-dismiss after timeout
    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, timeout);
        return () => clearTimeout(timer);
    }, [timeout]);

    // When visible becomes false, trigger exit animation and remove the alert after the transition
    useEffect(() => {
        if (!visible) {
            setTransitionClass("alert-exit-active");
            const timer = setTimeout(() => {
                setShouldRender(false);
                if (onClose) onClose();
            }, 300); // Duration matches the CSS transition duration
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    const handleClose = () => {
        setVisible(false);
    };

    // Define alert styles and icons based on type (using your original UI design)
    const alertConfig = {
        primary: {
            className: "alert alert-primary bg-primary-50 text-primary-600 border-primary-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between",
            icon: "mingcute:emoji-line",
        },
        lilac: {
            className: "alert alert-lilac bg-lilac-50 text-lilac-600 border-lilac-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between",
            icon: "mingcute:emoji-line",
        },
        success: {
            className: "alert alert-success bg-success-100 text-success-600 border-success-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between",
            icon: "akar-icons:double-check",
        },
        warning: {
            className: "alert alert-warning bg-warning-100 text-warning-600 border-warning-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between",
            icon: "mdi:alert-circle-outline",
        },
        info: {
            className: "alert alert-info bg-info-100 text-info-600 border-info-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between",
            icon: "ci:link",
        },
        danger: {
            className: "alert alert-danger bg-danger-100 text-danger-600 border-danger-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between",
            icon: "mingcute:delete-2-line",
        },
    };

    const { className, icon } = alertConfig[type] || alertConfig.primary;

    // Container style for positioning and stacking alerts
    const containerStyle = {
        position: "fixed",
        top: `calc(${position.top} + ${stackIndex * 70}px)`,
        right: position.right,
        zIndex: 10000,
    };

    if (!shouldRender) return null;

    return (
        <div style={containerStyle} className={transitionClass}>
            <div className={className} role="alert">
                <div className="d-flex align-items-center gap-2">
                    <Icon icon={icon} className="icon text-xl" />
                    {message || `This is a ${type} alert`}
                </div>
                <button className={`remove-button text-${type}-600 text-xxl line-height-1`} onClick={handleClose}>
                    <Icon icon="iconamoon:sign-times-light" className="icon" />
                </button>
            </div>
        </div>
    );
};

export default Alert;
