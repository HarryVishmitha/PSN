import { useState } from 'react';
import { Icon } from '@iconify/react';

const faqs = [
    {
        question: "How long does it take to receive my printed order?",
        answer: "Most standard orders are processed and delivered within 3-5 business days. Urgent delivery options are also available upon request.",
    },
    {
        question: "Can I get a custom design created by Printair?",
        answer: "Absolutely! Our in-house creative team can handle logos, packaging, branding, and more. Request a design quote to get started.",
    },
    {
        question: "Do you offer delivery outside Colombo?",
        answer: "Yes, we deliver island-wide across Sri Lanka with reliable courier partners.",
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept bank transfers, credit/debit cards, and mobile payments such as Frimi and Genie.",
    },
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="tw-py-20 tw-bg-white tw-mb-12">
            <div className="tw-container tw-mx-auto tw-px-4">
                <h2 className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-text-center tw-mb-12" data-aos="fade-up">
                    Frequently Asked <span className="tw-text-[#f44032]">Questions</span>
                </h2>

                <div className="tw-max-w-3xl tw-mx-auto">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            onClick={() => toggleFAQ(idx)}
                            className="tw-bg-gray-50 tw-rounded-lg tw-shadow-sm tw-mb-4 tw-cursor-pointer hover:tw-bg-gradient-to-r hover:tw-from-[#f44032]/10 hover:tw-to-[#f44032]/5 tw-transition"
                            data-aos="fade-up"
                            data-aos-delay={idx * 100}
                        >
                            <div className="tw-flex tw-items-center tw-justify-between tw-p-5">
                                <h4 className="tw-font-semibold tw-text-lg tw-leading-tight">{faq.question}</h4>
                                <Icon
                                    icon={openIndex === idx ? "mdi:minus" : "mdi:plus"}
                                    className="tw-text-2xl tw-text-[#f44032]"
                                />
                            </div>
                            {openIndex === idx && (
                                <div className="tw-px-5 tw-pb-5 tw-text-gray-600 tw-transition-all">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
