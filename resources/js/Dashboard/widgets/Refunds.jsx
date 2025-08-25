// Refunds.jsx
import React,{useEffect,useState,useCallback} from "react";import axios from "axios";import Chart from "react-apexcharts";
export default function Refunds({days=30}){const[d,setD]=useState({labels:[],counts:[],amounts:[]}),[l,setL]=useState(true);
const g=useCallback(async(u,o={})=>{const t=document.querySelector('meta[name="csrf-token"]')?.content;const h={"X-Requested-With":"XMLHttpRequest",...(t?{"X-CSRF-TOKEN":t}:{}) ,...o.headers};return axios.get(u,{withCredentials:true,headers:h,signal:o.signal});},[]);
useEffect(()=>{const ac=new AbortController();(async()=>{setL(true);const{data}=await g(`/admin/api/widgets/refunds?days=${days}`,{signal:ac.signal});setD(data?.data||{});setL(false);})();return()=>ac.abort();},[days,g]);
if(l) return <div className="tw-h-40 tw-animate-pulse tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl" />;
return <Chart type="line" height={240} series={[{name:"Count",data:d.counts},{name:"Amount",data:d.amounts}]} options={{xaxis:{categories:d.labels},dataLabels:{enabled:false}}}/>;
}
