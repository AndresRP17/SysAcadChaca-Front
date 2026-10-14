import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";
import { cleanParams, toPage } from "../../users/services/pagedList";

export const PERIOD_TYPES = {
  CURSADA: "Cursadas",
  FINAL: "Mesas de examen",
};

// open=true trae solo los períodos activos que incluyen la fecha de hoy.
export async function getEnrollmentPeriods({ type, academicYear, open } = {}) {
  const qs = buildParams({ type, academic_year: academicYear, open: open ? "1" : "", size: 1000 });
  const { data } = await api.get(`/enrollment-periods?${qs}`);
  return data;
}

// Una página de períodos filtrada en el servidor: { items, total }.
export async function getEnrollmentPeriodsPage({ type, academicYear, active, page = 1, size = 10 } = {}) {
  const response = await api.get("/enrollment-periods", {
    params: cleanParams({ type, academic_year: academicYear, active, page, size }),
  });
  return toPage(response);
}

export async function createEnrollmentPeriod(payload) {
  const res = await api.post("/enrollment-periods", payload);
  return res.data;
}

export async function updateEnrollmentPeriod(id, payload) {
  const res = await api.put(`/enrollment-periods/${id}`, payload);
  return res.data;
}

export async function deleteEnrollmentPeriod(id) {
  await api.delete(`/enrollment-periods/${id}`);
}
