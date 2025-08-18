// resources/js/lib/cartApi.js
import axios from 'axios';

/** Shared Axios config: always ask for JSON and don't throw on 4xx */
const cfg = {
    withCredentials: true,
    headers: { Accept: 'application/json' },
    validateStatus: (s) => s >= 200 && s < 500,
};

/** Fire-and-forget error broadcast so UIs can show toasts, etc. */
const emitError = (message, context = null) => {
    window.dispatchEvent(
        new CustomEvent('cart:error', { detail: { message, context } }),
    );
};

/** Broadcast cart updates with both line-count and quantity-count */
const emitUpdate = (cart = null) => {
    const items = Array.isArray(cart?.items) ? cart.items : [];
    const linesCount = items.length;
    const qtyCount = items.reduce(
        (sum, it) => sum + Number(it?.quantity || 0),
        0,
    );
    window.dispatchEvent(
        new CustomEvent('cart:updated', {
            detail: { cart, linesCount, qtyCount },
        }),
    );
};

/** Optional convenience: subscribe to updates and get an unsubscriber */
export function onCartUpdated(cb) {
    const h = (e) => cb?.(e.detail);
    window.addEventListener('cart:updated', h);
    return () => window.removeEventListener('cart:updated', h);
}

/** Optional convenience: subscribe to errors */
export function onCartError(cb) {
    const h = (e) => cb?.(e.detail);
    window.addEventListener('cart:error', h);
    return () => window.removeEventListener('cart:error', h);
}

/* ------------------------- Core Cart Endpoints ------------------------- */

export async function getCart() {
    try {
        const { data } = await axios.get('/api/cart', cfg);
        if (data?.ok) emitUpdate(data.cart);
        return data;
    } catch (err) {
        emitError(err?.message || 'Failed to fetch cart', { op: 'getCart' });
        return { ok: false, message: 'Failed to fetch cart' };
    }
}

export async function addCartItem(payload) {
    try {
        const { data } = await axios.post('/api/cart/items', payload, cfg);
        emitUpdate(data?.cart || null);
        if (data?.ok === false)
            emitError(data?.message || 'Could not add item', {
                op: 'addCartItem',
                payload,
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not add item', {
            op: 'addCartItem',
            payload,
        });
        return { ok: false, message: 'Could not add item' };
    }
}

export async function updateCartItem(itemId, payload) {
    try {
        const { data } = await axios.put(
            `/api/cart/items/${itemId}`,
            payload,
            cfg,
        );
        emitUpdate(data?.cart || null);
        if (data?.ok === false)
            emitError(data?.message || 'Could not update item', {
                op: 'updateCartItem',
                itemId,
                payload,
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not update item', {
            op: 'updateCartItem',
            itemId,
            payload,
        });
        return { ok: false, message: 'Could not update item' };
    }
}

export async function removeCartItem(itemId) {
    try {
        const { data } = await axios.delete(`/api/cart/items/${itemId}`, cfg);
        emitUpdate(data?.cart || null);
        if (data?.ok === false)
            emitError(data?.message || 'Could not remove item', {
                op: 'removeCartItem',
                itemId,
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not remove item', {
            op: 'removeCartItem',
            itemId,
        });
        return { ok: false, message: 'Could not remove item' };
    }
}

export async function clearCart() {
    try {
        const { data } = await axios.delete('/api/cart', cfg);
        emitUpdate(data?.cart || null);
        if (data?.ok === false)
            emitError(data?.message || 'Could not clear cart', {
                op: 'clearCart',
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not clear cart', { op: 'clearCart' });
        return { ok: false, message: 'Could not clear cart' };
    }
}

/* --------------------------- Promotions / Offers --------------------------- */

export async function applyOffer(code) {
    try {
        const { data } = await axios.post('/api/cart/offer', { code }, cfg);
        emitUpdate(data?.cart || null);
        if (data?.ok === false)
            emitError(data?.message || 'Could not apply offer', {
                op: 'applyOffer',
                code,
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not apply offer', {
            op: 'applyOffer',
            code,
        });
        return { ok: false, message: 'Could not apply offer' };
    }
}

export async function removeOffer(code) {
    try {
        // axios.delete accepts "config" as 2nd arg; include body via config.data
        const { data } = await axios.delete('/api/cart/offer', {
            ...cfg,
            data: { code },
        });
        emitUpdate(data?.cart || null);
        if (data?.ok === false)
            emitError(data?.message || 'Could not remove offer', {
                op: 'removeOffer',
                code,
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not remove offer', {
            op: 'removeOffer',
            code,
        });
        return { ok: false, message: 'Could not remove offer' };
    }
}

/* ------------------------------ Shipping / Addr ------------------------------ */

export async function setShippingMethod(shipping_method_id) {
    try {
        const { data } = await axios.post(
            '/api/cart/shipping',
            { shipping_method_id },
            cfg,
        );
        emitUpdate(data?.cart || null);
        if (data?.ok === false)
            emitError(data?.message || 'Could not set shipping', {
                op: 'setShippingMethod',
                shipping_method_id,
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not set shipping', {
            op: 'setShippingMethod',
            shipping_method_id,
        });
        return { ok: false, message: 'Could not set shipping' };
    }
}

export async function setAddresses({
    billing_address_id = null,
    shipping_address_id = null,
} = {}) {
    try {
        const { data } = await axios.post(
            '/api/cart/addresses',
            { billing_address_id, shipping_address_id },
            cfg,
        );
        emitUpdate(data?.cart || null);
        if (data?.ok === false)
            emitError(data?.message || 'Could not set addresses', {
                op: 'setAddresses',
                billing_address_id,
                shipping_address_id,
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not set addresses', {
            op: 'setAddresses',
            billing_address_id,
            shipping_address_id,
        });
        return { ok: false, message: 'Could not set addresses' };
    }
}

/* ----------------------------- Upload Attachments ----------------------------- */

export async function attachUpload(itemId, user_design_upload_id) {
    try {
        const { data } = await axios.post(
            `/api/cart/items/${itemId}/attach-upload`,
            { user_design_upload_id },
            cfg,
        );
        // This endpoint returns { ok: true, item } not the whole cart.
        // You may want to refetch the cart for consistency:
        await getCart();
        if (data?.ok === false)
            emitError(data?.message || 'Could not attach upload', {
                op: 'attachUpload',
                itemId,
                user_design_upload_id,
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not attach upload', {
            op: 'attachUpload',
            itemId,
            user_design_upload_id,
        });
        return { ok: false, message: 'Could not attach upload' };
    }
}

/* ------------------------------ Auth Merge Helper ------------------------------ */

export async function mergeGuestCartOnLogin() {
    try {
        const { data } = await axios.post('/api/cart/merge', {}, cfg);
        // Controller may or may not return the full cart; ensure header sync:
        await getCart();
        if (data?.ok === false)
            emitError(data?.message || 'Could not merge guest cart', {
                op: 'mergeGuestCartOnLogin',
            });
        return data;
    } catch (err) {
        emitError(err?.message || 'Could not merge guest cart', {
            op: 'mergeGuestCartOnLogin',
        });
        return { ok: false, message: 'Could not merge guest cart' };
    }
}

/* ------------------------------- Default Export ------------------------------- */

export default {
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    applyOffer,
    removeOffer,
    setShippingMethod,
    setAddresses,
    attachUpload,
    mergeGuestCartOnLogin,
    onCartUpdated,
    onCartError,
};
