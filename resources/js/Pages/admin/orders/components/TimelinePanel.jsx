import { Icon } from '@iconify/react';

const TimelinePanel = ({
    timeline,
    eventForm,
    setEventForm,
    submitEvent,
    eventSaving,
}) => (
    <div className="tw-mb-20 tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-3">
        <section className="tw-space-y-4 tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-5 tw-shadow-sm lg:tw-col-span-2">
            <div className="tw-flex tw-items-center tw-justify-between">
                <h3 className="tw-text-sm tw-font-semibold tw-text-slate-900">
                    Timeline
                </h3>
                <span className="tw-text-xs tw-text-slate-400">
                    {timeline.length} events
                </span>
            </div>
            <div className="tw-space-y-4">
                {timeline.length === 0 && (
                    <p className="tw-text-sm tw-text-slate-500">
                        No events logged yet.
                    </p>
                )}
                {timeline.map((event) => (
                    <div key={event.id} className="tw-flex tw-gap-3">
                        <div className="tw-flex tw-flex-col tw-items-center">
                            <span className="tw-rounded-full tw-bg-slate-900 tw-px-2 tw-py-1 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-white">
                                {event.visibility}
                            </span>
                            <span className="tw-my-1 tw-w-px tw-flex-1 tw-bg-slate-200" />
                        </div>
                        <div className="tw-flex-1 tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
                            <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
                                <div className="tw-flex tw-items-center tw-gap-2">
                                    <Icon
                                        icon="solar:clock-circle-bold-duotone"
                                        className="tw-text-lg tw-text-slate-500"
                                    />
                                    <span className="tw-text-xs tw-text-slate-400">
                                        {event.created_at
                                            ? new Date(
                                                  event.created_at,
                                              ).toLocaleString('en-GB')
                                            : '—'}
                                    </span>
                                </div>
                                {event.author && (
                                    <span className="tw-text-xs tw-text-slate-400">
                                        by {event.author.name}
                                    </span>
                                )}
                            </div>
                            <h4 className="tw-text-sm tw-font-semibold tw-text-slate-900">
                                {event.title || event.event_type}
                            </h4>
                            {event.message && (
                                <p className="tw-mt-2 tw-whitespace-pre-line tw-text-sm tw-text-slate-600">
                                    {event.message}
                                </p>
                            )}
                            {(event.old_status || event.new_status) && (
                                <div className="tw-mt-3 tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-text-slate-500">
                                    <span className="tw-rounded-full tw-bg-slate-200 tw-px-2 tw-py-0.5 tw-font-semibold">
                                        {event.old_status || '—'}
                                    </span>
                                    <Icon
                                        icon="solar:alt-arrow-right-line-duotone"
                                        className="tw-text-slate-400"
                                    />
                                    <span className="tw-rounded-full tw-bg-slate-200 tw-px-2 tw-py-0.5 tw-font-semibold">
                                        {event.new_status || '—'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
        <section className="tw-space-y-4 tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-5 tw-shadow-sm">
            <div>
                <h3 className="tw-text-sm tw-font-semibold tw-text-slate-900">
                    Add timeline event
                </h3>
                <p className="tw-mt-1 tw-text-xs tw-text-slate-500">
                    Log production progress, customer communications or payment
                    updates.
                </p>
            </div>
            <div className="tw-space-y-3">
                <div>
                    <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                        Event type
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
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/30"
                    />
                </div>
                <div>
                    <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
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
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/30"
                    />
                </div>
                <div>
                    <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                        Message
                    </label>
                    <textarea
                        rows={4}
                        value={eventForm.message}
                        onChange={(e) =>
                            setEventForm((prev) => ({
                                ...prev,
                                message: e.target.value,
                            }))
                        }
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/30"
                    />
                </div>
                <div>
                    <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                        Visibility
                    </label>
                    <select
                        value={eventForm.visibility}
                        onChange={(e) =>
                            setEventForm((prev) => ({
                                ...prev,
                                visibility: e.target.value,
                            }))
                        }
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/30"
                    >
                        <option value="admin">Internal</option>
                        <option value="customer">Customer</option>
                        <option value="public">Public</option>
                    </select>
                </div>
                <button
                    type="button"
                    onClick={submitEvent}
                    disabled={eventSaving}
                    className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-slate-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-slate-800 focus:tw-ring-2 focus:tw-ring-slate-900 focus:tw-ring-offset-2 disabled:tw-opacity-60"
                >
                    <Icon
                        icon="solar:notes-minimalistic-bold-duotone"
                        className="tw-text-lg"
                    />
                    {eventSaving ? 'Adding…' : 'Add event'}
                </button>
            </div>
        </section>
    </div>
);

export default TimelinePanel;
