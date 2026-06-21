const BACKEND_URL =
  import.meta.env.VITE_IS_DEVELOPMENT === "true"
    ? import.meta.env.VITE_LOCAL_BACKEND_URL
    : import.meta.env.VITE_PROD_BACKEND_URL;

export { BACKEND_URL };