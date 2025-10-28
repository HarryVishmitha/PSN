import React from 'react';
import { Icon } from '@iconify/react';

const TimelinePanel = ({ timeline, eventForm, setEventForm, submitEvent, eventSaving }) => (
    <div className="tw-grid tw-gap-6 tw-grid-cols-1 lg:tw-grid-cols-3 tw-mb-20">
        <section className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm tw-p-5 tw-space-y-4 lg:tw-col-span-2">
            <div className="tw-flex tw-items-center tw-justify-between">
                <h3 className="tw-text-sm tw-font-semibold tw-text-slate-900">Timeline</h3>
                <span className="tw-text-xs tw-text-slate-400">{timeline.length} events</span>
            </div>
            <div className="tw-space-y-4">
                {timeline.length === 0 && (
                    <p className="tw-text-sm tw-text-slate-500">No events logged yet.</p>
                )}
                {timeline.map((event) => (
                    <div key={event.id} className="tw-flex tw-gap-3">
                        <div className="tw-flex tw-flex-col tw-items-center">
                            <span className="tw-rounded-full tw-bg-slate-900 tw-text-white tw-text-[11px] tw-font-semibold tw-px-2 tw-py-1 tw-uppercase">
                                {event.visibility}
                            </span>
                            <span className="tw-flex-1 tw-w-px tw-bg-slate-200 tw-my-1" />
                        </div>
                        <div className="tw-flex-1 tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
                            <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                                <div className="tw-flex tw-items-center tw-gap-2">
                                    <Icon icon="solar:clock-circle-bold-duotone" className="tw-text-slate-500 tw-text-lg" />
                                    <span className="tw-text-xs tw-text-slate-400">
                                        {event.created_at ? new Date(event.created_at).toLocaleString('en-GB') : '—'}
                                    </span>
                                </div>
                                {event.author && (
                                    <span className="tw-text-xs tw-text-slate-400">by {event.author.name}</span>
                                )}
                            </div>
                            <h4 className="tw-text-sm tw-font-semibold tw-text-slate-900">
                                {event.title || event.event_type}
                            </h4>
                            {event.message && (
                                <p className="tw-text-sm tw-text-slate-600 tw-mt-2 tw-whitespace-pre-line">{event.message}</p>
                            )}
                            {(event.old_status || event.new_status) && (
                                <div className="tw-mt-3 tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-text-slate-500">
                                    <span className="tw-rounded-full tw-bg-slate-200 tw-px-2 tw-py-0.5 tw-font-semibold">
                                        {event.old_status || '—'}
                                    </span>
                                    <Icon icon="solar:alt-arrow-right-line-duotone" className="tw-text-slate-400" />
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
        <section className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm tw-p-5 tw-space-y-4">
            <div>
                <h3 className="tw-text-sm tw-font-semibold tw-text-slate-900">Add timeline event</h3>
                <p className="tw-text-xs tw-text-slate-500 tw-mt-1">
                    Log production progress, customer communications or payment updates.
                </p>
            </div>
            <div className="tw-space-y-3">
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Event type</label>
                    <input
                        type="text"
                        value={eventForm.event_type}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, event_type: e.target.value }))}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                    />
                </div>
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Title</label>
                    <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                    />
                </div>
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Message</label>
                    <textarea
                        rows={4}
                        value={eventForm.message}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, message: e.target.value }))}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                    />
                </div>
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Visibility</label>
                    <select
                        value={eventForm.visibility}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, visibility: e.target.value }))}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
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
                    className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-slate-900 tw-text-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold hover:tw-bg-slate-800 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-slate-900 disabled:tw-opacity-60"
                >
                    <Icon icon="solar:notes-minimalistic-bold-duotone" className="tw-text-lg" />
                    {eventSaving ? 'Adding…' : 'Add event'}
                </button>
            </div>
        </section>
    </div>
);

export default TimelinePanel;
