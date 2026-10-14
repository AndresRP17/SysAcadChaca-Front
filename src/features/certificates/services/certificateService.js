import { api } from "../../../shared/api/api";
import { cleanParams, toPage } from "../../users/services/pagedList";

export async function getCertificates({ status } = {}) {
  const params = status ? `?status=${status}` : "";
  const { data } = await api.get(`/certificates${params}`);
  return data;
}

// Una página de certificados filtrada en el servidor: { items, total }.
export async function getCertificatesPage({ q, type, status, page = 1, size = 10 } = {}) {
  const response = await api.get("/certificates", { params: cleanParams({ q, type, status, page, size }) });
  return toPage(response);
}

// studentId solo lo usan Administrador/Bedel para pedirlo en nombre de un alumno;
// para el Alumno el backend lo ignora y usa su propio legajo.
export async function requestCertificate(type, studentId) {
  const { data } = await api.post("/certificates", studentId ? { type, student_id: studentId } : { type });
  return data;
}

export async function issueCertificate(id) {
  const { data } = await api.put(`/certificates/${id}/issue`);
  return data;
}

export async function rejectCertificate(id) {
  const { data } = await api.put(`/certificates/${id}/reject`);
  return data;
}

export async function getCertificateReport(id) {
  const { data } = await api.get(`/certificates/${id}/report`);
  return data;
}
