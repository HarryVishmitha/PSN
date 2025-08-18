// resources/js/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const CartCtx = createContext({ count: 0, loading: true, refresh: () => { } });

export const CartProvider = ({ children }) => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const computeCount = useCallback((cart) => {
        try {
            const items = Array.isArray(cart?.items) ? cart.items : [];
            return items.reduce((sum, it) => sum + (parseInt(it.quantity || 0, 10)), 0);
        } catch {
            return 0;
        }
    }, []);

    const refresh = useCallback(async () => {
        try {
            // ensure cookies/session stick
            const { data } = await axios.get("/api/cart", { withCredentials: true });
            if (data?.ok) setCount(computeCount(data.cart));
        } catch {
            // keep silent; you can console.log if needed
        } finally {
            setLoading(false);
        }
    }, [computeCount]);

    useEffect(() => {
        // initial load
        refresh();

        // listen for global cart updates fired by our API helper
        const handler = (e) => {
            // if a full cart summary is provided, use it to avoid refetch
            if (e.detail?.cart) {
                setCount(computeCount(e.detail.cart));
            } else {
                refresh();
            }
        };
        window.addEventListener("cart:updated", handler);
        return () => window.removeEventListener("cart:updated", handler);
    }, [refresh, computeCount]);

    return (
        <CartCtx.Provider value={{ count, loading, refresh }}>
            {children}
        </CartCtx.Provider>
    );
};

export const useCart = () => useContext(CartCtx);
