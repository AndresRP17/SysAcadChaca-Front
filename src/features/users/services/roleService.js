import { api } from "../../../shared/api/api";

export async function getRoles() {
  const { data } = await api.get("/roles");
  return data;
}
