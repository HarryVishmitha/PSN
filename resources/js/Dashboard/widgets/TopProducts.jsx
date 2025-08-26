// TopProducts.jsx
import React, {useEffect,useState,useCallback} from "react";
import axios from "axios";
import Chart from "react-apexcharts";

export default function TopProducts({ days=30, limit=10 }) {
  const [data,setData]=useState({items:[]}); const [loading,setLoading]=useState(true);
  const secureGet=useCallback(async(u,o={})=>{const csrf=document.querySelector('meta[name="csrf-token"]')?.content;
    const h={"X-Requested-With":"XMLHttpRequest",...(csrf?{"X-CSRF-TOKEN":csrf}:{}) ,...o.headers};return axios.get(u,{withCredentials:true,headers:h,signal:o.signal});},[]);
  useEffect(()=>{const ac=new AbortController();(async()=>{setLoading(true);
    const {data}=await secureGet(`/admin/api/widgets/top-products?days=${days}&limit=${limit}`,{signal:ac.signal});
    setData(data?.data||{});setLoading(false);})();return()=>ac.abort();},[days,limit,secureGet]);
  if(loading) return <div className="tw-h-40 tw-animate-pulse tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl" />;
  const labels=data.items.map(i=>i.name); const rev=data.items.map(i=>i.revenue);
  return <Chart type="bar" height={240} series={[{name:"Revenue",data:rev}]} options={{xaxis:{categories:labels},dataLabels:{enabled:false},legend:{show:false}}} />;
}
