import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

export async function getSectionSchedules(sectionId) {
  const qs = buildParams({ section_id: sectionId, size: 1000 });
  const { data } = await api.get(`/section-schedules?${qs}`);
  return data;
}

export async function getAllSectionSchedules() {
  const { data } = await api.get("/section-schedules?size=1000");
  return data;
}

export async function createSectionSchedule(data) {
  const res = await api.post("/section-schedules", data);
  return res.data;
}

export async function deleteSectionSchedule(id) {
  await api.delete(`/section-schedules/${id}`);
}
