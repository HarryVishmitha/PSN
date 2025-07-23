import React from 'react';

const ContactUs = () => {
    return (
        <section className="tw-bg-white tw-py-20 tw-px-20 tw-mx-auto" id="contact">
            <h2
                className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-text-center tw-mb-12"
                data-aos="fade-up"
            >
                Contact <span className="tw-text-[#f44032]">Us</span>
            </h2>

            <div className="tw-grid md:tw-grid-cols-2 tw-gap-10">
                {/* Contact Info + Map */}
                <div data-aos="fade-right">
                    <div className="tw-mb-6">
                        <h3 className="tw-text-xl tw-font-semibold tw-mb-2">Get In Touch</h3>
                        <p className="tw-text-gray-600 tw-mb-4">
                            Feel free to reach out to us with any inquiries or custom design requests.
                        </p>
                        <ul className="tw-space-y-2">
                            <li><strong>Phone:</strong> +94 76 886 0175 | (011) 224 1858 </li>
                            <li><strong>Email:</strong> contact@printair.lk</li>
                            <li><strong>Address:</strong> No. 67/D/1, Uggashena, Walpola, Ragama, Sri Lanka</li>
                            <li><strong>Postal Code:</strong> 11011</li>
                        </ul>
                    </div>

                    <iframe
                        title="Printair Location"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.6284964775527!2d79.92438707499777!3d7.052865292949481!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2f9e69a99f8bb%3A0x22ee736733e2cc74!2sPrintair!5e0!3m2!1sen!2slk!4v1752900934311!5m2!1sen!2slk"
                        width="100%"
                        height="250"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="tw-rounded-xl tw-shadow"
                    ></iframe>
                </div>

                {/* Contact Form */}
                <div data-aos="fade-left">
                    <form className="tw-bg-gray-50 tw-rounded-xl tw-shadow-md tw-p-6 tw-space-y-4">
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium">Name</label>
                            <input
                                type="text"
                                placeholder="Your Name"
                                className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded focus:tw-outline-none focus:tw-border-[#f44032]"
                            />
                        </div>
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded focus:tw-outline-none focus:tw-border-[#f44032]"
                            />
                        </div>
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium">Message</label>
                            <textarea
                                rows="4"
                                placeholder="Your message..."
                                className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded focus:tw-outline-none focus:tw-border-[#f44032]"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="tw-bg-[#f44032] tw-text-white tw-w-full tw-py-2 tw-rounded hover:tw-bg-red-600 tw-transition tw-text-center"
                        >
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default ContactUs;
