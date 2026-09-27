import { api } from "../../../shared/api/api";

export async function getCertificates({ status } = {}) {
  const params = status ? `?status=${status}` : "";
  const { data } = await api.get(`/certificates${params}`);
  return data;
}

export async function requestCertificate(type) {
  const { data } = await api.post("/certificates", { type });
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
