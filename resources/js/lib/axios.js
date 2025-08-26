import Axios from "axios";

const axios = Axios.create({
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

const token = document.querySelector('meta[name="csrf-token"]')?.content;
if (token) {
  axios.defaults.headers.common["X-CSRF-TOKEN"] = token;
}

export default axios;
