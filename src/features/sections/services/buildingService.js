import { api } from "../../../shared/api/api";

export async function getBuildings() {
  const { data } = await api.get("/buildings?size=1000");
  return data;
}

export async function createBuilding(data) {
  const res = await api.post("/buildings", data);
  return res.data;
}

export async function updateBuilding(id, data) {
  const res = await api.put(`/buildings/${id}`, data);
  return res.data;
}

export async function deleteBuilding(id) {
  await api.delete(`/buildings/${id}`);
}
