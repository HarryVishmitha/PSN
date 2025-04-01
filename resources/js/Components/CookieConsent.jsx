import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Icon } from '@iconify/react';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);

  // Check if the user has already accepted the cookies
  useEffect(() => {
    const cookieConsent = Cookies.get('cookieConsent');
    if (!cookieConsent) {
      setShowConsent(true); // Show consent if no cookie is set
    }
  }, []);

  // Accept all cookies
  const acceptAllCookies = () => {
    Cookies.set('cookieConsent', 'accepted', { expires: 365 }); // Set cookie for a year
    setShowConsent(false); // Hide the consent popup
  };

  // Reject all cookies
  const rejectAllCookies = () => {
    Cookies.set('cookieConsent', 'rejected', { expires: 365 }); // Set cookie for a year
    setShowConsent(false); // Hide the consent popup
  };

  // Personalize cookie choices (if needed)
  const personalizeCookies = () => {
    alert("Personalizing cookie choices... (this can be customized)");
    setShowConsent(false); // Hide the consent popup
  };

  return (
    <>
      {showConsent && (
        <div className="tw-fixed tw-bottom-0 tw-right-0 tw-bg-gray-800 tw-text-white tw-p-6 tw-rounded-t-xl tw-shadow-lg tw-z-50 tw-w-2/5">
          <div className="tw-flex tw-items-center">
            <Icon icon="proicons:cookies" className="tw-text-2xl tw-mr-4" height='50' width='50'/>
            <div className="tw-flex-1">
              <p className="tw-text-[12px]">
                We use cookies, including third party cookies, for operational purposes, statistical analyses, to personalize your experience, provide you with targeted content tailored to your interests and to analyze the performance of our advertising campaigns.
              </p>
              <p className="tw-mt-2 tw-text-[10px]">
                To find out more about the types of cookies, as well as who sends them on our website, please visit our dedicated guide to{' '}
                <a href="/managing-cookies" className="tw-text-blue-400 hover:tw-underline">managing cookies</a>.
              </p>
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-justify-between tw-mt-4">
            <div>
              <button
                className="tw-bg-transparent tw-border tw-border-gray-500 tw-text-gray-500 tw-px-4 tw-py-2 tw-rounded-md hover:tw-bg-gray-500 hover:tw-text-white tw-mr-2 tw-text-sm"
                onClick={rejectAllCookies}
              >
                Reject all
              </button>
              <button
                className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-md hover:tw-bg-blue-700 tw-text-sm"
                onClick={acceptAllCookies}
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
