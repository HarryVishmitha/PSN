// ShipmentsStatus.jsx
import React,{useEffect,useState,useCallback} from "react";import axios from "axios";import Chart from "react-apexcharts";
export default function ShipmentsStatus({days=7}){const[d,setD]=useState({items:[]}),[l,setL]=useState(true);
const g=useCallback(async(u,o={})=>{const t=document.querySelector('meta[name="csrf-token"]')?.content;const h={"X-Requested-With":"XMLHttpRequest",...(t?{"X-CSRF-TOKEN":t}:{}) ,...o.headers};return axios.get(u,{withCredentials:true,headers:h,signal:o.signal});},[]);
useEffect(()=>{const ac=new AbortController();(async()=>{setL(true);const{data}=await g(`/admin/api/widgets/shipments-status?days=${days}`,{signal:ac.signal});setD(data?.data||{});setL(false);})();return()=>ac.abort();},[days,g]);
if(l) return <div className="tw-h-40 tw-animate-pulse tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl" />;
const labels=d.items.map(i=>i.status), vals=d.items.map(i=>i.count);
return <Chart type="pie" height={240} series={vals} options={{labels,legend:{position:"bottom"}}}/>;
}
