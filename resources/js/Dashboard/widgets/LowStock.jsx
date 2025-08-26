// LowStock.jsx
import React,{useEffect,useState,useCallback} from "react";import axios from "axios";
export default function LowStock({limit=10}){const[d,setD]=useState({items:[]}),[l,setL]=useState(true);
const g=useCallback(async(u,o={})=>{const t=document.querySelector('meta[name="csrf-token"]')?.content;const h={"X-Requested-With":"XMLHttpRequest",...(t?{"X-CSRF-TOKEN":t}:{}) ,...o.headers};return axios.get(u,{withCredentials:true,headers:h,signal:o.signal});},[]);
useEffect(()=>{const ac=new AbortController();(async()=>{setL(true);const{data}=await g(`/admin/api/widgets/low-stock?limit=${limit}`,{signal:ac.signal});setD(data?.data||{});setL(false);})();return()=>ac.abort();},[limit,g]);
if(l) return <div className="tw-h-40 tw-animate-pulse tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl" />;
return (<div className="table-responsive"><table className="table align-middle"><thead><tr><th>Product</th><th className="text-end">Stock</th><th className="text-end">Reorder</th></tr></thead>
<tbody>{d.items.map(p=>(<tr key={p.product_id}><td>{p.name}</td><td className={`text-end ${p.is_low?'text-danger fw-bold':''}`}>{p.stock}</td><td className="text-end">{p.reorder_level}</td></tr>))}
{d.items.length===0&&(<tr><td colSpan="3" className="tw-text-sm tw-text-gray-500">No low stock items.</td></tr>)}</tbody></table></div>); }
