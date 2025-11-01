import { Icon } from '@iconify/react';

const TimelinePanel = ({
    timeline,
    eventForm,
    setEventForm,
    submitEvent,
    eventSaving,
}) => (
    <div className="tw-mb-20 tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-3">
        <section className="tw-space-y-6 tw-rounded-2xl tw-border-2 tw-border-slate-200 tw-bg-gradient-to-br tw-from-white tw-to-slate-50 tw-p-6 tw-shadow-xl lg:tw-col-span-2">
            <div className="tw-flex tw-items-center tw-justify-between tw-border-b-2 tw-border-slate-200 tw-pb-4">
                <div className="tw-flex tw-items-center tw-gap-3">
                    <div className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-500 tw-to-purple-600 tw-shadow-lg">
                        <Icon
                            icon="solar:history-bold-duotone"
                            className="tw-text-2xl tw-text-white"
                        />
                    </div>
                    <div>
                        <h5 className="tw-text-xl tw-font-bold tw-text-slate-900">
                            Activity Timeline
                        </h5>
                        <p className="tw-mt-0.5 tw-text-xs tw-text-slate-600">
                            Complete order history and events
                        </p>
                    </div>
                </div>
                <span className="tw-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border-2 tw-border-blue-200 tw-bg-blue-50 tw-px-4 tw-py-2 tw-shadow-sm">
                    <Icon
                        icon="solar:list-bold-duotone"
                        className="tw-text-lg tw-text-blue-600"
                    />
                    <span className="tw-text-sm tw-font-bold tw-text-blue-900">
                        {timeline.length}{' '}
                        {timeline.length === 1 ? 'event' : 'events'}
                    </span>
                </span>
            </div>
            <div className="tw-space-y-5">
                {timeline.length === 0 && (
                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-py-12">
                        <div className="tw-flex tw-h-20 tw-w-20 tw-items-center tw-justify-center tw-rounded-2xl tw-bg-gradient-to-br tw-from-slate-100 tw-to-slate-200 tw-shadow-lg">
                            <Icon
                                icon="solar:history-bold-duotone"
                                className="tw-text-4xl tw-text-slate-400"
                            />
                        </div>
                        <div className="tw-text-center">
                            <h6 className="tw-text-base tw-font-bold tw-text-slate-700">
                                No Events Yet
                            </h6>
                            <p className="tw-mt-1 tw-text-sm tw-text-slate-500">
                                Activity will appear here as the order
                                progresses
                            </p>
                        </div>
                    </div>
                )}
                {timeline.map((event, index) => (
                    <div key={event.id} className="tw-flex tw-gap-4">
                        <div className="tw-flex tw-flex-col tw-items-center tw-pt-1">
                            <div className="tw-relative tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-500 tw-to-purple-600 tw-shadow-lg">
                                <Icon
                                    icon="solar:check-circle-bold"
                                    className="tw-text-xl tw-text-white"
                                />
                                {event.visibility === 'customer' && (
                                    <div className="tw-absolute -tw-right-1 -tw-top-1 tw-h-4 tw-w-4 tw-rounded-full tw-bg-emerald-500 tw-ring-2 tw-ring-white"></div>
                                )}
                            </div>
                            {index < timeline.length - 1 && (
                                <div className="tw-my-2 tw-w-0.5 tw-flex-1 tw-bg-gradient-to-b tw-from-slate-300 tw-to-transparent" />
                            )}
                        </div>
                        <div className="tw-group tw-flex-1 tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-gradient-to-br tw-from-white tw-to-slate-50 tw-p-5 tw-shadow-md tw-transition-all hover:tw-border-blue-300 hover:tw-shadow-lg">
                            <div className="tw-mb-3 tw-flex tw-items-start tw-justify-between tw-gap-4">
                                <div className="tw-flex tw-items-center tw-gap-2">
                                    <Icon
                                        icon="solar:clock-circle-bold-duotone"
                                        className="tw-text-lg tw-text-blue-600"
                                    />
                                    <span className="tw-text-xs tw-font-semibold tw-text-slate-600">
                                        {event.created_at
                                            ? new Date(
                                                  event.created_at,
                                              ).toLocaleString('en-GB', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : '—'}
                                    </span>
                                </div>
                                <div className="tw-flex tw-items-center tw-gap-2">
                                    {event.visibility && (
                                        <span
                                            className={`tw-rounded-lg tw-px-2.5 tw-py-1 tw-text-[10px] tw-font-bold tw-uppercase tw-shadow-sm ${
                                                event.visibility === 'customer'
                                                    ? 'tw-bg-emerald-600 tw-text-white'
                                                    : event.visibility ===
                                                        'public'
                                                      ? 'tw-bg-blue-600 tw-text-white'
                                                      : 'tw-bg-slate-600 tw-text-white'
                                            }`}
                                        >
                                            {event.visibility}
                                        </span>
                                    )}
                                    {event.author && (
                                        <span className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-bg-slate-100 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-slate-700">
                                            <Icon
                                                icon="solar:user-bold-duotone"
                                                className="tw-text-sm"
                                            />
                                            {event.author.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <h6 className="tw-mb-2 tw-text-base tw-font-bold tw-text-slate-900">
                                {event.title || event.event_type}
                            </h6>
                            {event.message && (
                                <p className="tw-mb-3 tw-whitespace-pre-line tw-text-sm tw-leading-relaxed tw-text-slate-700">
                                    {event.message}
                                </p>
                            )}
                            {(event.old_status || event.new_status) && (
                                <div className="tw-mt-4 tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-bg-slate-100 tw-p-3">
                                    <span className="tw-rounded-lg tw-bg-white tw-px-3 tw-py-1.5 tw-text-xs tw-font-bold tw-text-slate-700 tw-shadow-sm">
                                        {event.old_status || '—'}
                                    </span>
                                    <Icon
                                        icon="solar:arrow-right-bold"
                                        className="tw-text-xl tw-text-blue-600"
                                    />
                                    <span className="tw-rounded-lg tw-bg-blue-600 tw-px-3 tw-py-1.5 tw-text-xs tw-font-bold tw-text-white tw-shadow-md">
                                        {event.new_status || '—'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
        <section className="tw-sticky tw-top-6 tw-space-y-5 tw-rounded-2xl tw-border-2 tw-border-blue-200 tw-bg-gradient-to-br tw-from-blue-50 tw-via-white tw-to-purple-50 tw-p-6 tw-shadow-xl">
            <div className="tw-flex tw-items-center tw-gap-3 tw-border-b-2 tw-border-blue-200 tw-pb-4">
                <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-500 tw-to-purple-600 tw-shadow-lg">
                    <Icon
                        icon="solar:add-circle-bold-duotone"
                        className="tw-text-xl tw-text-white"
                    />
                </div>
                <div>
                    <h5 className="tw-text-base tw-font-bold tw-text-blue-900">
                        Add Event
                    </h5>
                    <p className="tw-mt-0.5 tw-text-xs tw-text-blue-700">
                        Log activity or notes
                    </p>
                </div>
            </div>
            <div className="tw-space-y-4">
                <div>
                    <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-blue-700">
                        <Icon
                            icon="solar:tag-bold-duotone"
                            className="tw-text-sm"
                        />
                        Event Type
                    </label>
                    <input
                        type="text"
                        value={eventForm.event_type}
                        onChange={(e) =>
                            setEventForm((prev) => ({
                                ...prev,
                                event_type: e.target.value,
                            }))
                        }
                        placeholder="e.g., note, update, milestone"
                        className="tw-w-full tw-rounded-xl tw-border-2 tw-border-blue-200 tw-bg-white tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-transition-all focus:tw-border-blue-400 focus:tw-ring-4 focus:tw-ring-blue-500/20"
                    />
                </div>
                <div>
                    <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-blue-700">
                        <Icon
                            icon="solar:document-text-bold-duotone"
                            className="tw-text-sm"
                        />
                        Title
                    </label>
                    <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) =>
                            setEventForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                            }))
                        }
                        placeholder="Brief title for this event"
                        className="tw-w-full tw-rounded-xl tw-border-2 tw-border-blue-200 tw-bg-white tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-transition-all focus:tw-border-blue-400 focus:tw-ring-4 focus:tw-ring-blue-500/20"
                    />
                </div>
                <div>
                    <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-blue-700">
                        <Icon
                            icon="solar:notes-bold-duotone"
                            className="tw-text-sm"
                        />
                        Message
                    </label>
                    <textarea
                        rows={5}
                        value={eventForm.message}
                        onChange={(e) =>
                            setEventForm((prev) => ({
                                ...prev,
                                message: e.target.value,
                            }))
                        }
                        placeholder="Detailed description or notes about this event..."
                        className="tw-w-full tw-rounded-xl tw-border-2 tw-border-blue-200 tw-bg-white tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition-all focus:tw-border-blue-400 focus:tw-ring-4 focus:tw-ring-blue-500/20"
                    />
                    <p className="tw-mt-1 tw-text-xs tw-text-slate-500">
                        {eventForm.message.length} characters
                    </p>
                </div>
                <div>
                    <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-blue-700">
                        <Icon
                            icon="solar:eye-bold-duotone"
                            className="tw-text-sm"
                        />
                        Visibility
                    </label>
                    <div className="tw-relative">
                        <select
                            value={eventForm.visibility}
                            onChange={(e) =>
                                setEventForm((prev) => ({
                                    ...prev,
                                    visibility: e.target.value,
                                }))
                            }
                            className="tw-w-full tw-appearance-none tw-rounded-xl tw-border-2 tw-border-blue-200 tw-bg-white tw-px-4 tw-py-2.5 tw-pr-10 tw-text-sm tw-font-semibold tw-transition-all focus:tw-border-blue-400 focus:tw-ring-4 focus:tw-ring-blue-500/20"
                        >
                            <option value="admin">🔒 Internal Only</option>
                            <option value="customer">
                                👤 Customer Visible
                            </option>
                            <option value="public">🌐 Public</option>
                        </select>
                        <Icon
                            icon="solar:alt-arrow-down-bold"
                            className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400"
                        />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={submitEvent}
                    disabled={eventSaving || !eventForm.message.trim()}
                    className="tw-group tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2.5 tw-rounded-xl tw-bg-gradient-to-r tw-from-blue-600 tw-to-purple-600 tw-px-6 tw-py-3.5 tw-text-sm tw-font-bold tw-text-white tw-shadow-lg tw-transition-all hover:tw-scale-[1.02] hover:tw-shadow-xl focus:tw-ring-4 focus:tw-ring-blue-500/50 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 disabled:hover:tw-scale-100"
                >
                    {eventSaving ? (
                        <>
                            <Icon
                                icon="svg-spinners:ring-resize"
                                className="tw-text-xl"
                            />
                            Adding Event...
                        </>
                    ) : (
                        <>
                            <Icon
                                icon="solar:add-circle-bold-duotone"
                                className="tw-text-xl tw-transition-transform group-hover:tw-rotate-90"
                            />
                            Add to Timeline
                        </>
                    )}
                </button>
            </div>
        </section>
    </div>
);

export default TimelinePanel;
