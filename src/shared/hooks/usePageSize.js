import { useCallback, useState } from "react";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;

const STORAGE_KEY = "sga_page_size";

function readStored() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return PAGE_SIZE_OPTIONS.includes(value) ? value : DEFAULT_PAGE_SIZE;
  } catch {
    return DEFAULT_PAGE_SIZE;
  }
}

// Cantidad de filas por pagina de las listas del servidor. Se guarda por navegador (es una
// comodidad: si no hay localStorage vuelve a 10) y es la misma para todas las listas.
export function usePageSize() {
  const [pageSize, setPageSizeState] = useState(readStored);

  const setPageSize = useCallback((value) => {
    const size = PAGE_SIZE_OPTIONS.includes(Number(value)) ? Number(value) : DEFAULT_PAGE_SIZE;
    setPageSizeState(size);
    try {
      localStorage.setItem(STORAGE_KEY, String(size));
    } catch {
      // sin localStorage solo se pierde el recuerdo
    }
  }, []);

  return [pageSize, setPageSize];
}
