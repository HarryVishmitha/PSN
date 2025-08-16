import React, { useEffect, useRef, useState } from 'react';
import { Head, router, Link, useForm, usePage } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/Components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import 'react-quill-new/dist/quill.snow.css';

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TopnavCategories = ({ userDetails, categories: initialCategories }) => {
    const [visibleCategories, setVisibleCategories] = useState(
        initialCategories.filter(cat => cat.is_visible)
    );
    const [hiddenCategories, setHiddenCategories] = useState(
        initialCategories.filter(cat => !cat.is_visible)
    );
    const [originalCategories, setOriginalCategories] = useState([]);
    const [categories, setCategories] = useState([]);

    const [alert, setAlert] = useState(null);

    useEffect(() => {
        const visible = initialCategories
            .filter((cat) => cat.is_visible)
            .sort((a, b) => a.order - b.order);
        const hidden = initialCategories.filter((cat) => !cat.is_visible);

        setVisibleCategories(visible);
        setHiddenCategories(hidden);
        setOriginalCategories([...visible, ...hidden]);
    }, [initialCategories]);


    const handleVisibilityToggle = (id) => {
        const movedFromVisible = visibleCategories.find(cat => cat.id === id);
        const movedFromHidden = hiddenCategories.find(cat => cat.id === id);

        if (movedFromVisible) {
            // Move to hidden
            const newVisible = visibleCategories.filter(cat => cat.id !== id);
            const newHidden = [...hiddenCategories, { ...movedFromVisible, is_visible: false }];
            setVisibleCategories(newVisible);
            setHiddenCategories(newHidden);
        } else if (movedFromHidden) {
            // Move to visible (add to end)
            const newHidden = hiddenCategories.filter(cat => cat.id !== id);
            const newVisible = [...visibleCategories, { ...movedFromHidden, is_visible: true }];
            setHiddenCategories(newHidden);
            setVisibleCategories(newVisible);
        }
    };



    const handleSave = () => {
        const payload = [
            ...visibleCategories.map((cat, index) => ({
                ...cat,
                is_visible: true,
                order: index + 1,
            })),
            ...hiddenCategories.map(cat => ({
                ...cat,
                is_visible: false,
                order: null, // or keep original?
            })),
        ];

        try {
            router.post(
                route('admin.topnavCategories.reorder'),
                { categories: payload },
                {
                    onSuccess: () => setAlert({ type: 'success', message: 'Categories updated successfully.' }),
                    onError: () => setAlert({ type: 'danger', message: 'Failed to update categories.' }),
                }
            );
        } catch (error) {
            setAlert({ type: 'danger', message: 'An unexpected error occurred.' });
        }
    };


    const handleCancel = () => {
        const visible = originalCategories.filter(cat => cat.is_visible);
        const hidden = originalCategories.filter(cat => !cat.is_visible);
        setVisibleCategories(visible);
        setHiddenCategories(hidden);
    };




    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = visibleCategories.findIndex(cat => cat.id === active.id);
            const newIndex = visibleCategories.findIndex(cat => cat.id === over?.id);
            const newOrder = arrayMove(visibleCategories, oldIndex, newIndex).map((cat, idx) => ({
                ...cat,
                order: idx + 1,
            }));
            setVisibleCategories(newOrder);
        }
    };


    const combinedCategories = [...visibleCategories, ...hiddenCategories];

    const DraggableRow = ({ category, index }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
        } = useSortable({ id: category.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        return (
            <tr ref={category.is_visible ? setNodeRef : null} style={style}>
                <td className='tw-text-center'>
                    {index + 1}
                </td>
                <td className='tw-text-center'>
                    <div className="d-flex align-items-center justify-content-center">
                        {category.img_link ? (
                            <img
                                src={category.img_link}
                                alt={category.name}
                                className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden"
                            />
                        ) : (
                            <Icon icon="tabler:category" className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden tw-bg-gray-400 tw-p-2" />
                        )}
                        <span className="text-md mb-0 fw-normal text-secondary-light">{category.name}</span>
                    </div>
                </td>
                <td>
                    <div className="form-switch switch-primary d-flex align-items-center gap-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`switch-${category.id}`}
                            checked={category.is_visible}
                            onChange={() => handleVisibilityToggle(category.id)}
                        />
                    </div>
                </td>
                <td>
                    <span className={`badge fw-normal ${category.is_visible ? 'bg-success' : 'bg-secondary'}`}>
                        {category.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                </td>
                <td>
                    {category.is_visible && (
                        <button
                            {...attributes}
                            {...listeners}
                            className="btn btn-sm btn-light border d-flex align-items-center justify-content-end"
                            style={{ cursor: 'grab' }}
                            title="Drag to reorder"
                        >
                            <Icon icon="tabler:grip-vertical" width={20} height={20} />
                        </button>
                    )}
                </td>
            </tr>
        );
    };


    return (
        <>
            <Head title="Site Management - Admin" />
            <Meta
                title="Site Management - Admin"
                description="Manage site settings, view details, and update information."
            />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Site Management - Top Nav" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className='tw-font-semibold'>Edit Navigations</h5>
                            <p className='tw-text-sm tw-text-gray-500 dark:tw-text-gray-400'>Choose Categories to show on top navigation on home page.</p>
                        </div>
                        <div>
                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave}>Save</button>
                            </div>

                        </div>
                    </div>

                    <div className="card-body p-24">
                        <div className='d-flex justify-content-center align-items-center mb-4'>
                            <div className="table-responsive scroll-sm tw-w-[50%]">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={visibleCategories.map(cat => cat.id)} strategy={verticalListSortingStrategy}>
                                        <table className="table table-borderless mb-0 table-striped">
                                            <tbody>
                                                {combinedCategories.map((cat, idx) => (
                                                    <DraggableRow key={cat.id} category={cat} index={idx} />
                                                ))}
                                            </tbody>

                                        </table>
                                    </SortableContext>
                                </DndContext>

                            </div>
                        </div>
                    </div>

                </div>
            </AdminDashboard>
            <CookiesV />
        </>
    );
}

export default TopnavCategories;
