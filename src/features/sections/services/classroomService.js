import { api } from "../../../shared/api/api";

export async function getClassrooms() {
  const { data } = await api.get("/classrooms?size=1000");
  return data;
}

export async function createClassroom(data) {
  const res = await api.post("/classrooms", toPayload(data));
  return res.data;
}

export async function updateClassroom(id, data) {
  const res = await api.put(`/classrooms/${id}`, toPayload(data));
  return res.data;
}

function toPayload({ name, capacity, location, buildingId }) {
  return { name, capacity, location, building_id: buildingId };
}

export async function deleteClassroom(id) {
  await api.delete(`/classrooms/${id}`);
}
